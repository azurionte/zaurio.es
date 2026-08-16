import assert from 'node:assert/strict';
import { resolveCurrentPosition } from '../core/position-engine.js';
import { buildExpectedLedger } from '../core/expected-ledger-engine.js';
import { generateDebtEvents } from '../core/debt-engine.js';
import { validateAiToolCall, aiMutationToDecisionCommand } from '../integrations/ai-contract.js';
import { normalizeProviderTransaction } from '../integrations/bank-provider-contract.js';

function test(name,fn){try{fn();console.log(`✓ ${name}`);}catch(error){console.error(`✗ ${name}`);throw error;}}

export function runArchitectureRegressions(){
  test('current position refuses to invent a bank balance from modelled cash flow',()=>{
    const result=resolveCurrentPosition({accounts:[{id:'a',name:'A'}],observations:[],events:[{id:'e',sourceType:'income_rule',sourceId:'s',eventType:'income',scheduledAt:'2026-08-01',occurredAt:'2026-08-01T10:00:00Z',amountMinor:10000,status:'confirmed',evidenceLevel:'user_confirmed',accountId:'a'}],transfers:[],asOf:'2026-08-16'});
    assert.equal(result.known,false);assert.equal(result.totalMinor,null);assert.equal(result.unknownAccounts.length,1);
  });
  test('fresh account total observation becomes truth and later confirmed facts advance it',()=>{
    const result=resolveCurrentPosition({accounts:[{id:'a',name:'A'}],observations:[{id:'o',accountId:'a',scope:'account_total',amountMinor:50000,observedAt:'2026-08-15T10:00:00Z',source:'bank_sync'}],events:[{id:'e',sourceType:'expense_rule',sourceId:'x',eventType:'expense',scheduledAt:'2026-08-16',occurredAt:'2026-08-16T10:00:00Z',amountMinor:-1000,status:'actual',evidenceLevel:'bank_actual',accountId:'a'}],transfers:[],asOf:'2026-08-16'});
    assert.equal(result.known,true);assert.equal(result.totalMinor,49000);assert.equal(result.accounts[0].fresh,true);
  });
  test('stale account total is not enough to authorize an optional purchase',()=>{
    const result=resolveCurrentPosition({accounts:[{id:'a',name:'A'}],observations:[{id:'o',accountId:'a',scope:'account_total',amountMinor:50000,observedAt:'2026-08-10T10:00:00Z',source:'user'}],events:[],transfers:[],asOf:'2026-08-16'});
    assert.equal(result.known,false);assert.equal(result.accounts[0].reason,'stale_account_total');
  });
  test('effective rule version changes future amount without rewriting prior occurrence',()=>{
    const events=buildExpectedLedger({from:'2028-05-01',to:'2028-07-31',recurrenceRules:[{id:'rent',frequency:'monthly',intervalValue:1,anchorDate:'2026-08-01',calendarRule:'fixed_day',dueDay:1,leadDays:0}],expenseRules:[{id:'rent',name:'Rent',amountMinor:114735,currency:'EUR',recurrenceId:'rent',startDate:'2026-08-01',enabled:true}],ruleVersions:[{id:'v',sourceType:'expense_rule',sourceId:'rent',effectiveFrom:'2028-06-01',amountMinor:130000}]});
    assert.deepEqual(events.map(e=>[e.scheduledAt,e.amountMinor]),[['2028-05-01',-114735],['2028-06-01',-130000],['2028-07-01',-130000]]);
  });
  test('effective debt schedule version changes only future installments',()=>{
    const events=generateDebtEvents({debt:{id:'d',name:'Debt',debtType:'loan',currentBalanceMinor:0,status:'active',metadata:{balanceKnown:false}},schedule:{id:'d',paymentAmountMinor:10000,remainingInstallments:12,enabled:true},recurrenceRule:{frequency:'monthly',intervalValue:1,anchorDate:'2026-08-05',calendarRule:'fixed_day',dueDay:5,leadDays:0},ruleVersions:[{id:'v',sourceType:'debt_schedule',sourceId:'d',effectiveFrom:'2026-10-01',amountMinor:12000}],from:'2026-09-01',to:'2026-10-31'});
    assert.deepEqual(events.map(e=>e.amountMinor),[-10000,-12000]);
  });
  test('AI mutation becomes a proposal requiring user confirmation',()=>{
    const command=aiMutationToDecisionCommand({name:'propose_occurrence_override',arguments:{sourceId:'x',date:'2026-09-01',amountMinor:1234}});
    assert.equal(command.proposedBy,'ai');assert.equal(command.requiresUserConfirmation,true);
    assert.equal(validateAiToolCall({name:'evaluate_purchase',arguments:{amountMinor:1000}}).tool.readOnly,true);
  });
  test('bank provider normalization preserves integer minor units and provider identity',()=>{
    const tx=normalizeProviderTransaction({externalTransactionId:'tx-1',bookedAt:'2026-09-01T10:00:00Z',amountMinor:-1549,currency:'eur',merchantName:'NETFLIX'});
    assert.equal(tx.externalTransactionId,'tx-1');assert.equal(tx.amountMinor,-1549);assert.equal(tx.currency,'EUR');
  });
}
