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
  const screenshot=path.join(dir,name+'.png');
  await page.screenshot({path:screenshot,fullPage:true});
  const measured=await page.evaluate(()=>{
   const card=document.querySelector('.scale-card');
   const food=document.querySelector('.food-button');
   const layout=document.querySelector('.main');
   return {cardBackground:getComputedStyle(card).backgroundColor,cardColor:getComputedStyle(card).color,
    horizontalOverflow:document.documentElement.scrollWidth-innerWidth,charts:document.querySelectorAll('svg.chart-svg').length,
    metricCards:document.querySelectorAll('.scale-card').length,foodButtons:document.querySelectorAll('.food-button').length,
    mainWidth:layout.getBoundingClientRect().width,saveText:document.querySelector('#saveStatus').textContent};
  });
  assert.equal(measured.metricCards,12);assert.equal(measured.foodButtons,10);
  assert.ok(measured.charts>8);
  assert.ok(measured.horizontalOverflow<=3,'Horizontal overflow: '+JSON.stringify(measured));
  assert.notEqual(measured.cardBackground,'rgb(255, 255, 255)','Metric cards must not be white');
  await page.locator('[data-action=date-prev]').click();
  assert.match(await page.locator('#content h1').innerText(),/17 abr/);
  await page.locator('[data-action=add-food]').first().click();
  assert.ok(await page.locator('#foodForm').isVisible());
  await page.locator('[data-action=close-modal]').first().click();
  await page.locator('[data-action=weight-new]').first().click();
  assert.ok(await page.locator('#weightForm').isVisible());
  await page.locator('[data-action=close-modal]').first().click();
  assert.deepEqual(errors,[],'Browser console errors: '+errors.join(' | '));
  console.log('PASS visual '+name,JSON.stringify(measured),'screenshot',screenshot);
  await page.close();
 }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
}
main().catch(e=>{console.error(e);process.exitCode=1;server.close()});
