import { buildExpectedLedger } from './expected-ledger-engine.js';
import { generateDebtEvents } from './debt-engine.js';
import { resolvePeriod } from './funding-cycle-engine.js';
import { summarizeLedger, explainAggregate } from './ledger.js';
import { resolveAccountState, assertAccountingInvariants } from './accounting-engine.js';
import { analyzePeriod } from './analytics-engine.js';

export const FINANCIAL_CORE_VERSION='dz3-financial-core-1';
function mapById(rows=[]){return new Map(rows.map(row=>[row.id,row]));}
export function generateDebtLedger({debts=[],debtSchedules=[],recurrenceRules=[],debtAdjustments=[],ruleVersions=[],from,to}){
  const schedules=new Map(debtSchedules.map(row=>[row.debtId,row])),recurrences=mapById(recurrenceRules);
  return debts.flatMap(debt=>{const schedule=schedules.get(debt.id);if(!schedule)return[];const recurrence=schedule.recurrenceId?recurrences.get(schedule.recurrenceId):null;if(!recurrence)return[];return generateDebtEvents({debt,schedule,recurrenceRule:{frequency:recurrence.frequency,intervalValue:recurrence.intervalValue,anchorDate:recurrence.anchorDate,endDate:recurrence.endDate,calendarRule:recurrence.calendarRule,dueDay:recurrence.dueDay,leadDays:recurrence.leadDays},adjustments:debtAdjustments,ruleVersions,from,to});});
}
export function buildFinancialState({range,plan,salaryEvent=null,nextSalaryEvent=null,incomeRules=[],expenseRules=[],savingsGoals=[],recurrenceRules=[],debts=[],debtSchedules=[],debtAdjustments=[],eventOverrides=[],ruleVersions=[],confirmedEvents=[],transferEvents=[],accounts=[],buckets=[],transfers=[],observations=[],asOf=range.to}){
  const debtEvents=generateDebtLedger({debts,debtSchedules,recurrenceRules,debtAdjustments,ruleVersions,from:range.from,to:range.to});
  const expected=buildExpectedLedger({from:range.from,to:range.to,incomeRules,expenseRules,savingsGoals,recurrenceRules,debtEvents,transferEvents,eventOverrides,ruleVersions});
  const ledger=[...expected,...confirmedEvents],summary=summarizeLedger(ledger,range),explanation=explainAggregate(ledger,range),accounting=resolveAccountState({accounts,buckets,events:ledger,transfers,observations,from:range.from,asOf});
  assertAccountingInvariants(accounting);
  const analytics=analyzePeriod({events:ledger,from:range.from,to:range.to}),period=plan?resolvePeriod({mode:plan.periodMode,labelMonth:plan.labelMonth||range.from.slice(0,7),salaryEvent,nextSalaryEvent,fundingStrategy:plan.salaryFundingStrategy}):null;
  return{version:FINANCIAL_CORE_VERSION,period,ledger,expectedLedger:expected,summary,explanation,accounting,analytics};
}
