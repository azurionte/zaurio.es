const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const server=http.createServer((req,res)=>{
 const requested=new URL(req.url,'http://127.0.0.1').pathname;
 const name=requested==='/dinofit/'?'index.html':requested.replace('/dinofit/','');
 if(!['index.html','app.css','app.js','app-ui.js','app-events.js'].includes(name)){res.writeHead(404);return res.end('not found')}
 const bytes=fs.readFileSync(path.join(root,name));res.writeHead(200,{'Content-Type':types[path.extname(name)]+';charset=utf-8'});res.end(bytes);
});
function listen(){return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port)))}
async function main(){
 const port=await listen();const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const dir=path.join(__dirname,'visual');fs.mkdirSync(dir,{recursive:true});
 try{
 for(const [name,width,height] of [['desktop',1366,850],['iphone',390,844]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/cdn.jsdelivr.net/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:"window.supabase={createClient:()=>({auth:{onAuthStateChange(){},getSession:async()=>({data:{session:null},error:null})}})};"}));
  await page.goto('http://127.0.0.1:'+port+'/dinofit/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
   state=defaultDocument({user_metadata:{full_name:'Persona de pruebas'}});
   state.weights=[109.0,108.4,108.1,107.7,107.9,107.4,107.1,106.8].map((w,i)=>({
    id:'synthetic-'+i,date:addDays('2026-04-11',i),weight:w,bodyFat:33.5-i*.2,
    bmi:40-i*.1,skeletalMuscle:30+i*.1,muscleMass:54+i*.06,
    protein:12.5+i*.07,bmr:1850-i*2,fatFreeMass:72+i*.1,subcutaneousFat:34-i*.12,
    visceralFat:24-i*.2,bodyWater:38.5+i*.2,boneMass:3.25
   }));
   state.profile.targetWeight=85;state.trackingStartDate='2026-04-11';
   selectedDate='2026-04-18';account={id:'synthetic',user_metadata:{}};
   document.querySelector('#authGate').hidden=true;
   document.querySelector('#privatePage').hidden=false;
   document.querySelector('#identityName').textContent='Prueba';
   render();
  });
  const screenshot=path.join(dir,name+'-weight.png');
  await page.screenshot({path:screenshot,fullPage:true});
  const measure=()=>page.evaluate(()=>({
    horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
    selectedTab:document.querySelector('.dashboard-tab.selected')?.dataset.tab,
    tabs:document.querySelectorAll('.dashboard-tab').length,
    charts:document.querySelectorAll('svg.chart-svg').length,
    mainWidth:document.querySelector('.main').getBoundingClientRect().width,
    saveText:document.querySelector('#saveStatus').textContent
  }));
  let measured=await measure();
  assert.equal(measured.tabs,4,'four sections');
  assert.equal(measured.selectedTab,'weight','weight selected by default');
  assert.ok(measured.charts>=1,'weight chart visible');
  assert.ok(measured.horizontalOverflow<=3,'weight horizontal overflow: '+JSON.stringify(measured));
  await page.locator('[data-action=forecast-mode][data-mode=active]').click();
  assert.equal(await page.locator('[data-action=forecast-mode][data-mode=active]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-action=dashboard-tab][data-tab=composition]').click();
  measured=await measure();
  assert.equal(measured.selectedTab,'composition');
  assert.equal(await page.locator('.composition-key').count(),15,'interactive body composition legend');
  assert.ok(measured.horizontalOverflow<=3,'composition horizontal overflow');
  await page.screenshot({path:path.join(dir,name+'-composition.png'),fullPage:true});
  await page.locator('[data-action=composition-metric][data-id=fatKg]').click();
  assert.equal(await page.locator('[data-action=composition-metric][data-id=fatKg]').getAttribute('aria-pressed'),'true');
  assert.ok((await page.locator('#dashboard-panel').innerText()).includes('Vista individual: Grasa calculada'));
  await page.locator('[data-action=composition-all]').click();
  assert.ok((await page.locator('#dashboard-panel').innerText()).includes('Vista comparativa'));
  await page.locator('[data-action=dashboard-tab][data-tab=goal]').click();
  assert.ok((await page.locator('#dashboard-panel').innerText()).includes('Tu camino hasta'));
  await page.locator('[data-action=add-activity]').click();
  assert.ok(await page.locator('#activityForm').isVisible());
  await page.locator('[data-action=close-modal]').first().click();
  await page.screenshot({path:path.join(dir,name+'-goal.png'),fullPage:true});
  await page.locator('[data-action=dashboard-tab][data-tab=nutrition]').click();
  assert.equal(await page.locator('.food-button').count(),14,'14 shortcuts available in nutrition tab');
  measured=await measure();
  assert.ok(measured.horizontalOverflow<=3,'nutrition horizontal overflow');
  await page.screenshot({path:path.join(dir,name+'-nutrition.png'),fullPage:true});
  await page.locator('[data-action=add-food]').first().click();
  assert.ok(await page.locator('#foodForm').isVisible());
  await page.locator('[data-action=close-modal]').first().click();
  await page.locator('[data-action=date-prev]').click();
  assert.match(await page.locator('#content h1').innerText(),/17 abr/);
  await page.locator('[data-action=dashboard-tab][data-tab=weight]').click();
  await page.locator('[data-action=weight-new]').first().click();
  assert.ok(await page.locator('#weightForm').isVisible());
  await page.locator('[data-action=close-modal]').first().click();
  assert.deepEqual(errors,[],'Browser console errors: '+errors.join(' | '));
  console.log('PASS visual '+name,JSON.stringify(measured),'screenshots in',dir);
  await page.close();
 }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
}
main().catch(e=>{console.error(e);process.exitCode=1;server.close()});
