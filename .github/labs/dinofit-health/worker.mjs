import {createHash,timingSafeEqual} from 'node:crypto';
function decode(payload){
 let arr=payload?.data?.workouts;
 if(!Array.isArray(arr)||arr.length>200)throw Error('Invalid workouts');
 const clean=[];
 for(const w of arr){
  if(!w||typeof w.id!=='string'||!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(w.id)||typeof w.name!=='string'||!w.name.trim()||w.name.length>100||typeof w.duration!=='number'||!Number.isFinite(w.duration)||w.duration<=0||w.duration>86400)throw Error('Invalid workout');
  const a=w.activeEnergyBurned;
  if(a!=null&&(a.units!=='kcal'||typeof a.qty!=='number'||!Number.isFinite(a.qty)||a.qty<0||a.qty>20000))throw Error('Invalid active energy');
  const match=/^(\d{4}-\d\d-\d\d) (\d\d):(\d\d):(\d\d)(?:[\s\u00a0\u202f]+(AM|PM))? ([+-]\d\d)(\d\d)$/i.exec(w.start);
  if(!match)throw Error('Invalid start');
  const [,day,h,m,sec,ampm,offset,mins]=match;
  let hour=+h;
  if(+m>59||+sec>59||+mins>59||Math.abs(+offset)>14|| (ampm ? (hour<1||hour>12) : hour>23))throw Error('Invalid time');
  if(ampm)hour=hour%12+(ampm.toUpperCase()==='PM'?12:0);
  const clock=String(hour).padStart(2,'0')+':'+m+':'+sec;
  const dateCheck=new Date(day+'T00:00:00Z');
  if(!Number.isFinite(+dateCheck)||dateCheck.toISOString().slice(0,10)!==day)throw Error('Invalid day');
  const start=new Date(day+'T'+clock+offset+':'+mins).toISOString();
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(start));
  const madrid=['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');
  clean.push({source:'apple_health',externalId:w.id.toLowerCase(),date:madrid,start,type:w.name.trim(),minutes:w.duration/60,activeKcal:a?.qty??null});
 }
 return clean;
}
const FIXTURE={"data":{"workouts":[{"id":"01010101-0101-0101-0101-010101010101","name":"Synthetic Walk","start":"2026-11-24 23:30:00 +0000","duration":900,"activeEnergyBurned":{"qty":51.25,"units":"kcal"}}]}};
export default {async fetch(req,env){
 const j=(status,body)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
 const url=new URL(req.url);
 if(url.pathname!=='/apple-health')return j(404,{ok:false});
 if(req.method!=='POST')return j(405,{ok:false});
 if(!/^[0-9a-f]{64}$/.test(env.LAB_AUTH_HASH||''))return j(503,{ok:false});
 const auth=req.headers.get('authorization')||'';
 if(auth.length!==71 || !timingSafeEqual(createHash('sha256').update(auth).digest(),Buffer.from(env.LAB_AUTH_HASH,'hex')))return j(401,{ok:false});
 if(!/^application\/json(?:;|$)/i.test(req.headers.get('content-type')||''))return j(415,{ok:false});
 const rd=req.body?.getReader();if(!rd)return j(422,{ok:false});
 let size=0, parts=[];
 while(true){const {done,value}=await rd.read();if(done)break;size+=value.byteLength;if(size>2048){await rd.cancel();return j(413,{ok:false});}parts.push(Buffer.from(value));}
 try{
 const data=JSON.parse(Buffer.concat(parts).toString('utf8'));
 if(JSON.stringify(data)!==JSON.stringify(FIXTURE))return j(422,{ok:false});
 const [item]=decode(data);
 return j(200,{ok:true,synthetic:true,activeKcal:item.activeKcal,madridDate:item.date,stored:false});
 }catch{return j(400,{ok:false});}
}};