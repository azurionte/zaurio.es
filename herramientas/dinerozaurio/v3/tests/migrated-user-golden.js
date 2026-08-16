import assert from 'node:assert/strict';
import { buildExpectedLedger } from '../core/expected-ledger-engine.js';
import { generateDebtLedger } from '../core/financial-core.js';
import { summarizeLedger } from '../core/ledger.js';

export function runMigratedUserGolden() {
  const recurrenceRules = [
    {id:'salary',frequency:'monthly',intervalValue:1,anchorDate:'2026-08-28',calendarRule:'fixed_day',dueDay:28,leadDays:0},
    {id:'webel',frequency:'interval_days',intervalValue:14,anchorDate:'2026-08-18',calendarRule:'anchor',leadDays:2},
    ...[['grindr',20],['rent',1],['vodafone',10],['chatgpt',29],['spotify',9],['netflix',20],['glovo',13],['cooper',12],['kivet',3],['google',21]].map(([id,day])=>({id,frequency:'monthly',intervalValue:1,anchorDate:`2026-08-${String(day).padStart(2,'0')}`,calendarRule:'fixed_day',dueDay:day,leadDays:0})),
    {id:'food',frequency:'monthly',intervalValue:1,anchorDate:'2026-08-28',calendarRule:'funding_relative',anchorSourceType:'income_rule',anchorSourceId:'salary',offsetDays:0},
    {id:'electricity',frequency:'monthly',intervalValue:1,anchorDate:'2026-08-28',calendarRule:'funding_relative',anchorSourceType:'income_rule',anchorSourceId:'salary',offsetDays:0},
    {id:'leisure',frequency:'monthly',intervalValue:1,anchorDate:'2026-08-28',calendarRule:'funding_relative',anchorSourceType:'income_rule',anchorSourceId:'salary',offsetDays:0},
    {id:'water',frequency:'interval_months',intervalValue:2,anchorDate:'2026-09-03',calendarRule:'fixed_day',dueDay:3,leadDays:0},
    {id:'madrid',frequency:'one_time',intervalValue:1,anchorDate:'2026-09-18',endDate:'2026-09-18',calendarRule:'fixed_day',dueDay:18,leadDays:0},
    {id:'short',frequency:'monthly',intervalValue:1,anchorDate:'2026-08-05',endDate:'2026-09-05',calendarRule:'fixed_day',dueDay:5,leadDays:0},
    {id:'iphone',frequency:'monthly',intervalValue:1,anchorDate:'2026-08-05',endDate:'2026-10-05',calendarRule:'fixed_day',dueDay:5,leadDays:0},
    {id:'consolidation',frequency:'monthly',intervalValue:1,anchorDate:'2026-08-31',endDate:'2033-08-31',calendarRule:'last_day',dueDay:31,leadDays:0}
  ];
  const incomeRules=[{id:'salary',name:'Sueldo neto',amountMinor:309370,currency:'EUR',recurrenceId:'salary',accountId:'bbva',startDate:'2026-08-28',isSalary:true,enabled:true}];
  const expenseRules=[
    ['webel','Webel',3975,'webel'],['grindr','Grindr',3999,'grindr'],['rent','Alquiler',114735,'rent'],['food','Comida',35000,'food'],['vodafone','Vodafone',12914,'vodafone'],['electricity','Iberdrola',22100,'electricity'],['water','Aigües',4608,'water'],['chatgpt','ChatGPT Business',5200,'chatgpt'],['spotify','Spotify',2099,'spotify'],['netflix','Netflix',1499,'netflix'],['glovo','Glovo',799,'glovo'],['leisure','Ocio',10000,'leisure'],['madrid','Viaje Madrid',30000,'madrid'],['cooper','Bolsa comida Cooper',2200,'cooper'],['kivet','Kivet',2600,'kivet'],['google','Google One',299,'google']
  ].map(([id,name,amountMinor,recurrenceId])=>({id,name,amountMinor,currency:'EUR',recurrenceId,accountId:'bbva',startDate:'2026-08-01',enabled:true}));
  const debts=[
    {id:'short',name:'Préstamo corto',debtType:'loan',currentBalanceMinor:0,currency:'EUR',status:'active',metadata:{balanceKnown:false}},
    {id:'iphone',name:'Préstamo iPhone',debtType:'loan',currentBalanceMinor:0,currency:'EUR',status:'active',metadata:{balanceKnown:false}},
    {id:'consolidation',name:'Préstamo consolidación 30K',debtType:'loan',currentBalanceMinor:3000000,currency:'EUR',status:'active',metadata:{balanceKnown:true}}
  ];
  const debtSchedules=[
    {debtId:'short',recurrenceId:'short',paymentAmountMinor:37232,remainingInstallments:2,enabled:true},
    {debtId:'iphone',recurrenceId:'iphone',paymentAmountMinor:6121,remainingInstallments:3,enabled:true},
    {debtId:'consolidation',recurrenceId:'consolidation',paymentAmountMinor:50504,remainingInstallments:84,enabled:true}
  ];
  const debtAdjustments=[{id:'first',debtId:'consolidation',effectiveDate:'2026-08-31',adjustmentType:'custom_payment',amountMinor:22332}];
  const debtEvents=generateDebtLedger({debts,debtSchedules,recurrenceRules,debtAdjustments,from:'2026-08-28',to:'2026-09-27'});
  const events=buildExpectedLedger({from:'2026-08-28',to:'2026-09-27',incomeRules,expenseRules,savingsGoals:[],recurrenceRules,debtEvents});
  const summary=summarizeLedger(events,{from:'2026-08-28',to:'2026-09-27'});
  const expenses=-events.filter(e=>e.eventType==='expense').reduce((sum,e)=>sum+e.amountMinor,0);
  const debt=-events.filter(e=>e.eventType==='debt_payment').reduce((sum,e)=>sum+e.amountMinor,0);
  const webelDates=events.filter(e=>e.sourceId==='webel').map(e=>e.scheduledAt);
  assert.deepEqual(webelDates,['2026-08-30','2026-09-13','2026-09-27']);
  assert.equal(expenses,259977);
  assert.equal(debt,65685);
  assert.equal(summary.netMinor,-16292);
  console.log('✓ migrated user September salary cycle = -162.92 EUR with 3 Webel charges');
}
