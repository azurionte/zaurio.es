/* GlobalView Demo Builder 0.1 — workspace, interface and interactions */
(function(){
  "use strict";
  var C=window.GVCore,STORAGE="dbt.gv.demo.builder.v01",W,UI={page:"dashboard",month:0,prepStep:0,detail:"",ruleId:null,eventPage:0,search:"",kind:"all",periodStart:1,periodEnd:3,selectedTypes:null,countryId:"AU",templateId:"P2001"};
  var TITLES={overview:["Overview","See the entire calendar and spot unusual patterns at a glance."],
    planner:["Event planner","Define natural event patterns, seasonal peaks, and employee variability."],
    employees:["Employees & events","Inspect, adjust and annotate every employee event."],
    exports:["Export center","Choose your period, validate the records, and download GlobalView TXT files."],
    countries:["Country setup","Build each country from scratch, with its own data formats and scenarios."],
    activity:["Activity & notes","Follow handovers, exports, confirmations and project changes."]};
  var COLORS={P2001:"#58a6ff",P2010:"#ed4459",P0008:"#a991ff",P0015:"#52d7b0",P0267:"#ffbb6b"};
  function h(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
  function safeArray(a){return Array.isArray(a)?a:[];}
  function byId(id){return document.getElementById(id);}
  function q(s,root){return (root||document).querySelector(s);}
  function qa(s,root){return Array.from((root||document).querySelectorAll(s));}
  function num(n){return Number(n||0).toLocaleString("en-GB");}
  function now(){return new Date().toISOString();}
  function state(){try{var x=JSON.parse(localStorage.getItem(STORAGE));if(x&&x.schema===1&&x.countries&&Array.isArray(x.projects)){if(!x.settings)x.settings={editor:"Demo Analyst",device:C.uid()};return x;}}catch(_e){}return C.defaultWorkspace();}
  function save(){W.updatedAt=now();try{localStorage.setItem(STORAGE,JSON.stringify(W));return true;}catch(e){notify("Could not save locally. Export a snapshot now.","error");return false;}}
  function current(){return W.projects.find(function(p){return p.id===W.selectedProject;})||null;}
  function country(){var p=current();return p?W.countries[p.profileId]:null;}
  function editor(){return (W.settings.editor||"Demo Analyst").trim()||"Demo Analyst";}
  function noteLog(p,action,detail){p.activity.unshift({id:C.uid(),at:now(),by:editor(),action:action,detail:detail||""});p.activity=p.activity.slice(0,400);p.revision++;p.updatedAt=now();save();}
  function notify(msg,level){var box=byId("toast-root");box.innerHTML='<div class="toast '+(level==="error"?"err":level==="success"?"ok":"")+'">'+h(msg)+'</div>';setTimeout(function(){if(box)box.innerHTML="";},4200);}
  function pill(text,style){return '<span class="pill '+(style||"")+'">'+h(text)+'</span>';}
  function button(text,action,cls,attrs){return '<button type="button" class="btn '+(cls||"")+'" data-action="'+h(action)+'" '+(attrs||"")+'>'+text+'</button>';}
  function option(value,label,selected){return '<option value="'+h(value)+'"'+(selected?' selected':'')+'>'+h(label)+'</option>';}
  function selectList(id,list,selected){return '<select id="'+h(id)+'">'+list.map(function(x){return option(x[0],x[1],x[0]==selected);}).join("")+'</select>';}
  function fieldLabel(name,input){return '<label>'+h(name)+input+'</label>';}
  function inp(id,value,type,min,max,step){return '<input id="'+h(id)+'" type="'+(type||"text")+'" value="'+h(value==null?"":value)+'"'+(min!=null?' min="'+h(min)+'"':'')+(max!=null?' max="'+h(max)+'"':'')+(step!=null?' step="'+h(step)+'"':'')+'>';}
  function panelTitle(title,desc,actions){return '<div class="pane-title"><div><h2>'+h(title)+'</h2><p>'+h(desc||"")+'</p></div><div class="actions">'+(actions||"")+'</div></div>';}
  function modal(title,body,actions){var target=byId("modal-root");target.innerHTML='<div class="modal-layer" role="presentation"><div class="modal" role="dialog" aria-modal="true" aria-label="'+h(title)+'"><div class="modal-head"><h2>'+h(title)+'</h2><button type="button" class="close" data-close-modal aria-label="Close">×</button></div>'+body+'<div class="modal-foot" id="modal-actions"></div></div></div>';target.querySelector("[data-close-modal]").onclick=closeModal;target.querySelector(".modal-layer").addEventListener("click",function(e){if(e.target===this)closeModal();});var footer=byId("modal-actions");(actions||[{label:"Close",cls:"ghost",run:closeModal}]).forEach(function(a){var b=document.createElement("button");b.type="button";b.className="btn "+(a.cls||"");b.textContent=a.label;b.onclick=a.run;footer.appendChild(b);});}
  function closeModal(){byId("modal-root").innerHTML="";}
  function confirmBox(title,body,run){modal(title,'<p>'+h(body)+'</p>',[{label:"Cancel",cls:"ghost",run:closeModal},{label:"Continue",cls:"primary",run:function(){closeModal();run();}}]);}
  function value(id){return String(byId(id)?.value||"").trim();}
  function originalValue(id){return String(byId(id)?.value||"");}
  function numberValue(id,fallback){var el=byId(id);return el?Number(el.value):fallback;}
  function render(){
    if(window.GVGuided&&typeof window.GVGuided.render==="function"){window.GVGuided.render();return;}
    var meta=TITLES[UI.page];byId("page-title").textContent=meta[0];byId("page-subtitle").textContent=meta[1];byId("page-eyebrow").textContent="Demo Building Tools / GlobalView / "+meta[0];
    qa("[data-page]").forEach(function(b){b.classList.toggle("active",b.dataset.page===UI.page);});
    var sel=byId("projectSelect");sel.innerHTML='<option value="">Select a project</option>'+W.projects.map(function(p){var c=W.countries[p.profileId];return option(p.id,(c?c.code:"?")+" · "+p.name+" ("+p.year+")",p.id===W.selectedProject);}).join("");
    var p=current(),notices=byId("notices");notices.innerHTML="";
    if(p&&!country()){notices.innerHTML='<div class="tip warning alertbar">This project references a country profile that is no longer available.</div>';}
    var content=byId("content");
    if(!p&&UI.page!=="countries"){content.innerHTML=emptyProject();return;}
    try{
      if(UI.page==="overview")content.innerHTML=renderOverview();
      else if(UI.page==="planner")content.innerHTML=renderPlanner();
      else if(UI.page==="employees")content.innerHTML=renderEmployees();
      else if(UI.page==="exports")content.innerHTML=renderExports();
      else if(UI.page==="countries")content.innerHTML=renderCountries();
      else content.innerHTML=renderActivity();
    }catch(err){content.innerHTML='<div class="tip danger">Unable to show this view: '+h(err.message)+'</div>';console.error(err);}
    if(p){var invalid=C.validateProject(p,country());if(invalid.some(function(x){return x.severity==="error";})){notices.innerHTML='<div class="tip danger alertbar">Some records need attention before export. Open Employees & events to review the validation findings.</div>';}}
  }
  function emptyProject(){return '<div class="card"><div class="empty"><strong>Ready for your next demo year?</strong><p>Create a project, pick a country and add employees. You can also start with fictional employees and use the event planner immediately.</p>'+button("+ Create first project","new-project","primary")+' '+button("Configure a country","country-page","ghost")+' '+button("Import shared project","import-snapshot","ghost")+'</div></div>';}
  function statusByMonth(p,month){var found=p.batches.filter(function(b){return b.start<=month&&b.end>=month;});if(!found.length)return "Not exported";return found.some(function(b){return b.status==="uploaded";})?"Uploaded":found.some(function(b){return b.status==="downloaded";})?"Downloaded":"Prepared";}
  function renderOverview(){
    var p=current(),pf=country(),series=C.monthlySeries(p),errors=C.validateProject(p,pf),people=new Set(p.events.map(function(e){return e.employee;})).size,avg=p.events.length/12;
    var high=series.filter(function(m){return avg>0&&m.total>avg*1.4;}),low=series.filter(function(m){return avg>0&&m.total<avg*.55;});
    var peak=high.length?high.map(function(m){return m.label;}).join(", "):"Balanced";
    var cards=[["Events",num(p.events.length),"Scheduled records","◈"],["Employees",num(p.employeeIds.length),"In the project roster","♙"],["Types",num(Object.keys(pf.templates).length),"Configured data formats","▦"],["Validation",num(errors.length),errors.filter(function(x){return x.severity==="error";}).length+" blocking errors","✓"]];
    var html='<div class="grid g4">'+cards.map(function(c){return '<div class="kpi"><div class="flex-between"><span class="muted small">'+h(c[0])+'</span><span class="kicon">'+c[3]+'</span></div><div class="metric">'+c[1]+'</div><div class="hint">'+h(c[2])+'</div></div>';}).join("")+'</div>';
    var max=Math.max(1,...series.map(function(m){return m.total;})),types=Array.from(new Set(p.events.map(function(e){return e.infotype;}))).sort();
    html+='<div class="section"><div class="card">'+panelTitle("2027 annual shape".replace("2027",String(p.year)),"Events are counted by start month; ongoing absences appear in the drill-down.",button("Plan scenarios","planner-page","ghost small"));
    html+='<div class="legend">'+types.map(function(t){return '<span class="small"><span class="dot" style="background:'+(COLORS[t]||"#a7bacf")+'"></span>'+h(t)+" "+h(C.typeNames[t]||"")+'</span>';}).join("")+'</div>';
    html+='<div class="bars" role="group" aria-label="Monthly events">'+series.map(function(m){
      var pieces=types.map(function(t){var n=m.byType[t]||0;return n?'<div class="bar-piece" style="height:'+(n/m.total*100)+'%;background:'+(COLORS[t]||"#a7bacf")+'"></div>':"";}).join("");
      return '<button class="bar-btn '+(UI.month===m.month?"selected":"")+'" data-action="select-month" data-month="'+m.month+'" title="'+m.label+': '+m.total+' new events; '+m.ongoing+' continuing absences"><b>'+num(m.total)+'</b><div class="bar-frame"><div class="bar-stack" style="height:'+Math.max(3,m.total/max*100)+'%">'+pieces+'</div></div><small>'+m.label+'</small></button>';
    }).join("")+'</div></div>';
    var observed=UI.month||new Date().getMonth()+1,month=C.MONTHS[observed-1],inMonth=C.activeEvents(p,observed),newly=inMonth.filter(function(e){return e.start.slice(0,6)===p.year+C.pad(observed);}),ongoing=inMonth.filter(function(e){return e.start.slice(0,6)!==p.year+C.pad(observed);});
    html+='<div class="grid g2"><div class="card">'+panelTitle(month+" · details","Click any bar above to review a month",button("Open events","view-selected-month","ghost small"))+'<div class="grid g3"><div class="kpi"><span class="muted small">New events</span><div class="metric">'+newly.length+'</div></div><div class="kpi"><span class="muted small">Ongoing leave</span><div class="metric">'+ongoing.length+'</div></div><div class="kpi"><span class="muted small">Employees affected</span><div class="metric">'+new Set(inMonth.map(function(e){return e.employee;})).size+'</div></div></div><p class="small muted">Export follows event start date, even when a leave spans multiple months.</p></div>';
    html+='<div class="card">'+panelTitle("Review signals","Check outliers before generating a file")+'<div class="toc">';
    html+='<div class="flex-between"><span>High-activity months</span>'+pill(peak,high.length?"warn":"good")+'</div><div class="flex-between"><span>Quiet months</span>'+pill(low.length?low.map(function(m){return m.label;}).join(", "):"Balanced",low.length?"warn":"good")+'</div><div class="flex-between"><span>Events outside '+p.year+'</span>'+pill(p.events.filter(function(e){return e.start.slice(0,4)!==String(p.year);}).length,"warn")+'</div>';
    html+='<div class="flex-between"><span>Downloaded batches</span>'+pill(p.batches.filter(function(b){return b.status==="downloaded";}).length)+'</div><div class="flex-between"><span>Uploaded batches (manually confirmed)</span>'+pill(p.batches.filter(function(b){return b.status==="uploaded";}).length,"good")+'</div></div></div></div></div>';
    html+='<div class="card" style="margin-top:15px">'+panelTitle("Progress across the year","An export is not an upload confirmation.",button("Export selected period","exports-page","primary small"))+'<div class="heatmap">'+series.map(function(m){var status=statusByMonth(p,m.month),mode=status==="Uploaded"?"high":status==="Downloaded"?"low":"";return '<div class="heatcell '+mode+'"><small>'+m.label+'</small><strong>'+m.total+'</strong><small>'+h(status)+'</small></div>';}).join("")+'</div></div>';
    return html;
  }
  function activeRule(pf){if(!pf)return null;var r=pf.rules.find(function(x){return x.id===UI.ruleId;});if(!r&&pf.rules.length){UI.ruleId=pf.rules[0].id;return pf.rules[0];}return r||null;}
  function renderPlanner(){
    var p=current(),pf=country(),rule=activeRule(pf),html='<div class="tip alertbar">Scenarios are country-specific. A saved seed makes the results reproducible; generating again replaces only unexported generated records, never imported or downloaded ones.</div>';
    html+='<div class="card">'+panelTitle("Build the annual simulation","Create realistic patterns rather than identical employee schedules.",
      button("+ Add scenario","new-rule","ghost small")+button("Generate events","generate","primary small"))+
      '<div class="control-row">'+fieldLabel("Simulation seed",inp("seedValue",p.seed,"number",0))+
      fieldLabel("Employees",'<div style="display:flex;gap:7px"><input value="'+h(p.employeeIds.length)+' employees" disabled>'+button("Edit roster","edit-roster","ghost small")+'</div>')+
      '<div class="actions">'+button("Apply seed","save-seed","small")+'</div></div></div>';
    html+='<div class="grid g2" style="margin-top:15px"><div class="card">'+panelTitle("Event patterns","Choose a scenario to tune its frequency and seasonality")+'<div class="rule-list">';
    html+=pf.rules.length?pf.rules.map(function(r){return '<button type="button" class="rule-line '+(r.id===UI.ruleId?"selected":"")+'" data-action="select-rule" data-id="'+h(r.id)+'"><span><strong>'+h(r.label)+'</strong><small>'+h(r.infotype)+' · '+h(r.code)+' · '+h(r.share)+'% of employees · '+h(r.countMin)+'–'+h(r.countMax)+'/year</small></span><span class="tag">'+(r.enabled?"Active":"Off")+'</span></button>';}).join(""):'<div class="empty"><strong>No patterns yet</strong><p>Add a scenario for the country you are configuring.</p></div>';
    html+='</div></div><div class="card">'+(rule?renderRuleForm(rule,pf):'<div class="empty">Select or create a scenario to edit its behavior.</div>')+'</div></div>';
    return html;
  }
  function renderRuleForm(r,pf){
    var templates=Object.keys(pf.templates),types=templates.map(function(t){return [t,t+" · "+(pf.templates[t].label||"")];}),modes=[["hours","Time quantity (hours)"],["days","Absence duration (days)"],["money","Fixed amount"]];
    var html=panelTitle(r.label,"How often should this happen, and when?",button("Duplicate","duplicate-rule","ghost small")+button("Delete","delete-rule","danger small"));
    html+='<div class="formgrid">'+
      fieldLabel("Scenario name",inp("r-label",r.label))+
      fieldLabel("Infotype",selectList("r-infotype",types,r.infotype))+
      fieldLabel("Wage / absence code",inp("r-code",r.code))+
      fieldLabel("Employees affected (%)",inp("r-share",r.share,"number",0,100,1))+
      fieldLabel("Minimum occurrences per employee / year",inp("r-countMin",r.countMin,"number",0,120))+
      fieldLabel("Maximum occurrences per employee / year",inp("r-countMax",r.countMax,"number",0,120))+
      fieldLabel("Event value",selectList("r-mode",modes,r.mode))+
      fieldLabel("Amount when using a fixed payment",inp("r-amount",r.amount,"number",0,1000000,.01))+
      fieldLabel("Minimum quantity",inp("r-quantityMin",r.quantityMin,"number",0,1000000,.5))+
      fieldLabel("Maximum quantity",inp("r-quantityMax",r.quantityMax,"number",0,1000000,.5))+
      fieldLabel("Minimum duration (days)",inp("r-durationMin",r.durationMin,"number",1,365))+
      fieldLabel("Maximum duration (days)",inp("r-durationMax",r.durationMax,"number",1,365))+
      '<div class="wide actions"><label class="checkitem"><input type="checkbox" id="r-weekdays" '+(r.weekdays?"checked":"")+'> Start on weekdays</label><label class="checkitem"><input type="checkbox" id="r-enabled" '+(r.enabled?"checked":"")+'> Include in generation</label></div></div>';
    html+='<div class="divider"></div><h3>Seasonality & spikes</h3><p class="muted small">Higher intensity means more events in that month, not higher payment amounts. Zero excludes the month.</p><div class="actions" style="margin:12px 0 16px">'+button("Even year","preset-even","ghost small")+button("Summer slowdown","preset-summer","ghost small")+button("Year-end rush","preset-yearend","ghost small")+button("Mid-year spike","preset-midyear","ghost small")+'</div><div class="months-edit">'+r.weights.map(function(w,i){return '<div class="weightcell"><b>'+C.MONTHS[i]+'</b><span class="monthweight" data-weight-label="'+i+'">'+w+'</span><input type="range" min="0" max="10" step="1" data-monthweight="'+i+'" value="'+h(w)+'" aria-label="'+C.MONTHS[i]+' intensity"></div>';}).join("")+'</div>';
    html+='<div class="divider"></div><div class="flex-between"><span class="small muted">Changes affect the next generation, not existing events.</span>'+button("Save this pattern","save-rule","primary")+'</div>';
    return html;
  }
  function renderEmployees(){
    var p=current(),pf=country(),types=Object.keys(pf.templates),query=UI.search.toLowerCase();
    var entries=p.events.filter(function(e){if(UI.kind!=="all"&&e.infotype!==UI.kind)return false;if(UI.month&&!(e.start<=p.year+C.pad(UI.month)+C.pad(new Date(Date.UTC(p.year,UI.month,0)).getUTCDate())&&e.end>=p.year+C.pad(UI.month)+"01"))return false;
      return !query||e.employee.toLowerCase().includes(query)||String(e.code).toLowerCase().includes(query)||e.notes.toLowerCase().includes(query);});
    entries=entries.sort(function(a,b){return a.start.localeCompare(b.start)||a.employee.localeCompare(b.employee);});
    var pageStart=UI.eventPage*70;if(pageStart>=entries.length){UI.eventPage=0;pageStart=0;}var shown=entries.slice(pageStart,pageStart+70);
    var html='<div class="card">'+panelTitle("Employee events","Imported and generated records can be reviewed and edited individually.",button("Import GlobalView TXT","import-txt","ghost small")+button("+ Add event","add-event","primary small"));
    html+='<div class="filters">'+fieldLabel("Employee / code",'<input id="eventSearch" placeholder="Search employee or code" value="'+h(UI.search)+'">')+
      fieldLabel("Data type",selectList("eventKind",[["all","All types"]].concat(types.map(function(t){return [t,t+" · "+(pf.templates[t].label||"")];})),UI.kind))+
      fieldLabel("Month",selectList("eventMonth",[[0,"Entire year"]].concat(C.MONTHS.map(function(m,i){return [i+1,m];})),UI.month))+
      button("Apply filters","apply-filters","small")+'</div>';
    var findings=C.validateProject(p,pf),bad=new Set(findings.filter(function(x){return x.severity==="error";}).map(function(x){return x.eventId;}));
    html+='<div class="summary-strip">'+pill(num(entries.length)+" matching events")+pill(num(findings.filter(function(x){return x.severity==="warning";}).length)+" warnings","warn")+pill(num(bad.size)+" invalid events",bad.size?"bad":"good")+'</div>';
    html+='<div class="tablewrap" style="margin-top:14px"><table class="data"><thead><tr><th>Employee</th><th>Infotype</th><th>Code</th><th>From</th><th>To</th><th>Value</th><th>Source</th><th>Review</th></tr></thead><tbody>';
    html+=shown.map(function(e){var t=pf.templates[e.infotype],qty=t?C.roleValue(e,t,"quantity")||C.roleValue(e,t,"hours"):"",amt=t?C.roleValue(e,t,"amount"):"";var status=bad.has(e.id)?'<span class="err">Fix fields</span>':e.locked?'<span class="ok">Exported</span>':e.notes?'<span class="warn">Annotated</span>':"Ready";
      return '<tr data-action="edit-event" data-id="'+h(e.id)+'"><td class="mono">'+h(e.employee)+'</td><td>'+h(e.infotype)+'</td><td class="mono">'+h(e.code||"—")+'</td><td>'+h(C.isoDate(e.start))+'</td><td>'+h(C.isoDate(e.end))+'</td><td>'+h(qty||amt||"—")+'</td><td>'+h(e.origin)+'</td><td>'+status+'</td></tr>';}).join("");
    html+='</tbody></table></div><div class="table-footer"><span class="muted small">Showing '+(entries.length?pageStart+1:0)+'–'+Math.min(pageStart+70,entries.length)+' of '+num(entries.length)+'</span><div class="actions">'+button("Previous","prev-events","ghost small",(UI.eventPage===0?'disabled':''))+button("Next","next-events","ghost small",(pageStart+70>=entries.length?'disabled':''))+'</div></div></div>';
    if(findings.length){html+='<div class="card">'+panelTitle("Validation findings","Warnings are review signals; errors block export")+'<div class="toc">'+findings.slice(0,15).map(function(f){return '<div class="flex-between"><span class="'+(f.severity==="error"?"err":"warn")+'">'+(f.severity==="error"?"●":"◐")+' '+h(f.message)+'</span>'+button("Review record","edit-event","ghost small",'data-id="'+h(f.eventId)+'"')+'</div>';}).join("")+(findings.length>15?'<p class="muted small">Showing the first 15 findings.</p>':"")+'</div></div>';}
    return html;
  }
  function batchPreview(p,types,start,end){var all=C.batchEvents(p,types,start,end),counts={};all.forEach(function(e){counts[e.infotype]=(counts[e.infotype]||0)+1;});
    var errors=C.validateProject(p,country()).filter(function(f){return f.severity==="error"&&all.some(function(e){return e.id===f.eventId;});});
    var repeats=all.filter(function(e){return p.batches.some(function(b){return b.status==="uploaded"&&b.eventRevisions&&b.eventRevisions[e.id];});});
    var ongoing=C.activeEvents(p,start).filter(function(e){return e.infotype==="P2001"&&e.start< p.year+C.pad(start)+"01";}).length;
    return {rows:all,counts:counts,errors:errors,repeats:repeats,ongoing:ongoing};
  }
  function renderExports(){
    var p=current(),pf=country(),types=Object.keys(pf.templates),selected=UI.selectedTypes||types;
    UI.selectedTypes=selected.filter(function(t){return types.includes(t);});selected=UI.selectedTypes;
    var pre=batchPreview(p,selected,UI.periodStart,UI.periodEnd);
    var html='<div class="card">'+panelTitle("Prepare the next upload","Select the exact months to package. Each infotype becomes one SAP-format TXT file.");
    html+='<div class="actions" style="margin-bottom:13px">'+button("1 month","period-1","small")+button("Quarter","period-3","small")+button("6 months","period-6","small")+button("Full year","period-12","small")+'</div>';
    html+='<div class="control-row">'+fieldLabel("From",selectList("periodStart",C.MONTHS.map(function(m,i){return [i+1,m];}),UI.periodStart))+
      fieldLabel("To",selectList("periodEnd",C.MONTHS.map(function(m,i){return [i+1,m];}),UI.periodEnd))+button("Update preview","preview-period","ghost")+'</div>';
    html+='<div class="divider"></div><h3>Included data types</h3><div class="actions" style="margin-top:11px">'+types.map(function(t){return '<label class="checkitem"><input type="checkbox" data-export-type="'+t+'" '+(selected.includes(t)?"checked":"")+'>'+t+' · '+h(pf.templates[t].label||"")+'</label>';}).join("")+'</div>';
    html+='<div class="grid g3" style="margin-top:18px"><div class="kpi"><span class="muted small">Records in this period</span><div class="metric">'+num(pre.rows.length)+'</div></div><div class="kpi"><span class="muted small">Blocking errors</span><div class="metric">'+num(pre.errors.length)+'</div></div><div class="kpi"><span class="muted small">Previously uploaded</span><div class="metric">'+num(pre.repeats.length)+'</div></div></div>';
    html+='<div class="summary-strip" style="margin-top:12px">'+selected.map(function(t){return pill(t+": "+num(pre.counts[t]||0));}).join("")+'</div>';
    if(pre.ongoing)html+='<div class="tip warning" style="margin-top:14px">'+pre.ongoing+' leave records remain active from earlier months. They are shown in the planner but excluded from this batch by start date to prevent duplicate uploads. Confirm the earlier batch was loaded.</div>';
    if(pre.repeats.length)html+='<div class="tip warning" style="margin-top:14px">'+pre.repeats.length+' records have already been marked as uploaded. Confirm before re-exporting any overlapping period.</div>';
    html+='<p class="small muted">The Australia file profile follows the supplied sample structure. Imported headers are preserved. Check the first upload with your target GlobalView environment before relying on new batches.</p>';
    html+='<div class="actions">'+button("Download TXT bundle (.zip)","download-bundle","primary",(!pre.rows.length||pre.errors.length||!selected.length?'disabled':''))+
      button("Share project snapshot","share-snapshot","ghost")+'</div></div>';
    html+='<div class="card">'+panelTitle("Export & upload history","Downloaded and uploaded are different states. Upload confirmation is recorded manually.");
    if(!p.batches.length)html+='<div class="empty"><strong>No exports yet</strong><p>Your first downloaded file bundle will appear here, with its records, date and author.</p></div>';
    else html+='<div class="toc">'+p.batches.slice().reverse().map(function(b){var label=b.status==="uploaded"?"Uploaded":b.status==="downloaded"?"Downloaded":"Prepared";return '<div class="form-card"><div class="flex-between"><div><strong>'+h(b.periodLabel||C.MONTHS[b.start-1]+"–"+C.MONTHS[b.end-1])+'</strong> '+pill(label,b.status==="uploaded"?"good":"")+'<div class="muted small">'+h(b.types.join(", "))+' · '+num(b.count)+' records · '+h(b.by||"")+' · '+h(new Date(b.at).toLocaleString())+'</div></div><div class="actions">'+(b.status!=="uploaded"?button("Confirm uploaded","confirm-upload","success small",'data-id="'+h(b.id)+'"'):"")+button("Add note","note-batch","ghost small",'data-id="'+h(b.id)+'"')+'</div></div>'+(b.notes?'<p class="small">'+h(b.notes)+'</p>':"")+'</div>';}).join("")+'</div>';
    html+='</div>';
    return html;
  }
  function renderCountries(){
    var ids=Object.keys(W.countries);if(!W.countries[UI.countryId])UI.countryId=ids[0]||"AU";var pf=W.countries[UI.countryId];
    var html='<div class="card">'+panelTitle("Country profiles","The same engine works with a blank profile built entirely in this interface.",button("+ Build a country","new-country","primary small"))+
      '<div class="filters">'+fieldLabel("Country",selectList("countryChoice",ids.map(function(id){var c=W.countries[id];return [id,c.name+" ("+id+")"+(Object.keys(c.templates).length?"":" · setup required")];}),UI.countryId))+
      button("Duplicate profile","clone-country","ghost small")+'</div>';
    if(!pf)return html+'</div>';
    html+='<div class="formgrid">'+fieldLabel("Display name",inp("c-name",pf.name))+fieldLabel("Country ISO code",inp("c-code",pf.code))+
      fieldLabel("Currency",inp("c-currency",pf.currency))+fieldLabel("GlobalView system",inp("c-system",pf.system))+
      fieldLabel("Client identifier",inp("c-client",pf.client))+fieldLabel("System / filename prefix",inp("c-systemCode",pf.systemCode))+
      fieldLabel("Interface",inp("c-interface",pf.interface))+
      '<div class="actions">'+button("Save country details","save-country","primary")+'</div></div></div>';
    html+='<div class="card">'+panelTitle("Data formats & export mapping","Every infotype has its own fields, defaults, mapping and transport metadata.",button("+ Add data type","new-template","ghost small"));
    var templates=Object.keys(pf.templates);if(!templates.length)html+='<div class="empty"><strong>No data formats configured</strong><p>Add a type such as P2001 or P0015, define its fields, mark the roles and configure the export header.</p></div>';
    else{
      if(!pf.templates[UI.templateId])UI.templateId=templates[0];
      var t=pf.templates[UI.templateId];
      html+='<div class="filters">'+fieldLabel("Data type",selectList("templateChoice",templates.map(function(x){return [x,x+" · "+pf.templates[x].label];}),UI.templateId))+'</div>';
      html+='<div class="summary-strip">'+pill(t.fields.length+" fields")+pill(t.exportReady?"Export enabled":"Needs mapping",t.exportReady?"good":"warn")+pill(t.verified==="reference-format-only"?"Australia example format":"Unverified template")+'</div>';
      html+='<div class="divider"></div><div class="formgrid">'+fieldLabel("Type label",inp("t-label",t.label))+fieldLabel("File route suffix",inp("t-route",t.route))+
        fieldLabel("Filename pattern",inp("t-fileNamePattern",t.fileNamePattern))+
        fieldLabel("Header description",inp("t-description",(t.header||[])[7]||""))+
        fieldLabel("Name / country label",inp("t-countryName",(t.name||[])[3]||""))+
        fieldLabel("Category label",inp("t-nameSuffix",(t.name||[])[4]||""))+
        '<div class="wide actions"><label class="checkitem"><input type="checkbox" id="t-export" '+(t.exportReady?"checked":"")+'> Allow exporting with this format</label>'+button("Save format settings","save-template","primary small")+button("Remove data type","remove-template","danger small")+'</div></div>';
      html+='<div class="divider"></div><div class="flex-between"><h3>Field mapping</h3>'+button("+ Add field","new-field","ghost small")+'</div><p class="muted small">Set each field’s role, technical name and default value. Preserve leading zeros and trailing spaces in source formats.</p>';
      html+='<div class="tablewrap"><table class="data"><thead><tr><th>Column</th><th>Field label</th><th>Role</th><th>Type</th><th>Required</th><th>Default</th><th></th></tr></thead><tbody>'+t.fields.map(function(f,i){return '<tr><td class="mono">'+h(f.name)+'</td><td>'+h(f.label)+'</td><td>'+h(f.role)+'</td><td>'+h(f.type)+'('+h(f.length)+')</td><td>'+(f.required?"Yes":"No")+'</td><td class="mono">'+h(f.defaultValue||"·")+'</td><td>'+button("Edit","edit-field","ghost small",'data-index="'+i+'"')+'</td></tr>';}).join("")+'</tbody></table></div>';
    }
    html+='</div>';return html;
  }
  function renderActivity(){
    var p=current();var html='<div class="grid g2"><div class="card">'+panelTitle("Project notes","Record decisions, anomalies and work left for the next analyst.",button("+ Add note","add-project-note","primary small"))+'<p class="muted small">Notes are saved with the project snapshot and retain the author and date.</p>';
    html+=p.annotations.length?p.annotations.slice().reverse().map(function(n){return '<div class="audit-item"><div><strong>'+h(n.title||"Note")+'</strong><div class="small muted">'+h(n.by)+' · '+h(new Date(n.at).toLocaleString())+(n.month?' · '+C.MONTHS[n.month-1]:"")+'</div><p>'+h(n.body)+'</p></div></div>';}).join(""):'<div class="empty">No notes have been added.</div>';html+='</div>';
    html+='<div class="card">'+panelTitle("Activity log","Changes are attributable and included in each shared snapshot.")+'<div class="actions">'+button("Share snapshot","share-snapshot","ghost small")+button("Import snapshot","import-snapshot","ghost small")+'</div><div class="divider"></div>';
    html+=p.activity.length?p.activity.slice(0,55).map(function(a){return '<div class="audit-item"><div><strong>'+h(a.action)+'</strong> <time>'+h(new Date(a.at).toLocaleString())+'</time><p>'+h(a.by)+' · '+h(a.detail)+'</p></div></div>';}).join(""):'<div class="empty">Changes to this project will be recorded here.</div>';html+='</div></div>';
    html+='<div class="card" style="margin-top:15px">'+panelTitle("Sharing & sync","Versioned project snapshots for handovers between analysts.")+
      '<div class="tip">Share snapshot downloads a versioned JSON project. Another analyst can import it, review the revision and replace their local copy. Snapshots are exchanged manually; compare revision numbers before replacing a local project.</div>'+
      '<div class="control-row" style="margin-top:14px">'+fieldLabel("Your display name",inp("editorName",editor()))+button("Save name","save-editor","primary")+'</div></div>';
    return html;
  }
  function setPage(page){UI.page=page;render();}
  function newProjectModal(){
    var countries=Object.keys(W.countries);
    modal("Create annual project",'<div class="formgrid">'+
      fieldLabel("Project name",inp("project-name","Australia Demo 2027"))+
      fieldLabel("Calendar year",inp("project-year",2027,"number",2020,2100))+
      fieldLabel("Country",selectList("project-country",countries.map(function(id){return [id,W.countries[id].name+" · "+id];}),"AU"))+
      fieldLabel("Employee roster",selectList("project-roster",[["sample","76 fictional employees"],["empty","Start empty; import TXT or enter employees"]],"sample"))+
      '</div><p class="muted small">Fictional sample numbers can be replaced. For an actual GlobalView demo, use only the employee identifiers authorized for that environment.</p>',
      [{label:"Cancel",cls:"ghost",run:closeModal},{label:"Create project",cls:"primary",run:function(){
        var name=value("project-name"),year=numberValue("project-year"),code=value("project-country"),pf=W.countries[code];
        if(!name||!pf||year<2020||year>2100){notify("Enter a valid name, country and year.","error");return;}
        var roster=value("project-roster")==="sample"?C.exampleEmployees(76):[],p=C.newProject(pf,name,year,roster);
        W.projects.push(p);W.selectedProject=p.id;UI.ruleId=null;UI.month=0;UI.selectedTypes=null;noteLog(p,"Project created","Country "+code+"; "+year+"; "+roster.length+" employees");closeModal();UI.page="overview";render();notify("Project created locally.","success");
      }}]);
  }
  function editRoster(){
    var p=current();modal("Employee roster",fieldLabel("One authorized employee number per line",'<textarea id="roster-input" rows="12" style="width:100%" placeholder="00010001">'+h(p.employeeIds.join("\n"))+'</textarea>')+
      '<p class="muted small">Changing the roster does not delete existing events. Newly generated events use this list.</p>',
      [{label:"Cancel",cls:"ghost",run:closeModal},{label:"Save roster",cls:"primary",run:function(){var ids=originalValue("roster-input").split(/[\r\n,;]+/).map(function(x){return x.trim();}).filter(Boolean);
        if(ids.some(function(x){return !/^\d{1,8}$/.test(x);})){notify("Employee identifiers must contain 1–8 digits.","error");return;}
        p.employeeIds=Array.from(new Set(ids));noteLog(p,"Roster updated",p.employeeIds.length+" employees");closeModal();render();
      }}]);
  }
  function saveRuleForm(){
    var pf=country(),r=activeRule(pf);if(!r)return false;var keys=["label","infotype","code","mode","amount","share","countMin","countMax","quantityMin","quantityMax","durationMin","durationMax"];
    keys.forEach(function(k){var v=value("r-"+k);r[k]=["amount","share","countMin","countMax","quantityMin","quantityMax","durationMin","durationMax"].includes(k)?Number(v):v;});
    r.weekdays=byId("r-weekdays").checked;r.enabled=byId("r-enabled").checked;
    r.weights=qa("[data-monthweight]").map(function(el){return Number(el.value);});
    if(!r.label||!pf.templates[r.infotype]||!r.code){notify("Provide scenario name, data type and code.","error");return false;}
    if(r.share<0||r.share>100||r.countMin<0||r.countMax<r.countMin||r.durationMax<r.durationMin||r.quantityMax<r.quantityMin){notify("Check probability and min/max ranges.","error");return false;}
    pf.revision++;save();return true;
  }
  function addRuleModal(){
    var pf=country(),types=Object.keys(pf.templates);if(!types.length){notify("Add a data format to this country first.","error");setPage("countries");return;}
    modal("New event scenario",'<div class="formgrid">'+fieldLabel("Natural language label",inp("new-rule-label","Annual bonus"))+
      fieldLabel("Data type",selectList("new-rule-type",types.map(function(t){return [t,t+" · "+pf.templates[t].label];}),types[0]))+
      fieldLabel("Wage / absence code",inp("new-rule-code",""))+
      fieldLabel("Percentage of employees",inp("new-rule-share",50,"number",0,100))+
      '</div><p class="small muted">Verify wage and absence codes against your GlobalView configuration before generating production import files.</p>',
      [{label:"Cancel",cls:"ghost",run:closeModal},{label:"Create pattern",cls:"primary",run:function(){
        var label=value("new-rule-label"),type=value("new-rule-type"),code=value("new-rule-code"),share=numberValue("new-rule-share");
        if(!label||!type||!code||share<0||share>100){notify("Complete all fields with a valid percentage.","error");return;}
        var mode=type==="P2001"?"days":"hours";
        var r=C.rule(label,type,code,share,1,4,2,6,1,type==="P2001"?8:1,0,[5,5,5,5,5,5,5,5,5,5,5,5],mode,true);
        pf.rules.push(r);UI.ruleId=r.id;pf.revision++;noteLog(current(),"Scenario added",label+" ("+type+")");closeModal();render();
      }}]);
  }
  function generateEvents(){
    var p=current(),pf=country();if(!p.employeeIds.length){notify("Add employees before generating events.","error");return;}
    if(!pf.rules.some(function(r){return r.enabled;})){notify("Enable at least one scenario.","error");return;}
    var candidate=p.events.filter(function(e){return e.origin==="generated"&&!e.locked;}).length;
    confirmBox("Generate annual events","Generate events using the current seed and scenarios. "+candidate+" existing, unexported generated records will be replaced; imported and exported records are protected.",function(){
      var results=C.generate(p,pf,true);noteLog(p,"Events generated",results.added+" added; "+results.skipped+" skipped due to conflicts; seed "+p.seed);render();notify(num(results.added)+" events generated. Review the charts and validation.","success");
    });
  }
  function newCountryModal(cloneSource){
    var src=cloneSource?W.countries[UI.countryId]:null;
    modal(src?"Duplicate country profile":"Build a country from scratch",'<div class="formgrid">'+
      fieldLabel("Country name",inp("country-name",src?src.name+" copy":""))+
      fieldLabel("ISO country code",inp("country-code","","text"))+
      fieldLabel("Currency code",inp("country-currency",src?src.currency:"USD"))+
      '</div><p class="muted small">'+(src?"Copies configuration rules, not employees or project data.":"Starts with no infotypes and no patterns. Add your own formats and fields in the next screen.")+'</p>',
      [{label:"Cancel",cls:"ghost",run:closeModal},{label:"Create country",cls:"primary",run:function(){
        var name=value("country-name"),code=value("country-code").toUpperCase(),currency=value("country-currency").toUpperCase();
        if(!name||!/^[A-Z]{2,3}$/.test(code)||!/^[A-Z]{3}$/.test(currency)||W.countries[code]){notify("Use a unique 2–3 letter country code and a 3-letter currency.","error");return;}
        var p=src?C.clone(src):C.blankCountry(code,name,currency);
        p.id=code;p.code=code;p.name=name;p.currency=currency;p.revision=1;
        if(src){Object.values(p.templates).forEach(function(t){t.exportReady=false;t.verified="unverified";});}
        W.countries[code]=p;UI.countryId=code;UI.templateId=Object.keys(p.templates)[0]||"";save();closeModal();render();notify("Country created. Configure its formats and scenarios.","success");
      }}]);
  }
  function newTemplateModal(){
    var pf=W.countries[UI.countryId];
    modal("Add GlobalView data type",'<div class="formgrid">'+fieldLabel("Infotype code",inp("new-type-code","P0015"))+fieldLabel("Display label",inp("new-type-label","One-time payments"))+
      '</div><p class="muted small">A minimal employee/date schema is created. Add the other fields and verify the transport metadata before enabling exports.</p>',
      [{label:"Cancel",cls:"ghost",run:closeModal},{label:"Add type",cls:"primary",run:function(){
        var type=value("new-type-code").toUpperCase(),label=value("new-type-label");if(!/^P\d{4}$/.test(type)||!label||pf.templates[type]){notify("Choose a new Pxxxx code and label.","error");return;}
        pf.templates[type]=C.newTemplate(type,label);UI.templateId=type;pf.revision++;save();closeModal();render();
      }}]);
  }
  function fieldModal(index){
    var pf=W.countries[UI.countryId],t=pf.templates[UI.templateId],old=index>=0?t.fields[index]:C.field("","New field","CHAR",10,false,"none","");
    var roleOpts=C.ROLES.map(function(r){return [r,r==="none"?"Other / constant":r.charAt(0).toUpperCase()+r.slice(1)];});
    modal(index>=0?"Edit mapping field":"Add mapping field",'<div class="formgrid">'+
      fieldLabel("SAP field name",inp("f-name",old.name))+fieldLabel("Friendly label",inp("f-label",old.label))+
      fieldLabel("Value role",selectList("f-role",roleOpts,old.role))+
      fieldLabel("Field type",selectList("f-type",["CHAR","NUMC","DATS","TIMS","DEC","CURR","CUKY"].map(function(x){return [x,x];}),old.type))+
      fieldLabel("Max field length",inp("f-length",old.length,"number",1,255))+
      fieldLabel("Default text (spaces preserved)",'<input id="f-default" value="'+h(old.defaultValue||"")+'">')+
      '<label class="checkitem"><input type="checkbox" id="f-required" '+(old.required?"checked":"")+'> Required</label></div>'+
      '<div class="tip">Field order is export order. Use the exact SAP names and lengths from the country specification.</div>',
      [{label:"Cancel",cls:"ghost",run:closeModal}].concat(index>=0?[{label:"Remove field",cls:"danger",run:function(){
        confirmBox("Remove this field?","Deleting a field changes the transport format. Existing project events may need remapping.",function(){t.fields.splice(index,1);t.exportReady=false;pf.revision++;save();render();});}
      }]:[]).concat([{label:"Save field",cls:"primary",run:function(){
        var f=C.field(value("f-name"),value("f-label"),value("f-type"),numberValue("f-length"),byId("f-required").checked,value("f-role"),originalValue("f-default"));
        if(!f.name||!f.label||f.length<1||/[\t\r\n]/.test(f.name)||t.fields.some(function(x,i){return i!==index&&x.name===f.name;})){notify("Enter a unique technical name and label.","error");return;}
        if(index<0)t.fields.push(f);else t.fields[index]=f;t.exportReady=false;t.verified="unverified";pf.revision++;save();closeModal();render();
      }}]));
  }
  function saveCountryForm(){
    var pf=W.countries[UI.countryId],name=value("c-name"),code=value("c-code").toUpperCase(),currency=value("c-currency").toUpperCase();
    if(!name||code!==pf.code||!/^[A-Z]{3}$/.test(currency)){notify("Country codes cannot change after creation; use a 3-letter currency.","error");return;}
    pf.name=name;pf.currency=currency;pf.system=value("c-system");pf.client=value("c-client");pf.systemCode=value("c-systemCode");pf.interface=value("c-interface");
    pf.revision++;save();render();notify("Country details saved.","success");
  }
  function saveTemplateForm(){
    var pf=W.countries[UI.countryId],t=pf.templates[UI.templateId];if(!t)return;
    t.label=value("t-label");t.route=value("t-route");t.fileNamePattern=value("t-fileNamePattern");
    if(!t.fileNamePattern||!t.fields.length){notify("Configure a filename pattern and at least one field.","error");return;}
    t.header[1]=pf.system;t.header[2]=pf.interface;t.header[3]=pf.client;t.header[7]=value("t-description");t.name[3]=value("t-countryName");t.name[4]=value("t-nameSuffix");
    var ready=byId("t-export").checked,roles=t.fields.map(function(f){return f.role;});
    if(ready&&["employee","start","end"].some(function(x){return !roles.includes(x);})){notify("Map employee, start and end dates before enabling export.","error");return;}
    t.exportReady=ready;pf.revision++;save();render();notify("Format settings saved.","success");
  }
  function eventModal(id){
    var p=current(),pf=country(),isEdit=!!id,e=p.events.find(function(x){return x.id===id;}),types=Object.keys(pf.templates),kind=e?e.infotype:types[0];if(!kind){notify("Configure an infotype first.","error");return;}
    var type=pf.templates[kind],initial=e?e.raw:type.fields.map(function(f){return f.defaultValue||"";});
    var fields=type.fields.map(function(f,i){return '<label>'+h(f.label)+' <span class="mono muted tiny">'+h(f.name)+'</span><input class="event-field" data-fieldidx="'+i+'" value="'+h(initial[i]||"")+'" '+(f.required?"required":"")+'></label>';}).join("");
    var body='<div class="flex-between"><p class="muted small">Editing technical field values updates the annual plan and all summaries. Dates use YYYYMMDD in the export.</p>'+pill(kind)+'</div>';
    if(!isEdit)body+='<div class="tip warning" style="margin-bottom:12px">Select a data type first. The editor opens with the country-specific fields.</div>'+fieldLabel("Data type",selectList("event-new-type",types.map(function(t){return [t,t+" · "+pf.templates[t].label];}),kind));
    body+='<div class="eventedit">'+fields+'</div><div class="divider"></div>'+
      fieldLabel("Analyst note",'<textarea id="event-note" rows="3" placeholder="Why was this event created or adjusted?">'+h(e?e.notes:"")+'</textarea>');
    if(e&&e.locked)body+='<div class="tip warning">This event was included in a previously downloaded bundle. Changes create a new revision; check GlobalView for replacement or duplicate upload risks.</div>';
    var actions=[{label:"Cancel",cls:"ghost",run:closeModal}];
    if(isEdit)actions.push({label:"Delete event",cls:"danger",run:function(){
      confirmBox("Delete event?","Deleting the event affects future exports. Previous downloads remain in the audit history.",function(){
        p.events=p.events.filter(function(x){return x.id!==id;});noteLog(p,"Event deleted",e.infotype+" · "+e.employee+" · "+e.start);render();
      });}});
    actions.push({label:isEdit?"Save changes":"Add event",cls:"primary",run:function(){
      var template=pf.templates[kind],raw=qa(".event-field",byId("modal-root")).map(function(el){return el.value;});
      var temp={id:e?e.id:C.uid(),infotype:kind,raw:raw};temp.employee=C.roleValue(temp,template,"employee");
      temp.start=C.roleValue(temp,template,"start");temp.end=C.roleValue(temp,template,"end");temp.code=C.roleValue(temp,template,"code");
      var issue=C.validateEvent(temp,pf,p.year);
      if(issue.errors.length){notify(issue.errors[0],"error");return;}
      if(!temp.employee||!temp.start||!temp.end){notify("Employee and valid dates are required.","error");return;}
      if(isEdit){Object.assign(e,{raw:raw,employee:temp.employee,start:temp.start,end:temp.end,code:temp.code,notes:originalValue("event-note"),revision:(e.revision||1)+1,updatedAt:now()});}
      else{Object.assign(temp,{origin:"manual",sourceIndex:null,notes:originalValue("event-note"),revision:1,updatedAt:now()});p.events.push(temp);if(!p.employeeIds.includes(temp.employee))p.employeeIds.push(temp.employee);}
      noteLog(p,isEdit?"Event edited":"Event added",kind+" · "+temp.employee+" · "+temp.start);closeModal();render();notify(isEdit?"Event updated.":"Event added.","success");
    }});
    modal(isEdit?"Edit employee event":"Add employee event",body,actions);
    if(!isEdit)byId("event-new-type").onchange=function(){closeModal();UI.kind=this.value;addEventWithType(this.value);};
  }
  function addEventWithType(type){
    // A custom new event editor uses the same form, with a temporary first-type ordering.
    var pf=country(),ordered=Object.keys(pf.templates);if(!pf.templates[type])return;
    var temp=pf.templates[type];delete pf.templates[type];pf.templates={[""+type]:temp,...pf.templates};
    eventModal(null);
    // Restore original display order immediately; template objects are unchanged.
    var rebuilt={};ordered.forEach(function(t){rebuilt[t]=pf.templates[t];});pf.templates=rebuilt;
  }
  function handleFileImport(files){
    var p=current(),pf=country();if(!files.length)return;
    Promise.all(Array.from(files).map(function(file){return file.arrayBuffer().then(function(bytes){return C.parseTxt(bytes,file.name);});})).then(function(parsed){
      var summary=parsed.map(function(x){return x.type+": "+x.rows.length+" rows";}).join("; ");
      confirmBox("Import "+parsed.length+" GlobalView file(s)","Found "+summary+". Records are added to the current project without duplicating identical rows. Imported transport headers are preserved.",function(){
        try{
          var count=0;parsed.forEach(function(x){count+=C.importParsed(p,pf,x);});
          noteLog(p,"GlobalView TXT imported",parsed.length+" files; "+count+" new events");render();notify(num(count)+" imported events added.","success");
        }catch(err){notify("Import failed: "+err.message,"error");}
      });
    }).catch(function(err){notify("Could not read TXT: "+err.message,"error");});
  }
  function download(data,name,mime){
    var blob=new Blob([data],{type:mime||"application/octet-stream"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.style.display="none";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},15000);
  }
  function handleExport(){
    var p=current(),pf=country(),types=UI.selectedTypes||Object.keys(pf.templates),pre=batchPreview(p,types,UI.periodStart,UI.periodEnd);
    if(!pre.rows.length||pre.errors.length){notify("No valid records to export. Fix errors first.","error");return;}
    if(types.some(function(t){return !pf.templates[t].exportReady;})){notify("One of the data formats is not export-enabled. Review country setup.","error");return;}
    var make=function(){
      var files=[],at=new Date(),revs={};pre.rows.forEach(function(e){revs[e.id]=e.revision||1;});
      types.forEach(function(t){var rows=pre.rows.filter(function(e){return e.infotype===t;});if(rows.length){files.push({name:C.makeFilename(pf,t,at),data:C.generateTxt(p,pf,t,rows,at)});}});
      if(!files.length){notify("No eligible records in these types.","error");return;}
      var zip=C.zipFiles(files),period=C.MONTHS[UI.periodStart-1]+"–"+C.MONTHS[UI.periodEnd-1],
        filename="GV_"+pf.code+"_"+p.year+"_"+C.pad(UI.periodStart)+"-"+C.pad(UI.periodEnd)+"_r"+(p.revision+1)+".zip";
      download(zip,filename,"application/zip");
      var hashes={};files.forEach(function(f){hashes[f.name]=C.crc32(f.data).toString(16).padStart(8,"0");});
      p.batches.push({id:C.uid(),at:now(),by:editor(),status:"downloaded",start:UI.periodStart,end:UI.periodEnd,periodLabel:period,types:types.slice(),count:pre.rows.length,files:files.map(function(f){return f.name;}),crc32:hashes,filename:filename,eventRevisions:revs,notes:""});
      pre.rows.forEach(function(e){e.locked=true;});noteLog(p,"TXT bundle downloaded",filename+" · "+pre.rows.length+" rows");render();notify("TXT bundle downloaded; upload not yet confirmed.","success");
    };
    if(pre.repeats.length){confirmBox("Previously uploaded records","This selection includes "+pre.repeats.length+" records already marked as uploaded. Re-export only if your import procedure allows retries or replacements.",make);}else make();
  }
  function confirmUploaded(id){
    var p=current(),b=p.batches.find(function(x){return x.id===id;});if(!b)return;
    modal("Confirm GlobalView upload",'<p>Confirm only after importing the TXT files into the target GlobalView system. This records a manual status, not a verified system response.</p>'+
      fieldLabel("Upload / handover note",'<textarea rows="3" id="upload-note" placeholder="Environment, ticket, and result"></textarea>'),
      [{label:"Cancel",cls:"ghost",run:closeModal},{label:"Mark uploaded",cls:"success",run:function(){
        b.status="uploaded";b.uploadedAt=now();b.uploadedBy=editor();b.notes=originalValue("upload-note");noteLog(p,"Upload confirmed manually",b.filename+" · "+(b.notes||"No note"));closeModal();render();notify("Manual upload checkpoint saved.","success");
      }}]);
  }
  function batchNote(id){
    var p=current(),b=p.batches.find(function(x){return x.id===id;});if(!b)return;
    modal("Batch note",fieldLabel("Handover / import notes",'<textarea rows="5" id="batch-note">'+h(b.notes||"")+'</textarea>'),
      [{label:"Cancel",cls:"ghost",run:closeModal},{label:"Save note",cls:"primary",run:function(){b.notes=originalValue("batch-note");noteLog(p,"Batch note updated",b.filename);closeModal();render();}}]);
  }
  function addNote(){
    var p=current();modal("New project note",'<div class="formgrid">'+fieldLabel("Title",inp("note-title","Review / handover"))+
      fieldLabel("Linked month (optional)",selectList("note-month",[[0,"Entire project"]].concat(C.MONTHS.map(function(m,i){return [i+1,m];})),0))+
      '<div class="wide">'+fieldLabel("Note",'<textarea id="note-body" rows="5" placeholder="What did you check, and what should the next analyst know?"></textarea>')+'</div></div>',
      [{label:"Cancel",cls:"ghost",run:closeModal},{label:"Save note",cls:"primary",run:function(){
        var body=originalValue("note-body");if(!body.trim()){notify("Enter a note.","error");return;}
        p.annotations.push({id:C.uid(),title:value("note-title")||"Note",month:numberValue("note-month"),body:body,by:editor(),at:now()});
        noteLog(p,"Project note added",value("note-title"));closeModal();render();
      }}]);
  }
  function shareSnapshot(){
    var p=current();if(!p){notify("Choose a project first.","error");return;}var pf=country();
    var snapshot={format:"dbt-globalview-project",version:1,exportedAt:now(),project:C.clone(p),profile:C.clone(pf)};
    var text=JSON.stringify(snapshot,null,2),filename="GV_"+pf.code+"_"+p.year+"_snapshot_r"+p.revision+".json";
    download(new TextEncoder().encode(text),filename,"application/json");notify("Project snapshot downloaded. Share only via an approved corporate channel.","success");
  }
  function importSnapshotFile(file){
    if(!file)return;file.text().then(function(s){
      var snap=JSON.parse(s);if(snap.format!=="dbt-globalview-project"||snap.version!==1||!snap.project||!snap.profile||!Array.isArray(snap.project.events)){throw new Error("Not a GlobalView Builder snapshot.");}
      var p=snap.project,pf=snap.profile,existing=W.projects.find(function(x){return x.id===p.id;});
      var message=(existing?"This project already exists locally at revision "+existing.revision+". The imported snapshot is revision "+p.revision+". It will replace the local copy; export a backup if needed.":"This new project will be added locally.")+" Country "+pf.code+"; "+p.events.length+" events.";
      confirmBox("Import shared snapshot",message,function(){
        if(existing){W.projects=W.projects.filter(function(x){return x.id!==p.id;});}
        if(W.countries[pf.id]&&W.countries[pf.id].revision>pf.revision){notify("The existing country profile is newer; review configuration after import.");}
        else W.countries[pf.id]=pf;
        W.projects.push(p);W.selectedProject=p.id;UI.countryId=pf.id;UI.ruleId=null;UI.selectedTypes=null;
        noteLog(p,"Shared snapshot imported","Revision "+p.revision+" from "+(snap.exportedAt||"unknown date"));closeModal();UI.page="overview";render();notify("Snapshot imported locally.","success");
      });
    }).catch(function(e){notify("Import failed: "+e.message,"error");});
  }
  function removeTemplate(){
    var pf=W.countries[UI.countryId],type=UI.templateId;
    if(current()&&current().profileId===pf.id&&current().events.some(function(e){return e.infotype===type;})){notify("Cannot remove a data type used by current project events.","error");return;}
    confirmBox("Remove "+type+"?","Its format and related country scenarios will be removed. Existing projects may need a new profile.",function(){delete pf.templates[type];pf.rules=pf.rules.filter(function(r){return r.infotype!==type;});UI.templateId=Object.keys(pf.templates)[0]||"";pf.revision++;save();render();});
  }
  function actions(e){
    var btn=e.target.closest("[data-action]");if(!btn)return;
    if(btn.disabled)return;var action=btn.dataset.action,id=btn.dataset.id;
    if(action==="new-project"){newProjectModal();}
    else if(action==="country-page")setPage("countries");
    else if(action==="planner-page")setPage("planner");
    else if(action==="exports-page")setPage("exports");
    else if(action==="new-rule")addRuleModal();
    else if(action==="select-rule"){UI.ruleId=id;render();}
    else if(action==="duplicate-rule"){var pf=country(),r=activeRule(pf);if(r){var copy=C.clone(r);copy.id=C.uid();copy.label=copy.label+" copy";pf.rules.push(copy);UI.ruleId=copy.id;pf.revision++;save();render();}}
    else if(action==="delete-rule"){var pf=country(),r=activeRule(pf);if(r)confirmBox("Delete scenario?","Existing events remain; only the pattern is removed.",function(){pf.rules=pf.rules.filter(function(x){return x.id!==r.id;});UI.ruleId=null;pf.revision++;noteLog(current(),"Scenario removed",r.label);render();});}
    else if(action.indexOf("preset-")===0){var pattern=action.slice(7),patterns={even:[5,5,5,5,5,5,5,5,5,5,5,5],summer:[6,7,7,7,8,7,3,2,5,7,8,8],yearend:[3,4,4,4,4,5,5,6,7,8,10,10],midyear:[3,3,4,5,9,10,10,9,5,4,3,3]};var weights=patterns[pattern];if(weights){qa("[data-monthweight]").forEach(function(el,i){el.value=weights[i];var n=q('[data-weight-label="'+i+'"]');if(n)n.textContent=weights[i];});notify("Monthly intensity adjusted. Save this pattern to keep it.");}}
    else if(action==="save-rule"){if(saveRuleForm()){noteLog(current(),"Scenario updated",activeRule(country()).label);render();notify("Pattern saved.","success");}}
    else if(action==="save-seed"){current().seed=numberValue("seedValue");noteLog(current(),"Simulation seed updated",String(current().seed));render();}
    else if(action==="generate"){if(q("#r-label")&&!saveRuleForm())return;generateEvents();}
    else if(action==="edit-roster")editRoster();
    else if(action==="new-country")newCountryModal(false);
    else if(action==="clone-country")newCountryModal(true);
    else if(action==="new-template")newTemplateModal();
    else if(action==="save-country")saveCountryForm();
    else if(action==="save-template")saveTemplateForm();
    else if(action==="remove-template")removeTemplate();
    else if(action==="new-field")fieldModal(-1);
    else if(action==="edit-field")fieldModal(Number(btn.dataset.index));
    else if(action==="import-txt")byId("importFiles").click();
    else if(action==="add-event")eventModal(null);
    else if(action==="edit-event")eventModal(id);
    else if(action==="apply-filters"){UI.search=value("eventSearch");UI.kind=value("eventKind");UI.month=numberValue("eventMonth");UI.eventPage=0;render();}
    else if(action==="select-month"){UI.month=Number(btn.dataset.month);render();}
    else if(action==="view-selected-month"){UI.page="employees";UI.eventPage=0;render();}
    else if(action==="prev-events"){UI.eventPage=Math.max(0,UI.eventPage-1);render();}
    else if(action==="next-events"){UI.eventPage++;render();}
    else if(/^period-(1|3|6|12)$/.test(action)){var months=Number(action.split("-")[1]);UI.periodEnd=Math.min(12,UI.periodStart+months-1);render();}
    else if(action==="preview-period"){UI.periodStart=numberValue("periodStart");UI.periodEnd=numberValue("periodEnd");if(UI.periodEnd<UI.periodStart){notify("End month cannot be earlier than start month.","error");return;}render();}
    else if(action==="download-bundle")handleExport();
    else if(action==="confirm-upload")confirmUploaded(id);
    else if(action==="note-batch")batchNote(id);
    else if(action==="add-project-note")addNote();
    else if(action==="share-snapshot")shareSnapshot();
    else if(action==="import-snapshot")byId("importSnapshot").click();
    else if(action==="save-editor"){W.settings.editor=value("editorName")||"Demo Analyst";save();render();notify("Display name saved.","success");}
  }
  function boot(){
    W=state();if(!W.countries.AU)W.countries.AU=C.auProfile();UI.countryId=W.countries.AU?"AU":Object.keys(W.countries)[0];save();
    qa("[data-page]").forEach(function(b){b.addEventListener("click",function(){setPage(b.dataset.page);});});
    byId("projectSelect").addEventListener("change",function(){W.selectedProject=this.value||null;UI.ruleId=null;UI.selectedTypes=null;UI.eventPage=0;save();render();});
    byId("shareBtn").addEventListener("click",shareSnapshot);byId("newBtn").addEventListener("click",newProjectModal);
    byId("content").addEventListener("click",actions);
    byId("content").addEventListener("input",function(e){if(e.target.matches("[data-monthweight]")){var el=q('[data-weight-label="'+e.target.dataset.monthweight+'"]');if(el)el.textContent=e.target.value;}});
    byId("content").addEventListener("change",function(e){
      if(e.target.id==="countryChoice"){UI.countryId=e.target.value;UI.templateId=Object.keys(W.countries[UI.countryId].templates)[0]||"";render();}
      if(e.target.id==="templateChoice"){UI.templateId=e.target.value;render();}
      if(e.target.matches("[data-export-type]")){var selected=UI.selectedTypes||Object.keys(country().templates);if(e.target.checked){if(!selected.includes(e.target.dataset.exportType))selected.push(e.target.dataset.exportType);}else selected=selected.filter(function(x){return x!==e.target.dataset.exportType;});UI.selectedTypes=selected;render();}
    });
    byId("importFiles").addEventListener("change",function(e){handleFileImport(e.target.files);e.target.value="";});
    byId("importSnapshot").addEventListener("change",function(e){importSnapshotFile(e.target.files[0]);e.target.value="";});
    render();
  }

  window.GVBridge={
    get W(){return W;}, UI:UI, C:C,
    current:current, country:country, save:save, noteLog:noteLog, notify:notify,
    render:render, renderOverview:renderOverview, renderPlanner:renderPlanner,
    renderEmployees:renderEmployees, renderExports:renderExports,
    renderCountries:renderCountries, renderActivity:renderActivity,
    editRoster:editRoster, generateEvents:generateEvents,
    newCountryModal:newCountryModal, newProjectModal:newProjectModal,
    markUserAction:function(action,detail){var p=current();if(p)noteLog(p,action,detail);},
    shareSnapshot:shareSnapshot, addNote:addNote,
    closeModal:closeModal, modal:modal,
    getValidation:function(){var p=current();return p&&country()?C.validateProject(p,country()):[];}
  };

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();