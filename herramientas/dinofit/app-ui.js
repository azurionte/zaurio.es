
function renderCalendar(){
 const el=$('#calendarBar');if(!el)return;
 const today=isoToday(),isNow=selectedDate===today;
 el.innerHTML='<button class="arrow" data-action="date-prev" type="button" aria-label="Día anterior">‹</button>'+
  '<span class="date-info"><strong>'+htmlSafe(readableDate(selectedDate))+'</strong><small>'+(isNow?'Hoy':'Fecha seleccionada')+'</small></span>'+
  '<input type="date" id="globalDate" aria-label="Elegir día" value="'+htmlSafe(selectedDate)+'">'+
  '<button class="arrow" data-action="date-next" type="button" aria-label="Día siguiente">›</button>'+
  '<button class="today" data-action="date-today" type="button">Hoy</button>';
}
function timeLine(){
 const values=weightsUntil().filter(w=>w.date>=trackingStart());
 return values;
}
function metricData(id){
 return timeLine().filter(w=>isNumber(w[id])).map(w=>({date:w.date,value:w[id]}));
}
function bestFit(list){
 if(list.length<3)return null;
 const x0=list[0].date,xx=list.map(w=>dayDiff(x0,w.date)),yy=list.map(w=>w.weight);
 const n=list.length,meanX=xx.reduce((a,b)=>a+b,0)/n,meanY=yy.reduce((a,b)=>a+b,0)/n;
 const sum=xx.reduce((acc,v,i)=>acc+(v-meanX)*(yy[i]-meanY),0);
 const div=xx.reduce((acc,v)=>acc+(v-meanX)**2,0);
 if(div===0)return null;
 return sum/div;
}
function bestFitField(list,measure){
 const values=list.filter(w=>isNumber(measure(w)));
 if(values.length<3)return null;
 const x0=values[0].date,xx=values.map(w=>dayDiff(x0,w.date)),yy=values.map(measure);
 const n=values.length,mx=xx.reduce((a,b)=>a+b,0)/n,my=yy.reduce((a,b)=>a+b,0)/n;
 const denominator=xx.reduce((sum,x)=>sum+(x-mx)**2,0);
 return denominator>0?xx.reduce((sum,x,i)=>sum+(x-mx)*(yy[i]-my),0)/denominator:null;
}
function projectionPoints(anchor,goal,slope){
 if(!anchor||!isNumber(goal)||!isNumber(slope)||slope>=0||goal>=anchor.weight)return {points:[],date:null};
 const days=Math.ceil((anchor.weight-goal)/-slope);
 if(days<1||days>3650)return {points:[],date:null};
 const points=[];
 for(let d=0;d<days;d+=Math.max(1,Math.ceil(days/85))){
  points.push({date:addDays(anchor.date,d),value:Math.max(goal,anchor.weight+slope*d)});
 }
 points.push({date:addDays(anchor.date,days),value:goal});
 return {points,date:addDays(anchor.date,days)};
}
function monitoringEvidence(anchor,recent){
 if(!anchor)return {completed:0,logged:0,averageKcal:null,activities:0,minutes:0,fatSlope:null,leanSlope:null};
 const since=addDays(anchor.date,-13);
 const complete=new Set((state?.completeDays||[]).filter(d=>dateValid(d)&&d>=since&&d<=anchor.date));
 const logged=(state?.logs||[]).filter(x=>x.date>=since&&x.date<=anchor.date);
 const completeDates=[...complete].filter(d=>logged.some(l=>l.date===d));
 const calories=completeDates.map(d=>logged.filter(l=>l.date===d).reduce((sum,l)=>sum+logTotal(l.parts||[]),0));
 const activities=(state?.activities||[]).filter(a=>a.date>=since&&a.date<=anchor.date);
 return {
  completed:completeDates.length,
  logged:new Set(logged.map(x=>x.date)).size,
  averageKcal:calories.length?calories.reduce((a,b)=>a+b,0)/calories.length:null,
  activities:activities.length,
  minutes:activities.reduce((sum,a)=>sum+(isNumber(a.minutes)?a.minutes:0),0),
  fatSlope:bestFitField(recent,w=>isNumber(w.bodyFat)?w.weight*w.bodyFat/100:null),
  leanSlope:bestFitField(recent,w=>isNumber(w.bodyFat)?w.weight*(1-w.bodyFat/100):null)
 };
}
function projections(){
 const actual=timeLine(),anchor=actual.at(-1),goal=state?.profile?.targetWeight;
 const empty={emp:[],adjusted:[],slope:null,activeSlope:null,empDate:null,adjDate:null,usedShortTrend:false,evidence:monitoringEvidence(anchor,[])};
 if(!anchor||!isNumber(goal)||goal>=anchor.weight)return empty;
 const recent=actual.filter(w=>dayDiff(w.date,anchor.date)<=14);
 const slope=bestFit(recent);
 const short=recent.filter(w=>dayDiff(w.date,anchor.date)<=6);
 const shortSlope=short.length>=4&&dayDiff(short[0].date,short.at(-1).date)>=4?bestFit(short):null;
 const activeSlope=isNumber(slope)&&isNumber(shortSlope)?(slope+shortSlope)/2:slope;
 const baseline=projectionPoints(anchor,goal,slope);
 const adaptive=projectionPoints(anchor,goal,activeSlope);
 const evidence=monitoringEvidence(anchor,recent);
 // Activity and logged food are monitored, but not added to observed weight loss twice.
 // Incomplete food days never count as zero kcal and are never extrapolated to future days.
 return {emp:baseline.points,adjusted:adaptive.points,slope,activeSlope,
  empDate:baseline.date,adjDate:adaptive.date,usedShortTrend:isNumber(shortSlope),evidence};
}
function svgLine(series,{small=false,unit='kg',yBounds=null,showGoal=null}={}){
 const all=series.flatMap(s=>s.points||[]);
 if(!all.length)return '<div class="empty">Todavía no hay datos para mostrar.</div>';
 const compact=!small && typeof window!=='undefined' && window.innerWidth<=700;
 const W=small?220:compact?430:1080,H=small?65:compact?300:405;
 const margin=small?{l:3,r:3,t:6,b:6}:compact?{l:45,r:10,t:15,b:42}:{l:66,r:28,t:22,b:48};
 const timestamps=all.map(p=>utcDay(p.date));
 const first=Math.min(...timestamps),last=Math.max(...timestamps),duration=Math.max(86400000,last-first);
 const vv=all.map(p=>p.value),lowest=Math.min(...vv,showGoal??Infinity),highest=Math.max(...vv,showGoal??-Infinity);
 const range=Math.max(.2,highest-lowest);
 const lo=yBounds?yBounds[0]:lowest-range*.06,hi=yBounds?yBounds[1]:highest+range*.08;
 const xp=d=>margin.l+(utcDay(d)-first)/duration*(W-margin.l-margin.r);
 const yp=v=>margin.t+((hi-v)/Math.max(0.01,hi-lo))*(H-margin.t-margin.b);
 const val=(v)=>locale(v,unit==='kcal'?0:1);
 let out='<svg class="chart-svg '+(small?'chart-small':'chart-large')+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Eje horizontal: fechas. Eje vertical: '+htmlSafe(unit)+'. Gráfico de evolución.">';
 if(!small){
  for(let k=0;k<=5;k++){
   const v=lo+(hi-lo)*k/5,y=yp(v);
   out+='<line x1="'+margin.l+'" y1="'+y.toFixed(2)+'" x2="'+(W-margin.r)+'" y2="'+y.toFixed(2)+'" stroke="#304158" stroke-width="1"/>'+
   '<text x="'+(margin.l-9)+'" y="'+(y+4).toFixed(2)+'" fill="#a0b3cd" font-size="12" text-anchor="end">'+val(v)+'</text>';
  }
  for(let k=0;k<=4;k++){
   const t=new Date(first+(last-first)*k/4).toISOString().slice(0,10),x=xp(t);
   out+='<text x="'+x.toFixed(2)+'" y="'+(H-13)+'" fill="#a0b3cd" font-size="12" text-anchor="'+(k===0?'start':k===4?'end':'middle')+'">'+htmlSafe(shortDate(t))+'</text>';
  }
  if(isNumber(showGoal)&&showGoal>=lo&&showGoal<=hi)out+='<line x1="'+margin.l+'" y1="'+yp(showGoal)+'" x2="'+(W-margin.r)+'" y2="'+yp(showGoal)+'" stroke="#6c8296" stroke-dasharray="3 7" stroke-width="1.2"/>';
 }
 for(const s of series){
  if(!s.points.length)continue;
  const pts=s.points.map(p=>xp(p.date).toFixed(2)+','+yp(p.value).toFixed(2)).join(' ');
  out+='<polyline points="'+pts+'" fill="none" stroke="'+(s.color||'#64dfc5')+'" stroke-width="'+(small?2.8:s.dash?2.6:3.5)+'" stroke-linecap="round" stroke-linejoin="round"'+(s.dash?' stroke-dasharray="'+s.dash+'"':'')+'/>';
  if(!small&&!s.dash){
   for(const p of s.points)out+='<circle cx="'+xp(p.date).toFixed(2)+'" cy="'+yp(p.value).toFixed(2)+'" r="4.0" fill="'+(s.color||'#64dfc5')+'" stroke="#172334" stroke-width="1.6"><title>'+htmlSafe(readableDate(p.date)+': '+val(p.value)+' '+unit)+'</title></circle>';
  }
 }
 return out+'</svg>';
}
function weightGraph(){
 const actual=timeLine(),goal=state?.profile?.targetWeight,pr=projections();
 const zoom=chartZoom==='short',last=actual.at(-1),e=pr.evidence;
 const obs=pr.emp,adapt=pr.adjusted;
 let series=[{id:'real',color:'#64dfc5',points:actual.map(w=>({date:w.date,value:w.weight}))}];
 if((forecastMode==='observed'||forecastMode==='both')&&obs.length)series.push({id:'emp',color:'#b79bfa',dash:'9 7',points:obs});
 if((forecastMode==='active'||forecastMode==='both')&&adapt.length)series.push({id:'active',color:'#8dbdff',dash:'6 7',points:adapt});
 if(zoom&&last){
  const begin=addDays(last.date,-30),end=addDays(last.date,30);
  series=series.map(item=>({...item,points:item.points.filter(p=>p.date>=begin&&p.date<=end)}));
 }
 const showDate=date=>date?htmlSafe(readableDate(date)):'Esperando más mediciones';
 const trend=pr.slope==null?'Sin datos suficientes':locale(Math.abs(pr.slope)*1000,0)+' g/día '+(pr.slope<0?'de descenso':'de aumento');
 const active=pr.activeSlope==null?'Sin datos suficientes':locale(Math.abs(pr.activeSlope)*1000,0)+' g/día '+(pr.activeSlope<0?'de descenso':'de aumento');
 const evidence=e||{};
 return '<section class="section">'+
  '<div class="section-head"><div><h2>Evolución del peso y previsión</h2><p>Las fechas se recalculan al incorporar tus mediciones. No usamos una tasa de pérdida inventada.</p></div>'+
  '<div class="tools"><button type="button" class="pillbutton '+(zoom?'active':'')+'" data-action="chart-zoom" data-mode="short">Últimos 30 días</button>'+
  '<button type="button" class="pillbutton '+(!zoom?'active':'')+'" data-action="chart-zoom" data-mode="full">Hasta la meta</button></div></div>'+
  '<div class="forecast-switch" aria-label="Modelos de proyección">'+
  [{id:'observed',label:'Ritmo medido'},{id:'active',label:'Seguimiento activo'},{id:'both',label:'Comparar modelos'}].map(m=>
   '<button type="button" class="pillbutton '+(forecastMode===m.id?'active':'')+'" data-action="forecast-mode" data-mode="'+m.id+'" aria-pressed="'+(forecastMode===m.id)+'">'+htmlSafe(m.label)+'</button>').join('')+'</div>'+
  svgLine(series,{unit:'kg',showGoal:zoom?null:goal})+
  '<div class="chart-legend"><span><i class="legend-line"></i> Peso registrado</span>'+
  ((forecastMode==='observed'||forecastMode==='both')?'<span><i class="legend-line emp"></i> Ritmo medido (14 días)</span>':'')+
  ((forecastMode==='active'||forecastMode==='both')?'<span><i class="legend-line dec"></i> Seguimiento activo (7 + 14 días)</span>':'')+'</div>'+
  '<div class="proj-info">'+
   '<div class="proj-stat"><span>Ritmo medido</span><strong>'+htmlSafe(trend)+'</strong><small>'+showDate(pr.empDate)+'</small></div>'+
   '<div class="proj-stat"><span>Seguimiento activo</span><strong>'+htmlSafe(active)+'</strong><small>'+showDate(pr.adjDate)+'</small></div>'+
   '<div class="proj-stat"><span>Peso objetivo</span><strong>'+(isNumber(goal)?locale(goal,1)+' kg':'Sin definir')+'</strong><small>'+(pr.usedShortTrend?'Recalibración semanal activa':'Se activa con más pesadas recientes')+'</small></div>'+
  '</div>'+
  '<div class="monitor-panel"><div class="section-head"><div><h3>Monitorización de tus datos</h3><p>Se actualiza cuando guardas una pesada, una comida o una actividad.</p></div><span class="monitor-indicator">Seguimiento activo</span></div>'+
  '<div class="monitor-grid">'+
   '<div><strong>'+(e.fatSlope==null?'—':locale(Math.abs(e.fatSlope)*1000,0)+' g/día')+'</strong><span>Tendencia de grasa calculada'+(e.fatSlope==null?'':e.fatSlope<0?' · descenso':' · aumento')+'</span></div>'+
   '<div><strong>'+e.completed+' días completos</strong><span>Alimentación · últimas 2 semanas'+(e.averageKcal!=null?' · '+locale(e.averageKcal,0)+' kcal/día registradas':'')+'</span></div>'+
   '<div><strong>'+e.activities+' sesiones · '+locale(e.minutes,0)+' min</strong><span>Ejercicio registrado · últimas 2 semanas</span></div>'+
  '</div>'+
  '<p class="chart-comment">La tendencia del peso determina las fechas. El modelo activo combina las regresiones de 7 y 14 días cuando hay lecturas suficientes. La composición, las comidas y el ejercicio se muestran como contexto; no se añaden como calorías extra al peso ya observado ni se consideran completos los días sin cerrar. No hay vigilancia en segundo plano.</p></div>'+
  '</section>';
}
function metricGrid(){
 const records=timeLine();
 const palette=['#60e3c8','#b79bfa','#ffcc7f','#8dbdff','#fc91ae','#7edbb9','#f1af80','#f0a8fc','#9be17d','#72bce4','#eecc86','#e4a4a2','#69daa9','#ffa97e','#b9a7f4'];
 const specs=[...METRICS.map(m=>({id:m.id,name:m.name,unit:m.unit,decimals:m.decimals,formula:w=>w[m.id]})),
  {id:'fatKg',name:'Grasa calculada',unit:'kg',decimals:2,formula:w=>isNumber(w.bodyFat)?w.weight*w.bodyFat/100:null},
  {id:'leanKg',name:'Masa sin grasa calculada',unit:'kg',decimals:2,formula:w=>isNumber(w.bodyFat)?w.weight*(1-w.bodyFat/100):null},
  {id:'waterKg',name:'Agua calculada',unit:'kg',decimals:2,formula:w=>isNumber(w.bodyWater)?w.weight*w.bodyWater/100:null}
 ];
 const items=specs.map((spec,i)=>{
  const values=records.map(w=>({date:w.date,value:spec.formula(w)})).filter(p=>isNumber(p.value));
  return {...spec,color:palette[i%palette.length],values};
 });
 const isolated=compositionFocus!=='all',selected=items.find(item=>item.id===compositionFocus);
 const chartItems=isolated&&selected?[selected]:items;
 const series=chartItems.filter(item=>item.values.length>0).map(item=>{
  const baseline=item.values[0].value;
  const points=isolated?item.values:item.values.filter(p=>baseline!==0).map(p=>({date:p.date,value:(p.value/baseline-1)*100}));
  return {id:item.id,color:item.color,points};
 });
 const lastSelected=selected?.values?.at(-1);
 const detail=isolated&&selected?'Vista individual: '+htmlSafe(selected.name)+' · '+(lastSelected?locale(lastSelected.value,selected.decimals)+' '+htmlSafe(selected.unit):'sin datos'):'Vista comparativa · variación porcentual respecto a la primera lectura de cada indicador';
 return '<section class="section"><div class="section-head"><div><h2>Composición corporal</h2><p>Una gráfica para tus indicadores. Selecciona una línea de la leyenda para verla por separado.</p></div>'+
  '<button class="click sm" type="button" data-action="weight-new">+ Medición</button></div>'+
  '<div class="composition-heading"><strong>'+detail+'</strong><button type="button" class="pillbutton '+(!isolated?'active':'')+'" data-action="composition-all" aria-pressed="'+(!isolated)+'">Ver todos</button></div>'+
  svgLine(series,{unit:isolated&&selected?selected.unit||'índice':'% de variación'})+
  '<div class="composition-legend" aria-label="Indicadores de composición corporal">'+
  items.map(item=>{
   const last=item.values.at(-1);
   return '<button type="button" class="composition-key '+(isolated?(compositionFocus===item.id?'isolate':'muted'):'')+'" data-action="composition-metric" data-id="'+item.id+'" aria-pressed="'+(compositionFocus===item.id)+'">'+
    '<span class="composition-swatch" style="background:'+item.color+'"></span><span class="composition-key-text"><strong>'+htmlSafe(item.name)+'</strong>'+
    '<small>'+(last?locale(last.value,item.decimals)+' '+htmlSafe(item.unit):'Sin lecturas')+'</small></span></button>';
  }).join('')+'</div>'+
  '<p class="chart-comment">Al mostrar todos, cada serie empieza en 0 % para poder comparar kg, porcentajes, índices y kcal en un mismo gráfico. Al seleccionar una métrica se muestran sus valores y unidades reales. La grasa, la masa sin grasa y el agua en kg se calculan a partir del peso y sus porcentajes registrados.</p>'+
  '</section>';
}
function getActivity(d){
 return (state.activities||[]).filter(a=>a.date===d);
}
function dashboardCards(){
 const timeline=timeLine(),first=timeline[0],last=timeline.at(-1),day=weightForDay(),goal=state.profile.targetWeight;
 const pr=projections(),sum=dayLogs().reduce((total,l)=>total+logTotal(l.parts||[]),0);
 const lost=first&&last?first.weight-last.weight:null;
 const missing=isNumber(goal)&&last?last.weight-goal:null;
 const today=selectedDate===isoToday();
 const cards=[
  {id:'weight',label:'Peso · kilos perdidos',value:day?locale(day.weight,1)+' kg':last?locale(last.weight,1)+' kg':'—',
   hint:lost==null?'Añade la primera pesada':(lost>=0?'−':'+')+locale(Math.abs(lost),1)+' kg desde '+shortDate(first.date)},
  {id:'composition',label:'Ritmo y composición',value:isNumber(pr.slope)&&pr.slope<0?locale(-pr.slope*1000,0)+' g/día':'—',
   hint:'Promedio de los últimos 14 días · ver grasa y músculo'},
  {id:'goal',label:'Kilos que faltan',value:missing==null?'—':locale(Math.max(0,missing),1)+' kg',
   hint:isNumber(goal)?'Para llegar a '+locale(goal,1)+' kg':'Configura tu objetivo'},
  {id:'nutrition',label:today?'Kcal anotadas hoy':'Kcal del '+shortDate(selectedDate),value:dayLogs().length?locale(sum,0)+' kcal':'Sin registros',
   hint:dayLogs().length+' entradas de '+shortDate(selectedDate)+' · ver alimentos y añadir'}
 ];
 return '<div class="metrics-row dashboard-tabs" role="tablist" aria-label="Áreas de tu seguimiento">'+
  cards.map(c=>'<button type="button" role="tab" class="section metric-card dashboard-tab '+(dashboardArea===c.id?'selected':'')+' '+(c.id==='weight'?'metric-main':'')+'" data-action="dashboard-tab" data-tab="'+c.id+'" aria-selected="'+(dashboardArea===c.id)+'" aria-controls="dashboard-panel">'+
   '<span class="eyebrow">'+htmlSafe(c.label)+'</span><span class="dashboard-value">'+htmlSafe(c.value)+'</span>'+
   '<span class="micro">'+htmlSafe(c.hint)+'</span></button>').join('')+'</div>';
}
function goalDashboard(){
 const timeline=timeLine(),first=timeline[0],last=timeline.at(-1),goal=state.profile.targetWeight,pr=projections();
 if(!last||!isNumber(goal))return '<section class="section"><h2>Objetivo</h2><p class="helper">Registra tu peso y define tu objetivo en Ajustes.</p><button type="button" class="click sm section-gap" data-action="view" data-view="settings">Abrir ajustes</button></section>';
 const start=first?.weight??last.weight,range=start-goal,remaining=Math.max(0,last.weight-goal);
 const done=range>0?clamp((start-last.weight)/range*100,0,100):0;
 const rate=pr.activeSlope!=null&&pr.activeSlope<0?pr.activeSlope:pr.slope;
 const stages=[120,110,100,90,goal].filter((x,i,ar)=>x<=start&&x>=goal&&ar.indexOf(x)===i).sort((a,b)=>b-a);
 return '<section class="section"><div class="section-head"><div><h2>Tu camino hasta '+locale(goal,1)+' kg</h2><p>Hitos estimados a partir de tus pesadas reales, no de un ritmo supuesto.</p></div>'+
 '<button type="button" class="click sm" data-action="view" data-view="settings">Editar objetivo</button></div>'+
 '<div class="goal-hero"><div><span class="helper">Quedan</span><strong>'+locale(remaining,1)+' kg</strong></div>'+
 '<div><span class="helper">Ya has bajado</span><strong>'+locale(start-last.weight,1)+' kg</strong></div>'+
 '<div><span class="helper">Previsión activa</span><strong>'+(pr.adjDate?htmlSafe(shortDate(pr.adjDate)):'Pendiente')+'</strong></div></div>'+
 '<div class="goal-progress" role="progressbar" aria-label="Progreso hasta el objetivo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+done.toFixed(1)+'"><div style="width:'+done.toFixed(2)+'%"></div></div>'+
 '<p class="helper">'+locale(done,1)+' % del trayecto desde '+locale(start,1)+' kg hasta '+locale(goal,1)+' kg</p>'+
 '<div class="milestone-list section-gap">'+stages.map(x=>{
 const reached=last.weight<=x;
 const date=reached?'Conseguido':(isNumber(rate)&&rate<0?readableDate(addDays(last.date,Math.ceil((last.weight-x)/-rate))):'Esperando suficientes datos');
 return '<div class="milestone"><span class="milestone-target">'+locale(x,1)+' kg</span><span>'+htmlSafe(date)+'</span><span class="milestone-dot '+(reached?'done':'')+'"></span></div>';
 }).join('')+'</div>'+
 '<p class="chart-comment">Las fechas de los hitos cambian automáticamente con tus nuevas pesadas. Si la tendencia cambia, también lo harán las previsiones.</p></section>';
}
// Visuals come from the food IDs recorded for each entry, not from inferred calories.
function foodTone(meal){
 return ({Desayuno:'breakfast',Comida:'lunch',Merienda:'snack',Cena:'dinner',Otro:'other'})[meal]||'other';
}
function mealIcon(meal){
 return ({Desayuno:'🌤️',Comida:'🍽️',Merienda:'🍓',Cena:'🌙',Otro:'✨'})[meal]||'🍽️';
}
function foodEmojis(entry){
 const pictures=[],parts=Array.isArray(entry?.parts)?entry.parts:[];
 const pictureForId=id=>{
  if(id.startsWith('burger-'))return '🍔';
  return ({chicken:'🍗',beef:'🥩',egg:'🥚',cheese:'🧀',coffee:'☕',milk:'🥛',cola:'🥤',
   flan:'🍮',yopro:'🥛','activia-cereales':'🥣',yogurt:'🥛','yogurt-berries':'🫐',
   'yogurt-pineapple':'🍍','saute-chicken':'🥦','saute-frank':'🥔',onion:'🧅',garlic:'🧄'})[id]||null;
 };
 for(const part of parts){
  const id=String(part?.foodId||'');
  const emoji=pictureForId(id);
  if(!emoji)continue;
  // Two recorded burger patties are two burgers in the illustration, never one.
  const qty=id.startsWith('burger-')&&part.qty>=2?2:1;
  for(let i=0;i<qty;i++)pictures.push(emoji);
 }
 if(!pictures.length){
  const recipe=RECIPES.find(r=>r.name.toLowerCase()===String(entry?.title||'').toLowerCase());
  pictures.push(recipe?.emoji||'🍽️');
 }
 return pictures.slice(0,4);
}
function foodPicture(entry,kind='plate'){
 return '<span class="'+(kind==='sticker'?'food-sticker-icons':'food-picture-icons')+'" aria-hidden="true">'+
  foodEmojis(entry).map(emoji=>'<span>'+htmlSafe(emoji)+'</span>').join('')+'</span>';
}
function foodSummary(){
 const entries=dayLogs(),total=entries.reduce((sum,l)=>sum+logTotal(l.parts||[]),0);
 const groups=['Desayuno','Comida','Merienda','Cena','Otro'];
 const byMeal=groups.map(meal=>({meal,entries:entries.filter(e=>e.meal===meal)})).filter(x=>x.entries.length);
 return '<div class="nutrition-overview-head"><div><span class="eyebrow">TU ALIMENTACIÓN</span><h2>Tu diario de comidas</h2>'+
  '<p>'+htmlSafe(readableDate(selectedDate))+'</p></div>'+
  '<div class="nutrition-total"><strong>'+locale(total,0)+'</strong><span>kcal anotadas</span></div></div>'+
  (byMeal.length?'<div class="meal-summary">'+byMeal.map(g=>{
   const kcal=g.entries.reduce((sum,l)=>sum+logTotal(l.parts||[]),0);
   const share=total>0?clamp(kcal/total*100,0,100):0;
   return '<div class="meal-slice tone-'+foodTone(g.meal)+'"><div class="meal-slice-top"><span class="meal-slice-emoji" aria-hidden="true">'+mealIcon(g.meal)+'</span>'+
    '<div><span>'+htmlSafe(g.meal)+'</span><strong>'+locale(kcal,0)+' kcal</strong></div><small>'+g.entries.length+' '+(g.entries.length===1?'registro':'registros')+'</small></div>'+
    '<div class="meal-track" aria-label="'+locale(share,0)+' por ciento de las calorías registradas"><span style="width:'+share.toFixed(2)+'%"></span></div></div>';
  }).join('')+'</div>':'');
}
function currentDay(){
 let out='<div class="view-head"><span class="eyebrow">TU SEGUIMIENTO</span><h1>Tu día · '+htmlSafe(readableDate(selectedDate))+'</h1><p>Elige una fecha y utiliza las tarjetas para cambiar de área.</p></div>';
 if(selectedDate!==isoToday())out+='<div class="historical-day-note" role="status"><span>Estás consultando el <strong>'+htmlSafe(readableDate(selectedDate))+'</strong>, no el día de hoy. Las comidas no se trasladan de una fecha a otra.</span><button type="button" class="click sm" data-action="date-today">Ir a hoy · '+htmlSafe(shortDate(isoToday()))+'</button></div>';
 if(notice)out+='<div class="notice section-gap">'+htmlSafe(notice)+'</div>';
 out+=dashboardCards()+'<div id="dashboard-panel" role="tabpanel" class="dashboard-panel">';
 if(dashboardArea==='composition')out+=metricGrid();
 else if(dashboardArea==='goal')out+=goalDashboard()+dayRecords('activity');
 else if(dashboardArea==='nutrition')out+=dayRecords('food')+quickFoods();
 else out+='<div class="section-head quick-weights"><div><h2>Pesadas y proyección</h2><p>Tu evolución medida, con acceso a los modelos de seguimiento.</p></div><button type="button" class="click sm" data-action="weight-new">+ Registrar peso</button></div>'+weightGraph();
 return out+'</div>';
}
function quickFoods(){
 const groups=[
  {id:'mixed',title:'Platos con salteados',emoji:'🥘',hint:'Tu guarnición habitual y el aceite repartido entre ocho tuppers',recipes:RECIPES.filter(r=>r.group==='mixed')},
  {id:'plain',title:'Solo proteína',emoji:'🍗',hint:'Pollo, ternera o dos hamburguesas por plato',recipes:RECIPES.filter(r=>r.group==='plain')},
  {id:'treats',title:'Postres y lácteos',emoji:'🍮',hint:'Tus tentempiés habituales',recipes:RECIPES.filter(r=>['cheese','flan','yopro','activia'].includes(r.id))},
  {id:'drinks',title:'Bebidas',emoji:'🥤',hint:'Café, leche y refrescos',recipes:RECIPES.filter(r=>['coffee','cola'].includes(r.id))}
 ];
 const buttons=r=>{
  const mock={title:r.name,parts:r.parts.map(([foodId,qty])=>({foodId,qty}))};
  return '<button class="food-button illustrated-quick" type="button" data-action="add-food" data-recipe="'+r.id+'" aria-label="Añadir '+htmlSafe(r.name)+'">'+
   '<span class="food-top"><span class="quick-pictures">'+foodPicture(mock,'sticker')+'</span><span class="quick-plus" aria-hidden="true">+</span></span>'+
   '<span class="quick-copy"><strong>'+htmlSafe(r.name)+'</strong><small>'+htmlSafe(r.hint)+'</small></span></button>';
 };
 return '<section class="section quick-foods-section"><div class="section-head"><div><span class="eyebrow">A UN TOQUE</span><h2>¿Qué has comido?</h2><p>Selecciona un plato o tentempié para registrarlo. Puedes ajustar las cantidades.</p></div></div>'+
  groups.map(g=>'<div class="quick-group food-group-'+g.id+'">'+
   '<div class="quick-group-title"><span class="quick-group-em" aria-hidden="true">'+g.emoji+'</span><div><h3>'+htmlSafe(g.title)+'</h3><p class="helper">'+htmlSafe(g.hint)+'</p></div></div>'+
   '<div class="quick-grid">'+g.recipes.map(buttons).join('')+'</div></div>').join('')+'</section>';
}
function foodPartsCaption(entry){
 const parts=Array.isArray(entry.parts)?entry.parts:[];
 if(!parts.length)return 'Registro personalizado';
 if(parts.length>=3)return parts.length+' ingredientes registrados · pulsa Editar para verlos';
 return parts.map(part=>{
  const f=food(part.foodId),name=f?.name||part.foodId;
  const unit=f?.unit==='g'?'g':f?.unit==='ml'?'ml':'ud';
  return name+' · '+locale(part.qty,part.qty%1===0?0:1)+' '+unit;
 }).join(' · ');
}
function dayRecords(kind='all'){
 const entries=dayLogs().sort((a,b)=>(a.meal||'').localeCompare(b.meal||'')),activities=getActivity(selectedDate);
 const body=entries.length?entries.map(entry=>{
  const tone=foodTone(entry.meal);
  return '<article role="listitem" class="food-record-card tone-'+tone+'">'+
   '<div class="food-card-art">'+foodPicture(entry)+'<span class="food-art-spark" aria-hidden="true">✦</span></div>'+
   '<div class="food-card-content"><span class="food-meal-tag">'+mealIcon(entry.meal)+' '+htmlSafe(entry.meal||'Otro')+'</span>'+
    '<h3>'+htmlSafe(entry.title||'Comida')+'</h3><p>'+htmlSafe(foodPartsCaption(entry))+'</p></div>'+
   '<div class="food-card-bottom"><strong>'+locale(logTotal(entry.parts||[]),0)+' <small>kcal</small></strong>'+
    '<button type="button" class="food-edit-button" data-action="edit-food" data-id="'+htmlSafe(entry.id)+'" aria-label="Editar '+htmlSafe(entry.title||'comida')+'">Editar <span aria-hidden="true">✎</span></button></div></article>';
 }).join(''):'<div class="empty">Aún no hay comidas registradas para esta fecha. Puedes añadirlas debajo.</div>';
 const sport=activities.length?activities.map(a=>'<div class="day-entry"><div><strong>'+htmlSafe(a.type||'Actividad')+'</strong><small>'+htmlSafe(a.note||'Actividad física')+'</small></div><strong>'+locale(a.minutes,1)+' min</strong><button type="button" class="click sm" data-action="delete-activity" data-id="'+htmlSafe(a.id)+'">Eliminar</button></div>').join(''):
 '<div class="helper">Sin actividad registrada.</div>';
 const complete=(state.completeDays||[]).includes(selectedDate);
 const foodSection='<section class="section nutrition-overview food-records-section">'+foodSummary()+
  '<div class="food-diary-heading"><div><h3>Alimentos registrados</h3><p>Pulsa Editar para ajustar cualquier entrada.</p></div>'+
  '<label class="checkrow completed-toggle"><input type="checkbox" id="dayComplete" '+(complete?'checked':'')+'>Día completo</label></div>'+
  '<div class="food-record-grid" role="list">'+body+'</div>'+
  '<div class="nutrition-foot"><span class="nutrition-foot-star" aria-hidden="true">✦</span><span>'+
  (complete?'Día marcado como completo.':'Registro en curso: puede que todavía falten comidas.')+
  ' Las calorías son orientativas y las barras muestran el reparto de lo anotado.</span></div></section>';
 const activitySection='<section class="section"><div class="section-head"><div><h2>Actividad física</h2><p>Sesiones y minutos reales registrados.</p></div><button type="button" class="click sm" data-action="add-activity">+ Actividad</button></div>'+
  '<div class="day-entries">'+sport+'</div></section>';
 return kind==='food'?foodSection:kind==='activity'?activitySection:foodSection+activitySection;
}
function currentHistory(){
 const tracking=trackingStart(),valid=sortedWeights(),recent=valid.filter(w=>w.date>=tracking),older=valid.filter(w=>w.date<tracking);
 const history=Array.isArray(state.history)?state.history:[];
 let html='<div class="view-head"><span class="eyebrow">REGISTRO HISTÓRICO</span><h1>Historial de mediciones</h1><p>Mediciones recientes y lecturas antiguas conservadas por separado.</p></div>';
 html+=weightGraph();
 html+='<section class="section"><div class="section-head"><div><h2>Mediciones actuales</h2><p>'+recent.length+' días registrados desde '+htmlSafe(readableDate(tracking))+'</p></div><button class="click sm" data-action="weight-new">+ Medición</button></div>'+
 '<div class="history-scroll"><table class="history-table"><thead><tr><th>Fecha</th><th>Peso</th><th>Grasa</th><th>Músculo</th><th>Agua</th><th></th></tr></thead><tbody>'+
 recent.filter(w=>w.date<=selectedDate).slice().reverse().map(w=>'<tr><td>'+htmlSafe(readableDate(w.date))+(Array.isArray(w.alternates)&&w.alternates.length?'<details><summary class="helper">+'+w.alternates.length+' lectura adicional</summary>'+w.alternates.map(a=>'<div class="helper">'+htmlSafe(a.time||'Sin hora')+' · '+locale(a.weight,1)+' kg'+(isNumber(a.bodyFat)?' · grasa '+locale(a.bodyFat,1)+' %':'')+'</div>').join('')+'</details>':'')+'</td><td>'+locale(w.weight,1)+' kg</td><td>'+(!isNumber(w.bodyFat)?'—':locale(w.bodyFat,1)+' %')+'</td><td>'+(!isNumber(w.muscleMass)?'—':locale(w.muscleMass,1)+' kg')+'</td><td>'+(!isNumber(w.bodyWater)?'—':locale(w.bodyWater,1)+' %')+'</td><td><button type="button" class="click sm" data-action="weight-edit" data-date="'+w.date+'">Editar</button></td></tr>').join('')+
 '</tbody></table></div></section>';
 html+='<section class="section"><div class="section-head"><div><h2>Archivo anterior</h2><p>No se mezcla con la curva de seguimiento actual.</p></div><span class="helper">'+older.length+' lecturas anteriores</span></div>'+
 (older.length||history.length?'<details><summary class="click" style="display:inline-block">Mostrar archivo</summary><div class="history-scroll section-gap"><table class="history-table"><thead><tr><th>Fecha</th><th>Peso</th><th>Origen</th></tr></thead><tbody>'+
 older.map(w=>'<tr><td>'+htmlSafe(readableDate(w.date))+'</td><td>'+locale(w.weight,1)+' kg</td><td>Registro anterior</td></tr>').join('')+
 history.flatMap(h=>([{date:h.startDate,weight:h.start},...(h.weights||[])]).filter(w=>dateValid(w.date)&&isNumber(w.weight)).map(w=>'<tr><td>'+htmlSafe(readableDate(w.date))+'</td><td>'+locale(w.weight,1)+' kg</td><td>'+htmlSafe(h.name||'Archivo')+'</td></tr>')).join('')+
 '</tbody></table></div></details>':'<div class="empty">Sin lecturas archivadas.</div>')+'</section>';
 return html;
}
function currentSettings(){
 const p=state.profile;
 return '<div class="view-head"><span class="eyebrow">TU CUENTA</span><h1>Ajustes</h1><p>Objetivos, periodo de seguimiento, importación y exportación.</p></div>'+
 '<section class="section"><div class="section-head"><div><h2>Tu perfil</h2><p>Los cambios afectarán a tus proyecciones y gráficas.</p></div></div>'+
 '<form id="profileForm" class="profile-layout">'+
 '<label>Nombre visible<input name="profileName" maxlength="80" value="'+htmlSafe(p.name||'')+'" required></label>'+
 '<label>Peso objetivo (kg)<input name="targetWeight" type="number" min="20" max="500" step="0.1" inputmode="decimal" value="'+(isNumber(p.targetWeight)?p.targetWeight:'')+'"></label>'+
 '<label>Fecha de inicio del seguimiento actual<input name="trackingStartDate" type="date" value="'+trackingStart()+'"></label>'+
 '<label>Altura (cm)<input name="height" type="number" min="100" max="250" step="0.1" inputmode="decimal" value="'+(isNumber(p.height)?p.height:'')+'"></label>'+
 '<div><button type="submit" class="click primary">Guardar perfil</button></div></form></section>'+
 '<section class="section"><div class="section-head"><div><h2>Importar las mediciones de ChatGPT</h2><p>Incorpora varias fechas de golpe sin borrar registros anteriores.</p></div></div>'+
 '<p class="helper">Puedes abrir un enlace de importación preparado en esta conversación o pegar aquí un JSON. Solo se modifican los campos de las fechas incluidas.</p>'+
 '<textarea id="importJson" aria-label="JSON de mediciones" rows="6" class="section-gap" placeholder=\'{"type":"dinofit-chat-import-v1","weights":[{"date":"2026-01-15","weight":95.0}]}\'></textarea>'+
 '<div class="tools section-gap"><button type="button" class="click primary" data-action="import-paste">Importar ahora</button></div>'+
 (lastImportSummary?'<div class="notice success section-gap">'+htmlSafe(lastImportSummary)+'</div>':'')+'</section>'+
 '<section class="section"><h2>Copia de seguridad y sesión</h2><p class="helper section-gap">Exporta todas tus comidas, pesadas y actividad en un archivo JSON privado.</p><div class="tools section-gap"><button type="button" class="click" data-action="export">Descargar copia JSON</button><button type="button" class="click danger" data-action="logout">Cerrar sesión</button></div></section>';
}
function render(){
 if(!state||!account)return;
 renderCalendar();setSaveUI();
 for(const b of $$('button[data-view]'))b.classList.toggle('selected',b.dataset.view===activeView);
 const content=$('#content');if(!content)return;
 content.innerHTML=activeView==='history'?currentHistory():activeView==='settings'?currentSettings():currentDay();
}
