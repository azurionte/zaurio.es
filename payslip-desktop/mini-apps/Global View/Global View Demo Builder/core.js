/* GlobalView Demo Builder 0.1 — portable planning and SAP text export engine.
   No employee data or credentials are embedded in this source. */
(function(root,factory){
  var api=factory();
  if(typeof module!=="undefined" && module.exports) module.exports=api;
  root.GVCore=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  var MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var ROLES=["none","employee","start","end","code","hours","quantity","unit","amount","currency"];
  var typeNames={P2001:"Absences",P2010:"Time wage types",P0008:"Basic pay",P0015:"One-time payments",P0267:"Off-cycle payments"};
  function clone(x){return JSON.parse(JSON.stringify(x));}
  function uid(){return (typeof crypto!=="undefined"&&crypto.randomUUID)?crypto.randomUUID():"gv-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);}
  function pad(n,len){return String(n).padStart(len||2,"0");}
  function yyyyMMdd(d){return d.getUTCFullYear()+pad(d.getUTCMonth()+1)+pad(d.getUTCDate());}
  function isoDate(x){if(!/^\d{8}$/.test(String(x||"")))return "";return String(x).slice(0,4)+"-"+String(x).slice(4,6)+"-"+String(x).slice(6,8);}
  function dateFromSAP(s){if(!/^\d{8}$/.test(String(s||"")))return null;var d=new Date(Date.UTC(+s.slice(0,4),+s.slice(4,6)-1,+s.slice(6,8)));return yyyyMMdd(d)===s?d:null;}
  function fromISO(s){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||"");if(!m)return "";return dateFromSAP(m[1]+m[2]+m[3])?m[1]+m[2]+m[3]:"";}
  function dateAdd(start,days){var d=dateFromSAP(start);if(!d)return start;d.setUTCDate(d.getUTCDate()+days);return yyyyMMdd(d);}
  function businessEnd(start,count){var d=dateFromSAP(start);if(!d)return start;var left=Math.max(1,Math.min(366,Number(count)||1));while(left>1){d.setUTCDate(d.getUTCDate()+1);if(d.getUTCDay()!==0&&d.getUTCDay()!==6)left--;}return yyyyMMdd(d);}
  function businessDays(start,end){var d=dateFromSAP(start),limit=dateFromSAP(end),count=0;if(!d||!limit)return 0;while(d<=limit){if(d.getUTCDay()!==0&&d.getUTCDay()!==6)count++;d.setUTCDate(d.getUTCDate()+1);}return count;}
  function field(name,label,type,length,required,role,def){return {name:name,label:label,type:type||"CHAR",length:length||20,required:!!required,role:role||"none",defaultValue:def==null?"":String(def)};}
  function auProfile(){
    var p={id:"AU",code:"AU",name:"Australia",currency:"AUD",system:"GVXADP",interface:"VIEWPOINT",client:"13Australia (AU)",systemCode:"PU4030",year:2027,revision:1,templates:{},rules:[]};
    var f2010=[
      field("ZHRKEY-PERNR","Personnel Number","NUMC",8,true,"employee"),
      field("ZHRKEY-BEGDA","Start Date","DATS",8,true,"start"),
      field("ZHRKEY-ENDDA","End Date","DATS",8,true,"end"),
      field("P2010-LGART","Wage Type","CHAR",4,true,"code"),
      field("P2010-STDAZ","Hours","DEC",7,false,"hours","0"),
      field("P2010-ANZHL","Number per time unit","DEC",7,false,"quantity","0"),
      field("P2010-ZEINH","Time unit/meas.","CHAR",3,false,"unit"),
      field("P2010-BETRG","Amount","CURR",13,false,"amount","0"),
      field("P2010-WAERS","Currency","CUKY",5,true,"currency","AUD  "),
      field("P2010-AUFKZ","Extra pay ID","CHAR",1),
      field("P2010-BWGRL","Valuation basis","CURR",13,false,"none","0"),
      field("P2010-TRFGR","Pay Scale Group","CHAR",8),
      field("P2010-TRFST","PS level","CHAR",2),
      field("P2010-PLANS","Position","NUMC",8,false,"none","00000000"),
      field("P2010-OTYPE","Object type","CHAR",2),
      field("P2010-VERSL","OT comp. type","CHAR",1),
      field("P2010-PRAKN","Premium no.","CHAR",2),
      field("P2010-PRAKZ","Premium ID","NUMC",4,false,"none","0000"),
      field("P2010-EXBEL","Ext. doc. no.","CHAR",8),
      field("PSREF-BUKRS","Company Code","CHAR",4),
      field("PSREF-KOSTL","Cost Center","CHAR",10),
      field("PSREF-POSID","Work Breakdown Structure Element (WBS Element)","CHAR",24),
      field("PSREF-AUFNR","Order","CHAR",12)
    ];
    var f2001=[
      field("ZHRKEY-PERNR","Personnel Number","NUMC",8,true,"employee"),
      field("ZHRKEY-BEGDA","Start Date","DATS",8,true,"start"),
      field("ZHRKEY-ENDDA","End Date","DATS",8,true,"end"),
      field("ZHRKEY-SEQNR","IT record no.","NUMC",3,false,"none","000"),
      field("P2001-AWART","Att./abs. type","CHAR",4,true,"code"),
      field("P2001-BEGUZ","Start time","TIMS",6),
      field("P2001-ENDUZ","End time","TIMS",6),
      field("P2001-STDAZ","Absence hrs","DEC",7,false,"hours","8"),
      field("P2001-KENN1","Subs.sick.ind.","DEC",2,false,"none","0"),
      field("P2001-DOCSY","Log. system","CHAR",10),
      field("P2001-DOCNR","Document number","NUMC",20)
    ];
    function tmpl(type,fields,desc,route,filename,nameSuffix,time){
      var marks={P2010:"AUS_it2010_OTwagetypes",P2001:"AUS- it 2001 absences 2027"};
      return {type:type,label:typeNames[type],fields:fields,route:route,
        fileNamePattern:"PU4030_{timestamp}_"+route+".txt",
        header:["HEADR","GVXADP","VIEWPOINT","13Australia (AU)","xxxx","xxxx","xxxx",marks[type],"20270101",time,"P","*","*","E","","","","",""],
        name:[type,"NAME",type,"Australia",nameSuffix],
        recordHint:desc,exportReady:true,verified:"reference-format-only"};
    }
    p.templates.P2010=tmpl("P2010",f2010,"Time wage types","AUADPI_HRMD01_TUSCSSL","","09:51:18");
    p.templates.P2001=tmpl("P2001",f2001,"Absences","AUADPF_HROM01_OUSCSSL","Leave","12:18:34");
    p.rules=[
      rule("Annual leave","P2001","1000",74,2,6,0,0,2,10,0,[5,5,6,6,7,7,10,11,8,7,5,6],"days",true),
      rule("Overtime ×1.5","P2010","2115",73,6,14,2,5,1,1,0,[7,7,7,8,7,7,6,6,9,9,11,12],"hours",true),
      rule("Overtime ×2","P2010","2120",62,3,9,1,3,1,1,0,[6,6,7,8,6,5,5,5,8,9,11,12],"hours",true),
      rule("Shift allowance","P2010","2200",58,2,6,0,0,1,1,90,[5,6,7,9,7,7,5,6,9,10,11,11],"money",true),
      rule("Shift premium 20%","P2010","2220",52,2,5,4,6,1,1,0,[5,6,7,9,7,7,5,6,9,10,11,11],"hours",true),
      rule("Shift premium 25%","P2010","2225",42,1,4,5,8,1,1,0,[5,6,7,9,7,7,5,6,9,10,11,11],"hours",true)
    ];
    return p;
  }
  function rule(label,infotype,code,share,min,max,qmin,qmax,dmin,dmax,amount,weights,mode,weekdays){
    return {id:uid(),label:label,infotype:infotype,code:code,share:share,countMin:min,countMax:max,quantityMin:qmin,quantityMax:qmax,durationMin:dmin,durationMax:dmax,amount:amount||0,weights:weights||[5,5,5,5,5,5,5,5,5,5,5,5],mode:mode||"hours",weekdays:!!weekdays,enabled:true};
  }
  function blankCountry(code,name,currency){
    return {id:code,code:code,name:name,currency:currency||"USD",system:"GVXADP",interface:"VIEWPOINT",client:"",systemCode:"",revision:1,templates:{},rules:[]};
  }
  function newTemplate(type,label){
    return {type:type,label:label||typeNames[type]||type,fields:[
      field("ZHRKEY-PERNR","Personnel Number","NUMC",8,true,"employee"),
      field("ZHRKEY-BEGDA","Start Date","DATS",8,true,"start"),
      field("ZHRKEY-ENDDA","End Date","DATS",8,true,"end")
    ],route:"",fileNamePattern:"{systemCode}_{timestamp}_{type}.txt",
      header:["HEADR","GVXADP","VIEWPOINT","","xxxx","xxxx","xxxx","","20270101","00:00:00","P","*","*","E","","","","",""],
      name:[type,"NAME",type,"",""],exportReady:false,verified:"unverified"};
  }
  function defaultWorkspace(){
    var country=auProfile();
    return {schema:1,settings:{device:uid(),editor:"Demo Analyst"},countries:{AU:country},projects:[],selectedProject:null,updatedAt:new Date().toISOString()};
  }
  function newProject(profile,name,year,employeeIds){
    return {id:uid(),name:name||profile.name+" "+year,profileId:profile.id,year:Number(year),employeeIds:Array.from(new Set((employeeIds||[]).map(function(x){return String(x).trim();}).filter(Boolean))),
      seed:Math.floor(Math.random()*1e9),revision:0,events:[],batches:[],annotations:[],activity:[],importHeaders:{},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  }
  function exampleEmployees(n){return Array.from({length:n||76},function(_,i){return pad(10001+i,8);});}
  function hashCode(str){var h=2166136261;for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function rngFor(seed){var a=hashCode(String(seed));return function(){a=(a+0x6D2B79F5)>>>0;var t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
  function randomBetween(r,min,max){min=Number(min)||0;max=Math.max(min,Number(max)||min);return min+Math.floor(r()*(max-min+1));}
  function pickMonth(r,weights){var w=(weights||[]).map(function(n){return Math.max(0,Number(n)||0);});var sum=w.reduce(function(a,b){return a+b;},0);if(!sum)return Math.floor(r()*12);var x=r()*sum;for(var i=0;i<12;i++){x-=w[i]||0;if(x<0)return i;}return 11;}
  function randomDay(r,year,month,weekdays){var days=new Date(Date.UTC(year,month+1,0)).getUTCDate();for(var j=0;j<80;j++){var day=randomBetween(r,1,days);var d=new Date(Date.UTC(year,month,day));if(!weekdays||(d.getUTCDay()!==0&&d.getUTCDay()!==6))return yyyyMMdd(d);}return yyyyMMdd(new Date(Date.UTC(year,month,1)));}
  function eventFromRule(project,profile,rule,employee,seed,ordinal){
    var template=profile.templates[rule.infotype];if(!template)return null;
    var r=rngFor(seed+"|"+employee+"|"+rule.id+"|"+ordinal);
    var month=pickMonth(r,rule.weights);
    var start=randomDay(r,project.year,month,rule.weekdays);
    var duration=Math.max(1,randomBetween(r,rule.durationMin,rule.durationMax));
    var end=rule.infotype==="P2001"?businessEnd(start,duration):start;
    if(end>String(project.year)+"1231")end=String(project.year)+"1231";
    var quantity=rule.mode==="money"?"0":String(randomBetween(r,rule.quantityMin,rule.quantityMax));
    if(rule.infotype==="P2001")quantity=String(Math.max(1,businessDays(start,end))*8);
    var amount=rule.mode==="money"?String(rule.amount||0):"0";
    var values={employee:employee,start:start,end:end,code:rule.code||"",hours:rule.infotype==="P2001"?quantity:"0",quantity:rule.infotype==="P2001"?"":quantity,
      unit:rule.mode==="hours"?"001":"",amount:amount,currency:profile.currency.padEnd(5," ")};
    var raw=template.fields.map(function(f){return values[f.role]!==undefined&&values[f.role]!==""?String(values[f.role]):String(f.defaultValue||"");});
    return {id:uid(),infotype:rule.infotype,employee:employee,start:start,end:end,code:rule.code,raw:raw,origin:"generated",ruleId:rule.id,sourceIndex:null,notes:"",revision:1,updatedAt:new Date().toISOString()};
  }
  function generate(project,profile,replaceDrafts){
    var retained=replaceDrafts?project.events.filter(function(e){return e.origin!=="generated"||e.locked;}):project.events.slice();
    var generated=[],skipped=0;
    var seen=new Set(retained.map(function(e){return e.infotype+"|"+e.employee+"|"+e.start+"|"+e.code;}));
    for(var ri=0;ri<profile.rules.length;ri++){
      var rule=profile.rules[ri];if(!rule.enabled||!profile.templates[rule.infotype])continue;
      for(var ei=0;ei<project.employeeIds.length;ei++){
        var employee=project.employeeIds[ei],r=rngFor(project.seed+"|"+employee+"|"+rule.id);
        if(r()*100>=Number(rule.share||0))continue;
        var times=randomBetween(r,rule.countMin,rule.countMax);
        for(var n=0;n<times;n++){
          var event=null,key="";
          for(var attempt=0;attempt<15;attempt++){
            event=eventFromRule(project,profile,rule,employee,project.seed+"|"+attempt,n);
            if(!event)break;key=event.infotype+"|"+event.employee+"|"+event.start+"|"+event.code;
            var overlap=event.infotype==="P2001" && retained.concat(generated).some(function(other){return other.infotype==="P2001"&&other.employee===employee&&other.start<=event.end&&other.end>=event.start;});
            if(!seen.has(key)&&!overlap)break;
            event=null;
          }
          if(!event){skipped++;continue;}
          generated.push(event);seen.add(key);
        }
      }
    }
    project.events=retained.concat(generated);
    return {added:generated.length,skipped:skipped,total:project.events.length};
  }
  function roleValue(event,template,role){var i=template.fields.findIndex(function(f){return f.role===role;});return i<0?"":String(event.raw[i]||"");}
  function parseTxt(bytes,filename){
    var arr=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
    if(arr.length<2||arr[0]!==255||arr[1]!==254)throw new Error("Expected UTF-16LE with BOM.");
    var text=new TextDecoder("utf-16le").decode(arr),lines=text.split("\r\n");
    if(lines[lines.length-1]==="")lines.pop();
    if(lines.length<7)throw new Error("The file is too short.");
    var parts=lines.map(function(l){return l.split("\t");}),h=parts[0],n=parts[1],c=parts[2],f=parts[3],sp=parts[4],tail=parts[parts.length-1];
    if(h[0]!=="HEADR"||n[1]!=="NAME"||c[1]!=="CTEXT"||f[1]!=="FIELD"||sp[1]!=="FSPEC"||tail[0]!=="TRAIL")throw new Error("Unsupported GlobalView TXT structure.");
    var type=f[0],rows=parts.slice(5,-1).map(function(row){if(row[0]!==type||row[1]!=="DATA")throw new Error("Unexpected record type.");if(row.length!==f.length)throw new Error("Column count does not match FIELD in a DATA row.");return row.slice(2);});
    if(tail[1]!==type+"-"+rows.length)throw new Error("TRAIL record count does not match the data.");
    return {type:type,filename:filename||"",header:h,name:n,ctext:c,field:f,fspec:sp,rows:rows,rawText:text};
  }
  function templateFromImport(parsed,base){
    var t=base?clone(base):newTemplate(parsed.type,parsed.type);
    t.fields=parsed.field.slice(2).map(function(n,i){
      var old=base&&base.fields.find(function(f){return f.name===n;});
      return old?clone(old):field(n,parsed.ctext[i+2]||n,"CHAR",30,parsed.fspec[i+2]==="R",
        /PERNR$/.test(n)?"employee":/BEGDA$/.test(n)?"start":/ENDDA$/.test(n)?"end":"none");
    });
    t.header=parsed.header;t.name=parsed.name;t.exportReady=true;t.verified=base?"reference-format-only":"imported-format";
    return t;
  }
  function importParsed(project,profile,parsed){
    var tmpl=profile.templates[parsed.type];
    if(tmpl&&tmpl.fields.map(function(f){return f.name;}).join("|")!==parsed.field.slice(2).join("|"))throw new Error("The "+parsed.type+" fields do not match this country's template.");
    if(!tmpl)profile.templates[parsed.type]=templateFromImport(parsed,null);
    var template=profile.templates[parsed.type];
    var roles=["employee","start","end","code"];
    var indices=roles.map(function(x){return template.fields.findIndex(function(f){return f.role===x;});});
    if(indices.slice(0,3).some(function(i){return i<0;}))throw new Error("Assign employee and date fields before importing.");
    var existing=new Set(project.events.filter(function(e){return e.infotype===parsed.type;}).map(function(e){return e.raw.join("\t");}));
    var added=0;
    parsed.rows.forEach(function(row,i){var key=row.join("\t");if(existing.has(key))return;existing.add(key);
      var emp=row[indices[0]],start=row[indices[1]],end=row[indices[2]],code=indices[3]<0?"":row[indices[3]];
      project.events.push({id:uid(),infotype:parsed.type,employee:emp,start:start,end:end,code:code,raw:row,origin:"imported",sourceFile:parsed.filename,
        sourceIndex:i,notes:"",revision:1,updatedAt:new Date().toISOString()});added++;
      if(!project.employeeIds.includes(emp))project.employeeIds.push(emp);
    });
    project.importHeaders[parsed.type]={header:parsed.header,name:parsed.name,ctext:parsed.ctext,field:parsed.field,fspec:parsed.fspec,sourceFile:parsed.filename};
    return added;
  }
  function dataLines(project,profile,type,events){
    var t=profile.templates[type];if(!t)throw new Error("No template configured for "+type);
    var h=project.importHeaders[type]||null;
    var header=h?h.header.slice():t.header.slice(),name=h?h.name.slice():t.name.slice(),ctext=h?h.ctext.slice():[type,"CTEXT"].concat(t.fields.map(function(f){return f.label;})),
      fieldLine=h?h.field.slice():[type,"FIELD"].concat(t.fields.map(function(f){return f.name;})),
      spec=h?h.fspec.slice():[type,"FSPEC"].concat(t.fields.map(function(f){return f.required?"R":"";}));
    if(!h&&header.length>8)header[8]=project.year+"0101";
    if(!h&&header.length>3)header[3]=profile.client||header[3];
    if(!h&&name.length>3)name[3]=profile.name;
    var arranged=events.slice().sort(function(a,b){if(a.sourceIndex!=null&&b.sourceIndex!=null&&a.sourceFile===b.sourceFile)return a.sourceIndex-b.sourceIndex;
      if(a.sourceIndex!=null&&b.sourceIndex==null)return -1;if(a.sourceIndex==null&&b.sourceIndex!=null)return 1;
      return a.employee.localeCompare(b.employee)||a.start.localeCompare(b.start)||a.code.localeCompare(b.code);});
    var lines=[header.join("\t"),name.join("\t"),ctext.join("\t"),fieldLine.join("\t"),spec.join("\t")];
    arranged.forEach(function(e){if(e.raw.length!==t.fields.length)throw new Error("Invalid field count in event "+e.id);lines.push([type,"DATA"].concat(e.raw).join("\t"));});
    lines.push("TRAIL\t"+type+"-"+arranged.length);
    return lines.join("\r\n")+"\r\n";
  }
  function utf16le(text){var out=new Uint8Array(2+text.length*2);out[0]=255;out[1]=254;for(var i=0;i<text.length;i++){var ch=text.charCodeAt(i);out[i*2+2]=ch&255;out[i*2+3]=ch>>8;}return out;}
  function generateTxt(project,profile,type,events){return utf16le(dataLines(project,profile,type,events));}
  function batchEvents(project,types,startMonth,endMonth){
    var tset=new Set(types),a=String(project.year)+pad(startMonth)+"01",b=String(project.year)+pad(endMonth)+pad(new Date(Date.UTC(project.year,endMonth,0)).getUTCDate());
    return project.events.filter(function(e){return tset.has(e.infotype)&&e.start>=a&&e.start<=b;});
  }
  function activeEvents(project,month){
    var a=String(project.year)+pad(month)+"01",b=String(project.year)+pad(month)+pad(new Date(Date.UTC(project.year,month,0)).getUTCDate());
    return project.events.filter(function(e){return e.start<=b&&e.end>=a;});
  }
  function validateEvent(event,profile,year){
    var template=profile.templates[event.infotype],errors=[],warnings=[];
    if(!template){errors.push("Unknown data type.");return {errors:errors,warnings:warnings};}
    if(event.raw.length!==template.fields.length){errors.push("Incorrect number of fields.");return {errors:errors,warnings:warnings};}
    template.fields.forEach(function(f,i){var val=String(event.raw[i]||"");
      if(f.required&&!val)errors.push(f.label+" is required.");
      if(f.length&&val.length>f.length)errors.push(f.label+" exceeds "+f.length+" characters.");
      if(f.type==="NUMC"&&val&&!/^\d+$/.test(val))errors.push(f.label+" must contain digits.");
      if(f.type==="DATS"&&val&&!dateFromSAP(val))errors.push(f.label+" is not a valid date.");
      if(f.type==="TIMS"&&val&&!/^\d{6}$/.test(val))errors.push(f.label+" requires HHMMSS.");
      if((f.type==="DEC"||f.type==="CURR")&&val&&!/^-?\d+(\.\d+)?$/.test(val))errors.push(f.label+" must be a number.");
      if(/[\t\r\n]/.test(val))errors.push(f.label+" contains an invalid separator.");
    });
    if(event.start&&event.end&&event.start>event.end)errors.push("End date precedes start date.");
    if(event.start&&event.start.slice(0,4)!==String(year))warnings.push("Event begins outside the planning year.");
    return {errors:errors,warnings:warnings};
  }
  function validateProject(project,profile){
    var findings=[];var byEmp={};
    project.events.forEach(function(e){
      var result=validateEvent(e,profile,project.year);result.errors.forEach(function(s){findings.push({severity:"error",eventId:e.id,message:s});});
      result.warnings.forEach(function(s){findings.push({severity:"warning",eventId:e.id,message:s});});
      if(e.infotype==="P2001"){(byEmp[e.employee]||(byEmp[e.employee]=[])).push(e);}
    });
    Object.keys(byEmp).forEach(function(k){var arr=byEmp[k].sort(function(a,b){return a.start.localeCompare(b.start);});
      for(var i=1;i<arr.length;i++){if(arr[i].start<=arr[i-1].end)findings.push({severity:"warning",eventId:arr[i].id,message:"Potential overlapping absences."});}
    });
    return findings;
  }
  function monthlySeries(project){
    return MONTHS.map(function(label,index){var m=index+1;
      var starts=project.events.filter(function(e){return e.start.slice(0,6)===String(project.year)+pad(m);});
      var ongoing=activeEvents(project,m).filter(function(e){return e.infotype==="P2001"&&e.start.slice(0,6)!==String(project.year)+pad(m);}).length;
      var breakdown={};starts.forEach(function(e){breakdown[e.infotype]=(breakdown[e.infotype]||0)+1;});
      return {month:m,label:label,total:starts.length,byType:breakdown,ongoing:ongoing};});
  }
  function makeFilename(profile,type,time){
    var t=profile.templates[type],d=time||new Date();
    var timestamp=d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+pad(d.getHours())+pad(d.getMinutes())+pad(d.getSeconds());
    return (t.fileNamePattern||"{systemCode}_{timestamp}_{type}.txt").replace(/\{(systemCode|timestamp|type|country)\}/g,function(_,key){
      return {systemCode:profile.systemCode||"GV",timestamp:timestamp,type:type,country:profile.code}[key];
    }).replace(/[\/\\:*?"<>|]/g,"_");
  }
  var crcTable=null;
  function crc32(data){if(!crcTable){crcTable=Array.from({length:256},function(_,i){var c=i;for(var k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});}
    var c=0xffffffff;for(var i=0;i<data.length;i++)c=crcTable[(c^data[i])&255]^(c>>>8);return (c^0xffffffff)>>>0;}
  function zipFiles(files){
    var parts=[],central=[],offset=0,enc=new TextEncoder();
    function push16(view,at,n){view.setUint16(at,n,true);}function push32(view,at,n){view.setUint32(at,n>>>0,true);}
    files.forEach(function(file){
      var name=enc.encode(file.name),data=file.data instanceof Uint8Array?file.data:new Uint8Array(file.data),crc=crc32(data);
      var local=new Uint8Array(30+name.length),v=new DataView(local.buffer);
      push32(v,0,0x04034b50);push16(v,4,20);push16(v,6,0x0800);push16(v,8,0);push32(v,14,crc);push32(v,18,data.length);push32(v,22,data.length);push16(v,26,name.length);local.set(name,30);
      parts.push(local,data);
      var cent=new Uint8Array(46+name.length),cv=new DataView(cent.buffer);
      push32(cv,0,0x02014b50);push16(cv,4,20);push16(cv,6,20);push16(cv,8,0x0800);push32(cv,16,crc);
      push32(cv,20,data.length);push32(cv,24,data.length);push16(cv,28,name.length);push32(cv,42,offset);cent.set(name,46);
      central.push(cent);offset+=local.length+data.length;
    });
    var dirBytes=central.reduce(function(s,a){return s+a.length;},0),footer=new Uint8Array(22),end=new DataView(footer.buffer);
    push32(end,0,0x06054b50);push16(end,8,files.length);push16(end,10,files.length);push32(end,12,dirBytes);push32(end,16,offset);
    var total=offset+dirBytes+22,out=new Uint8Array(total),pos=0;
    parts.concat(central,[footer]).forEach(function(a){out.set(a,pos);pos+=a.length;});return out;
  }
  return {MONTHS:MONTHS,ROLES:ROLES,typeNames:typeNames,clone:clone,uid:uid,pad:pad,yyyyMMdd:yyyyMMdd,isoDate:isoDate,fromISO:fromISO,
    field:field,rule:rule,auProfile:auProfile,blankCountry:blankCountry,newTemplate:newTemplate,defaultWorkspace:defaultWorkspace,newProject:newProject,
    exampleEmployees:exampleEmployees,generate:generate,parseTxt:parseTxt,templateFromImport:templateFromImport,importParsed:importParsed,roleValue:roleValue,
    dataLines:dataLines,utf16le:utf16le,generateTxt:generateTxt,batchEvents:batchEvents,activeEvents:activeEvents,validateEvent:validateEvent,
    validateProject:validateProject,monthlySeries:monthlySeries,makeFilename:makeFilename,zipFiles:zipFiles,crc32:crc32};
});