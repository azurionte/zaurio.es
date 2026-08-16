'use strict';
const assert=require('node:assert/strict');
const engine=require('../finance/math-engine.js');

const webel={
  id:'webel',
  name:'Limpieza Webel · cada 14 días',
  amount:39.75,
  periodicity:'biweekly',
  startMonth:'2026-08',
  startDate:'2026-08-18',
  chargeLeadDays:2,
  calendarBehavior:'charge'
};

{
  const days=engine.baseRecurringDays(webel,'2026-08-28','2026-09-27');
  assert.deepEqual(days,['2026-08-30','2026-09-13','2026-09-27']);
}

{
  const occurrences=engine.recurringOccurrences(webel,'2026-08-28','2026-09-27',{});
  assert.equal(occurrences.length,3);
  assert.equal(occurrences.reduce((sum,item)=>sum+item.amount,0),119.25);
}

{
  const rawEvents=[
    {date:new Date('2026-08-30T12:00:00'),itemId:'webel',type:'Gasto',name:webel.name,amount:-39.75},
    {date:new Date('2026-09-13T12:00:00'),itemId:'webel',type:'Gasto',name:webel.name,amount:-39.75}
  ];
  const events=engine.canonicalizeEvents({
    startDay:'2026-08-28',
    endDay:'2026-09-27',
    events:rawEvents,
    expenses:[webel],
    monthAdjustments:{}
  });
  const webelEvents=events.filter(event=>event.itemId==='webel');
  assert.equal(webelEvents.length,3);
  assert.deepEqual(webelEvents.map(event=>engine.dayKey(event.date)),['2026-08-30','2026-09-13','2026-09-27']);
}

{
  const events=[
    {date:new Date('2026-08-28T12:00:00'),type:'Ingreso',name:'Sueldo',amount:3093.70},
    {date:new Date('2026-08-30T12:00:00'),itemId:'webel',type:'Gasto',name:webel.name,amount:-39.75},
    {date:new Date('2026-09-13T12:00:00'),itemId:'webel',type:'Gasto',name:webel.name,amount:-39.75},
    {date:new Date('2026-09-27T12:00:00'),itemId:'webel',type:'Gasto',name:webel.name,amount:-39.75},
    {date:new Date('2026-09-05T12:00:00'),type:'Deuda',name:'Cetelem',amount:-372.32}
  ];
  const summary=engine.summarizeEvents(events,'2026-08-28','2026-09-27');
  assert.equal(summary.income,3093.70);
  assert.equal(summary.expense,119.25);
  assert.equal(summary.debt,372.32);
  assert.equal(summary.net,2602.13);
}

{
  const adjusted={
    '2026-08':{
      expenseOverrides:{
        webel:{
          mode:'this_month',
          amount:39.75,
          dateReplacements:{'2026-08-30':'2026-08-31'}
        }
      }
    }
  };
  const days=engine.recurringOccurrences(webel,'2026-08-28','2026-09-27',adjusted).map(item=>item.day);
  assert.deepEqual(days,['2026-08-31','2026-09-13','2026-09-27']);
}

console.log('math-engine.test.js passed');
