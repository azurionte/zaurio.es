import { normalizeProviderAccount, normalizeProviderTransaction } from '../integrations/bank-provider-contract.js';
import { scoreReconciliation, actualizeExpectedEvent } from '../core/reconciliation-engine.js';

export const BANK_SYNC_SERVICE_VERSION='dz3-bank-sync-2';

function snake(row){const out={};for(const[k,v]of Object.entries(row||{}))out[k.replace(/[A-Z]/g,m=>`_${m.toLowerCase()}`)]=v;return out;}
function day(value){return String(value||'').slice(0,10);}

export async function syncBankProvider({repository,provider,connection,expectedEvents=[]}){
  if(!repository?.client)throw new TypeError('repository with Supabase client is required');
  const remoteAccounts=await provider.listAccounts(connection);
  const accountLinks=[];
  for(const raw of remoteAccounts){
    const account=normalizeProviderAccount(provider.provider,raw);
    const bankAccountPayload={connection_id:connection.id,account_id:raw.localAccountId||null,external_account_id:account.externalAccountId,name:account.name,currency:account.currency,metadata:{institutionName:account.institutionName,accountType:account.accountType,...account.metadata}};
    const{data,error}=await repository.client.from('dz3_bank_accounts').upsert(bankAccountPayload,{onConflict:'connection_id,external_account_id'}).select().single();
    if(error)throw error;
    accountLinks.push({...data,raw});
  }

  const imported=[];
  for(const link of accountLinks){
    const rows=await provider.listTransactions(connection,link.raw);
    for(const raw of rows){
      const tx=normalizeProviderTransaction(raw);
      const payload={bank_account_id:link.id,external_transaction_id:tx.externalTransactionId,booked_at:tx.bookedAt,value_at:tx.valueAt,amount_minor:tx.amountMinor,currency:tx.currency,merchant_name:tx.merchantName,description:tx.description,provider_category:tx.rawCategory,provider_payload:tx.providerData,sync_status:tx.syncStatus};
      const{data,error}=await repository.client.from('dz3_bank_transactions').upsert(payload,{onConflict:'bank_account_id,external_transaction_id'}).select().single();
      if(error)throw error;
      imported.push({...data,accountId:link.account_id});
    }
    await repository.client.from('dz3_bank_accounts').update({last_synced_at:new Date().toISOString()}).eq('id',link.id);
  }
  await repository.client.from('dz3_bank_connections').update({last_sync_at:new Date().toISOString(),status:'active'}).eq('id',connection.id);

  const proposals=[];
  for(const tx of imported){
    const candidates=expectedEvents.filter(event=>event.accountId===tx.accountId&&Math.abs(new Date(day(event.scheduledAt))-new Date(day(tx.booked_at)))<=7*86400000);
    const ranked=candidates.map(event=>({event,score:scoreReconciliation({expectedEvent:event,bankTransaction:{id:tx.id,externalTransactionId:tx.external_transaction_id,bookedAt:tx.booked_at,amountMinor:Number(tx.amount_minor),merchantName:tx.merchant_name,description:tx.description}})})).sort((a,b)=>b.score.confidence-a.score.confidence);
    if(!ranked[0]||ranked[0].score.confidence<0.75)continue;
    const best=ranked[0];
    proposals.push({bankTransaction:tx,expectedEvent:best.event,...best.score});
  }
  return{version:BANK_SYNC_SERVICE_VERSION,accounts:accountLinks,transactions:imported,reconciliationProposals:proposals};
}

export async function acceptReconciliation({repository,planId,proposal,status='user_confirmed'}){
  const{bankTransaction,expectedEvent}=proposal;
  const{data:match,error}=await repository.client.from('dz3_reconciliation_matches').insert({plan_id:planId,bank_transaction_id:bankTransaction.id,financial_event_id:null,match_type:'event',confidence:proposal.confidence,status,evidence:{signals:proposal.signals||{},expectedEventId:expectedEvent.id}}).select().single();
  if(error)throw error;
  const actual=actualizeExpectedEvent({expectedEvent,bankTransaction:{id:bankTransaction.id,externalTransactionId:bankTransaction.external_transaction_id,bookedAt:bankTransaction.booked_at,amountMinor:Number(bankTransaction.amount_minor),merchantName:bankTransaction.merchant_name,description:bankTransaction.description},reconciliationId:match.id});
  const payload={plan_id:planId,source_type:actual.sourceType,source_id:actual.sourceId,event_type:actual.eventType,scheduled_at:actual.originalScheduledAt||actual.scheduledAt,occurred_at:actual.occurredAt,amount_minor:actual.amountMinor,currency:actual.currency||bankTransaction.currency||'EUR',account_id:bankTransaction.accountId||actual.accountId||null,bucket_id:actual.bucketId||null,status:'actual',evidence_level:'bank_actual',external_reference:bankTransaction.external_transaction_id,metadata:{...actual.metadata,expectedScheduledAt:actual.originalScheduledAt||actual.scheduledAt}};
  const{data:event,error:eventError}=await repository.client.from('dz3_financial_events').insert(payload).select().single();
  if(eventError)throw eventError;
  const{error:updateError}=await repository.client.from('dz3_reconciliation_matches').update({financial_event_id:event.id,confirmed_at:new Date().toISOString()}).eq('id',match.id);
  if(updateError)throw updateError;
  return{match:{...match,financial_event_id:event.id},event};
}

export async function importBankBalances({repository,planId,balances=[]}){
  const rows=balances.filter(row=>row.accountId&&Number.isInteger(Number(row.amountMinor))).map(row=>snake({planId,accountId:row.accountId,bucketId:null,amountMinor:Number(row.amountMinor),currency:row.currency||'EUR',observedAt:row.observedAt||new Date().toISOString(),source:'bank_sync',scope:'account_total',metadata:{provider:row.provider||null,externalAccountId:row.externalAccountId||null}}));
  if(!rows.length)return[];
  const{data,error}=await repository.client.from('dz3_balance_observations').insert(rows).select();
  if(error)throw error;
  return data;
}
