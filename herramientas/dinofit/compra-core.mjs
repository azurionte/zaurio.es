export const SHOP_TZ='Europe/Madrid';
const dayMs=86400000;
const dayKey=/^\d{4}-\d{2}-\d{2}$/;
const clockKey=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
export function validShopDate(d){
 if(typeof d!=='string'||!dayKey.test(d)||d<'2000-01-01'||d>'2099-12-31')return false;
 const t=Date.parse(d+'T00:00:00Z');
 return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===d;
}
export function addShopDays(d,n){return new Date(Date.parse(d+'T00:00:00Z')+n*dayMs).toISOString().slice(0,10)}
function distance(a,b){return (Date.parse(a)-Date.parse(b))/dayMs}
const civil=new Intl.DateTimeFormat('en-CA',{timeZone:SHOP_TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function parts(t){return Object.fromEntries(civil.formatToParts(t).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]))}
export function shopLocalDate(t=Date.now()){const p=parts(t);return p.year+'-'+p.month+'-'+p.day}
export function madridTime(date,time){
 if(!validShopDate(date)||typeof time!=='string'||!clockKey.test(time))return null;
 const want=date+'T'+time,start=Date.parse(want+'Z');
 // Pick the first occurrence on a fall-back day. Move a skipped spring time
 // to the next real wall-clock minute rather than dropping the reminder.
 for(const h of [2,1]){const t=start-h*3600000,p=parts(t);if(p.year+'-'+p.month+'-'+p.day+'T'+p.hour+':'+p.minute===want)return t}
 for(let i=1;i<=60;i++){const t=start-7200000+i*60000,p=parts(t);if(p.year+'-'+p.month+'-'+p.day+'T'+p.hour+':'+p.minute>want)return t}
 return null;
}
export function cleanShopPlan(p){
 if(!p||![p.coverStart,p.orderDate,p.deliveryDate].every(validShopDate))return null;
 const weeks=Number(p.weeks),cadence=Number(p.cadence),lead=Number(p.lead);
 if(!Number.isInteger(weeks)||weeks<1||weeks>8||!Number.isInteger(cadence)||cadence<1||cadence>8||cadence<weeks||
 !Number.isInteger(lead)||lead<0||lead>21||typeof p.time!=='string'||!clockKey.test(p.time)||
 p.orderDate>p.deliveryDate||Math.abs(distance(p.coverStart,p.orderDate))>60||Math.abs(distance(p.deliveryDate,p.coverStart))>60)return null;
 const changes={};
 for(const [d,v] of Object.entries(p.changes||{}).slice(0,120)){
  if(!validShopDate(d)||!v||typeof v!=='object')continue;
  if([v.order,v.delivery].every(validShopDate)&&v.order<=v.delivery&&Math.abs(distance(d,v.order))<=60&&Math.abs(distance(d,v.delivery))<=60)
   changes[d]={order:v.order,delivery:v.delivery,skip:v.skip===true,...(validShopDate(v.remind)&&v.remind<=v.order&&distance(v.order,v.remind)<=21?{remind:v.remind}:{})};
 }
 return {coverStart:p.coverStart,orderDate:p.orderDate,deliveryDate:p.deliveryDate,weeks,cadence,lead,time:p.time,enabled:p.enabled===true,changes};
}
export function shopOccurrence(p,index){
 if(!Number.isSafeInteger(index)||index<0||index>5300)return null;
 const shift=index*p.cadence*7,start=addShopDays(p.coverStart,shift),custom=p.changes[start];
 const order=custom?.order||addShopDays(p.orderDate,shift), delivery=custom?.delivery||addShopDays(p.deliveryDate,shift);
 const remind=custom?.remind||addShopDays(order,-p.lead);
 return {index,start,end:addShopDays(start,p.weeks*7),order,delivery,remind,skip:custom?.skip===true,custom:!!custom};
}
export function shopUpcoming(p,now=Date.now(),count=4){
 const first=Math.max(0,Math.floor(distance(shopLocalDate(now),p.coverStart)/(p.cadence*7)));
 return Array.from({length:count},(_,j)=>shopOccurrence(p,first+j)).filter(Boolean);
}
export function dueShopOccurrences(raw,now=Date.now()){
 const p=cleanShopPlan(raw);if(!p?.enabled)return [];
 const center=Math.floor(distance(shopLocalDate(now),p.coverStart)/(p.cadence*7));
 const first=Math.max(0,center-13),last=Math.min(5300,center+13),due=[];
 for(let i=first;i<=last;i++){
  const item=shopOccurrence(p,i);
  if(item.skip)continue;
  const when=madridTime(item.remind,p.time);
  if(when!==null&&when<=now&&now-when<12*3600000)due.push({...item,when});
 }
 return due;
}
