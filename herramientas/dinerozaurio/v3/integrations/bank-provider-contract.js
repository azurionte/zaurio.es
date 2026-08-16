export const BANK_PROVIDER_CONTRACT_VERSION='dz3-bank-provider-1';

export function validateProviderAccount(account){
  if(!account?.externalAccountId)throw new TypeError('externalAccountId is required');
  if(!account?.name)throw new TypeError('account name is required');
  if(!account?.currency)throw new TypeError('account currency is required');
  return account;
}

export function validateProviderTransaction(transaction){
  if(!transaction?.externalTransactionId)throw new TypeError('externalTransactionId is required');
  if(!transaction?.bookedAt)throw new TypeError('bookedAt is required');
  if(!Number.isInteger(Number(transaction.amountMinor)))throw new TypeError('amountMinor must be integer minor units');
  return transaction;
}

export class BankProviderAdapter {
  get provider(){throw new Error('provider getter must be implemented');}
  async connect(){throw new Error('connect() must be implemented by provider adapter');}
  async listAccounts(){throw new Error('listAccounts() must be implemented by provider adapter');}
  async listTransactions(){throw new Error('listTransactions() must be implemented by provider adapter');}
  async getBalances(){return[];}
}

export function normalizeProviderAccount(provider,row){
  validateProviderAccount(row);
  return{provider,externalAccountId:String(row.externalAccountId),name:String(row.name),currency:String(row.currency).toUpperCase(),institutionName:row.institutionName||'',accountType:row.accountType||'current',metadata:row.metadata||{}};
}

export function normalizeProviderTransaction(row){
  validateProviderTransaction(row);
  return{externalTransactionId:String(row.externalTransactionId),bookedAt:String(row.bookedAt),valueAt:row.valueAt?String(row.valueAt):null,amountMinor:Number(row.amountMinor),currency:String(row.currency||'EUR').toUpperCase(),merchantName:row.merchantName||'',description:row.description||'',rawCategory:row.rawCategory||null,syncStatus:row.syncStatus||'booked',providerData:row.providerData||{}};
}
