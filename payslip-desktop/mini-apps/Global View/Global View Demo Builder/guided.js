/* GlobalView Demo Builder 0.1.1 — guided country-first experience, no new dependencies. */
(function(){
  "use strict";
  var G=window.GVCore,F=window.GVWorkflow,B,UI;
  var FLAGS={AU:"🇦🇺",US:"🇺🇸",CA:"🇨🇦",ES:"🇪🇸",MX:"🇲🇽",GB:"🇬🇧",CN:"🇨🇳",DE:"🇩🇪",NL:"🇳🇱",FR:"🇫🇷"};
  function h(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
  function money(n){return Number(n||0).toLocaleString("en-GB");}
  function current(){return B.current();}
  function profile(){return B.country();}
  function year(){
    var w=B.W;
    if(!w.settings.gvYear)w.settings.gvYear=2027;
    return Math.max(2027,Number(w.settings.gvYear));
  }
  function projectFor(code,planYear){
    return B.W.projects.filter(function(p){return p.profileId===code&&Number(p.year)===Number(planYear);})
      .sort(function(a,b){return String(b.updatedAt||"").localeCompare(String(a.updatedAt||""));})[0]||null;
  }
  function statuses(p,pf){return {pre:F.preparation(p,pf,G.validateProject),imp:F.importing(p,pf)};}
  function press(label,action,cls,disabled,extra){
    return '<button type="button" class="btn '+h(cls||"ghost")+'" data-guide="'+h(action)+'" '+(disabled?'disabled ':'')+(extra||"")+'>'+label+'</button>';
  }
  function percent(label,value,kind){
    return '<div class="country-progress-line"><div class="country-progress-top"><span>'+h(label)+'</span><strong>'+value+'%</strong></div><div class="track '+(kind||"")+'"><span style="width:'+value+'%"></span></div></div>';
  }
  function tile(pf,planYear){
    var p=projectFor(pf.id,planYear),st=statuses(p,pf);
    var done=st.pre.ready&&st.imp.total>0&&st.imp.completed===st.imp.total;
    var due=st.imp.months.filter(function(m){var d=new Date();return m.total>0&&!m.complete&&
      (planYear<d.getFullYear()||(planYear===d.getFullYear()&&m.month<=d.getMonth()+1));}).length;
    var state=done?"Ready":due?due+" months need attention":!p?"Not started":st.pre.ready?"Prepared":"In preparation";
    function progress(label,value,complete){
      return '<span class="mini-progress '+(complete?"complete":"")+'"><span>'+h(label)+'</span><strong>'+
        (complete?fa("check-circle")+" Ready":value+"%")+'</strong><span class="track"><span style="width:'+value+'%"></span></span></span>';
    }
    return '<article class="country-card"><button type="button" data-guide="select-country" data-code="'+h(pf.id)+'" class="country-main" aria-label="'+h(pf.name)+' '+planYear+'">'+
      flag(pf.id)+'<span><strong>'+h(pf.name)+'</strong><small>'+h(pf.code)+' · '+planYear+'</small></span>'+
      '<span class="arrow">'+fa("arrow-right")+'</span></button><div class="mini-grid">'+
      '<button data-guide="phase-country" data-code="'+h(pf.id)+'" data-phase="preparation">'+progress("Preparation",st.pre.percent,st.pre.ready)+'</button>'+
      '<button data-guide="phase-country" data-code="'+h(pf.id)+'" data-phase="import">'+progress("Import",st.imp.percent,st.imp.total>0&&st.imp.percent===100)+'</button></div>'+
      '<div class="country-foot"><span class="'+(due?"warn":done?"ok":"muted")+'">'+h(state)+'</span></div></article>';
  }

  function fa(name){
    return '<i class="fa-solid fa-'+h(name)+'" aria-hidden="true"></i>';
  }
  function flag(code){
    code=String(code||"").toLowerCase();
    var bundled=["au","us","ca","es","mx","gb","cn","de","nl","fr"].includes(code);
    var source=bundled?"flags/"+code+".svg":"https://flagcdn.com/w80/"+encodeURIComponent(code)+".png";
    return '<span class="country-flag" aria-hidden="true"><img loading="lazy" src="'+source+'" alt="" /></span>';
  }
  function yearLimit(){return Math.max(2027,Number(B.W.settings.gvMinYear)||2027);}
  function yearComplete(y){
    var all=Object.values(B.W.countries);
    return all.length>0&&all.every(function(pf){
      var p=projectFor(pf.id,y);
      if(!p)return false;
      var st=statuses(p,pf);
      return st.pre.ready&&st.imp.total>0&&st.imp.completed===st.imp.total;
    });
  }
  function yearChoices(){
    var min=yearLimit(),max=Math.max(min+5,year()+3),pending=min;
    while(pending<max&&yearComplete(pending))pending++;
    var rows=[];
    for(var y=min;y<=max;y++){
      var done=y<pending,attention=y===pending;
      rows.push('<button type="button" role="option" aria-selected="'+(y===year())+'" class="year-choice '+
        (done?"complete":attention?"pending":"")+(y===year()?" selected":"")+'" data-guide="choose-year" data-year="'+y+'">'+
        '<strong>'+y+'</strong><small>'+(done?fa("check")+" Completed":attention?"Pending next":"Future")+'</small></button>');
    }
    return rows.join("");
  }
  var COUNTRY_CODES=("AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ "+
    "CA CD CF CG CH CI CL CM CN CO CR CU CV CW CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FO FR "+
    "GA GB GD GE GH GI GL GM GN GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP "+
    "KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN "+
    "MO MR MT MU MV MW MX MY MZ NA NC NE NG NI NL NO NP NR NU NZ OM PA PE PG PH PK PL PM PR PS PT PW PY "+
    "QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR "+
    "TT TV TW TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW").split(/\s+/);
  function countryPicker(){
    var names=new Intl.DisplayNames(["en-GB"],{type:"region"});
    var countries=COUNTRY_CODES.filter(function(c){return !B.W.countries[c];}).map(function(c){return {code:c,name:names.of(c)};})
      .sort(function(a,b){return a.name.localeCompare(b.name);});
    function list(query){
      var key=String(query||"").trim().toLowerCase();
      var matches=countries.filter(function(c){return !key||c.name.toLowerCase().includes(key)||c.code.toLowerCase()===key;}).slice(0,18);
      return matches.length?matches.map(function(c){
        return '<button class="country-choice" type="button" data-country-pick="'+h(c.code)+'">'+flag(c.code)+
          '<span><strong>'+h(c.name)+'</strong></span><small>'+h(c.code)+'</small></button>';
      }).join(""):'<p class="muted small">No matching country available.</p>';
    }
    B.modal("Add country",'<label>Search for a country<input id="countrySearch" type="search" autocomplete="off" placeholder="Start typing a country name"></label>'+
      '<div id="countryMatches" class="country-matches">'+list("")+'</div>',
      [{label:"Close",cls:"ghost",run:B.closeModal}]);
    var field=document.getElementById("countrySearch"),results=document.getElementById("countryMatches");
    field.addEventListener("input",function(){results.innerHTML=list(field.value);});
    results.addEventListener("click",function(e){
      var button=e.target.closest("[data-country-pick]");if(!button)return;
      var code=button.dataset.countryPick,item=countries.find(function(c){return c.code===code;});
      if(!item)return;
      B.newCountryModal(false);
      var nameField=document.getElementById("country-name"),codeField=document.getElementById("country-code"),
        currencyField=document.getElementById("country-currency");
      if(nameField)nameField.value=item.name;
      if(codeField)codeField.value=item.code;
      var eur="AD AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MC MT NL PT SI SK SM VA".split(" ");
      var currency={AU:"AUD",CA:"CAD",CH:"CHF",CN:"CNY",GB:"GBP",IN:"INR",JP:"JPY",MX:"MXN",NZ:"NZD",US:"USD",BR:"BRL",AR:"ARS",DK:"DKK",NO:"NOK",SE:"SEK",PL:"PLN",ZA:"ZAR",KR:"KRW"}[code]||(eur.includes(code)?"EUR":"USD");
      if(currencyField)currencyField.value=currency;
    });
    field.focus();
  }
  function typeSelected(){
    var templates=Object.keys(profile().templates||{}),preferred=templates.includes("P2010")?"P2010":templates[0]||"";
    if(!UI.simType||!templates.includes(UI.simType))UI.simType=preferred;
    return UI.simType;
  }
  function defaultScenario(){
    return {seed:4,preset:"demo",count:4,coverage:75,overrides:{}};
  }
  function draftScenario(){
    var type=typeSelected();
    if(!UI.simDrafts)UI.simDrafts={};
    if(!UI.simDrafts[type])UI.simDrafts[type]=G.clone((current().scenarios||{})[type]||defaultScenario());
    return UI.simDrafts[type];
  }
  function previewData(){
    var p=current(),pf=profile(),type=typeSelected(),draft=draftScenario();
    function build(config){
      var temporary={year:p.year,seed:p.seed,employeeIds:p.employeeIds.slice(),events:[],scenarios:{}};
      if(config)temporary.scenarios[type]=config;
      var oneType={templates:pf.templates,rules:(pf.rules||[]).filter(function(r){return r.infotype===type;})};
      G.generate(temporary,oneType,true);
      return temporary.events;
    }
    var baseline=p.events.filter(function(e){return e.infotype===type;});
    if(!baseline.length)baseline=build((p.scenarios||{})[type]||null);
    var forecast=build(draft),starts=function(events){
      var counts=Array(12).fill(0);
      events.forEach(function(e){if(String(e.start).slice(0,4)!==String(p.year))return;var i=Number(String(e.start).slice(4,6))-1;if(i>=0&&i<12)counts[i]++;});
      return counts;
    };
    return {saved:starts(baseline),forecast:starts(forecast),events:forecast};
  }
  function previewMarkup(){
    var data=previewData(),months=G.MONTHS,max=Math.max(1,...data.saved,...data.forecast),view=UI.simView||"chart";
    var total=data.forecast.reduce(function(a,b){return a+b;},0),top=data.forecast.indexOf(Math.max(...data.forecast));
    var body='<div class="sim-totals"><span>Preview events <b>'+money(total)+'</b></span>'+
      '<span>Busiest month <b>'+months[top]+'</b></span><span>Employees <b>'+money(current().employeeIds.length)+'</b></span></div>';
    if(view==="table"){
      body+='<div class="tablewrap"><table class="data"><thead><tr><th>Month</th><th>Saved baseline</th><th>Preview</th><th>Difference</th></tr></thead><tbody>'+
        months.map(function(m,i){var diff=data.forecast[i]-data.saved[i];return '<tr><td>'+h(m)+'</td><td>'+data.saved[i]+'</td><td>'+data.forecast[i]+'</td><td>'+ (diff>0?"+":"")+diff+'</td></tr>';}).join("")+'</tbody></table></div>';
    }else if(view==="employees"){
      var byEmp={},saved=new Set(current().employeeIds);
      data.events.forEach(function(e){if(!saved.has(e.employee))return;byEmp[e.employee]=(byEmp[e.employee]||0)+1;});
      body+='<div class="tablewrap"><table class="data"><thead><tr><th>Employee ID</th><th>Preview events</th></tr></thead><tbody>'+
        Object.keys(byEmp).sort().slice(0,60).map(function(k){return '<tr><td class="mono">'+h(k)+'</td><td>'+byEmp[k]+'</td></tr>';}).join("")+'</tbody></table></div>'+
        '<p class="small muted">Preview counts for up to 60 employees. Use Review raw records to inspect saved data.</p>';
    }else{
      body+='<div class="sim-legend"><span><i class="legend-dot" style="background:#65aef5"></i>Saved baseline</span>'+
        '<span><i class="legend-dot" style="background:#df3e5e"></i>Live preview</span></div>'+
        '<div class="sim-chart" role="group" aria-label="Monthly event preview">'+months.map(function(m,i){
          var a=data.saved[i],b=data.forecast[i],style=function(v){return 'height:'+Math.max(2,Math.round(100*v/max))+'%';};
          return '<button class="sim-column '+(UI.simMonth===i?"active":"")+'" type="button" data-guide="sim-month" data-month="'+i+'" title="'+h(m)+': saved '+a+', preview '+b+'">'+
            '<strong>'+b+'</strong><span class="sim-bar-pair"><span class="sim-bar actual" style="'+style(a)+'"></span>'+
            '<span class="sim-bar forecast" style="'+style(b)+'"></span></span><small>'+h(m)+'</small></button>';
        }).join("")+'</div>';
    }
    return '<div id="simPreviewBody">'+body+'</div>';
  }
  function refreshPreview(){
    var el=document.getElementById("simPreviewBody");if(el)el.outerHTML=previewMarkup();
  }
  function simulator(){
    var pf=profile(),type=typeSelected(),draft=draftScenario(),month=UI.simMonth||0,
      templates=Object.keys(pf.templates||{}),p=current();
    var typeButtons=templates.map(function(k){
      return '<button class="btn ghost small" type="button" aria-pressed="'+(k===type)+'" data-guide="select-type" data-type="'+h(k)+'">'+
        h(k)+' · '+h(pf.templates[k].label||G.typeNames[k]||"Events")+'</button>';
    }).join("");
    var modeButtons=["random","manual"].map(function(m){
      return '<button class="btn ghost small" type="button" aria-pressed="'+(UI.simMode===m)+'" data-guide="sim-mode" data-mode="'+m+'">'+
        (m==="random"?"Random peaks":"Manual peaks")+'</button>';
    }).join("");
    var viewButtons=[["chart","Chart"],["table","Monthly data"],["employees","Employees"]].map(function(v){
      return '<button class="btn ghost small" type="button" aria-pressed="'+(UI.simView===v[0])+'" data-guide="sim-view" data-view="'+v[0]+'">'+v[1]+'</button>';
    }).join("");
    var currentWeight=draft.overrides&&draft.overrides[month]!=null?Number(draft.overrides[month]):G.scenarioFactors(type,draft)[month];
    var controls=UI.simMode==="manual"?
      '<label>Month<select id="simMonthSelect">'+G.MONTHS.map(function(m,i){return '<option value="'+i+'" '+(i===month?"selected":"")+'>'+m+'</option>';}).join("")+'</select></label>'+
      '<label>Month intensity <output id="simMonthOut">'+currentWeight.toFixed(1)+'×</output><input type="range" id="simMonthWeight" min="0.2" max="5" step="0.1" value="'+currentWeight+'"></label>'+
      press("Reset month","sim-reset-month","ghost small"):
      '<label>Variability style<select id="simPreset">'+[["natural","Natural"],["demo","Demo"],["intense","Intense"]].map(function(x){
        return '<option value="'+x[0]+'" '+(draft.preset===x[0]?"selected":"")+'>'+x[1]+'</option>';}).join("")+'</select></label>'+
      '<label>Number of peaks <output id="simCountOut">'+draft.count+'</output><input type="range" id="simCount" min="0" max="8" step="1" value="'+draft.count+'"></label>'+
      press(fa("shuffle")+" New distribution","sim-shuffle","ghost small");
    return '<div class="card"><div class="flex-between"><div><h2>Annual variability simulator</h2><p class="small muted">Preview changes before applying them to this country and year.</p></div>'+
      '<div class="sim-toolbar">'+typeButtons+'</div></div>'+
      '<div class="sim-mode">'+modeButtons+'</div><div class="sim-layout" style="margin-top:14px">'+
      '<div class="sim-preview"><div class="sim-view-tabs">'+viewButtons+'</div>'+previewMarkup()+'</div>'+
      '<div class="sim-controls">'+controls+
      '<label>Employees affected <output id="simCoverageOut">'+draft.coverage+'%</output>'+
      '<input id="simCoverage" type="range" min="10" max="100" step="5" value="'+draft.coverage+'"></label>'+
      '<p class="small muted">P2001 and P2010 have separate settings. The chart shows event counts, not hours or monetary totals.</p>'+
      '<div class="sim-control-actions">'+press(fa("rotate-left")+" Discard","sim-discard","ghost small")+
      press(fa("check")+" Apply changes","sim-apply","primary")+'</div></div></div>'+
      '<div class="sim-totals"><span>Saved scenario: <b>'+((p.scenarios||{})[type]?"Configured":"Default")+'</b></span>'+
      '<span>Changes stay in preview until Apply.</span></div></div>';
  }
  function applyScenario(){
    var p=current(),type=typeSelected(),draft=draftScenario();
    if(!p.scenarios)p.scenarios={};
    p.scenarios[type]=G.clone(draft);
    B.noteLog(p,"Scenario updated",type+" for "+p.year+": "+draft.count+" peaks, "+draft.preset+" intensity");
    B.notify("Scenario settings saved for "+p.year+". Generate and review the year before approval.","success");
    render();
  }

  function board(){
    var y=year(),profiles=Object.values(B.W.countries).sort(function(a,b){return a.name.localeCompare(b.name);});
    var pending=profiles.filter(function(pf){var p=projectFor(pf.id,y);return p&&!statuses(p,pf).pre.ready;}).length;
    return '<div class="country-intro"><div><h2>Countries · '+y+'</h2>'+
      '<p class="muted">Select a country or a phase. Each card reflects the selected calendar year.</p></div>'+
      '<div class="actions">'+
      '<div class="year-selector"><button class="btn ghost" data-guide="toggle-years" aria-expanded="'+!!UI.yearsOpen+'">'+fa("calendar-days")+
        ' '+y+' '+fa("chevron-down")+'</button>'+
      (UI.yearsOpen?'<div class="year-popover" role="listbox" aria-label="Calendar year">'+yearChoices()+'</div>':"")+'</div>'+
      press(fa("plus")+" Add country","new-country","primary")+'</div></div>'+
      '<div class="country-board">'+profiles.map(function(pf){return tile(pf,y);}).join("")+'</div>'+
      '<div class="country-board-foot"><span>'+profiles.length+' countries · '+pending+' in preparation</span>'+
      press("Import shared snapshot","import-snapshot","ghost small")+'</div>'+
      '<p class="muted small">Work is saved on this device. Automatic team synchronization is not configured yet; shared snapshots remain available for handover.</p>';
  }
  function selectCountry(code,planYear){
    var pf=B.W.countries[code];if(!pf){B.notify("Country not found.","error");return;}
    var p=projectFor(code,planYear);
    if(!p){
      p=G.newProject(pf,pf.name+" "+planYear,planYear,[]);
      B.W.projects.push(p);
    }
    B.W.selectedProject=p.id;B.W.settings.gvYear=planYear;
    UI.countryId=code;UI.templateId=Object.keys(pf.templates||{})[0]||"";
    UI.month=0;UI.eventPage=0;UI.ruleId=null;UI.kind="all";UI.selectedTypes=null;
    UI.prepStep=0;UI.detail="";UI.page="preparation";UI.simDrafts={};UI.simType="";UI.simMonth=0;UI.simView="chart";UI.simMode="random";B.save();render();
  }
  function phase(label,st,mode,active){
    return '<div class="journey-phase '+(active?"active":"")+'"><div class="flex-between"><strong>'+h(label)+'</strong>'+
      '<span class="percent">'+st.percent+'%<small>complete</small></span></div>'+
      '<span class="phase-badge">'+st.completed+' of '+st.total+' '+(mode==="import"?"months with events":"steps")+'</span>'+
      '<div class="track '+mode+'"><span style="width:'+st.percent+'%"></span></div></div>';
  }
  function header(importing){
    var p=current(),pf=profile(),st=statuses(p,pf);
    return '<div class="journey-hero"><div class="journey-heading"><div class="journey-title">'+flag(pf.id)+
      '<div><h2>'+h(pf.name)+' · '+p.year+'</h2><p>'+money(p.employeeIds.length)+' employees · '+Object.keys(pf.templates).length+' file types</p></div></div>'+
      '<div class="actions">'+press(fa("arrow-left")+" Countries","back-countries","ghost small")+
      press(fa("clock-rotate-left")+" Activity","handover","ghost small")+'</div></div>'+
      '<div class="journey-stats">'+
      '<button data-guide="preparation" class="journey-phase '+(!importing?"active":"")+'"><strong>Preparation</strong>'+
      '<span class="percent">'+st.pre.percent+'%</span><div class="track"><span style="width:'+st.pre.percent+'%"></span></div></button>'+
      '<button data-guide="import" class="journey-phase '+(importing?"active":"")+'"><strong>Import</strong>'+
      '<span class="percent">'+st.imp.percent+'%</span><div class="track import"><span style="width:'+st.imp.percent+'%"></span></div></button>'+
      '</div></div>';
  }
  function steps(){
    var state=statuses(current(),profile()).pre;
    return '<div class="journey-steps">'+F.PREPARATION_STEPS.map(function(step,i){
      var done=state.steps[step.key],active=UI.prepStep===i;
      return '<button type="button" class="journey-step '+(active?"active":done?"complete":"")+'" data-guide="prep-step" data-step="'+i+'" aria-current="'+(active?"step":"false")+'">'+
        '<span class="step-number">'+(done?"✓":i+1)+'</span><strong>'+h(step.title)+'</strong>'+
        '<small>'+(done?"Complete":active?"Current step":"Open step")+'</small></button>';
    }).join("")+'</div>';
  }
  function wrap(content){
    return header(false)+steps()+'<div class="guided-content">'+content+'</div>';
  }
  function intro(title,sub,actions){
    return '<div class="guided-intro"><div><h2>'+h(title)+'</h2><p>'+h(sub)+'</p></div>'+
      '<div class="actions">'+(actions||"")+'</div></div>';
  }
  function stepSetup(){
    var pf=profile(),state=statuses(current(),pf).pre,ts=Object.keys(pf.templates).map(function(k){return pf.templates[k];});
    if(UI.detail==="config"){
      return wrap('<div class="card">'+press("← Back to country step","close-detail","ghost small")+'</div>'+B.renderCountries());
    }
    return wrap('<div class="card">'+intro("1 · Country setup","Review the configured file types and rules for this country. You can edit them before confirming.")+
      '<div class="grid g2"><div class="form-card"><strong>'+h(pf.name)+'</strong>'+
      '<p class="muted small">'+h(pf.code)+' · '+h(pf.currency)+' · '+h(pf.client||"Client not configured")+'</p>'+
      '<div class="summary-strip">'+pill(ts.length+" infotypes")+pill(F.templatesReady(pf)?"Formats available":"Setup required",F.templatesReady(pf)?"good":"warn")+'</div></div>'+
      '<div class="form-card"><strong>Data formats</strong><p class="small muted">Only verified formats are export-enabled.</p>'+
      (ts.length?ts.map(function(t){return '<div class="flex-between" style="margin-top:10px"><span>'+h(t.type)+' · '+h(t.label)+'</span>'+
        pill(t.exportReady?t.fields.length+" fields":"Needs setup",t.exportReady?"good":"warn")+'</div>';}).join(""):'<p class="muted">Create your first infotype to continue.</p>')+'</div></div>'+
      '<div class="guided-actions">'+press("Edit country settings","config","ghost")+
      press(state.steps.setup?"Setup confirmed":"Confirm setup","confirm-setup","primary",!F.templatesReady(pf))+
      press("Next: Employees","next-step","ghost")+'</div></div>');
  }
  function pill(text,cls){return '<span class="pill '+(cls||"")+'">'+h(text)+'</span>';}
  function stepRoster(){
    var p=current(),n=p.employeeIds.length;
    return wrap('<div class="card">'+intro("2 · Employees","Choose the workforce for this demo. No employees are added automatically.")+
      '<div class="grid g2"><div class="form-card"><span class="small muted">Employees selected</span>'+
      '<div class="metric" style="font-size:36px;font-weight:800;margin:11px 0">'+money(n)+'</div>'+
      '<p class="muted small">'+(n?"Roster saved for this country and year.":"A new country starts with an empty roster.")+'</p></div>'+
      '<div class="form-card"><strong>Add your employees</strong><div class="insight-stack" style="margin-top:12px">'+
      '<div class="flex-between"><div><strong class="small">Enter IDs</strong><small class="muted">Paste demo employee numbers.</small></div>'+press("Enter IDs","edit-roster","primary small")+'</div>'+
      '<div class="flex-between"><div><strong class="small">Example workforce</strong><small class="muted">76 fictional employees for testing.</small></div>'+press("Use example","example-roster","ghost small")+'</div>'+
      '<div class="flex-between"><div><strong class="small">Reuse existing TXT data</strong><small class="muted">Import employee events from GlobalView files.</small></div>'+press("Import TXT","import-txt","ghost small")+'</div>'+
      '</div></div></div><div class="guided-actions">'+press("Back","previous-step","ghost")+
      press("Next: Event patterns","next-step","primary",!n)+'</div></div>');
  }
  function stepPatterns(){
    var pf=profile(),st=statuses(current(),pf).pre;
    if(UI.detail==="patterns")return wrap('<div class="card">'+press("← Back to patterns","close-detail","ghost small")+'</div>'+B.renderPlanner());
    var rules=pf.rules||[];
    return wrap('<div class="card">'+intro("3 · Event patterns","Choose the kinds of events employees will experience. Adjust their frequency, share of employees and monthly spikes.",
      press("+ Add pattern","add-rule","ghost small"))+
      '<div class="insight-stack">'+(rules.length?rules.map(function(r){
        var peaks=(r.weights||[]).map(function(w,i){return {month:G.MONTHS[i],weight:w};}).sort(function(a,b){return b.weight-a.weight;}).slice(0,2).map(function(x){return x.month;}).join(" · ");
        return '<div class="insight-item"><div class="flex-between"><div><strong>'+h(r.label)+'</strong>'+
          '<small>'+h(r.infotype)+' · '+h(r.share)+'% of employees · '+h(r.countMin)+'–'+h(r.countMax)+' times/year · peak: '+h(peaks)+'</small></div>'+
          pill(r.enabled?"Active":"Off",r.enabled?"good":"")+'</div></div>';
      }).join(""):'<div class="empty"><strong>No patterns yet</strong><p>Define absences, overtime and seasonal events to build the year.</p></div>')+'</div>'+
      '<div class="guided-actions">'+press("Adjust variability & spikes","patterns","ghost")+
      press(st.steps.patterns?"Patterns confirmed":"Confirm patterns","confirm-patterns","primary",!F.patternsReady(pf))+
      press("Next: Generate","next-step","ghost")+'</div></div>');
  }
  function yearlyReview(){
    var p=current(),series=G.monthlySeries(p),total=series.reduce(function(sum,m){return sum+m.total;},0),average=total/12;
    var peak=series.reduce(function(a,b){return b.total>a.total?b:a;},series[0]);
    var low=series.reduce(function(a,b){return b.total<a.total?b:a;},series[0]);
    var max=Math.max(1,...series.map(function(m){return m.total;}));
    var color={P2001:"#58a6ff",P2010:"#ed4459",P0008:"#a991ff",P0015:"#52d7b0",P0267:"#ffbb6b"};
    var types=Array.from(new Set(p.events.map(function(e){return e.infotype;}))).sort();
    var chart=series.map(function(m){
      var parts=types.map(function(t){var v=m.byType[t]||0;return v&&m.total?
        '<span class="bar-piece" style="height:'+(v/m.total*100)+'%;background:'+(color[t]||"#93abbf")+'"></span>':'';}).join("");
      return '<button type="button" class="bar-btn" data-guide="month-review" data-month="'+m.month+'" title="Review '+m.label+': '+m.total+' events">'+
        '<b>'+money(m.total)+'</b><span class="bar-frame"><span class="bar-stack" style="height:'+Math.max(3,m.total/max*100)+'%">'+parts+'</span></span>'+
        '<small>'+h(m.label)+'</small></button>';
    }).join("");
    var legend=types.map(function(t){return '<span class="small"><span class="dot" style="background:'+(color[t]||"#93abbf")+'"></span>'+h(t)+' '+h(G.typeNames[t]||"")+'</span>';}).join("");
    return '<div class="card">'+intro(p.year+" · Monthly distribution","Compare monthly activity at a glance. Select any month to inspect its employees and events.")+
      '<div class="legend" style="margin-top:12px">'+legend+'</div><div class="bars" role="group" aria-label="Events by month">'+chart+'</div>'+
      '<div class="grid g3" style="margin-top:16px">'+
        '<div class="form-card"><span class="small muted">Busiest month</span><strong style="display:block;font-size:18px;margin-top:6px">'+h(peak.label)+' · '+money(peak.total)+'</strong></div>'+
        '<div class="form-card"><span class="small muted">Quietest month</span><strong style="display:block;font-size:18px;margin-top:6px">'+h(low.label)+' · '+money(low.total)+'</strong></div>'+
        '<div class="form-card"><span class="small muted">Monthly average</span><strong style="display:block;font-size:18px;margin-top:6px">'+money(Math.round(average))+' events</strong></div></div>'+
      '</div>';
  }
  function stepSimulation(){
    var p=current(),pf=profile(),n=p.events.length,issues=B.getValidation().filter(function(x){return x.severity==="error";}).length;
    if(UI.detail==="events")return wrap('<div class="card">'+press("← Back to annual review","close-detail","ghost small")+'</div>'+B.renderEmployees());
    var blocked=!p.employeeIds.length||!F.patternsReady(pf);
    var body='<div class="card">'+intro("4 · Generate & review","Create the entire year's calendar, inspect the distribution and correct any outliers before approval.")+
      '<div class="grid g3"><div class="kpi"><div class="small muted">Employee events</div><div class="metric">'+money(n)+'</div></div>'+
      '<div class="kpi"><div class="small muted">Employees</div><div class="metric">'+money(p.employeeIds.length)+'</div></div>'+
      '<div class="kpi"><div class="small muted">Blocking issues</div><div class="metric">'+issues+'</div></div></div>'+
      '<p class="muted small">'+(blocked?"Add employees and configure event patterns before generating.":"A new generation changes only records that have not already been exported.")+'</p>'+
      '<div class="guided-actions">'+press("Generate annual calendar","generate","primary",blocked)+
      press("Inspect employee records","events","ghost",!n)+press("Next: Approve","next-step","ghost",!n)+'</div></div>';
    if(n)body+=yearlyReview();
    return wrap(body);
  }
  function stepApproval(){
    var p=current(),pf=profile(),st=statuses(p,pf).pre,issues=B.getValidation(),blocked=issues.filter(function(x){return x.severity==="error";}).length;
    if(UI.detail==="events")return wrap('<div class="card">'+press("← Back to approval","close-detail","ghost small")+'</div>'+B.renderEmployees());
    var canApprove=st.steps.setup&&st.steps.roster&&st.steps.patterns&&st.steps.simulation;
    return wrap('<div class="card">'+intro("5 · Approve the plan","Confirm that the year is ready. A changed scenario or employee record will require a new approval before later exports.")+
      '<div class="insight-stack">'+F.PREPARATION_STEPS.slice(0,4).map(function(step){
        var done=st.steps[step.key];
        return '<div class="flow-row"><div class="flow-icon">'+(done?"✓":"○")+'</div>'+
          '<div><strong>'+h(step.title)+'</strong><p>'+h(step.description)+'</p></div>'+
          pill(done?"Complete":"Still needed",done?"good":"warn")+'</div>';
      }).join("")+'</div>'+
      '<div class="guided-note" style="margin-top:14px">'+(blocked?blocked+" employee records require correction.":st.ready?"Your plan is approved and ready for monthly exports.":"Complete the steps above, then approve to unlock file downloads.")+'</div>'+
      '<div class="guided-actions">'+(st.ready?press("Continue to import","import","primary"):
        press("Approve annual plan","approve-plan","primary",!canApprove))+
        press("Review employee records","events","ghost",!p.events.length)+'</div></div>');
  }
  function preparation(){
    if(!current()||!profile())return board();
    var p=current(),pf=profile(),st=statuses(p,pf).pre;
    if(UI.detail==="handover")return header(false)+'<div class="card">'+press("Back to preparation","close-detail","ghost small")+'</div>'+B.renderActivity();
    if(UI.detail==="config")return header(false)+'<div class="card">'+press("Back to simulator","close-detail","ghost small")+'</div>'+B.renderCountries();
    if(UI.detail==="patterns")return header(false)+'<div class="card">'+press("Back to simulator","close-detail","ghost small")+'</div>'+B.renderPlanner();
    if(UI.detail==="events")return header(false)+'<div class="card">'+press("Back to simulator","close-detail","ghost small")+'</div>'+B.renderEmployees();
    var ready=F.templatesReady(pf)&&F.patternsReady(pf)&&p.employeeIds.length>0;
    var errors=B.getValidation().filter(function(f){return f.severity==="error";}).length;
    var result=header(false)+
      '<div class="card prep-summary">'+
      '<div class="flex-between"><div><h2>Annual preparation</h2><p class="muted small">One workspace for country setup, employee roster, simulation and approval.</p></div>'+
      '<div class="actions">'+press(fa("gear")+" Country setup","config","ghost small")+
      press(fa("users")+" Edit employees","edit-roster","ghost small")+'</div></div>'+
      '<div class="prep-checkpoints">'+
      '<span class="'+(st.steps.setup?"ok":"warn")+'">'+fa(st.steps.setup?"check-circle":"circle-exclamation")+' Export formats</span>'+
      '<span class="'+(st.steps.roster?"ok":"warn")+'">'+fa(st.steps.roster?"check-circle":"circle-exclamation")+' Workforce</span>'+
      '<span class="'+(st.steps.patterns?"ok":"warn")+'">'+fa(st.steps.patterns?"check-circle":"circle-exclamation")+' Scenarios</span>'+
      '<span class="'+(st.steps.simulation?"ok":"warn")+'">'+fa(st.steps.simulation?"check-circle":"circle-exclamation")+' Annual records</span>'+
      '</div><div class="actions">'+
      (!p.employeeIds.length?press("Use 76 fictional employees","example-roster","ghost small"):"")+
      (!st.steps.setup?press("Confirm country setup","confirm-setup","ghost small",!F.templatesReady(pf)):"")+
      (!st.steps.patterns?press("Confirm scenario rules","confirm-patterns","ghost small",!F.patternsReady(pf)):"")+
      '</div></div>'+
      (Object.keys(pf.templates).length?simulator():'<div class="card"><h2>Configure a file type first</h2>'+
        '<p class="muted">This country has no GlobalView export templates yet.</p>'+press("Configure file types","config","primary")+'</div>')+
      '<div class="card prep-approval"><div><h2>Generate and approve</h2><p class="muted small">'+
      (st.ready?"Annual plan approved. You can export selected months.":"Review the generated records and approve the annual plan once everything is correct.")+
      '</p></div><div class="actions">'+
      press(fa("wand-magic-sparkles")+" Generate year","generate","primary",!ready)+
      press("Review raw records","events","ghost small",!p.events.length)+
      (st.ready?press("Continue to Import","import","success"):press("Approve annual plan","approve-plan","ghost",!st.steps.setup||!st.steps.roster||!st.steps.patterns||!st.steps.simulation||errors>0))+
      '</div><p class="small muted">'+p.events.length+' saved records · '+errors+' blocking errors. Generation keeps imported and previously exported events intact.</p></div>';
    return result;
  }
  function history(){
    var p=current(),batches=(p.batches||[]).slice().reverse();
    return '<div class="card" style="margin-top:14px">'+intro("Previous downloads","Existing bundles remain visible, even if the annual plan requires a fresh review.")+
      (batches.length?'<div class="insight-stack">'+batches.map(function(b){
        return '<div class="insight-item"><div class="flex-between"><div><strong>'+h(b.periodLabel||G.MONTHS[b.start-1]+"–"+G.MONTHS[b.end-1])+' · '+h(b.status)+'</strong>'+
          '<small>'+h(b.filename||"Export bundle")+' · '+money(b.count)+' records</small></div>'+
          (b.status!=="uploaded"?'<button class="btn success small" data-action="confirm-upload" data-id="'+h(b.id)+'">Confirm uploaded</button>':pill("Uploaded","good"))+'</div></div>';
      }).join("")+'</div>':'<p class="muted small">No exports recorded yet.</p>')+'</div>';
  }
  function imports(){
    if(!current()||!profile())return board();
    var p=current(),st=statuses(p,profile()),m=st.imp.months;
    if(UI.detail==="handover")return header(true)+'<div class="card">'+press("← Back to import","close-detail","ghost small")+'</div>'+B.renderActivity();
    var now=new Date(),due=m.filter(function(x){
      return x.total>0&&!x.complete&&(p.year<now.getFullYear()||(p.year===now.getFullYear()&&x.month<=now.getMonth()+1));
    });
    var result=header(true)+'<div class="card">'+intro("Import progress · "+p.year,"Download a month or custom block, then track confirmed GlobalView uploads.")+
      (due.length?'<div class="tip warning" style="margin-bottom:13px">'+due.length+' current or elapsed month(s) need attention: '+h(due.map(function(x){return G.MONTHS[x.month-1];}).join(", "))+'.</div>':"")+
      '<div class="mini-months">'+m.map(function(x){
        var overdue=due.some(function(d){return d.month===x.month;});
        var label=x.complete?"Uploaded":x.status==="downloaded"?"Downloaded":x.status==="partial"?"In progress":overdue?"Action needed":x.status==="planned"?"Upcoming":"No events";
        return '<div class="mini-month '+(x.complete?"done":overdue?"overdue":x.status==="downloaded"?"downloaded":x.status==="partial"?"pending":x.status==="empty"?"nodata":"")+'">'+G.MONTHS[x.month-1]+'<strong>'+h(label)+'</strong></div>';
      }).join("")+'</div>'+
      '<p class="muted small" style="margin-top:13px">'+st.imp.completed+' of '+st.imp.total+' months with planned events have been confirmed as uploaded. Downloading alone does not complete a month.</p></div>';
    if(!st.pre.ready){
      result+='<div class="card" style="margin-top:15px">'+intro("Finish preparation to generate new files","Review and approve the annual plan first. Existing download records remain available.")+
        '<div class="guided-actions">'+press("Continue preparation","preparation","primary")+
        (p.batches.length?press("View previous downloads","show-history","ghost"):"")+'</div></div>';
      if(UI.detail==="history")result+=history();
      return result;
    }
    return result+'<div style="margin-top:15px">'+B.renderExports()+'</div>';
  }
  function render(){
    if(!B||!B.W)return;
    if(!["dashboard","preparation","import"].includes(UI.page)){
      if(UI.page==="employees"){UI.page="preparation";UI.prepStep=3;UI.detail="events";}
      else if(UI.page==="planner"){UI.page="preparation";UI.prepStep=2;UI.detail="patterns";}
      else if(UI.page==="exports"){UI.page="import";UI.detail="";}
      else if(UI.page==="countries"){UI.page="preparation";UI.prepStep=0;UI.detail="config";}
      else{UI.page="dashboard";UI.detail="";}
    }
    var pages={dashboard:["Countries","Choose a country and see preparation and import progress."],
      preparation:["Preparation","Build and approve an annual employee calendar."],
      import:["Import","Select a period, download files and confirm the actual import."]};
    var meta=pages[UI.page],title=document.getElementById("page-title"),sub=document.getElementById("page-subtitle");
    title.textContent=meta[0];sub.textContent=meta[1];
    document.getElementById("page-eyebrow").textContent="Demo Building Tools / Global View / "+meta[0];
    Array.from(document.querySelectorAll("[data-page]")).forEach(function(b){b.classList.toggle("active",b.dataset.page===UI.page);});
    var sel=document.getElementById("projectSelect");
    if(sel)sel.innerHTML='<option value="">Choose a plan</option>'+B.W.projects.map(function(p){
      return '<option value="'+h(p.id)+'" '+(p.id===B.W.selectedProject?"selected":"")+'>'+h(p.name)+'</option>';
    }).join("");
    var p=current();
    if(p&&B.W.countries[p.profileId])UI.countryId=p.profileId;
    document.getElementById("notices").innerHTML="";
    try{document.getElementById("content").innerHTML=UI.page==="dashboard"?board():UI.page==="preparation"?preparation():imports();}
    catch(err){document.getElementById("content").innerHTML='<div class="tip danger">Could not open this section: '+h(err.message)+'</div>';console.error(err);}
  }
  function navigate(dest){
    UI.page=dest;UI.detail="";render();
  }
  function act(event){
    var btn=event.target.closest("[data-guide]");if(!btn||btn.disabled)return;
    var op=btn.dataset.guide,p=current(),pf=profile();
    if(op==="new-country"){countryPicker();return;}
    if(op==="toggle-years"){UI.yearsOpen=!UI.yearsOpen;render();return;}
    if(op==="choose-year"){B.W.settings.gvYear=Math.max(yearLimit(),Number(btn.dataset.year));UI.yearsOpen=false;B.save();render();return;}
    if(op==="phase-country"){selectCountry(btn.dataset.code,year());UI.page=btn.dataset.phase;render();return;}
    if(op==="select-type"){UI.simType=btn.dataset.type;UI.simView="chart";render();return;}
    if(op==="sim-mode"){UI.simMode=btn.dataset.mode;render();return;}
    if(op==="sim-view"){UI.simView=btn.dataset.view;render();return;}
    if(op==="sim-month"){UI.simMonth=Number(btn.dataset.month);if(UI.simMode==="manual")render();else refreshPreview();return;}
    if(op==="sim-shuffle"){draftScenario().seed=(Number(draftScenario().seed)||0)+1;render();return;}
    if(op==="sim-discard"){delete UI.simDrafts[typeSelected()];UI.simDrafts[typeSelected()]=G.clone((p.scenarios||{})[typeSelected()]||defaultScenario());render();return;}
    if(op==="sim-reset-month"){delete draftScenario().overrides[UI.simMonth||0];render();return;}
    if(op==="sim-apply"){applyScenario();return;}
    if(op==="select-country"){selectCountry(btn.dataset.code,year());return;}
    if(op==="back-countries"){navigate("dashboard");return;}
    if(op==="preparation"){navigate("preparation");return;}
    if(op==="import"){navigate("import");return;}
    if(op==="prep-step"){UI.prepStep=Number(btn.dataset.step);UI.detail="";render();return;}
    if(op==="next-step"){UI.prepStep=Math.min(4,(UI.prepStep||0)+1);UI.detail="";render();return;}
    if(op==="previous-step"){UI.prepStep=Math.max(0,(UI.prepStep||0)-1);UI.detail="";render();return;}
    if(op==="close-detail"){UI.detail="";render();return;}
    if(op==="config"){UI.detail="config";render();return;}
    if(op==="patterns"){UI.detail="patterns";render();return;}
    if(op==="events"){UI.detail="events";render();return;}
    if(op==="month-review"){UI.month=Number(btn.dataset.month);UI.detail="events";render();return;}
    if(op==="handover"){UI.detail="handover";render();return;}
    if(op==="show-history"){UI.detail="history";render();return;}
    if(op==="edit-roster"){B.editRoster();return;}
    if(op==="import-txt"){document.getElementById("importFiles").click();return;}
    if(op==="import-snapshot"){document.getElementById("importSnapshot").click();return;}
    if(op==="add-rule"){UI.prepStep=2;UI.detail="patterns";render();document.getElementById("content").querySelector('[data-action="new-rule"]')?.click();return;}
    if(op==="generate"){B.generateEvents();return;}
    if(op==="confirm-setup"||op==="confirm-patterns"||op==="approve-plan"){
      var key=op==="confirm-setup"?"setup":op==="confirm-patterns"?"patterns":"review";
      try{var result=F.mark(p,pf,key,G.validateProject);B.noteLog(p,key==="setup"?"Country setup confirmed":key==="patterns"?"Event patterns confirmed":"Annual plan approved",
        pf.code+" · "+p.year+" · "+result.percent+"% preparation");B.notify(key==="review"?"Annual plan approved. You can now export months.":"Step confirmed.","success");render();}
      catch(err){B.notify(err.message,"error");}
      return;
    }
    if(op==="example-roster"){
      if(p.employeeIds.length){B.notify("This plan already has employees. Use Edit roster to change them.","error");return;}
      p.employeeIds=G.exampleEmployees(76);
      B.noteLog(p,"Sample workforce added","76 fictional employee IDs");render();return;
    }
  }
  function onChange(event){
    var el=event.target,config;
    if(el.id==="simPreset"||el.id==="simCount"||el.id==="simCoverage"||el.id==="simMonthSelect"||el.id==="simMonthWeight"){
      config=draftScenario();
      if(el.id==="simMonthSelect"){UI.simMonth=Number(el.value);render();return;}
      if(el.id==="simPreset")config.preset=el.value;
      if(el.id==="simCount")config.count=Number(el.value);
      if(el.id==="simCoverage")config.coverage=Number(el.value);
      if(el.id==="simMonthWeight"){config.overrides=config.overrides||{};config.overrides[UI.simMonth||0]=Number(el.value);}
      if(el.id==="simCount"||el.id==="simCoverage"||el.id==="simMonthWeight"){
        var output=document.getElementById({simCount:"simCountOut",simCoverage:"simCoverageOut",simMonthWeight:"simMonthOut"}[el.id]);
        if(output)output.textContent=el.id==="simCoverage"?el.value+"%":el.id==="simMonthWeight"?Number(el.value).toFixed(1)+"×":el.value;
        refreshPreview();return;
      }
      render();
    }
  }
  function boot(){
    B=window.GVBridge;
    if(!B||!B.W||!F){console.error("Guided GlobalView module missing its dependencies");return;}
    UI=B.UI;UI.page="dashboard";UI.detail="";UI.prepStep=0;UI.month=0;
    document.getElementById("content").addEventListener("click",act);
    document.getElementById("content").addEventListener("change",onChange);
    document.getElementById("content").addEventListener("input",onChange);
    window.addEventListener("message",function(event){
      if(event.source!==window.parent||!event.data||event.data.source!=="dbt-gv-toolbar")return;
      if(event.data.action==="add-country")countryPicker();
      if(event.data.action==="countries"){UI.page="dashboard";render();}
    });
    render();
  }
  window.GVGuided={boot:boot,render:render};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();