import page from './index.html';
import css from './app.css';
import core from './app.js';
import ui from './app-ui.js';
import events from './app-events.js';
const staticFiles = new Map([
 ['/dinofit/',{body:page,type:'text/html; charset=utf-8'}],
 ['/dinofit/index.html',{body:page,type:'text/html; charset=utf-8'}],
 ['/dinofit/app.css',{body:css,type:'text/css; charset=utf-8'}],
 ['/dinofit/app.js',{body:core,type:'application/javascript; charset=utf-8'}],
 ['/dinofit/app-ui.js',{body:ui,type:'application/javascript; charset=utf-8'}],
 ['/dinofit/app-events.js',{body:events,type:'application/javascript; charset=utf-8'}]
]);
export default {
 async fetch(request){
  const url = new URL(request.url);
  if(url.pathname==='/dinofit')return Response.redirect(url.origin+'/dinofit/'+url.search,308);
  if(!['GET','HEAD'].includes(request.method))return new Response('Método no permitido',{status:405,headers:{Allow:'GET, HEAD'}});
  const file=staticFiles.get(url.pathname);
  if(!file)return new Response('No encontrado',{status:404});
  const isPage=file.type.startsWith('text/html');
  const headers={
   'Content-Type':file.type,
   'Cache-Control':'no-store',
   'X-Content-Type-Options':'nosniff',
   'Referrer-Policy':'strict-origin-when-cross-origin',
   'X-Frame-Options':'DENY'
  };
  if(isPage)headers['Content-Security-Policy']="default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; connect-src https://adpjitccwwvlydrtvvqk.supabase.co wss://adpjitccwwvlydrtvvqk.supabase.co; img-src 'self' data: https://*.googleusercontent.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
  return new Response(request.method==='HEAD'?null:file.body,{headers});
 }
};
