const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const server=http.createServer((req,res)=>{
 const requested=new URL(req.url,'http://127.0.0.1').pathname;
 const name=requested==='/dinofit/'?'index.html':requested.replace('/dinofit/','');
 if(!['index.html','app.css','app.js','app-pantry.js','app-ui.js','app-events.js','app-pantry-v2.js'].includes(name)){res.writeHead(404);return res.end('not found')}
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

   // Six real-world-shaped synthetic entries; no remote data is touched.
   const foodDate='2026-04-18';
   const log=(id,meal,title,ingredients)=>({id,date:foodDate,meal,title,note:'',parts:ingredients.map(([foodId,qty])=>makePart(foodId,qty))});
   state.logs=[
    log('poultry','Comida','Solo pechuga de pollo',[['chicken',120]]),
    log('burgers','Comida','2 burgers de pollo + salteados',[['burger-chicken',2],['saute-chicken',56.25],['saute-frank',56.25],['oil',7]]),
    log('coffee','Desayuno','Café con leche desnatada',[['coffee',2],['milk',120]]),
    log('flan-a','Otro','Flan proteico',[['flan',1]]),
    log('flan-b','Otro','Flan proteico',[['flan',1]]),
    log('yopro','Otro','YoPRO',[['yopro',1]])
   ];

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
  assert.equal(await page.locator('.food-record-card').count(),6,'six illustrated food cards');
  assert.equal(await page.locator('.plate-gallery').count(),0,'duplicate gallery must not render');
  assert.equal(await page.locator('.nutrition-overview').count(),1,'one panel contains summary and food diary');
  assert.equal(await page.locator('.food-record-card [data-action=edit-food]').count(),6,'one editable item for each meal log');
  assert.equal(await page.locator('.meal-slice').count(),3,'three colored meal groups');
  assert.equal(await page.locator('.food-record-card.tone-lunch').count(),2,'lunch has two food cards');
  assert.ok((await page.locator('.nutrition-overview').innerText()).includes('825'),'daily calories preserved');
  const art=await page.evaluate(()=>({
   icons:document.querySelector('.food-record-card.tone-lunch .food-picture-icons')?.innerText,
   burgerIcons:[...document.querySelectorAll('.food-record-card')].find(card=>card.querySelector('h3')?.textContent==='2 burgers de pollo + salteados')?.querySelector('.food-picture-icons')?.innerText,
   toneA:getComputedStyle(document.querySelector('.meal-slice.tone-lunch')).borderColor,
   toneB:getComputedStyle(document.querySelector('.meal-slice.tone-other')).borderColor,
   nutritionFits:document.querySelector('.nutrition-overview').scrollHeight<=document.querySelector('.nutrition-overview').clientHeight+2,
   cardsFit:document.querySelector('.food-record-grid').scrollHeight<=document.querySelector('.food-record-grid').clientHeight+2
  }));
  assert.ok(art.icons?.includes('🍗'),'chicken shown as food illustration');
  assert.ok(art.burgerIcons?.includes('🍔'),'burger illustration exists');
  assert.notEqual(art.toneA,art.toneB,'meal groups have distinct accent colors');
  assert.equal(art.nutritionFits,true,'no inner scrolling in nutrition area');
  assert.equal(art.cardsFit,true,'no inner scrolling in food diary');
  measured=await measure();
  assert.ok(measured.horizontalOverflow<=3,'nutrition horizontal overflow');
  await page.screenshot({path:path.join(dir,name+'-nutrition.png'),fullPage:true});
  await page.locator('.food-record-card [data-action=edit-food]').first().click();
  assert.ok(await page.locator('#foodForm').isVisible(),'existing meal opens editable without losing it');
  await page.locator('[data-action=close-modal]').first().click();
  await page.locator('[data-action=add-food]').first().click();
  assert.ok(await page.locator('#foodForm').isVisible());
  assert.equal(await page.locator('#foodSuggestedMeal').innerText(),'Cena','another main plate is inferred as dinner');
  assert.equal(await page.locator('#foodForm select[name=meal]').isVisible(),false,'quick add must not ask for a meal category');
  await page.locator('.food-meal-adjust summary').click();
  assert.equal(await page.locator('#foodForm select[name=meal]').isVisible(),true,'manual correction is available when requested');
  await page.locator('#foodForm select[name=meal]').selectOption('Comida');
  assert.equal(await page.locator('#foodSuggestedMeal').innerText(),'Comida','manual override wins');
  await page.locator('[data-action=close-modal]').first().click();
  const initialFoodLogs=await page.evaluate(()=>structuredClone(state.logs));
  await page.evaluate(()=>{
   state.logs=[];selectedDate='2026-04-18';render();
  });
  await page.locator('[data-recipe=coffee]').click();
  assert.equal(await page.locator('#foodSuggestedMeal').innerText(),'Desayuno','first coffee is suggested as breakfast');
  await page.locator('#foodForm [name=date]').fill('2026-04-19');
  assert.equal(await page.locator('#foodSuggestedMeal').innerText(),'Desayuno','suggestion recalculates for changed date');
  await page.locator('[data-action=close-modal]').first().click();
  await page.evaluate(()=>{
   state.logs=[{id:'breakfast',date:'2026-04-18',meal:'Desayuno',title:'Café',parts:[makePart('coffee',1)]}];render();
  });
  await page.locator('[data-recipe=coffee]').click();
  assert.equal(await page.locator('#foodSuggestedMeal').innerText(),'Merienda','second coffee is suggested as snack');
  await page.locator('[data-action=close-modal]').first().click();
  await page.evaluate(logs=>{state.logs=logs;render();},initialFoodLogs);
  // Test a browser left open overnight, without affecting any real user data.
  await page.evaluate(()=>{
    lastObservedToday='2026-04-18';
    followCurrentDay=true;
    refreshCalendarDay('2026-04-19');
  });
  assert.equal(await page.locator('#globalDate').inputValue(),'2026-04-19','new day selected automatically');
  assert.equal(await page.locator('.food-record-card').count(),0,'yesterday food must not appear on the new day');
  assert.equal(await page.locator('.plate-gallery').count(),0,'duplicate gallery never appears');
  assert.ok((await page.locator('#dashboard-panel').innerText()).includes('Aún no hay comidas registradas'));
  await page.evaluate(()=>selectCalendarDay('2026-04-18'));
  assert.equal(await page.locator('.food-record-card').count(),6,'yesterday records remain accessible');
  // An explicit historical view remains selected when midnight arrives.
  await page.evaluate(()=>{
    lastObservedToday='2026-04-18';
    followCurrentDay=false;
    refreshCalendarDay('2026-04-19');
  });
  assert.equal(await page.locator('#globalDate').inputValue(),'2026-04-18');
  assert.equal(await page.locator('.food-record-card').count(),6);
  await page.locator('[data-action=date-prev]').click();
  assert.match(await page.locator('#content h1').innerText(),/17 abr/);
  await page.locator('[data-action=dashboard-tab][data-tab=weight]').click();
  await page.locator('[data-action=weight-new]').first().click();
  assert.ok(await page.locator('#weightForm').isVisible());
  await page.locator('[data-action=close-modal]').first().click();

  // Despensa v2: verify the actual loaded script, responsive layout, and complete flows.
  await page.locator('button[data-view="pantry"]').click();
  assert.match(await page.locator('#content h1').innerText(),/Despensa/);
  assert.ok(await page.locator('.pantry2-card').count()>5,'v2 cards must render');
  assert.equal(await page.locator('.pantry2-zone h2').count(),3,'three pantry sections');
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=3,'v2 horizontal overflow');
  assert.ok(await page.evaluate(()=>!!globalThis.DinoPantry),'pantry v2 script must be loaded');
  await page.screenshot({path:path.join(dir,name+'-pantry-v2.png'),fullPage:true});
  await page.locator('#pantrySearch').fill('Activia');
  assert.equal(await page.locator('.pantry2-card').count(),1,'product search filters visual cards');
  await page.locator('[data-action="pantry2-count"][data-id="activia-cereales"]').click();
  assert.ok(await page.locator('#pantry2CountForm').isVisible(),'quick inventory edit opens');
  await page.locator('#pantry2CountForm [name="qty"]').fill('2');
  await page.locator('#pantry2CountForm button[type="submit"]').last().click();
  assert.equal(await page.evaluate(()=>DinoPantry.stock('activia-cereales').qty),2,'recount confirmed');
  await page.locator('[data-action="pantry2-buy-one"][data-id="activia-cereales"]').click();
  await page.locator('#pantry2BuyForm [name="qty"]').fill('6');
  await page.locator('#pantry2BuyForm [name="mode"]').selectOption('purchase');
  await page.locator('#pantry2BuyForm button[type="submit"]').last().click();
  assert.equal(await page.evaluate(()=>DinoPantry.stock('activia-cereales').qty),8,'buy sums to current inventory');
  await page.locator('[data-action="pantry2-eat"][data-id="activia-cereales"]').click();
  assert.equal(await page.evaluate(()=>DinoPantry.stock('activia-cereales').qty),7,'consumption subtracts one');
  await page.locator('#pantrySearch').fill('');
  await page.locator('[data-action="pantry2-buy"]').first().click();
  await page.locator('#pantry2BuyProduct').selectOption('chicken');
  await page.locator('#pantry2BuyForm [name="qty"]').fill('619');
  await page.locator('#pantry2BuyForm [name="pieces"]').fill('5');
  await page.locator('#pantry2BuyForm [name="grams"]').fill('619');
  await page.locator('#pantry2BuyForm [name="mode"]').selectOption('count');
  await page.locator('#pantry2BuyForm button[type="submit"]').last().click();
  assert.equal(await page.evaluate(()=>DinoPantry.stock('chicken').qty),619,'verified chicken pack weighs 619g');
  assert.equal(await page.evaluate(()=>DinoPantry.stock('chicken').pieces),5,'five fillets counted');
  await page.locator('[data-action="pantry2-cook"]').first().click();
  await page.locator('#pantry2Recipe').selectOption('chicken');
  await page.locator('#pantry2CookForm [name="count"]').fill('2');
  await page.locator('#pantry2CookForm button[type="submit"]').last().click();
  assert.equal(await page.evaluate(()=>DinoPantry.available().length),2,'two individual tuppers available');
  assert.equal(await page.evaluate(()=>DinoPantry.stock('chicken').qty),319,'cooking deducts 300g');
  assert.equal(await page.evaluate(()=>DinoPantry.stock('chicken').pieces),3,'cooking uses two fillets');
  await page.locator('.pantry2-tupper [data-action="pantry2-eat-tupper"]').first().click();
  assert.equal(await page.evaluate(()=>DinoPantry.available().length),1,'one prepared tupper remains');
  assert.equal(await page.evaluate(()=>DinoPantry.stock('chicken').qty),319,'eating does not debit raw twice');
  // Editing a meal from the normal diary must preserve its link to the prepared tupper.
  const tupperMeal=await page.evaluate(()=>state.logs.find(x=>x.pantryTupperId)?.id);
  const eatenTupper=await page.evaluate(id=>state.logs.find(x=>x.id===id)?.pantryTupperId,tupperMeal);
  await page.evaluate(()=>{activeView='today';dashboardArea='nutrition';selectCalendarDay(isoToday(),false);render();});
  await page.locator('[data-action="edit-food"][data-id="'+tupperMeal+'"]').click();
  await page.locator('#foodForm [data-food-id="chicken"]').fill('140');
  await page.locator('#foodForm button[type="submit"]').click();
  assert.equal(await page.evaluate(id=>state.logs.find(x=>x.id===id)?.pantryTupperId,tupperMeal),eatenTupper,
    'editing the meal keeps its pantry tupper link');
  assert.equal(await page.evaluate(()=>DinoPantry.available().length),1,
    'edited meal does not free the consumed tupper');
  assert.equal(await page.evaluate(()=>DinoPantry.stock('chicken').qty),319,
    'editing an already prepared tupper meal does not debit raw chicken twice');
  await page.evaluate(()=>{activeView='pantry';render();});
  await page.evaluate(()=>{
    const last=state.logs.find(x=>x.pantryTupperId);
    state.logs=state.logs.filter(x=>x.id!==last.id);
    render();
  });
  assert.equal(await page.evaluate(()=>DinoPantry.available().length),2,'removing diary entry reverses tupper consumption');
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=3,'no mobile overflow after activity');
  await page.screenshot({path:path.join(dir,name+'-pantry-v2-filled.png'),fullPage:true});
  assert.deepEqual(errors,[],'Browser console errors: '+errors.join(' | '));
  console.log('PASS visual '+name,JSON.stringify(measured),'screenshots in',dir);
  await page.close();
 }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
}
main().catch(e=>{console.error(e);process.exitCode=1;server.close()});
