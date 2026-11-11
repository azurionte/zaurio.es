/* Standalone PRR Builder rules and deductions undo. Not loaded by Celergo Payroll Processing Tool. */
(function(){
'use strict';
var STORAGE_KEY='dbt-prr-standalone-rules-v1';
var ruleSets={};
var rulesOpen=false;
var customSequence=0;
var undoStack=[];
var MAX_UNDO=50;
function copy(value){return JSON.parse(JSON.stringify(value));}
function cleanCount(value,fallback){var n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(10000,Math.floor(n))):fallback;}
function storedRules(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch(error){return {};}}
function baseRules(country){
  var config=prrCountryConfig(country);
  return config.groups.map(function(group,i){
    return Object.assign({id:'builtin-'+i,name:'Default rule '+(i+1),builtin:true,enabled:true,scope:'session',amountMin:null,amountMax:null},copy(group));
  });
}
function rulesFor(country){
  if(ruleSets[country])return ruleSets[country];
  var base=baseRules(country),saved=storedRules()[country]||[];
  if(!Array.isArray(saved))saved=[];
  saved.forEach(function(r){
    if(!r||typeof r!=='object'||!r.id)return;
    var pos=base.findIndex(function(x){return x.id===r.id;});
    if(pos>=0)base[pos]=Object.assign(base[pos],copy(r),{builtin:true,scope:'permanent'});
    else if(String(r.id).indexOf('custom-')===0)base.push(Object.assign({builtin:false,enabled:true,scope:'permanent'},copy(r)));
  });
  ruleSets[country]=base;
  return base;
}
function persistRules(){
  var stored=storedRules();
  Object.keys(ruleSets).forEach(function(country){
    stored[country]=ruleSets[country].filter(function(r){return r.scope==='permanent';}).map(copy);
  });
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(stored));return true;}
  catch(error){console.warn('PRR rule preferences could not be saved',error);return false;}
}
function normalizeRule(rule,country){
  var allowed=prrCountryConfig(country).singles;
  var elements=(Array.isArray(rule.elements)?rule.elements:[]).filter(function(el){return allowed.indexOf(el)>=0;});
  var excluded=(Array.isArray(rule.excludeElements)?rule.excludeElements:[]).filter(function(el){return allowed.indexOf(el)>=0;});
  var min=cleanCount(rule.min,0),max=Math.max(min,cleanCount(rule.max,min));
  var low=rule.amountMin===''||rule.amountMin==null?null:Math.max(0,Number(rule.amountMin));
  var high=rule.amountMax===''||rule.amountMax==null?null:Math.max(0,Number(rule.amountMax));
  return {id:String(rule.id),name:String(rule.name||'Custom rule'),builtin:!!rule.builtin,
    enabled:rule.enabled!==false,scope:rule.scope==='permanent'?'permanent':'session',
    mode:rule.mode==='block'?'block':'file',block:Math.max(1,cleanCount(rule.block,5)),
    min:min,max:max,elements:elements,excludeElements:excluded,
    amountMin:Number.isFinite(low)?low:null,amountMax:Number.isFinite(high)?high:null};
}
function rulesMarkup(){
  var country=state.country,config=prrCountryConfig(country);
  var cards=rulesFor(country).map(function(raw){
    var r=normalizeRule(raw,country),id=esc(r.id);
    function input(label,field,value,type,attributes){
      return '<label>'+label+'<input data-prr-rule-id="'+id+'" data-prr-rule-field="'+field+'" type="'+(type||'number')+'" '+(attributes||'')+' value="'+esc(value==null?'':value)+'"></label>';
    }
    return '<details class="prr-rule-card"><summary><strong>'+esc(r.name)+'</strong><span class="prr-rule-meta">'+(r.builtin?'Built-in':'Custom')+' · '+(r.enabled?'Enabled':'Disabled')+' · '+(r.scope==='permanent'?'Saved on this computer':'This session')+'</span><small>'+esc(r.elements.join(', ')||'No selected elements')+'</small></summary>'+
      '<div class="prr-rule-fields"><label>Active<select data-prr-rule-id="'+id+'" data-prr-rule-field="enabled"><option value="yes"'+(r.enabled?' selected':'')+'>Enabled</option><option value="no"'+(!r.enabled?' selected':'')+'>Disabled</option></select></label>'+
      '<label>Distribution<select data-prr-rule-id="'+id+'" data-prr-rule-field="mode"><option value="file"'+(r.mode==='file'?' selected':'')+'>Across all employees</option><option value="block"'+(r.mode==='block'?' selected':'')+'>Per employee block</option></select></label>'+
      input('Minimum assignments','min',r.min,'number','min="0" step="1"')+
      input('Maximum assignments','max',r.max,'number','min="0" step="1"')+
      input('Employees per block','block',r.block,'number','min="1" step="1"')+
      input('Min. amount (optional)','amountMin',r.amountMin,'number','min="0" step="0.01"')+
      input('Max. amount (optional)','amountMax',r.amountMax,'number','min="0" step="0.01"')+
      '<label>Keep changes<select data-prr-rule-id="'+id+'" data-prr-rule-field="scope"><option value="session"'+(r.scope==='session'?' selected':'')+'>This session only</option><option value="permanent"'+(r.scope==='permanent'?' selected':'')+'>Save on this computer</option></select></label>'+
      '<label class="prr-rule-wide">Elements this rule can assign<select multiple size="'+Math.min(7,config.singles.length)+'" data-prr-rule-id="'+id+'" data-prr-rule-field="elements">'+config.singles.map(function(el){return '<option value="'+esc(el)+'"'+(r.elements.indexOf(el)>=0?' selected':'')+'>'+esc(el)+'</option>';}).join('')+'</select><small class="muted">Use Ctrl or Shift to select multiple pay elements.</small></label>'+'<label class="prr-rule-wide">Exclude employees already assigned any of these elements (comma-separated)<input type="text" data-prr-rule-id="'+id+'" data-prr-rule-field="excludeElements" value="'+esc(r.excludeElements.join(', '))+'" placeholder="e.g. Bonus, Commission"></label></div>'+
      '<div class="prr-rule-actions">'+(r.builtin?'<button class="mini-btn" type="button" data-prr-rule-reset="'+id+'">Restore default</button>':'<button class="mini-btn" type="button" data-prr-rule-remove="'+id+'">Remove rule</button>')+'</div></details>';
  }).join('');
  return '<section class="prr-rules-manager" id="prrRulesPanel" '+(rulesOpen?'':'hidden')+'><h3>Single element assignment rules</h3><p class="muted">Rules determine who receives each demo pay element when you click Randomize elements. Existing manual amounts are not changed until you randomize. Temporary changes last for this PRR session; permanent changes are saved on this computer only.</p>'+
    '<div class="prr-rule-list">'+cards+'</div><div class="prr-rule-add"><h4>Add a rule</h4><div class="prr-rule-fields">'+
    '<label>Rule name<input id="prrNewRuleName" placeholder="e.g. Team bonus"></label>'+
    '<label>Pay element<select id="prrNewRuleElement">'+config.singles.map(function(el){return '<option value="'+esc(el)+'">'+esc(el)+'</option>';}).join('')+'</select></label>'+
    '<label>Distribution<select id="prrNewRuleMode"><option value="file">Across all employees</option><option value="block">Per employee block</option></select></label>'+
    '<label>Minimum assignments<input id="prrNewRuleMin" type="number" min="0" step="1" value="1"></label>'+
    '<label>Maximum assignments<input id="prrNewRuleMax" type="number" min="0" step="1" value="2"></label>'+
    '<label>Employees per block<input id="prrNewRuleBlock" type="number" min="1" step="1" value="5"></label>'+
    '<label>Keep changes<select id="prrNewRuleScope"><option value="session">This session only</option><option value="permanent">Save on this computer</option></select></label></div>'+
    '<div class="toolbar"><button type="button" class="btn primary" data-prr-rule-add><i class="fa-solid fa-plus"></i>Add rule</button><span class="muted">Click Randomize elements to apply updated rules.</span></div></div><div id="prrRuleMessage" class="muted" role="status"></div></section>';
}
var originalRenderSingles=prrRenderSingles;
prrRenderSingles=function(){
  originalRenderSingles();
  var host=document.getElementById('prrSinglesHost'),panel=host&&host.querySelector('.panel'),toolbar=panel&&panel.querySelector('.toolbar');
  if(!toolbar)return;
  var randomButton=toolbar.querySelector('[data-prr-random-singles]');
  if(randomButton)randomButton.innerHTML='<i class="fa-solid fa-dice"></i> Randomize elements';
  toolbar.insertAdjacentHTML('beforeend','<button class="btn" type="button" data-prr-toggle-rules><i class="fa-solid fa-sliders"></i>Configure rules</button>');
  toolbar.insertAdjacentHTML('afterend',rulesMarkup());
};
function rerenderRules(){
  var panel=document.getElementById('prrRulesPanel');
  if(panel)panel.outerHTML=rulesMarkup();
}
function noteRules(message){
  var note=document.getElementById('prrRuleMessage');
  if(note)note.textContent=message;
}
prrGenerateSingles=function(country,d){
  var emps=prrCurrentEmployees();
  emps.forEach(function(emp){d.singles[String(emp.id)]={};});
  rulesFor(country).forEach(function(raw){
    var rule=normalizeRule(raw,country);
    if(!rule.enabled||!rule.elements.length||!rule.max)return;
    var blocks=[];
    if(rule.mode==='block'){
      for(var start=0;start<emps.length;start+=rule.block)blocks.push(emps.slice(start,start+rule.block));
    }else blocks=[emps];
    blocks.forEach(function(block){
      var eligible=block.filter(function(emp){
        var assigned=d.singles[String(emp.id)]||{};
        if(rule.excludeElements.some(function(el){return assigned[el]!=null;}))return false;
        return rule.elements.some(function(el){return assigned[el]==null;});
      });
      var recipients=prrChoose(eligible,prrRandomInt(rule.min,rule.max));
      recipients.forEach(function(emp){
        var id=String(emp.id),available=rule.elements.filter(function(el){return d.singles[id][el]==null;});
        if(!available.length)return;
        var el=prrChoose(available,1)[0],amount=prrSingleAmount(country,el,d.salaries[id]);
        if(rule.amountMin!=null||rule.amountMax!=null){
          var low=rule.amountMin==null?rule.amountMax:rule.amountMin,high=rule.amountMax==null?low:rule.amountMax;
          if(low>high){var swap=low;low=high;high=swap;}
          amount=prrRound(prrRandom(low,high));
        }
        d.singles[id][el]=amount;
      });
    });
  });
};
function snapshot(label){
  if(step!==7)return;
  var root=prrStateRoot(),country=state.country;
  undoStack.push({country:country,label:label,data:copy(root.countries[country]||{}),config:copy(root.configByCountry[country]||{})});
  if(undoStack.length>MAX_UNDO)undoStack.shift();
  updateUndoButton();
}
function updateUndoButton(){
  var button=document.querySelector('[data-prr-undo]');
  if(button){button.disabled=!undoStack.length;button.title=undoStack.length?'Undo: '+undoStack[undoStack.length-1].label:'Nothing to undo';}
}
function undo(){
  var item=undoStack.pop();
  if(!item)return;
  var root=prrStateRoot();
  state.country=item.country;
  root.countries[item.country]=copy(item.data);
  root.configByCountry[item.country]=copy(item.config);
  prrRenderDeductions();
}
window.prrStandaloneResetUndo=function(){undoStack=[];updateUndoButton();};
var originalRenderExport=prrRenderExport;
prrRenderExport=function(){
  originalRenderExport();
  var host=document.getElementById('prrExportHost');
  if(!host)return;
  var paragraph=host.querySelector('.panel > p');
  if(paragraph)paragraph.textContent='Download a clean Excel workbook with the 12 required PRR columns. Employee IDs are preserved as text, amounts as numbers, and all generated rows are included.';
};
var originalRenderDeductions=prrRenderDeductions;
prrRenderDeductions=function(){
  originalRenderDeductions();
  var button=document.querySelector('#prrDeductionsHost [data-prr-reset-locks]');
  if(button){button.removeAttribute('data-prr-reset-locks');button.setAttribute('data-prr-undo','');button.innerHTML='<i class="fa-solid fa-rotate-left"></i> Undo';}
  updateUndoButton();
};
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-prr-undo]');
  if(b){e.preventDefault();e.stopPropagation();undo();return;}
  b=e.target.closest('[data-prr-toggle-rules]');
  if(b){rulesOpen=!rulesOpen;var panel=document.getElementById('prrRulesPanel');if(panel)panel.hidden=!rulesOpen;return;}
  b=e.target.closest('[data-prr-rule-reset]');
  if(b){
    var arr=rulesFor(state.country),def=baseRules(state.country).find(function(x){return x.id===b.dataset.prrRuleReset;});
    if(def){var ix=arr.findIndex(function(x){return x.id===def.id;});if(ix>=0)arr[ix]=def;persistRules();rerenderRules();}
    return;
  }
  b=e.target.closest('[data-prr-rule-remove]');
  if(b){
    var rs=rulesFor(state.country),i=rs.findIndex(function(x){return x.id===b.dataset.prrRuleRemove&&!x.builtin;});
    if(i>=0){rs.splice(i,1);persistRules();rerenderRules();}
    return;
  }
  b=e.target.closest('[data-prr-rule-add]');
  if(b){
    var cc=state.country,name=document.getElementById('prrNewRuleName').value.trim();
    var min=Number(document.getElementById('prrNewRuleMin').value),max=Number(document.getElementById('prrNewRuleMax').value),block=Number(document.getElementById('prrNewRuleBlock').value);
    if(!Number.isInteger(min)||min<0||!Number.isInteger(max)||max<min||!Number.isInteger(block)||block<1){noteRules('Enter whole numbers: minimum 0 or more, maximum at least minimum, and block size at least 1.');return;}
    var rule={id:'custom-'+Date.now().toString(36)+'-'+(++customSequence),name:name||'Custom '+document.getElementById('prrNewRuleElement').value,
      builtin:false,enabled:true,scope:document.getElementById('prrNewRuleScope').value,
      mode:document.getElementById('prrNewRuleMode').value,block:block,min:min,max:max,
      elements:[document.getElementById('prrNewRuleElement').value],excludeElements:[],amountMin:null,amountMax:null};
    rulesFor(cc).push(rule);
    var saved=persistRules();
    rerenderRules();noteRules(saved?'Rule added. Click Randomize elements to apply it.':'Rule added for this session. Local storage was unavailable.');
    return;
  }
  b=e.target.closest('[data-prr-rate-mode], [data-prr-apply-rate-setup], [data-prr-apply-elements], [data-prr-random-deductions]');
  if(b&&step===7)snapshot(b.hasAttribute('data-prr-random-deductions')?'Randomized rates and allocations':'Deduction configuration');
},true);
document.addEventListener('change',function(e){
  var field=e.target.closest('[data-prr-rule-field]');
  if(field){
    var cc=state.country,rule=rulesFor(cc).find(function(x){return x.id===field.dataset.prrRuleId;});
    if(!rule)return;
    var prop=field.dataset.prrRuleField,value=field.value;
    if(prop==='enabled')rule.enabled=value==='yes';
    else if(prop==='scope')rule.scope=value==='permanent'?'permanent':'session';
    else if(prop==='mode')rule.mode=value==='block'?'block':'file';
    else if(prop==='elements')rule.elements=Array.from(field.selectedOptions).map(function(x){return x.value;});
    else if(prop==='excludeElements')rule.excludeElements=value.split(',').map(function(x){return x.trim();}).filter(function(el){return prrCountryConfig(cc).singles.indexOf(el)>=0;});
    else if(['min','max','block'].indexOf(prop)>=0){
      if(!/^[0-9]+$/.test(value)||((prop==='block')&&Number(value)<1)){noteRules('Enter a non-negative whole number (block size must be at least 1).');return;}
      rule[prop]=Number(value);
      if(rule.max<rule.min){if(prop==='min')rule.max=rule.min;else rule.min=rule.max;}
    }else if(prop==='amountMin'||prop==='amountMax'){
      if(value!==''&&(!Number.isFinite(Number(value))||Number(value)<0)){noteRules('Amounts must be positive numbers or blank.');return;}
      rule[prop]=value===''?null:Number(value);
    }
    var saved=persistRules();
    noteRules((rule.scope==='permanent'&&saved?'Saved on this computer. ':'Session rule updated. ')+'Click Randomize elements to apply.');
    return;
  }
  var changed=e.target.closest('[data-prr-pct], [data-prr-bucket], [data-prr-flat-rate], [data-prr-range], [data-prr-weight]');
  if(changed&&step===7)snapshot('Edited deduction value');
},true);
})();
