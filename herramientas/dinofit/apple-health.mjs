const SUPABASE_URL='https://adpjitccwwvlydrtvvqk.supabase.co';
const SUPABASE_KEY='sb_publishable_D8CL0HI8vLfD5L3g5ZgUGg_HOM6Ixdk';
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
export async function receiveAppleWorkouts(req){
 const j=(status,body)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(status===405?{Allow:'POST'}:{})}});
 if(req.method!=='POST')return j(405,{ok:false});
 const match=/^Bearer ([0-9a-f]{64})$/.exec(req.headers.get('authorization')||'');
 if(!match)return j(401,{ok:false});
 if(!/^application\/json(?:;|$)/i.test(req.headers.get('content-type')||''))return j(415,{ok:false});
 const rd=req.body?.getReader();if(!rd)return j(400,{ok:false});
 let size=0;const parts=[];
 try{
  while(true){const {done,value}=await rd.read();if(done)break;size+=value.byteLength;if(size>262144){await rd.cancel();return j(413,{ok:false});}parts.push(value);}
  const bytes=new Uint8Array(size); let offset=0; for(const p of parts){bytes.set(p,offset);offset+=p.byteLength;}
  let items;
  try{items=decode(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));}catch{return j(422,{ok:false});}
  const upstream=await fetch(SUPABASE_URL+'/rest/v1/rpc/dinofit_apple_ingest',{
   method:'POST',redirect:'manual',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json','X-Dinofit-Upload-Key':match[1]},
   body:JSON.stringify({items}),signal:AbortSignal.timeout(12000)
  });
  if(!upstream.ok)return j([400,401,413,422].includes(upstream.status)?upstream.status:502,{ok:false});
  const data=await upstream.json();
  return data?.ok===true?j(200,{ok:true,received:data.received}):j(502,{ok:false});
 }catch{return j(502,{ok:false});}
}
