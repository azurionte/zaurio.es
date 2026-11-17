"use strict";
// Browser E2E for the country-first GlobalView experience.
// Uses Node's native WebSocket + Chrome DevTools Protocol. No npm dependency.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const {pathToFileURL}=require("node:url");
const {spawn,spawnSync}=require("node:child_process");

const app=path.resolve(__dirname,"index.html");
const screenshotDir=path.resolve(process.env.GV_SCREENSHOT_DIR||path.join(os.tmpdir(),"gv-browser-smoke"));
fs.mkdirSync(screenshotDir,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),"gv-chrome-"));
function which(name){const r=spawnSync("which",[name],{encoding:"utf8"});return r.status===0?r.stdout.trim():"";}
const binary=["google-chrome","google-chrome-stable","chromium","chromium-browser"].map(which).find(Boolean);
assert.ok(binary,"Chrome or Chromium binary is required for UI smoke test.");
const browser=spawn(binary,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
 "--allow-file-access-from-files","--no-first-run","--no-default-browser-check",
 "--remote-debugging-port=0","--window-size=1440,1000","--user-data-dir="+profile,"about:blank"],{stdio:"ignore"});
let ws,serial=0;const pending=new Map();
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,desc,timeout=25000){
 const start=Date.now();
 while(Date.now()-start<timeout){try{const val=await fn();if(val)return val;}catch(e){if(Date.now()-start+250>=timeout)throw e;}await pause(220);}
 throw Error("Timed out waiting for "+desc);
}
function send(method,params={}){
 const id=++serial;
 return new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{pending.delete(id);reject(Error("CDP timeout: "+method));},15000);
   pending.set(id,{resolve(result){clearTimeout(timer);resolve(result);},reject(e){clearTimeout(timer);reject(e);}});
   ws.send(JSON.stringify({id,method,params}));
 });
}
async function evalJS(expression){
 const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error("Browser JavaScript: "+(r.exceptionDetails.exception?.description||r.exceptionDetails.text));
 return r.result?.value;
}
async function click(selector){
 const selectorString=JSON.stringify(selector);
 const result=await evalJS("(()=>{const el=document.querySelector("+selectorString+");if(!el)return 'missing';if(el.disabled)return 'disabled';el.click();return 'clicked';})()");
 assert.equal(result,"clicked","Could not click "+selector);
}
async function screenshot(name){
 const response=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:true});
 const dest=path.join(screenshotDir,name+".png");
 fs.writeFileSync(dest,Buffer.from(response.data,"base64"));
 console.log("Screenshot:",dest,fs.statSync(dest).size,"bytes");
}
async function main(){
 await until(async()=>{
   const f=path.join(profile,"DevToolsActivePort");
   return fs.existsSync(f)?fs.readFileSync(f,"utf8").split("\n")[0]:null;
 },"Chrome debugging port");
 const port=fs.readFileSync(path.join(profile,"DevToolsActivePort"),"utf8").split("\n")[0];
 const targets=await (await fetch("http://127.0.0.1:"+port+"/json/list")).json();
 const target=targets.find(t=>t.type==="page");assert.ok(target,"No Chrome page target.");
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true});});
 ws.addEventListener("message",event=>{
   const msg=JSON.parse(event.data),task=pending.get(msg.id);
   if(task){pending.delete(msg.id);if(msg.error)task.reject(Error(msg.error.message));else task.resolve(msg.result);}
 });
 await send("Page.enable");await send("Runtime.enable");
 await send("Page.navigate",{url:pathToFileURL(app).href});
 await until(async()=>await evalJS("document.readyState==='complete' && window.GVGuided && window.GVBridge && document.querySelectorAll('[data-guide=\"select-country\"]').length===10"),
   "ten country cards");
 assert.equal(await evalJS("window.GVBridge.UI.page"),"dashboard","Start on country board.");
 assert.equal(await evalJS("document.querySelectorAll('.nav-btn, .side').length"),0,"No duplicate sidebar navigation.");
 assert.equal(await evalJS("document.querySelector('.country-card:has([data-guide=\"select-country\"][data-code=\"AU\"])').innerText.includes('0%')"),true,
   "Australia begins at zero completion.");
 await screenshot("01-country-board");
 await click('[data-guide="select-country"][data-code="AU"]');
 assert.equal(await evalJS("window.GVBridge.current().employeeIds.length"),0,"New country-year plan starts empty.");
 assert.equal(await evalJS("window.GVWorkflow.preparation(window.GVBridge.current(),window.GVBridge.country(),window.GVCore.validateProject).percent"),0);
 await click('[data-guide="confirm-setup"]');
 await click('[data-guide="example-roster"]');
 assert.equal(await evalJS("window.GVBridge.current().employeeIds.length"),76);
 await click('[data-guide="confirm-patterns"]');
 await screenshot("02-country-preparation");
 await click('[data-guide="sim-shuffle"]');
 await click('[data-guide="sim-apply"]');
 assert.equal(await evalJS("!!window.GVBridge.current().scenarios.P2010"),true,"Simulation settings saved per project.");
 await click('[data-guide="confirm-patterns"]');
 await click('[data-guide="generate"]');
 await until(async()=>await evalJS("document.querySelector('.modal-foot button')?.textContent==='Cancel'"),"generation confirmation");
 await click(".modal-foot button:last-child");
 await until(async()=>await evalJS("window.GVBridge.current().events.length>100"),"events generated");
 await screenshot("03-year-chart");
 await click('[data-guide="approve-plan"]');
 assert.equal(await evalJS("window.GVWorkflow.preparation(window.GVBridge.current(),window.GVBridge.country(),window.GVCore.validateProject).percent"),100,
   "Preparation should reach 100% after explicit approval.");
 await click('[data-guide="import"]');
 assert.equal(await evalJS("window.GVWorkflow.importing(window.GVBridge.current(),window.GVBridge.country()).percent"),0,
   "Import remains zero until confirmed.");
 assert.equal(await evalJS("document.querySelector('[data-action=\"download-bundle\"]')!==null"),true,
   "Export action must be available after approval.");
 await screenshot("04-import-not-started");
 await send("Page.setDownloadBehavior",{behavior:"allow",downloadPath:screenshotDir});
 await click('[data-action="download-bundle"]');
 await until(async()=>await evalJS("window.GVBridge.current().batches.length===1"),"TXT batch recorded");
 assert.equal(await evalJS("window.GVBridge.current().batches[0].status"),"downloaded");
 assert.equal(await evalJS("window.GVWorkflow.importing(window.GVBridge.current(),window.GVBridge.country()).percent"),0,
   "A download must NOT count as imported.");
 await click('[data-action="confirm-upload"]');
 await until(async()=>await evalJS("document.querySelector('.modal-foot button:last-child')?.textContent==='Mark uploaded'"),"manual import confirmation");
 await click(".modal-foot button:last-child");
 const imported=await evalJS("window.GVWorkflow.importing(window.GVBridge.current(),window.GVBridge.country()).percent");
 assert.ok(imported>0&&imported<100,"Confirmed months should advance progress.");
 await screenshot("05-import-confirmed");
 await send("Page.reload",{ignoreCache:true});
 await until(async()=>await evalJS("window.GVGuided && window.GVBridge?.UI.page==='dashboard' && (()=>{const b=window.GVBridge,p=b.W.projects.find(x=>x.profileId==='AU' && x.year===2027);return p && window.GVWorkflow.preparation(p,b.W.countries.AU,window.GVCore.validateProject).percent===100 && !!document.querySelector('.country-card:has([data-code=\\\"AU\\\"]) .mini-progress.complete');})()"),
   "dashboard progress restored after relaunch");
 await screenshot("06-country-board-restored");
 await click('[data-guide="select-country"][data-code="DE"]');
 assert.equal(await evalJS("window.GVWorkflow.preparation(window.GVBridge.current(),window.GVBridge.country(),window.GVCore.validateProject).percent"),0);
 assert.equal(await evalJS("document.querySelector('[data-guide=\"confirm-setup\"]')?.disabled"),true,
   "Unconfigured country must not be export-ready.");
 await screenshot("07-empty-country-setup");
 console.log("PASS: country-first UI, live simulator, 0→100 preparation, monthly import milestones, ZIP action, restart persistence and blank-country setup");
}
main().then(()=>{try{ws?.close();}catch(_){}browser.kill("SIGTERM");process.exit(0);}).catch(err=>{
 console.error("UI SMOKE FAILED:",err.stack||err);
 try{ws?.close();}catch(_){}browser.kill("SIGTERM");process.exit(1);
});