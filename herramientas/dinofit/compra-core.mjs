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

export const PURCHASE_REMINDER_TIME='11:30';
const purchaseId=/^[A-Za-z0-9_-]{1,80}$/;
const assetHosts=new Set(['prod-mercadona.imgix.net']);
export function cleanPurchaseImage(value){
 if(typeof value!=='string'||value.length>1024)return '';
 let image;try{image=new URL(value);}catch{return '';}
 if(image.protocol!=='https:'||image.port||image.username||image.password||image.hash||!assetHosts.has(image.hostname)||
 !/^\/images\/[a-z0-9_-]+\.(?:png|webp|jpe?g)$/i.test(image.pathname))return '';
 image.search='';
 image.searchParams.set('fm','jpg');
 image.searchParams.set('fit','crop');
 image.searchParams.set('w','160');
 image.searchParams.set('h','160');
 return image.href;
}
export function cleanPurchaseItem(item){
 const name=typeof item?.name==='string'?item.name.trim():'';
 if(!name||name.length>100||!Number.isInteger(item.qty)||item.qty<1||item.qty>999||
 (item.cents!=null&&(!Number.isInteger(item.cents)||item.cents<0||item.cents>100000)))return null;
 const inventory=item.inventory;
 return {...(typeof item.id==='string'&&purchaseId.test(item.id)?{id:item.id}:{}),name,...(/^[A-Za-z0-9_-]{1,80}$/.test(String(item.productId||''))?{productId:String(item.productId)}:{}),pack:typeof item.pack==='string'?item.pack.trim().slice(0,60):'',qty:item.qty,cents:item.cents??null,
  ...(cleanPurchaseImage(item.imageUrl)?{imageUrl:cleanPurchaseImage(item.imageUrl)}:{}),
  ...(/^[a-z0-9-]{1,80}$/.test(inventory?.foodId||'')&&typeof inventory.qty==='number'&&Number.isFinite(inventory.qty)&&inventory.qty>0&&inventory.qty<=100000?{
    inventory:{foodId:inventory.foodId,qty:inventory.qty,...Object.fromEntries(['pieces','grams']
     .filter(key=>typeof inventory[key]==='number'&&Number.isFinite(inventory[key])&&inventory[key]>0&&inventory[key]<=100000)
     .map(key=>[key,inventory[key]]))}
  }:{})};
}
export function cleanPurchaseOrder(raw){
 if(!raw||!purchaseId.test(raw.id||'')||typeof raw.id!=='string'||![raw.orderDate,raw.coverStart,raw.coverEnd].every(validShopDate)||
 raw.coverEnd<=raw.coverStart||(raw.deliveryDate!=null&&(!validShopDate(raw.deliveryDate)||raw.deliveryDate<raw.orderDate))||
 (raw.reminderDate!=null&&!validShopDate(raw.reminderDate))||!Array.isArray(raw.items)||raw.items.length<1||raw.items.length>100)return null;
 const items=raw.items.map(cleanPurchaseItem);
 if(items.some(x=>!x))return null;
 return {id:raw.id,orderDate:raw.orderDate,deliveryDate:raw.deliveryDate??null,coverStart:raw.coverStart,coverEnd:raw.coverEnd,
  reminderDate:raw.reminderDate??null,purchased:raw.purchased===true,inventoryReceived:raw.inventoryReceived===true&&raw.purchased===true,items,
  ...(Number.isSafeInteger(raw.totalCents)&&raw.totalCents>=0?{totalCents:raw.totalCents}:{}),
  ...(Number.isSafeInteger(raw.feesCents)&&raw.feesCents>=0?{feesCents:raw.feesCents}:{}),
  ...(raw.inventoryReceived===true&&typeof raw.inventoryReceivedAt==='string'&&Number.isFinite(Date.parse(raw.inventoryReceivedAt))?{inventoryReceivedAt:new Date(raw.inventoryReceivedAt).toISOString()}:{})};
}
export function cleanPurchaseOrders(raw){
 const result=[], seen=new Set();
 for(const item of Array.isArray(raw)?raw:[]){
  const order=cleanPurchaseOrder(item);
  if(!order||seen.has(order.id))continue;
  seen.add(order.id);result.push(order);
 }
 return result;
}
export function usualPurchase(orders){
 return cleanPurchaseOrders(orders).filter(x=>x.purchased).sort((a,b)=>b.orderDate.localeCompare(a.orderDate))[0]||null;
}
export function purchaseEstimate(items){
 return items.reduce((s,x)=>({cents:s.cents+(x.cents==null?0:x.cents*x.qty),unknown:s.unknown+Number(x.cents==null)}),{cents:0,unknown:0});
}
export function duePurchaseOrders(raw,now=Date.now()){
 const orders=cleanPurchaseOrders(raw),today=shopLocalDate(now);
 return orders.filter(o=>!o.purchased&&o.reminderDate===today).map(o=>({...o,when:madridTime(o.reminderDate,PURCHASE_REMINDER_TIME)}))
  .filter(o=>o.when!==null&&o.when<=now&&now-o.when<12*3600000);
}
