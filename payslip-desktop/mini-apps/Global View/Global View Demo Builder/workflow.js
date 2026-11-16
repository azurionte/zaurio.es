/* GlobalView Demo Builder — guided country workflow and auditable completion rules. */
(function(root,factory){
  var api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.GVWorkflow=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  var PREPARATION_STEPS=[
    {key:"setup",title:"Country setup",description:"Review the country's SAP fields and export rules."},
    {key:"roster",title:"Employees",description:"Provide the employee identifiers for the demo population."},
    {key:"patterns",title:"Event patterns",description:"Choose variability, frequency and seasonal spikes."},
    {key:"simulation",title:"Generate & inspect",description:"Generate the year and inspect the monthly distribution."},
    {key:"review",title:"Approve plan",description:"Confirm the scenario is ready for export."}
  ];
  function fp(data){
    var s=JSON.stringify(data),h=2166136261;
    for(var i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),16777619);}
    return (h>>>0).toString(16).padStart(8,"0")+":"+s.length;
  }
  function setupSignature(profile){
    if(!profile)return "";
    return fp({id:profile.id,code:profile.code,name:profile.name,currency:profile.currency,
      system:profile.system,client:profile.client,interface:profile.interface,systemCode:profile.systemCode,templates:profile.templates});
  }
  function patternSignature(profile){
    return profile?fp(profile.rules||[]):"";
  }
  function planSignature(project,profile){
    if(!project||!profile)return "";
    return fp({country:setupSignature(profile),rules:patternSignature(profile),
      year:project.year,seed:project.seed,employees:project.employeeIds,
      events:project.events.map(function(e){return [e.id,e.infotype,e.employee,e.start,e.end,e.code,e.revision,e.raw];})});
  }
  function templatesReady(profile){
    if(!profile||!profile.templates)return false;
    return Object.keys(profile.templates).some(function(t){
      var x=profile.templates[t];if(!x.exportReady||!x.fields||!x.fields.length)return false;
      var roles=x.fields.map(function(f){return f.role;});
      return ["employee","start","end"].every(function(r){return roles.includes(r);})&&!!x.fileNamePattern;
    });
  }
  function patternsReady(profile){
    return !!(profile&&Array.isArray(profile.rules)&&profile.rules.some(function(r){
      return r.enabled&&profile.templates[r.infotype]&&profile.templates[r.infotype].exportReady&&r.code&&r.share>=0;
    }));
  }
  function validPlan(project,profile,validate){
    if(!project||!project.events||!project.events.length)return false;
    if(typeof validate==="function"){
      return !validate(project,profile).some(function(f){return f.severity==="error";});
    }
    return true;
  }
  function preparation(project,profile,validate){
    var w=project&&project.workflow||{},steps={
      setup:!!(project&&templatesReady(profile)&&w.setup===setupSignature(profile)),
      roster:!!(project&&project.employeeIds&&project.employeeIds.length>0),
      patterns:!!(project&&patternsReady(profile)&&w.patterns===patternSignature(profile)),
      simulation:!!(project&&validPlan(project,profile,validate))
    };
    steps.review=!!(project&&steps.setup&&steps.roster&&steps.patterns&&steps.simulation&&w.approvedPlan===planSignature(project,profile));
    var completed=Object.keys(steps).filter(function(k){return steps[k];}).length;
    return {steps:steps,completed:completed,total:5,percent:completed*20,ready:steps.review,
      next:PREPARATION_STEPS.find(function(x){return !steps[x.key];})?.key||"review"};
  }
  function mark(project,profile,key,validate){
    if(!project)throw new Error("No country-year project selected.");
    project.workflow=project.workflow||{};
    if(key==="setup"){
      if(!templatesReady(profile))throw new Error("Configure a valid export template before confirming this setup.");
      project.workflow.setup=setupSignature(profile);
    }else if(key==="patterns"){
      if(!patternsReady(profile))throw new Error("At least one enabled scenario must use an export-ready data type.");
      project.workflow.patterns=patternSignature(profile);
    }else if(key==="review"){
      var status=preparation(project,profile,validate);
      if(!status.steps.setup||!status.steps.roster||!status.steps.patterns||!status.steps.simulation)
        throw new Error("Complete the first four steps and fix blocking errors before approving.");
      project.workflow.approvedPlan=planSignature(project,profile);
    }else throw new Error("Unknown checklist step.");
    return preparation(project,profile,validate);
  }
  function confirmedForEvent(project,event,month){
    return (project.batches||[]).some(function(b){
      return b.status==="uploaded"&&b.start<=month&&b.end>=month&&
        Array.isArray(b.types)&&b.types.includes(event.infotype)&&b.eventRevisions&&
        b.eventRevisions[event.id]===event.revision;
    });
  }
  function downloadedForEvent(project,event,month){
    return (project.batches||[]).some(function(b){
      return ["uploaded","downloaded"].includes(b.status)&&b.start<=month&&b.end>=month&&
        Array.isArray(b.types)&&b.types.includes(event.infotype)&&b.eventRevisions&&
        b.eventRevisions[event.id]===event.revision;
    });
  }
  function monthStatus(project,profile,month){
    if(!project||!profile)return {month:month,status:"empty",total:0,uploaded:0,downloaded:0,complete:false};
    var types=Object.keys(profile.templates||{}).filter(function(t){return profile.templates[t].exportReady;});
    var rows=(project.events||[]).filter(function(e){
      return types.includes(e.infotype)&&e.start.slice(0,6)===String(project.year)+String(month).padStart(2,"0");
    });
    if(!rows.length)return {month:month,status:"empty",total:0,uploaded:0,downloaded:0,complete:false};
    var uploaded=rows.filter(function(e){return confirmedForEvent(project,e,month);}).length;
    var downloaded=rows.filter(function(e){return downloadedForEvent(project,e,month);}).length;
    var status=uploaded===rows.length?"uploaded":downloaded===rows.length?"downloaded":downloaded?"partial":"planned";
    return {month:month,status:status,total:rows.length,uploaded:uploaded,downloaded:downloaded,complete:uploaded===rows.length};
  }
  function importing(project,profile){
    var months=Array.from({length:12},function(_,i){return monthStatus(project,profile,i+1);});
    var completed=months.filter(function(m){return m.complete;}).length;
    return {months:months,completed:completed,total:12,percent:Math.round(completed/12*100)};
  }
  return {PREPARATION_STEPS:PREPARATION_STEPS,preparation:preparation,importing:importing,monthStatus:monthStatus,
    mark:mark,setupSignature:setupSignature,patternSignature:patternSignature,planSignature:planSignature,
    templatesReady:templatesReady,patternsReady:patternsReady};
});