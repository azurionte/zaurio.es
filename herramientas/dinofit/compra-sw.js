'use strict';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
 let data={};try{data=event.data?.json()||{}}catch{}
 const body=typeof data.body==='string'?data.body.slice(0,150):'Revisa tu lista de la compra.';
 event.waitUntil(self.registration.showNotification('DinoFit · Compra',{body,icon:'/dinofit/compra-icon.svg'}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil((async()=>{
  const destination=new URL('/dinofit/#compra',self.location.origin).href;
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const tab=windows.find(w=>new URL(w.url).pathname.match(/^\/dinofit\/?$/));
  if(tab){await tab.navigate(destination);return tab.focus()}
  return self.clients.openWindow(destination);
 })());
});
