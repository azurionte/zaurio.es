const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const server=http.createServer((req,res)=>{
 const requested=new URL(req.url,'http://127.0.0.1').pathname;
 const name=requested==='/dinofit/'?'index.html':requested.replace('/dinofit/','');
 if(!['index.html','app.css','app.js','app-pantry.js','app-ui.js','app-events.js','app-pantry-v2.js','app-pantry-v3.js','app-pantry-v3.css'].includes(name)){res.writeHead(404);return res.end('not found')}
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
  const tabGeometry=()=>page.locator('.dashboard-tabs').evaluate(list=>{
   const tabs=[...list.querySelectorAll('[role=tab]')],bounds=list.getBoundingClientRect(),selected=list.querySelector('[aria-selected=true]');
   const selectedBounds=selected.getBoundingClientRect();
   return {rows:new Set(tabs.map(tab=>Math.round(tab.getBoundingClientRect().top))).size,
    minHeight:Math.min(...tabs.map(tab=>tab.getBoundingClientRect().height)),
    maxHeight:Math.max(...tabs.map(tab=>tab.getBoundingClientRect().height)),
    overflow:list.scrollWidth-list.clientWidth,scroll:list.scrollLeft,
    intact:tabs.every(tab=>tab.scrollWidth<=tab.clientWidth+1&&tab.querySelector('.eyebrow')?.textContent&&tab.querySelector('.dashboard-value')?.textContent),
    fullyShown:selectedBounds.left>=bounds.left-1&&selectedBounds.right<=bounds.right+1};
  });
  const initialTabs=await tabGeometry();
  assert.equal(initialTabs.rows,1,'all dashboard areas share one row');
  assert.ok(initialTabs.intact&&initialTabs.minHeight>=44&&initialTabs.maxHeight<122,'compact readable labels and values with usable touch targets');
  assert.equal(initialTabs.overflow>1,name==='iphone','only the narrow viewport scrolls the tab bar');
  const weightTab=page.locator('#dashboard-tab-weight');
  await weightTab.focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator(':focus').getAttribute('id'),'dashboard-tab-composition','arrow activates and retains keyboard focus');
  assert.equal(await page.locator('#dashboard-panel').getAttribute('aria-labelledby'),'dashboard-tab-composition');
  await page.keyboard.press('End');
  assert.equal(await page.locator(':focus').getAttribute('id'),'dashboard-tab-nutrition');
  const endTabs=await tabGeometry();
  assert.ok(endTabs.fullyShown&&(name!=='iphone'||endTabs.scroll>0),'scrolled active tab stays visible after re-render');
  await page.evaluate(()=>render());
  assert.ok((await tabGeometry()).fullyShown,'rightmost active area remains visible during an ordinary refresh');
  await page.locator('#dashboard-tab-nutrition').focus();
  await page.keyboard.press('Home');
  assert.equal(await page.locator(':focus').getAttribute('id'),'dashboard-tab-weight');
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
  assert.equal(await page.locator('.food-button').count(),0,'no stock-backed shortcut if balances are unknown');
  await page.evaluate(()=>{DinoPantry.recount('activia-cereales',1);DinoPantry.recount('coffee',3);render()});
  assert.equal(await page.locator('.food-button').count(),1,'only stocked Activia is suggested');
  assert.equal(await page.locator('[data-recipe="coffee"]').count(),0,'coffee requires milk too');
  await page.evaluate(()=>{DinoPantry.recount('milk',360);render()});
  assert.equal(await page.locator('.food-button').count(),2,'stocked coffee appears with both ingredients');
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
  await page.locator('[data-recipe=activia]').click();
  assert.ok(await page.locator('#foodForm').isVisible());
  assert.equal(await page.locator('#foodSuggestedMeal').innerText(),'Merienda','an available yogurt is inferred as a snack');
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

  // Despensa: single-tap stock tiles; no consumption buttons or ingredient shopping mistakes.
  await page.locator('button[data-view="pantry"]').click();
  assert.match(await page.locator('#content h1').innerText(),/Despensa/);
  assert.equal(await page.locator('[role="tab"]').count(),3,'exactly three exclusive tabs');
  assert.equal(await page.locator('[role="tabpanel"]').count(),1,'only one pantry panel');
  assert.ok(await page.locator('.pantry3-tile').count()>5,'compact inventory tiles');
  assert.equal(await page.locator('#calendarBar').isVisible(),false,'no diary calendar in pantry');
  assert.equal(await page.locator('#content [data-action="pantry2-eat"]').count(),0,'no consume shortcut in pantry');
  assert.equal(await page.locator('#content [data-action="pantry3-buy-quick"]').count(),0,'no buttons cluttering individual tiles');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=3,true,'no pantry horizontal overflow');
  await page.screenshot({path:path.join(dir,name+'-pantry-compact.png'),fullPage:true});
  await page.locator('[data-action="pantry3-open"][data-id="coffee"]').click();
  assert.ok(await page.locator('#pantry3BuyForm').isVisible());
  assert.equal(await page.locator('.pantry3-choice').count(),2,'preset box sizes: 10 and 20 capsules');
  await page.locator('[data-action="pantry3-select-size"][data-size="20"]').click();
  await page.locator('#pantry3BuyForm button[type="submit"]').click();
  assert.equal(await page.evaluate(()=>DinoPantry.stock('coffee').qty),20,'one purchased box adds 20 capsules');
  await page.locator('[data-action="pantry3-open"][data-id="activia-cereales"]').click();
  await page.locator('#pantry3BuyForm button[type="submit"]').click();
  assert.equal(await page.evaluate(()=>DinoPantry.stock('activia-cereales').qty),4,'one Activia pack adds four yogurts');
  await page.locator('[data-action="pantry3-open"][data-id="cheese"]').click();
  await page.locator('[data-action="pantry3-select-size"][data-size="13"]').click();
  await page.locator('#pantry3BuyForm button[type="submit"]').click();
  assert.equal(await page.evaluate(()=>DinoPantry.stock('cheese').qty),13,'one cheese package adds 13 slices');
  await page.locator('[data-action="pantry3-tab"][data-id="raw"]').click();
  assert.equal(await page.locator('[role="tabpanel"]').count(),1,'raw is exclusive');
  assert.equal(await page.locator('.pantry3-tile').filter({hasText:'Activia'}).count(),0);
  await page.locator('[data-action="pantry3-open"][data-id="garlic"]').click();
  assert.ok((await page.locator('#pantry3BuyForm').innerText()).includes('bolsa congelada'),'garlic purchased in frozen bags');
  await page.locator('#pantry3BuyForm [name="size"]').fill('250');
  await page.locator('#pantry3BuyForm button[type="submit"]').click();
  assert.equal(await page.evaluate(()=>DinoPantry.stock('garlic').qty),250,'250g garlic bag counted');
  await page.locator('[data-action="pantry3-open"][data-id="oil"]').click();
  assert.ok((await page.locator('#pantry3BuyForm').innerText()).includes('botella'),'oil bottle not a tray');
  await page.locator('[data-action="close-modal"]').first().click();
  await page.locator('[data-action="pantry3-open"][data-id="chicken"]').click();
  assert.ok((await page.locator('#pantry3BuyForm').innerText()).includes('bandeja'));
  await page.locator('#pantry3BuyForm [name="size"]').fill('619');
  await page.locator('#pantry3BuyForm [name="pieces"]').fill('5');
  await page.locator('#pantry3BuyForm button[type="submit"]').click();
  assert.equal(await page.evaluate(()=>DinoPantry.stock('chicken').qty),619,'619g pack recorded');
  assert.equal(await page.evaluate(()=>DinoPantry.stock('chicken').pieces),5,'five fillets recorded');
  await page.locator('[data-action="pantry3-tab"][data-id="tuppers"]').click();
  assert.equal(await page.locator('[role="tabpanel"]').count(),1);
  assert.equal(await page.locator('#content [data-action="pantry2-eat-tupper"]').count(),0,'no consume button in pantry tuppers');
  await page.locator('[data-action="pantry2-cook"]').first().click();
  await page.locator('#pantry2Recipe').selectOption('chicken');
  await page.locator('[data-action="pantry3-cook-number"][data-value="2"]').click();
  await page.locator('#pantry2CookForm [data-action="pantry3-portion"][data-fraction="0.5"]').first().click();
  const perTupper=await page.locator('#pantry2CookForm [data-basic-qty]').first().inputValue();
  assert.equal(perTupper,'154.75','half 619g pack distributed across two tuppers');
  await page.locator('#pantry2CookForm button[type="submit"]').last().click();
  assert.equal(await page.evaluate(()=>DinoPantry.available().length),2,'two prepared tuppers');
  assert.equal(await page.evaluate(()=>DinoPantry.stock('chicken').qty),309.5,'half tray debited exactly once');
  assert.equal(await page.locator('.pantry3-tupper-tile').count(),1,'prepared food grouped compactly');
  await page.locator('.pantry3-tupper-tile').first().click();
  assert.equal(await page.locator('.pantry3-tupper-line').count(),2,'individual tuppers editable');
  await page.locator('[data-action="close-modal"]').first().click();
  // Consumption remains exclusively available through the diary.
  await page.locator('button[data-view="today"]').click();
  await page.locator('[data-action="dashboard-tab"][data-tab="nutrition"]').click();
  assert.equal(await page.locator('#calendarBar').isVisible(),true,'calendar returns in diary');
  assert.equal(await page.getByText('Tuppers disponibles',{exact:true}).count(),0,'the kcal tab never shows a standalone stock list');
  const quickTupper=page.locator('.quick-foods-section [data-action="pantry2-eat-tupper"]');
  assert.equal(await quickTupper.count(),1,'two identical portions share an existing-section shortcut');
  assert.match(await quickTupper.innerText(),/2 disponibles/);
  await quickTupper.click();
  assert.equal(await quickTupper.count(),1,'shortcut stays with the remaining portion');
  assert.match(await quickTupper.innerText(),/1 disponible/);
  assert.ok((await tabGeometry()).fullyShown,'active tab stays visible after recording a tupper rerenders the diary');
  assert.equal(await page.evaluate(()=>DinoPantry.available().length),1,'one consumed, one remains');
  assert.equal(await page.evaluate(()=>DinoPantry.stock('chicken').qty),309.5,'no double debit');
  const mealId=await page.evaluate(()=>state.logs.find(x=>x.pantryTupperId)?.id);
  const tupperId=await page.evaluate(id=>state.logs.find(x=>x.id===id)?.pantryTupperId,mealId);
  assert.equal(await page.locator('.food-record-grid .food-record-card').filter({hasText:'Solo pechuga de pollo'}).count(),1,'actual tupper type appears in the food diary');
  await page.locator('[data-action="edit-food"][data-id="'+mealId+'"]').click();
  await page.locator('#foodForm [data-food-id="chicken"]').fill('140');
  await page.locator('#foodForm button[type="submit"]').click();
  assert.equal(await page.evaluate(id=>state.logs.find(x=>x.id===id)?.pantryTupperId,mealId),tupperId,'editing preserves tupper link');
  assert.equal(await page.evaluate(()=>DinoPantry.stock('chicken').qty),309.5,'editing cannot debit raw twice');
  await page.evaluate(()=>{activeView='pantry';const l=state.logs.find(x=>x.pantryTupperId);state.logs=state.logs.filter(x=>x.id!==l.id);render()});
  assert.equal(await page.evaluate(()=>DinoPantry.available().length),2,'deleting diary entry restores prepared tupper');
  assert.equal(await page.locator('#calendarBar').isVisible(),false);
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=3,'no mobile overflow');
  await page.screenshot({path:path.join(dir,name+'-pantry-compact-filled.png'),fullPage:true});
  assert.deepEqual(errors,[],'Browser console errors: '+errors.join(' | '));
  console.log('PASS visual '+name,JSON.stringify(measured),'screenshots in',dir);
  await page.close();
 }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
}
main().catch(e=>{console.error(e);process.exitCode=1;server.close()});
