/* GlobalView Demo Builder 0.2 — guided country-first experience, no new dependencies. */
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
    if(!w.settings.gvYear)w.settings.gvYear=new Date().getFullYear()+1;
    return Number(w.settings.gvYear);
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
    var p=projectFor(pf.id,planYear),st=statuses(p,pf),configured=F.templatesReady(pf);
    var status=!p?"Not started":st.pre.ready?"Plan approved":st.pre.completed?"In preparation":configured?"Ready to prepare":"Needs country setup";
    return '<button type="button" class="country-card" data-guide="select-country" data-code="'+h(pf.id)+'" aria-label="'+h(pf.name)+' — Preparation '+st.pre.percent+'%; Import '+st.imp.percent+'%">'+
      '<div class="country-heading"><span class="country-flag" aria-hidden="true">'+(FLAGS[pf.id]||"🌍")+'</span>'+
      '<span><strong>'+h(pf.name)+'</strong><small>'+h(pf.code)+' · '+planYear+'</small></span></div>'+
      '<div class="country-progress">'+percent("Preparation",st.pre.percent)+percent("Import",st.imp.percent,"import")+'</div>'+
      '<div class="country-foot"><em>'+h(status)+'</em><span class="arrow">→</span></div></button>';
  }
  function board(){
    var planYear=year(),profiles=Object.keys(B.W.countries).map(function(code){return B.W.countries[code];}),
      started=profiles.filter(function(p){return !!projectFor(p.id,planYear);}).length;
    var first=Math.max(2025,new Date().getFullYear()-1),years=Array.from({length:9},function(_,i){return first+i;});
    return '<div class="country-intro"><div><h2>Choose a country</h2><p class="muted">Every country has the same two phases: prepare the calendar year, then import the months you need.</p></div>'+
      '<div class="actions"><label>Calendar year<select id="boardYear">'+years.map(function(y){return '<option value="'+y+'" '+(y===planYear?"selected":"")+'>'+y+'</option>';}).join("")+'</select></label>'+
      press("+ New country","new-country","ghost")+'</div></div>'+
      '<div class="grid g3" style="margin-bottom:16px"><div class="kpi"><div class="muted small">Countries</div><div class="metric">'+profiles.length+'</div><div class="hint">Each country has its own configuration.</div></div>'+
      '<div class="kpi"><div class="muted small">Started this year</div><div class="metric">'+started+'</div><div class="hint">Progress is saved locally.</div></div>'+
      '<div class="kpi"><div class="muted small">The workflow</div><div class="metric" style="font-size:18px;margin-top:15px">Prepare → Import</div><div class="hint">Continue from where work stopped.</div></div></div>'+
      '<div class="country-board">'+profiles.map(function(pf){return tile(pf,planYear);}).join("")+'</div>'+
      '<div class="card" style="margin-top:17px"><div class="flex-between"><div><strong>Have a project from another analyst?</strong>'+
      '<p class="muted small">Import a shared snapshot to continue their work on this device.</p></div>'+
      press("Import shared work","import-snapshot","ghost small")+'</div></div>';
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
    UI.prepStep=0;UI.detail="";UI.page="preparation";B.save();render();
  }
  function phase(label,st,mode,active){
    return '<div class="journey-phase '+(active?"active":"")+'"><div class="flex-between"><strong>'+h(label)+'</strong>'+
      '<span class="percent">'+st.percent+'%<small>complete</small></span></div>'+
      '<span class="phase-badge">'+st.completed+' of '+st.total+' '+(mode==="import"?"months with events":"steps")+'</span>'+
      '<div class="track '+mode+'"><span style="width:'+st.percent+'%"></span></div></div>';
  }
  function header(importing){
    var p=current(),pf=profile(),st=statuses(p,pf);
    return '<div class="journey-hero"><div class="journey-heading">'+
      '<div class="journey-title"><span class="country-flag" aria-hidden="true">'+(FLAGS[pf.id]||"🌍")+'</span>'+
      '<div><h2>'+h(pf.name)+' · '+p.year+'</h2><p>'+h(p.name)+' · '+money(p.employeeIds.length)+' employees</p></div></div>'+
      '<div class="actions">'+press("All countries","back-countries","ghost small")+press("Handover & notes","handover","ghost small")+'</div></div>'+
      '<div class="journey-stats">'+phase("Phase 1 · Preparation",st.pre,"",!importing)+phase("Phase 2 · Import",st.imp,"import",importing)+'</div>'+
      '<div class="journey-tabs">'+press("1. Preparation","preparation",importing?"ghost":"primary")+
      press("2. Import","import",importing?"primary":"ghost")+'</div></div>';
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
    if(n)body+=B.renderOverview();
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
    if(UI.detail==="handover")return header(false)+'<div class="card">'+press("← Back to preparation","close-detail","ghost small")+'</div>'+B.renderActivity();
    return [stepSetup,stepRoster,stepPatterns,stepSimulation,stepApproval][UI.prepStep||0]();
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
    var result=header(true)+'<div class="card">'+intro("Import progress · "+p.year,"Download the selected months, upload them to GlobalView and confirm each completed upload.")+
      '<div class="mini-months">'+m.map(function(x){
        var label=x.complete?"Uploaded":x.status==="downloaded"?"Downloaded":x.status==="partial"?"In progress":x.status==="planned"?"Pending":"No events";
        return '<div class="mini-month '+(x.complete?"done":x.status==="downloaded"?"downloaded":x.status==="partial"?"pending":x.status==="empty"?"nodata":"")+'">'+G.MONTHS[x.month-1]+'<strong>'+h(label)+'</strong></div>';
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
    if(op==="select-country"){selectCountry(btn.dataset.code,year());return;}
    if(op==="new-country"){B.newCountryModal(false);return;}
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
    if(event.target.id==="boardYear"){
      B.W.settings.gvYear=Number(event.target.value);
      B.save();render();
    }
  }
  function boot(){
    B=window.GVBridge;
    if(!B||!B.W||!F){console.error("Guided GlobalView module missing its dependencies");return;}
    UI=B.UI;UI.page="dashboard";UI.detail="";UI.prepStep=0;UI.month=0;
    document.getElementById("content").addEventListener("click",act);
    document.getElementById("content").addEventListener("change",onChange);
    render();
  }
  window.GVGuided={boot:boot,render:render};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();