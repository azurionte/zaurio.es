import { majorToMinor } from '../core/money.js';

export const CONFIGURATION_SERVICE_VERSION='dz3-config-1';
const nowDay=()=>new Date().toISOString().slice(0,10);
const uuid=()=>crypto.randomUUID();

function recurrencePayload({planId,id=uuid(),frequency='monthly',intervalValue=1,anchorDate=nowDay(),endDate=null,calendarRule='fixed_day',dueDay=null,leadDays=0,anchorSourceType=null,anchorSourceId=null,offsetDays=0,metadata={}}){return{id,plan_id:planId,frequency,interval_value:Number(intervalValue||1),anchor_date:anchorDate,end_date:endDate||null,calendar_rule:calendarRule,due_day:dueDay==null?null:Number(dueDay),lead_days:Number(leadDays||0),anchor_source_type:anchorSourceType,anchor_source_id:anchorSourceId,offset_days:Number(offsetDays||0),metadata};}
function sourcePayload({id,planId,name,amount,recurrenceId,accountId=null,bucketId=null,startDate,endDate=null,metadata={}}){return{id,plan_id:planId,name,amount_minor:majorToMinor(Number(amount||0)),currency:'EUR',recurrence_id:recurrenceId,account_id:accountId||null,bucket_id:bucketId||null,start_date:startDate,end_date:endDate||null,metadata};}
async function one(client,table,payload,options={}){const query=options.upsert?client.from(table).upsert(payload,{onConflict:options.onConflict||'id'}):client.from(table).insert(payload);const{data,error}=await query.select().single();if(error)throw error;return data;}

export async function createBasicPlan({repository,name='Plan principal',periodMode='salary_cycle',salaryFundingStrategy='funds_next_month',primaryAccountName='Cuenta principal',timezone='Europe/Madrid'}){
  const session=await repository.session();if(!session?.user?.id)throw new Error('Authentication is required');
  const plan=await one(repository.client,'dz3_plans',{user_id:session.user.id,name,currency:'EUR',timezone,period_mode:periodMode,salary_funding_strategy:salaryFundingStrategy,initial_balance_minor:0,status:'active'});
  const account=await one(repository.client,'dz3_accounts',{plan_id:plan.id,name:primaryAccountName,account_type:'current',currency:'EUR',is_primary:true,enabled:true});
  return{plan,account};
}

export async function configureSalary({repository,planId,name='Sueldo',amount,accountId,firstPaymentDate,fundingStrategy='funds_next_month'}){
  const id=uuid(),day=Number(firstPaymentDate.slice(8,10));
  const recurrence=await one(repository.client,'dz3_recurrence_rules',recurrencePayload({planId,id,frequency:'monthly',anchorDate:firstPaymentDate,calendarRule:'fixed_day',dueDay:day,metadata:{configuredBy:'v3'}}));
  const salary=await one(repository.client,'dz3_income_rules',{...sourcePayload({id,planId,name,amount,recurrenceId:recurrence.id,accountId,startDate:firstPaymentDate}),is_salary:true,enabled:true});
  const{error}=await repository.client.from('dz3_plans').update({period_mode:'salary_cycle',salary_funding_strategy:fundingStrategy,salary_source_id:salary.id}).eq('id',planId);if(error)throw error;
  return{salary,recurrence};
}

export async function createIncomeRule({repository,planId,name,amount,accountId=null,bucketId=null,startDate,frequency='monthly',intervalValue=1,calendarRule='fixed_day',dueDay=null,endDate=null,isSalary=false,leadDays=0}){
  if(isSalary)return configureSalary({repository,planId,name,amount,accountId,firstPaymentDate:startDate});
  const id=uuid();const recurrence=await one(repository.client,'dz3_recurrence_rules',recurrencePayload({planId,id,frequency,intervalValue,anchorDate:startDate,endDate,calendarRule,dueDay:dueDay??Number(startDate.slice(8,10)),leadDays}));
  const source=await one(repository.client,'dz3_income_rules',{...sourcePayload({id,planId,name,amount,recurrenceId:id,accountId,bucketId,startDate,endDate}),is_salary:false,enabled:true});return{source,recurrence};
}

export async function createExpenseRule({repository,planId,name,amount,category=null,accountId=null,bucketId=null,startDate,frequency='monthly',intervalValue=1,calendarRule='fixed_day',dueDay=null,endDate=null,leadDays=0,fundingRelativeToSalaryId=null,offsetDays=0}){
  const id=uuid();const relative=!!fundingRelativeToSalaryId;const recurrence=await one(repository.client,'dz3_recurrence_rules',recurrencePayload({planId,id,frequency,intervalValue,anchorDate:startDate,endDate,calendarRule:relative?'funding_relative':calendarRule,dueDay:relative?null:(dueDay??Number(startDate.slice(8,10))),leadDays,anchorSourceType:relative?'income_rule':null,anchorSourceId:fundingRelativeToSalaryId,offsetDays}));
  const source=await one(repository.client,'dz3_expense_rules',{...sourcePayload({id,planId,name,amount,recurrenceId:id,accountId,bucketId,startDate,endDate}),category,enabled:true});return{source,recurrence};
}

export async function createSavingsGoal({repository,planId,name,target,contribution,accountId=null,bucketId=null,startDate,endDate=null,dueDay=1,status='active'}){
  const id=uuid();await one(repository.client,'dz3_recurrence_rules',recurrencePayload({planId,id,frequency:'monthly',anchorDate:startDate,endDate,calendarRule:'fixed_day',dueDay}));
  return one(repository.client,'dz3_savings_goals',{id,plan_id:planId,name,target_minor:majorToMinor(Number(target||0)),contribution_minor:majorToMinor(Number(contribution||0)),currency:'EUR',recurrence_id:id,account_id:accountId||null,bucket_id:bucketId||null,start_date:startDate,end_date:endDate||null,status,metadata:{configuredBy:'v3'}});
}

export async function createDebt({repository,planId,name,creditor='',debtType='loan',principal,currentBalance,interestRate=0,accountId=null,startDate,paymentAmount,remainingInstallments=null,lastPaymentDate=null,dueDay=null,payoffFeePercent=0}){
  const id=uuid();await one(repository.client,'dz3_recurrence_rules',recurrencePayload({planId,id,frequency:'monthly',anchorDate:startDate,endDate:lastPaymentDate,calendarRule:'fixed_day',dueDay:dueDay??Number(startDate.slice(8,10))}));
  const debt=await one(repository.client,'dz3_debts',{id,plan_id:planId,name,creditor:creditor||null,debt_type:debtType,original_principal_minor:majorToMinor(Number(principal||0)),current_balance_minor:majorToMinor(Number(currentBalance||0)),currency:'EUR',annual_interest_rate:Number(interestRate||0),start_date:startDate,status:'active',payment_account_id:accountId||null,metadata:{balanceKnown:true,configuredBy:'v3'}});
  const schedule=await one(repository.client,'dz3_debt_schedules',{id,debt_id:id,recurrence_id:id,payment_amount_minor:majorToMinor(Number(paymentAmount||0)),remaining_installments:remainingInstallments==null?null:Number(remainingInstallments),last_payment_date:lastPaymentDate||null,payoff_fee_percent:Number(payoffFeePercent||0),enabled:true});return{debt,schedule};
}

export async function createAccount({repository,planId,name,institutionName='',accountType='current',isPrimary=false}){if(isPrimary){const{error}=await repository.client.from('dz3_accounts').update({is_primary:false}).eq('plan_id',planId);if(error)throw error;}return one(repository.client,'dz3_accounts',{plan_id:planId,name,account_type:accountType,currency:'EUR',is_primary:isPrimary,institution_name:institutionName||null,enabled:true});}
export async function createBucket({repository,accountId,name,bucketType='custom'}){return one(repository.client,'dz3_account_buckets',{account_id:accountId,name,bucket_type:bucketType,enabled:true});}

export async function effectiveAmountChange({repository,planId,sourceType,sourceId,effectiveFrom,amount}){return one(repository.client,'dz3_rule_versions',{plan_id:planId,source_type:sourceType,source_id:sourceId,effective_from:effectiveFrom,amount_minor:majorToMinor(Number(amount||0)),metadata:{configuredBy:'v3'}},{upsert:true,onConflict:'source_type,source_id,effective_from'});}
export async function setRuleEnabledFrom({repository,planId,sourceType,sourceId,effectiveFrom,enabled}){return one(repository.client,'dz3_rule_versions',{plan_id:planId,source_type:sourceType,source_id:sourceId,effective_from:effectiveFrom,enabled:!!enabled,metadata:{configuredBy:'v3'}},{upsert:true,onConflict:'source_type,source_id,effective_from'});}
