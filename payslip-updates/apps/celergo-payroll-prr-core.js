'use strict';

var PRR_SAMPLE_SALARIES = {"FR":[16333.33,6250.0,16375.0,16583.33,16541.67,16466.67,16250.0,16375.0,16541.67,16416.67,16441.67,6083.33,6125.0,5979.17,6083.33,6041.67,6000.0,6083.33,6166.67,5916.67,7341.67,7166.67,7208.33,7258.33,7583.33,5416.67,6008.33,5708.33,5916.67,5916.67,5666.67,9250.0,9333.33,9416.67,9645.83,9708.33,9708.33,9791.67,10083.33,10125.0,9604.17,9541.67,9208.33,9625.0,10104.17,9875.0,9625.0,9708.33,9958.33,9812.5,10041.67,7166.67,7208.33,7270.83,7583.33,7604.17,5541.67,5875.0,5916.67,5604.17,4291.67,6729.17,6770.83,6875.0,4395.83,6791.67,7062.5,6958.33,6875.0,6854.17,4291.67,6791.67,4375.0],"DE":[18333.33,16250.0,16666.67,17500.0,16708.33,16791.67,17166.67,17500.0,17916.67,16666.67,17083.33,12500.0,12416.67,12583.33,7416.67,12416.67,7500.0,12500.0,12583.33,12666.67,7333.33,12333.33,10000.0,12250.0,7666.67,12416.67,7416.67,12583.33,9916.67,12666.67,12500.0,12166.67,7583.33,12416.67,12583.33,12500.0,12333.33,7750.0,12083.33,12416.67,7250.0,7833.33,7333.33,9833.33,7416.67,7500.0,9583.33,7500.0,9833.33,7333.33,9916.67,7166.67,10000.0,7333.33,9750.0,7416.67,9666.67,7500.0,7583.33,9583.33]};
var PRR_COLUMNS = ['Payroll Name','Pay Period','Payroll Pay Element','Employee ID','Amount','Number','Unit Code','Unit','Rate','ICP Pay Element Code','Local ID (LID)','ICP Payroll Name'];
var PRR_CONFIG = {
  FR: {
    label: 'France',
    recurring: ['2000 PP Maladie','2000 PS Maladie','7020 PP Assurance Chômage','7020 PS Assurance Chômage',"9208 PP Taxe d'apprentissage"],
    weights: [27.8541,4.5541,21.5770,4.3017,41.7131],
    rateMin: 20,
    rateMax: 30,
    singles: ['Annual Bonus','Bonus Gross-Up','Cost of Living Allowance','Expense Reimbursement','Over-time','RSU','Special Bonus','Transportation Allowance','Recovery'],
    groups: [
      {key:'blue', elements:['Cost of Living Allowance','Over-time','Transportation Allowance'], mode:'block', block:5, min:1, max:2},
      {key:'purple', elements:['Bonus Gross-Up','RSU'], mode:'block', block:20, min:1, max:2},
      {key:'cyan', elements:['Recovery'], mode:'file', min:1, max:2},
      {key:'pink', elements:['Expense Reimbursement','Special Bonus'], mode:'file', min:1, max:2},
      {key:'orange', elements:['Annual Bonus'], mode:'file', min:1, max:1, excludeElements:['Cost of Living Allowance','Over-time','Transportation Allowance','Expense Reimbursement','Special Bonus']}
    ]
  },
  DE: {
    label: 'Germany',
    recurring: ['Health Insurance EE','Health Insurance ER','Social Security EE','Social Security ER','Wage Tax'],
    weights: [8.8253,9.2460,15.8290,19.0712,47.0286],
    rateMin: 25,
    rateMax: 40,
    singles: ['Bonus','Expense Reimbursement','Commission','Cost of Living Allowance','Special Bonus','Transportation Allowance'],
    groups: [
      {key:'blue', elements:['Commission','Cost of Living Allowance','Transportation Allowance'], mode:'block', block:5, min:1, max:2},
      {key:'pink', elements:['Bonus','Special Bonus'], mode:'file', min:1, max:2},
      {key:'cyan', elements:['Expense Reimbursement'], mode:'block', block:20, min:1, max:1}
    ]
  }
};
var PRR_STEP_LABELS = ['Country','New employees','Employees','Mapping','Export','Salaries','Single elements','Deductions','PRR export'];

function prrSupported(country){ return !!PRR_CONFIG[country]; }
function prrRound(value){ return Math.round((Number(value)||0)*100)/100; }
function prrRandom(min,max){ return min + Math.random()*(max-min); }
function prrRandomInt(min,max){ return Math.floor(prrRandom(min,max+1)); }
function prrCountryConfig(country){ return PRR_CONFIG[country] || null; }
function prrCurrentEmployees(){ return employees(); }
function prrStateRoot(){
  state.prr = state.prr || { countries:{}, configByCountry:{} };
  state.prr.countries = state.prr.countries || {};
  state.prr.configByCountry = state.prr.configByCountry || {};
  return state.prr;
}
function prrEditableConfig(country){
  var root=prrStateRoot(), base=prrCountryConfig(country);
  if(!base) return null;
  if(!root.configByCountry[country]) root.configByCountry[country]={rateMin:base.rateMin,rateMax:base.rateMax,weights:base.weights.slice()};
  var cfg=root.configByCountry[country];
  if(!Array.isArray(cfg.weights) || cfg.weights.length!==base.recurring.length) cfg.weights=base.weights.slice();
  return cfg;
}
function prrCountryData(country){
  var root=prrStateRoot();
  if(!root.countries[country]) root.countries[country]={salaries:{},singles:{},deductionPct:{},buckets:{},locks:{},jitter:{},singlesGenerated:false};
  var d=root.countries[country];
  ['salaries','singles','deductionPct','buckets','locks','jitter'].forEach(function(k){ d[k]=d[k]||{}; });
  return d;
}
function prrSampleSalary(country,index,total){
  var sample=(PRR_SAMPLE_SALARIES[country]||[]).slice().sort(function(a,b){return a-b;});
  if(!sample.length) return 5000;
  if(total<=1) return sample[Math.floor(sample.length/2)];
  var pos=Math.round(index*(sample.length-1)/(total-1));
  return prrRound(sample[Math.max(0,Math.min(sample.length-1,pos))]);
}
function prrRandomSalary(country){
  var sample=PRR_SAMPLE_SALARIES[country]||[5000];
  var base=sample[Math.floor(Math.random()*sample.length)] || 5000;
  return prrRound(base*prrRandom(.97,1.03));
}
function prrEnsureCountry(country){
  if(!prrSupported(country)) return null;
  var d=prrCountryData(country), cfg=prrEditableConfig(country), emps=prrCurrentEmployees();
  emps.forEach(function(emp,i){
    var id=String(emp.id);
    if(!(id in d.salaries)) d.salaries[id]=prrSampleSalary(country,i,emps.length);
    if(!d.singles[id]) d.singles[id]={};
    if(!(id in d.deductionPct)) d.deductionPct[id]=prrRound(prrRandom(Number(cfg.rateMin)||0,Number(cfg.rateMax)||0));
    if(!d.buckets[id]) d.buckets[id]={};
    if(!d.locks[id]) d.locks[id]={};
    if(!d.jitter[id]){
      d.jitter[id]={};
      prrCountryConfig(country).recurring.forEach(function(el){ d.jitter[id][el]=prrRandom(.88,1.12); });
    }
  });
  if(!d.singlesGenerated){ prrGenerateSingles(country,d); d.singlesGenerated=true; }
  prrRebalanceAll(country,d);
  save();
  return d;
}
function prrGross(country,id,d){
  d=d||prrCountryData(country);
  var salary=Number(d.salaries[id])||0;
  var singles=d.singles[id]||{};
  return prrRound(salary+Object.keys(singles).reduce(function(sum,k){return sum+(Number(singles[k])||0);},0));
}
function prrSingleAmount(country,element,salary){
  salary=Number(salary)||0;
  var fixedFR={
    'Annual Bonus':[2000,4200], 'Bonus Gross-Up':[1900,2800], 'Cost of Living Allowance':[500,900],
    'Expense Reimbursement':[500,2850], 'Over-time':[900,1900], 'RSU':[1020,2500],
    'Recovery':[1000,1800], 'Special Bonus':[1500,3500], 'Transportation Allowance':[600,1350]
  };
  if(country==='FR' && fixedFR[element]) return Math.round(prrRandom(fixedFR[element][0],fixedFR[element][1])/10)*10;
  var ranges={
    'Commission':[.08,.22], 'Cost of Living Allowance':[.04,.10], 'Transportation Allowance':[.03,.08],
    'Expense Reimbursement':[.02,.08], 'Bonus':[.10,.30], 'Special Bonus':[.10,.35]
  };
  var r=ranges[element]||[.04,.16];
  var value=salary*prrRandom(r[0],r[1]);
  if(element==='Expense Reimbursement') value=Math.max(250,Math.min(1500,value));
  return Math.round(value/10)*10;
}
function prrChoose(list,count){
  var copy=list.slice();
  for(var i=copy.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=copy[i];copy[i]=copy[j];copy[j]=t;}
  return copy.slice(0,Math.max(0,Math.min(count,copy.length)));
}
function prrGenerateSingles(country,d){
  var config=prrCountryConfig(country), emps=prrCurrentEmployees();
  emps.forEach(function(emp){ d.singles[String(emp.id)]={}; });
  var elementCursor=0;
  function assignRecipients(group, recipients){
    recipients.forEach(function(emp){
      var id=String(emp.id), element=group.elements[elementCursor++%group.elements.length];
      d.singles[id][element]=prrSingleAmount(country,element,d.salaries[id]);
    });
  }
  config.groups.forEach(function(group){
    if(group.mode==='block'){
      for(var start=0;start<emps.length;start+=group.block){
        var block=emps.slice(start,start+group.block);
        var count=prrRandomInt(group.min,group.max);
        assignRecipients(group,prrChoose(block,count));
      }
    } else {
      var eligible=emps.filter(function(emp){
        if(!group.excludeElements || !group.excludeElements.length) return true;
        var assigned=d.singles[String(emp.id)]||{};
        return !group.excludeElements.some(function(el){return assigned[el]!=null;});
      });
      assignRecipients(group,prrChoose(eligible,prrRandomInt(group.min,group.max)));
    }
  });
}
function prrNormalizedWeights(country,id,d){
  var config=prrCountryConfig(country), editable=prrEditableConfig(country), jitter=(d.jitter[id]||{});
  var raw=config.recurring.map(function(el,i){return Math.max(0,Number(editable.weights[i])||0)*(Number(jitter[el])||1);});
  var sum=raw.reduce(function(a,b){return a+b;},0)||1;
  return raw.map(function(v){return v/sum;});
}
function prrRebalanceEmployee(country,id,d){
  var config=prrCountryConfig(country), gross=prrGross(country,id,d), pct=Math.max(0,Number(d.deductionPct[id])||0), target=prrRound(gross*pct/100);
  var buckets=d.buckets[id]||(d.buckets[id]={}), locks=d.locks[id]||(d.locks[id]={});
  var locked=config.recurring.filter(function(el){return !!locks[el];});
  if(locked.length>=config.recurring.length){ locks[config.recurring[config.recurring.length-1]]=false; locked=locked.slice(0,-1); }
  var lockedTotal=locked.reduce(function(sum,el){return sum+(Number(buckets[el])||0);},0);
  if(lockedTotal>target && lockedTotal>0){
    var scale=target/lockedTotal;
    locked.forEach(function(el){buckets[el]=prrRound((Number(buckets[el])||0)*scale);});
    lockedTotal=locked.reduce(function(sum,el){return sum+(Number(buckets[el])||0);},0);
  }
  var unlocked=config.recurring.filter(function(el){return !locks[el];});
  var remaining=Math.max(0,prrRound(target-lockedTotal));
  var weights=prrNormalizedWeights(country,id,d), unlockedWeight=0;
  unlocked.forEach(function(el){ unlockedWeight+=weights[config.recurring.indexOf(el)]; });
  var allocated=0;
  unlocked.forEach(function(el,idx){
    var amount;
    if(idx===unlocked.length-1) amount=prrRound(remaining-allocated);
    else {
      var w=weights[config.recurring.indexOf(el)];
      amount=unlockedWeight?prrRound(remaining*w/unlockedWeight):prrRound(remaining/unlocked.length);
      allocated=prrRound(allocated+amount);
  }
  buckets[el]=Math.max(0,amount);
  });
  return target;
}
function prrRebalanceAll(country,d){
  d=d||prrCountryData(country);
  prrCurrentEmployees().forEach(function(emp){prrRebalanceEmployee(country,String(emp.id),d);});
}
function prrSetBucket(country,id,element,value){
  var d=prrCountryData(country), config=prrCountryConfig(country), target=prrRound(prrGross(country,id,d)*(Number(d.deductionPct[id])||0)/100);
  var locks=d.locks[id]||(d.locks[id]={}), buckets=d.buckets[id]||(d.buckets[id]={});
  var others=config.recurring.filter(function(el){return el!==element && locks[el];}).reduce(function(sum,el){return sum+(Number(buckets[el])||0);},0);
  buckets[element]=Math.max(0,Math.min(prrRound(value),Math.max(0,target-others)));
  locks[element]=true;
  prrRebalanceEmployee(country,id,d);
  save();
}
function prrRandomizeDeductions(country){
  var d=prrEnsureCountry(country), cfg=prrEditableConfig(country), config=prrCountryConfig(country);
  prrCurrentEmployees().forEach(function(emp){
    var id=String(emp.id);
    d.deductionPct[id]=prrRound(prrRandom(Number(cfg.rateMin)||0,Number(cfg.rateMax)||0));
    d.locks[id]={}; d.jitter[id]={};
    config.recurring.forEach(function(el){d.jitter[id][el]=prrRandom(.88,1.12);});
    prrRebalanceEmployee(country,id,d);
  });
  save();
}
function prrRandomizeSalaries(country){
  var d=prrEnsureCountry(country);
  prrCurrentEmployees().forEach(function(emp){ d.salaries[String(emp.id)]=prrRandomSalary(country); });
  prrRebalanceAll(country,d); save();
}
function prrSingleAssignmentsCount(d){ return Object.keys(d.singles).reduce(function(n,id){return n+Object.keys(d.singles[id]||{}).length;},0); }
function prrBuildRows(country){
  var d=prrEnsureCountry(country), config=prrCountryConfig(country), label=config.label+' Local Monthly';
  var parts=String(state.month||currentMonth()).split('-'), period=parts[0]+'-Monthly-'+parts[1], out=[];
  prrCurrentEmployees().forEach(function(emp){
    var id=String(emp.id), buckets=d.buckets[id]||{};
    config.recurring.forEach(function(el){ out.push([label,period,el,id,prrRound(buckets[el]),'','','','','','','']); });
    out.push([label,period,'Salary',id,prrRound(d.salaries[id]),'','','','','','','']);
    config.singles.forEach(function(el){ if(d.singles[id] && d.singles[id][el]!=null) out.push([label,period,el,id,prrRound(d.singles[id][el]),'','','','','','','']); });
  });
  return out;
}

