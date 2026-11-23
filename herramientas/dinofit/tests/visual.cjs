const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const server=http.createServer((req,res)=>{
 const requested=new URL(req.url,'http://127.0.0.1').pathname;
 const name=requested==='/dinofit/'?'index.html':requested.replace('/dinofit/','');
 if(!['index.html','app.css','app.js','app-pantry.js','app-ui.js','app-events.js'].includes(name)){res.writeHead(404);return res.end('not found')}
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
  // Pantry exercises desktop and mobile UI with synthetic data only.
  await page.locator('button[data-view="pantry"]').click();
  assert.match(await page.locator('#content h1').innerText(),/Despensa/);
  assert.ok(await page.locator('.pantry-product').count()>20,'existing catalogue populated');
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=3,'pantry horizontal overflow');
  await page.screenshot({path:path.join(dir,name+'-pantry.png'),fullPage:true});
  await page.locator('#pantrySearch').fill('Activia');
  assert.equal(await page.locator('.pantry-product').count(),1,'pantry search filters entries');
  await page.locator('button[data-action="pantry-count"][data-id="activia-cereales"]').click();
  assert.ok(await page.locator('#pantryCountForm').isVisible());
  await page.locator('#pantryCountForm [name="amount"]').fill('2');
  await page.locator('#pantryCountForm button[type="submit"]').click();
  assert.ok((await page.locator('.pantry-product').innerText()).includes('2 ud'),'counted stock visible');
  assert.equal(await page.evaluate(()=>pantryBalance('activia-cereales').remaining),2);
  await page.locator('button[data-action="pantry-shop-add"]').click();
  await page.locator('#pantryShopForm [name="id"]').selectOption('flan');
  await page.locator('#pantryShopForm [name="qty"]').fill('4');
  await page.locator('#pantryShopForm button[type="submit"]').click();
  const shoppingView=await page.evaluate(()=>({shopping:state.pantry.shopping,modalHidden:document.querySelector('#modalMount').hidden,toast:document.querySelector('#toast').textContent,body:document.querySelector('#content').innerText.slice(-1400)}));
  assert.ok(shoppingView.body.includes('Flan de huevo +Proteínas 0%'),'shopping list entry created: '+JSON.stringify(shoppingView));
  assert.equal(await page.evaluate(()=>pantryBalance('flan')),null,'shopping alone cannot create verified stock');
  await page.locator('button[data-action="pantry-batch-add"]').click();
  assert.ok(await page.locator('#pantryBatchForm').isVisible());
  await page.locator('#pantryBatchForm button[type="submit"]').click();
  assert.ok((await page.locator('#content').innerText()).includes('14 tuppers'),'planned lot visible');
  assert.equal(await page.evaluate(()=>state.pantry.batches[0].status),'planned');
  await page.screenshot({path:path.join(dir,name+'-pantry-filled.png'),fullPage:true});
  assert.deepEqual(errors,[],'Browser console errors: '+errors.join(' | '));
  console.log('PASS visual '+name,JSON.stringify(measured),'screenshots in',dir);
  await page.close();
 }
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
}
main().catch(e=>{console.error(e);process.exitCode=1;server.close()});
