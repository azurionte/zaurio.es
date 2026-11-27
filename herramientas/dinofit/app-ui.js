
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
  {id:'weight',short:'Peso',label:'Peso · kilos perdidos',value:day?locale(day.weight,1)+' kg':last?locale(last.weight,1)+' kg':'—',
   hint:lost==null?'Añade la primera pesada':(lost>=0?'−':'+')+locale(Math.abs(lost),1)+' kg desde '+shortDate(first.date)},
  {id:'composition',short:'Ritmo',label:'Ritmo y composición',value:isNumber(pr.slope)&&pr.slope<0?locale(-pr.slope*1000,0)+' g/día':'—',
   hint:'Promedio de los últimos 14 días · ver grasa y músculo'},
  {id:'goal',short:'Objetivo',label:'Kilos que faltan',value:missing==null?'—':locale(Math.max(0,missing),1)+' kg',
   hint:isNumber(goal)?'Para llegar a '+locale(goal,1)+' kg':'Configura tu objetivo'},
  {id:'nutrition',short:'Kcal',label:today?'Kcal anotadas hoy':'Kcal del '+shortDate(selectedDate),value:dayLogs().length?locale(sum,0)+' kcal':'Sin registros',
   hint:dayLogs().length+' entradas de '+shortDate(selectedDate)+' · ver alimentos y añadir'}
 ];
 return '<div class="dashboard-tabs-frame"><div class="dashboard-tabs" role="tablist" aria-label="Áreas de tu seguimiento">'+
  cards.map(c=>'<button type="button" role="tab" class="section metric-card dashboard-tab '+(dashboardArea===c.id?'selected':'')+' '+(c.id==='weight'?'metric-main':'')+'" data-action="dashboard-tab" data-tab="'+c.id+'" id="dashboard-tab-'+c.id+'" tabindex="'+(dashboardArea===c.id?0:-1)+'" aria-selected="'+(dashboardArea===c.id)+'" aria-controls="dashboard-panel" aria-label="'+htmlSafe(c.short+' · '+c.label+': '+c.value+'. '+c.hint)+'">'+
   '<span class="eyebrow dashboard-label-full">'+htmlSafe(c.label)+'</span><span class="eyebrow dashboard-label-short">'+htmlSafe(c.short)+'</span><span class="dashboard-value">'+htmlSafe(c.value)+'</span>'+
   '<span class="micro">'+htmlSafe(c.hint)+'</span></button>').join('')+'</div></div>';
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
 out+=dashboardCards()+'<div id="dashboard-panel" role="tabpanel" aria-labelledby="dashboard-tab-'+dashboardArea+'" class="dashboard-panel">';
 if(dashboardArea==='composition')out+=metricGrid();
 else if(dashboardArea==='goal')out+=goalDashboard()+dayRecords('activity');
 else if(dashboardArea==='nutrition')out+=dayRecords('food')+quickFoods();
 else out+='<div class="section-head quick-weights"><div><h2>Pesadas y proyección</h2><p>Tu evolución medida, con acceso a los modelos de seguimiento.</p></div><button type="button" class="click sm" data-action="weight-new">+ Registrar peso</button></div>'+weightGraph();
 return out+'</div>';
}
function quickFoods(groups=[]){
 const stocked=groups.filter(g=>g.choices.length);
 const button=r=>{
  const mock={title:r.name,parts:r.parts.map(([foodId,qty])=>({foodId,qty}))};
  const kcal=mock.parts.every(p=>isNumber(food(p.foodId)?.kcal))?
   '≈ '+locale(logTotal(mock.parts.map(p=>makePart(p.foodId,p.qty))),0)+' kcal':'';
  const title=r.variant?r.name+' · '+r.variant:r.name;
  const availability=r.available?(r.available===1?'1 disponible':r.available+' disponibles'):'';
  const action=r.tupperId? 'data-action="pantry2-eat-tupper" data-id="'+htmlSafe(r.tupperId)+'" data-date="'+htmlSafe(selectedDate)+'"':
   'data-action="add-food" data-recipe="'+htmlSafe(r.id)+'"';
  return '<button class="food-button illustrated-quick" type="button" '+action+' aria-label="'+htmlSafe(['Añadir '+title,kcal,availability].filter(Boolean).join(' · '))+'">'+
   '<span class="food-top"><span class="quick-pictures">'+foodPicture(mock,'sticker')+
   (kcal?'<span class="quick-kcal">'+htmlSafe(kcal)+'</span>':'')+'</span><span class="quick-plus" aria-hidden="true">+</span></span>'+
   '<span class="quick-copy"><strong>'+htmlSafe(title)+'</strong>'+(availability?'<small class="quick-availability">'+htmlSafe(availability)+'</small>':'')+'</span></button>';
 };
 return '<section class="section quick-foods-section"><div class="section-head"><div><span class="eyebrow">A UN TOQUE</span><h2>¿Qué has comido?</h2><p>Registra un tupper, un tentempié o una bebida de tu despensa.</p></div></div>'+
  (stocked.length?stocked.map(g=>'<div class="quick-group food-group-'+g.id+'">'+
   '<div class="quick-group-title"><span class="quick-group-em" aria-hidden="true">'+g.emoji+'</span><div><h3>'+htmlSafe(g.title)+'</h3></div></div>'+
   '<div class="quick-grid">'+g.choices.map(button).join('')+'</div></div>').join(''):
   '<p class="empty">No hay platos preparados ni tentempiés o bebidas con existencias confirmadas para añadir.</p>')+'</section>';
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
 const sport=activities.length?activities.map(a=>'<div class="day-entry"><div><strong>'+htmlSafe(a.type||'Actividad')+'</strong><small>'+htmlSafe(a.note||'Actividad física')+'</small></div><strong>'+locale(a.minutes,1)+' min'+(Number.isFinite(a.activeKcal)?' · '+locale(a.activeKcal,0)+' kcal activas':'')+'</strong><button type="button" class="click sm" data-action="delete-activity" data-id="'+htmlSafe(a.id)+'">Eliminar</button></div>').join(''):
 '<div class="helper">Sin actividad registrada.</div>';
 const complete=(state.completeDays||[]).includes(selectedDate);
 const foodSection='<section class="section nutrition-overview food-records-section">'+foodSummary()+
  dfNutritionTotalsMarkup(entries.flatMap(e=>e.parts||[]),entries.filter(e=>!(e.parts||[]).length).length,'Información nutricional del día')+
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
 // Updating the calendar or sync status must not destroy an open purchase draft.
 if(activeView==='compra'&&content.querySelector('#compra-dialog[open]'))return;
 content.innerHTML=activeView==='pantry'?currentPantry():activeView==='history'?currentHistory():activeView==='settings'?currentSettings():activeView==='compra'?(globalThis.renderDinoCompra?.()||'<section class="section">Cargando Compra…</section>'):currentDay();
 if(activeView==='compra')globalThis.refreshDinoCompra?.();
}

/* DinoFit Compra: first-party public browser bundle. */
if(typeof window!=='undefined'&&window.document){(() => {
const SHOP_TZ='Europe/Madrid';
const dayMs=86400000;
const dayKey=/^\d{4}-\d{2}-\d{2}$/;
const clockKey=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
function validShopDate(d){
 if(typeof d!=='string'||!dayKey.test(d)||d<'2000-01-01'||d>'2099-12-31')return false;
 const t=Date.parse(d+'T00:00:00Z');
 return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===d;
}
function addShopDays(d,n){return new Date(Date.parse(d+'T00:00:00Z')+n*dayMs).toISOString().slice(0,10)}
function distance(a,b){return (Date.parse(a)-Date.parse(b))/dayMs}
const civil=new Intl.DateTimeFormat('en-CA',{timeZone:SHOP_TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function parts(t){return Object.fromEntries(civil.formatToParts(t).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]))}
function shopLocalDate(t=Date.now()){const p=parts(t);return p.year+'-'+p.month+'-'+p.day}
function madridTime(date,time){
 if(!validShopDate(date)||typeof time!=='string'||!clockKey.test(time))return null;
 const want=date+'T'+time,start=Date.parse(want+'Z');
 // Pick the first occurrence on a fall-back day. Move a skipped spring time
 // to the next real wall-clock minute rather than dropping the reminder.
 for(const h of [2,1]){const t=start-h*3600000,p=parts(t);if(p.year+'-'+p.month+'-'+p.day+'T'+p.hour+':'+p.minute===want)return t}
 for(let i=1;i<=60;i++){const t=start-7200000+i*60000,p=parts(t);if(p.year+'-'+p.month+'-'+p.day+'T'+p.hour+':'+p.minute>want)return t}
 return null;
}
function cleanShopPlan(p){
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
function shopOccurrence(p,index){
 if(!Number.isSafeInteger(index)||index<0||index>5300)return null;
 const shift=index*p.cadence*7,start=addShopDays(p.coverStart,shift),custom=p.changes[start];
 const order=custom?.order||addShopDays(p.orderDate,shift), delivery=custom?.delivery||addShopDays(p.deliveryDate,shift);
 const remind=custom?.remind||addShopDays(order,-p.lead);
 return {index,start,end:addShopDays(start,p.weeks*7),order,delivery,remind,skip:custom?.skip===true,custom:!!custom};
}
function shopUpcoming(p,now=Date.now(),count=4){
 const first=Math.max(0,Math.floor(distance(shopLocalDate(now),p.coverStart)/(p.cadence*7)));
 return Array.from({length:count},(_,j)=>shopOccurrence(p,first+j)).filter(Boolean);
}
function dueShopOccurrences(raw,now=Date.now()){
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

const PURCHASE_REMINDER_TIME='11:30';
const purchaseId=/^[A-Za-z0-9_-]{1,80}$/;
const assetHosts=new Set(['prod-mercadona.imgix.net']);
function cleanPurchaseImage(value){
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
function cleanPurchaseItem(item){
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
function cleanPurchaseOrder(raw){
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
function cleanPurchaseOrders(raw){
 const result=[], seen=new Set();
 for(const item of Array.isArray(raw)?raw:[]){
  const order=cleanPurchaseOrder(item);
  if(!order||seen.has(order.id))continue;
  seen.add(order.id);result.push(order);
 }
 return result;
}
function usualPurchase(orders){
 return cleanPurchaseOrders(orders).filter(x=>x.purchased).sort((a,b)=>b.orderDate.localeCompare(a.orderDate))[0]||null;
}
function purchaseEstimate(items){
 return items.reduce((s,x)=>({cents:s.cents+(x.cents==null?0:x.cents*x.qty),unknown:s.unknown+Number(x.cents==null)}),{cents:0,unknown:0});
}
function duePurchaseOrders(raw,now=Date.now()){
 const orders=cleanPurchaseOrders(raw),today=shopLocalDate(now);
 return orders.filter(o=>!o.purchased&&o.reminderDate===today).map(o=>({...o,when:madridTime(o.reminderDate,PURCHASE_REMINDER_TIME)}))
  .filter(o=>o.when!==null&&o.when<=now&&now-o.when<12*3600000);
}

function nextPurchaseDates(raw,today=shopLocalDate()){
 const fallback=addShopDays(today,3);
 const scheduled=cleanPurchaseOrders(Array.isArray(raw)?raw.filter(x=>!x?.cancelled&&!x?.canceled):[])
   .filter(x=>x.coverEnd>today).sort((a,b)=>a.coverStart.localeCompare(b.coverStart));
 // Follow the current or imminent purchase, filling the first gap before a later booking.
 let coverStart=scheduled[0]?.coverStart<=addShopDays(today,7)?scheduled[0].coverStart:fallback;
 for(const order of scheduled){
  if(order.coverStart>coverStart)break;
  if(order.coverEnd>coverStart)coverStart=order.coverEnd;
 }
 const next=scheduled.find(x=>x.coverStart>coverStart);
 const normalEnd=addShopDays(coverStart,14);
 const coverEnd=next&&next.coverStart<normalEnd?next.coverStart:normalEnd;
 return {coverStart,coverEnd,...purchaseLeadDates(coverStart)};
}

function purchaseLeadDates(coverStart){
 const weekday=new Date(coverStart+'T00:00:00Z').getUTCDay();
 const orderDate=addShopDays(coverStart,-(((weekday+3)%7)||7));
 const saturday=addShopDays(orderDate,2);
 return {orderDate,deliveryDate:saturday<coverStart?saturday:addShopDays(coverStart,-1),reminderDate:orderDate};
}

function applyPurchaseOrderChange(document,intended,expected,applyInventory=()=>undefined){
 const shopping=document.shoppingPlan||{};
 const rows=Array.isArray(shopping.orders)?shopping.orders:[];
 const found=rows.find(row=>row?.id===intended.id);
 const actual=found?cleanPurchaseOrder(found):null;
 const equivalent=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 if(actual&&equivalent(actual,intended))return {kind:'already'};
 if((found&&!actual)||!equivalent(actual,expected))return {kind:'changed'};
 const detail=applyInventory(intended);
 const next={...found,...intended};
 // An edit can intentionally remove a previously confirmed receipt total.
 for(const key of ['totalCents','feesCents','inventoryReceivedAt'])if(!Object.hasOwn(intended,key))delete next[key];
 document.shoppingPlan={...shopping,orders:found?rows.map(row=>row?.id===intended.id?next:row):[next,...rows]};
 return {kind:'apply',detail};
}


/* One key per operation avoids linear read/modify/write races between tabs. */
function makeCompraJournal(storage,owner){
 const prefix='dinofit-compra-outbox-v1:'+owner+':';
 function entry(raw,id){
  if(!raw||raw.id!==id||!purchaseId.test(id))return null;
  const item=cleanPurchaseOrder(raw.item),expected=raw.expected===null?null:cleanPurchaseOrder(raw.expected);
  if(!item||raw.expected!==null&&expected?.id!==item.id)return null;
  return {id,item,expected,at:Number(raw.at)||0,blocked:raw.blocked===true,
   draft:typeof raw.draft==='string'?raw.draft:'',message:typeof raw.message==='string'?raw.message.slice(0,250):''};
 }
 return {
  entries(){
   const result=[];
   for(let i=0;i<storage.length;i++){
    const key=storage.key(i);if(!key?.startsWith(prefix))continue;
    try{const op=entry(JSON.parse(storage.getItem(key)),key.slice(prefix.length));if(op)result.push(op);}catch{}
   }
   return result.sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
  },
  put(operation){
   const op=entry(operation,operation.id);if(!op)throw Error('Invalid purchase operation');
   storage.setItem(prefix+op.id,JSON.stringify(op));return op;
  },
  clear(id){if(purchaseId.test(id))storage.removeItem(prefix+id);}
 };
}

const eur=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'});
const esc=x=>htmlSafe(String(x??''));
const day=x=>x?x.split('-').reverse().join('/'):'—';
const cents=x=>x===''?null:Math.round(Number(x)*100);
const tile=(shape)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+shape+'</svg>';
const trash=tile('<path d="M4 7h16M10 10v7m4-7v7M9 7V4h6v3M6 7l1 13h10l1-13"/>');
const bell=tile('<path d="M18 8a6 6 0 0 0-12 0c0 6-3 7-3 9h18c0-2-3-3-3-9m-8 12a2 2 0 0 0 4 0"/>');
const bag=tile('<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/>');
const dates=(name,label,value,required=false)=>'<label>'+label+'<input type="date" name="'+name+'"'+(required?' required':'')+' value="'+esc(value)+'"></label>';
const number=(name,label,value,min,max)=>'<label>'+label+'<input type="number" name="'+name+'" required min="'+min+'" max="'+max+'" value="'+value+'"></label>';
const defaults=()=>{const today=shopLocalDate();return {coverStart:addShopDays(today,3),orderDate:today,deliveryDate:addShopDays(today,1),weeks:2,cadence:2,lead:0,time:PURCHASE_REMINDER_TIME,enabled:false,changes:{}}};
const sample={coverStart:'2026-12-01',orderDate:'2026-11-27',deliveryDate:'2026-11-28',weeks:2,cadence:2,lead:0,time:PURCHASE_REMINDER_TIME,enabled:false,changes:{}};
function currentShop(){return state?.shoppingPlan||{}}
const orders=()=>cleanPurchaseOrders(currentShop().orders);
let pushStatus='',pushAccount=null,deviceActive=false;
const priceText=({cents,unknown})=>eur.format(cents/100)+(unknown?' · '+unknown+' sin precio':'');
const promptStatus=()=>deviceActive?bell+'<span>Notificaciones activadas</span>':bell+'<span>Activar notificaciones</span>';
function legacyCalendar(){
 const plan=currentShop().plan,p=cleanShopPlan(plan)||defaults();
 if(!plan)return '';
 const entries=shopUpcoming(p),enabled=!!plan?.enabled;
 return  '<details class="compra-legacy"><summary>Calendario recurrente anterior</summary><p class="helper">Las fechas son orientativas; no reservan entregas. Puedes adelantar solo una compra si cae en festivo.</p>'+
 (!plan?'<p><button class="click sm" type="button" data-shop="sample">Usar el ejemplo de diciembre (sin activar avisos)</button></p>':'')+
 '<form class="compra-dates" id="compra-plan">'+dates('coverStart','Primer día que cubre',p.coverStart)+dates('orderDate','Hacer el primer pedido',p.orderDate)+dates('deliveryDate','Primera entrega prevista',p.deliveryDate)+
 number('weeks','Semanas que cubre',p.weeks,1,8)+number('cadence','Repetir cada (semanas)',p.cadence,1,8)+number('lead','Avisar días antes del pedido',p.lead,0,21)+
 '<label>Hora del aviso (España peninsular)<input name="time" type="time" required value="'+esc(p.time)+'"></label>'+
 '<label class="compra-check"><input name="enabled" type="checkbox"'+(enabled?' checked':'')+'> Programar avisos de compra</label>'+
 '<div class="tools"><button class="click primary">Guardar calendario</button></div></form>'+
 (entries.length?'<h3>Próximas compras</h3><p class="helper">La fecha final es el inicio de la semana siguiente.</p>'+entries.map(item=>'<details class="compra-occur"><summary>Cubre '+day(item.start)+' al '+day(item.end)+(item.skip?' · Sin aviso':item.custom?' · Ajuste puntual':'')+'</summary>'+
 '<form class="compra-dates compra-override" data-cover="'+esc(item.start)+'">'+dates('order','Pedido previsto',item.order)+dates('delivery','Entrega prevista',item.delivery)+
 dates('remind','Fecha de aviso',item.remind)+'<label class="compra-check"><input name="skip" type="checkbox"'+(item.skip?' checked':'')+'> Omitir aviso de esta compra</label>'+
 '<div class="tools"><button class="click primary">Guardar este ajuste</button>'+(item.custom?'<button class="click" type="button" data-shop="reset" data-cover="'+esc(item.start)+'">Volver a fechas habituales</button>':'')+'</div></form></details>').join(''):'')+'</details>';
}

let editorDraft=null,compraSaving=false;
const draftKey=()=>account?.id?'dinofit-purchase-draft-v1:'+account.id:null;
function readPurchaseDraft(){
 try{
  const key=draftKey(),draft=key?JSON.parse(sessionStorage.getItem(key)||'null'):null;
  if(!draft||typeof draft.id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(draft.id)||!Array.isArray(draft.items)||draft.items.length>100||
   (draft.expected!==null&&cleanPurchaseOrder(draft.expected)?.id!==draft.id))return null;
  return {...draft,expected:draft.expected===null?null:cleanPurchaseOrder(draft.expected)};
 }catch{return null;}
}
function forgetPurchaseDraft(id){
 try{const key=draftKey();if(key&&readPurchaseDraft()?.id===id)sessionStorage.removeItem(key);}catch{}
}
function rememberPurchaseDraft(form){
 if(!editorDraft||!form||editorDraft.id!==form.dataset.id||compraSaving)return;
 const dates=Object.fromEntries(['orderDate','deliveryDate','coverStart','coverEnd','reminderDate'].map(k=>[k,form.elements[k].value]));
 const items=[...form.querySelectorAll('.compra-item')].map(el=>({...collected(el),draftQty:el.elements.cantidad.value,draftPrice:el.elements.precio.value}));
 try{const key=draftKey();if(key)sessionStorage.setItem(key,JSON.stringify({...editorDraft,dates,items}));}catch{}
}

function shopRender(){
 const pending=readPurchaseDraft(), queued=journalEntries();
 const saved=orders().sort((a,b)=>b.coverStart.localeCompare(a.coverStart)||b.orderDate.localeCompare(a.orderDate));
 if(pushAccount!==account?.id){pushAccount=account?.id;deviceActive=false;readyDevice=null;deviceLoading=null;pushStatus='';}
 void preparePushDevice().catch(()=>{});
 const rows=saved.map(x=>{
   const id=esc(x.id),n=x.items.length;
   const estimate=x.totalCents==null?priceText(purchaseEstimate(x.items)):eur.format(x.totalCents/100);
   const onList=x.purchased?'<span class="compra-stock-note">'+(x.inventoryReceived?'Recepción confirmada':x.deliveryDate?'Entrega prevista el '+day(x.deliveryDate):'Por añadir a Despensa')+'</span>':
     (x.reminderDate?'<span class="compra-stock-note">Aviso '+day(x.reminderDate)+' · 11:30</span>':'');
   return '<article class="compra-card"><div class="compra-card-main"><button type="button" class="compra-open" data-shop="edit" data-id="'+id+'">Compra del '+day(x.coverStart)+' al '+day(addShopDays(x.coverEnd,-1))+'</button>'+
    '<div class="compra-card-info"><span>Pedido del '+day(x.orderDate)+'</span><span>'+n+' '+(n===1?'producto':'productos')+'</span><span>'+esc(estimate)+' estimados</span></div>'+onList+'</div>'+
    '<div class="compra-card-actions"><button type="button" class="compra-state" data-shop="toggle" data-id="'+id+'" aria-pressed="'+x.purchased+'" title="'+(x.purchased?'Marcar pendiente':'Marcar comprado')+'">'+(x.purchased?'Comprado':'Pendiente')+'</button>'+
    (x.purchased&&!x.inventoryReceived?'<button type="button" class="compra-receive" data-shop="receive" data-id="'+id+'">Añadir a Despensa</button>':'')+'</div></article>';
 }).join('');
 return '<section class="section compra compra-home"><header class="compra-head"><div><p class="eyebrow">MERCADONA · PLANIFICACIÓN</p><h1>Compra</h1></div>'+
   '<div class="compra-notifs"><button type="button" id="compra-push-control" class="compra-squircle" data-shop="subscribe" '+(deviceActive?'disabled':'')+'>'+promptStatus()+'</button>'+
   '<details id="compra-push-options" class="compra-push-options" '+(deviceActive?'':'hidden')+'><summary>Opciones de aviso</summary><div><button type="button" class="click sm" data-shop="test">Enviar aviso de prueba</button><button type="button" class="click sm" data-shop="unsubscribe">Desactivar en este dispositivo</button></div></details></div></header>'+
   '<p id="compra-push-status" class="compra-push-status" role="status">'+esc(pushStatus)+'</p>'+
   '<div class="compra-board-head"><div><h2>Mis compras</h2><p class="helper">Organiza tus pedidos y el período que cubren.</p></div><button type="button" class="click primary compra-plan-button" data-shop="new"><span aria-hidden="true">+</span> Planificar compra</button></div>'+
   (queued.length?'<p class="compra-draft-bar" role="status">'+(queued.some(op=>op.blocked)?'Hay cambios pendientes que necesitan revisión.':'Hay compras pendientes de sincronizar.')+' <button type="button" class="click sm" data-shop="retry-outbox">Reintentar sincronización</button></p>'+queued.filter(o=>o.blocked).map(o=>
    '<p class="compra-draft-bar">Compra del '+day(o.item.orderDate)+' <button type="button" class="click sm" data-shop="discard-blocked" data-id="'+esc(o.id)+'">Descartar cambio rechazado</button></p>').join(''):'')+
   (pending?'<p class="compra-draft-bar"><button class="click sm" type="button" data-shop="continue-draft">Continuar borrador</button> <button class="click sm" type="button" data-shop="discard-draft">Descartar borrador</button></p>':'')+
   (rows?'<div class="compra-board">'+rows+'</div>':'<div class="compra-empty">'+bag+'<strong>Todavía no hay compras guardadas</strong><p>Prepara la próxima y añade un aviso si lo necesitas.</p></div>')+
   legacyCalendar()+'<dialog id="compra-dialog" class="compra-dialog" aria-labelledby="compra-dialog-title"></dialog></section>';
}
globalThis.renderDinoCompra=shopRender;
globalThis.refreshDinoCompra=()=>totals();

function purchaseRow(item){
 const p=item||{id:crypto.randomUUID(),name:'',pack:'',qty:1,cents:null};
 const product=esc(p.name),image=esc(p.imageUrl);
 const thumb='<div class="compra-thumb" aria-hidden="true">'+bag+(image?'<img data-mercadona-image="'+image+'" alt="" width="48" height="48" hidden>':'')+'</div>';
 return '<fieldset class="compra-item" data-item="'+esc(p.id)+'" data-image="'+image+'"'+(p.inventory?' data-inventory="'+esc(JSON.stringify(p.inventory))+'"':'')+' data-product-id="'+esc(p.productId)+'">'+
  thumb+'<label class="compra-item-name">Producto<input name="producto" required maxlength="100" value="'+product+'"></label>'+
  '<label class="compra-item-qty">Cantidad<input name="cantidad" type="number" min="1" max="999" step="1" required value="'+esc(p.draftQty??p.qty)+'"></label>'+
  '<label class="compra-item-price">Precio (€)<input name="precio" type="number" min="0" max="1000" step="0.01" value="'+esc(p.draftPrice??(p.cents==null?'':p.cents/100))+'"></label>'+
  '<button class="compra-trash" type="button" data-shop="remove" aria-label="'+(p.name?'Quitar '+product:'Quitar producto')+'">'+trash+'</button>'+
  '<input type="hidden" name="formato" value="'+esc(p.pack)+'">'+
  '<output class="compra-line-total" aria-label="Subtotal de este producto"></output></fieldset>';
}
function viewOrder(existing=null,draft=null){
 const d=document.querySelector('#compra-dialog');if(!d)return;
 editorDraft={id:draft?.id||existing?.id||crypto.randomUUID(),expected:draft?draft.expected:existing};
 const savedDates=draft?.dates;
 const suggested=existing||nextPurchaseDates(currentShop().orders),start=suggested.coverStart,last=usualPurchase(currentShop().orders);
 const lastDay=addShopDays(suggested.coverEnd,-1);
 const oldList=!last&&Array.isArray(currentShop().items)&&currentShop().items.length>0;
 const legacyItems=oldList?'<button class="click" type="button" data-shop="previous-list">Recuperar lista anterior</button>':'';
 const hasReceipt=existing?.totalCents!=null;
 d.innerHTML='<form id="compra-order" data-id="'+esc(editorDraft.id)+'">'+
 '<header class="compra-modal-head"><div><p class="eyebrow">'+(existing?'DETALLE DEL PEDIDO':'NUEVO PEDIDO')+'</p><h2 id="compra-dialog-title">'+(existing?'Compra del '+day(start):'Planificar compra')+'</h2></div><button class="compra-close" type="button" data-shop="close" aria-label="Cerrar">×</button></header>'+
 '<div class="compra-modal-body">'+
 '<details class="compra-period"><summary>Período que cubre <span id="compra-period-label">'+day(start)+' – '+day(lastDay)+'</span></summary><div class="compra-dates">'+dates('coverStart','Desde',savedDates?.coverStart??start,true)+dates('coverEnd','Hasta',savedDates?.coverEnd??lastDay,true)+'</div></details>'+
 '<div class="compra-dates compra-order-dates">'+dates('orderDate','Fecha del pedido',savedDates?.orderDate??suggested.orderDate,true)+dates('deliveryDate','Fecha de entrega (opcional)',savedDates?.deliveryDate??suggested.deliveryDate)+dates('reminderDate','Fecha del recordatorio (opcional)',savedDates?.reminderDate??suggested.reminderDate)+'</div>'+
 '<p class="helper compra-time">Los avisos se envían a las 11:30, hora peninsular.</p>'+
 '<div class="compra-products-head"><h3>Productos</h3><div class="compra-actions"><button class="click" type="button" data-shop="usual" '+(last?'':'disabled title="Todavía no hay una compra marcada como comprada"')+'>Cargar compra usual</button>'+
 '<button class="click" type="button" data-shop="add">Añadir producto</button><button class="click" type="button" data-shop="clear">Empezar de cero</button>'+legacyItems+'</div></div>'+
 '<div id="compra-products">'+(draft?.items||existing?.items||[]).filter(x=>x&&typeof x==='object').map(x=>purchaseRow({...x,id:x.id||crypto.randomUUID()})).join('')+'</div>'+
 '<p id="compra-products-empty" class="helper">Añade un producto o recupera los de tu última compra.</p>'+
 (hasReceipt?'<aside class="compra-receipt"><span>Total estimado del pedido</span><strong>'+eur.format(existing.totalCents/100)+'</strong>'+(existing.feesCents?'<small>Incluye '+eur.format(existing.feesCents/100)+' de preparación o envío.</small>':'')+'</aside>':'')+
 '<p id="compra-form-error" class="compra-form-error" role="alert" hidden></p></div>'+
 '<footer class="compra-modal-foot"><div class="compra-total"><span>Subtotal estimado de productos</span><output id="compra-total"></output></div><button class="click primary">Guardar compra</button></footer></form>';
 d.addEventListener('close',()=>{productObserver?.disconnect();editorDraft=null;if(activeView==='compra')render();},{once:true});
 d.oncancel=e=>{if(compraSaving)e.preventDefault();};
 const editor=d.querySelector('#compra-order');
 let previousLead=purchaseLeadDates(savedDates?.coverStart||start);
 editor.elements.orderDate.addEventListener('change',()=>moveReminderWithOrderDate(editor));
 editor.elements.coverStart.addEventListener('change',()=>{
  const value=editor.elements.coverStart.value;if(!value)return;
  const nextLead=purchaseLeadDates(value);
  for(const key of ['orderDate','deliveryDate','reminderDate']){
   const field=editor.elements[key];
   if(field.value===previousLead[key])field.value=nextLead[key];
  }
  previousLead=nextLead;totals();rememberPurchaseDraft(editor);
 });
 d.showModal();totals();prepareProductImages(d);
}
function collected(el){
 let inventory=null;
 try{inventory=JSON.parse(el.dataset.inventory||'null')}catch{}
 return {id:el.dataset.item,name:el.elements.producto.value.trim(),pack:el.elements.formato.value.trim(),qty:Number(el.elements.cantidad.value),
  cents:cents(el.elements.precio.value),...(el.dataset.productId?{productId:el.dataset.productId}:{}),...(el.dataset.image?{imageUrl:el.dataset.image}:{}),...(inventory?{inventory}:{})};
}
function totals(){
 const form=document.querySelector('#compra-order');if(!form)return;
 const rows=[...form.querySelectorAll('.compra-item')];
 const estimate=purchaseEstimate(rows.map(collected));
 form.querySelector('#compra-products-empty').hidden=rows.length>0;
 form.querySelector('#compra-total').textContent=priceText(estimate);
 form.querySelector('#compra-period-label').textContent=day(form.elements.coverStart.value)+' – '+day(form.elements.coverEnd.value);
 for(const el of rows){const x=collected(el);el.querySelector('output').textContent=x.cents===null?'Sin precio':eur.format((x.cents*x.qty)/100);}
}
function formError(form,text){
 const help=form.querySelector('#compra-form-error');help.hidden=!text;help.textContent=text;
}
function replaceProducts(list){
 const area=document.querySelector('#compra-products');if(!area)return;
 if(area.children.length&&!confirm('¿Sustituir los productos de esta compra?'))return;
 area.innerHTML=list.slice(0,100).map(x=>purchaseRow({...x,id:crypto.randomUUID()})).join('');
 totals();prepareProductImages(area);
 rememberPurchaseDraft(area.closest('form'));
 area.querySelector('input:not([type=hidden])')?.focus();
}
async function saveUpdate(patch,msg){
 if(!state||!account)return;
 state.shoppingPlan={...currentShop(),...patch};changed();
 toast(await persistNow()?msg:'No se pudo guardar en tu cuenta. Revisa el estado de sincronización.');
}


function journal(){
 const owner=account?.id;if(!owner)return null;
 try{return makeCompraJournal(localStorage,owner);}catch{return null;}
}
function journalEntries(){try{return journal()?.entries()||[];}catch{return [];}}
function draftMarker(draft){return draft?JSON.stringify([draft.dates,draft.items]):'';}
function stageCompraOperation(item,expected,message,keepDraft){
 const box=journal();if(!box)return {error:'El navegador no permite conservar cambios pendientes. El editor sigue abierto.'};
 try{
  const prior=box.entries().filter(o=>o.item.id===item.id);
  const existing=prior.find(o=>JSON.stringify(o.item)===JSON.stringify(item)&&JSON.stringify(o.expected)===JSON.stringify(expected));
  if(existing)return {box,op:existing};
  if(prior.length)return {error:'Ya hay cambios pendientes en esta compra. Revisa primero esa versión para no perder ninguno.'};
  const op=box.put({id:crypto.randomUUID(),item,expected,at:Date.now(),message,draft:keepDraft?draftMarker(readPurchaseDraft()):''});
  return {box,op};
 }catch{return {error:'El navegador no pudo conservar esta compra. El editor y sus datos siguen abiertos.'};}
}
async function applyJournalEntry(box,op){
 if(navigator.onLine===false)return {kind:'offline'};
 let result;
 try{result=await persistCompraMutation(document=>applyPurchaseOrderChange(document,op.item,op.expected,globalThis.syncDinoCompraInventory));}
 catch{result={kind:'offline'};}
 try{
  if(result.kind==='ok'||result.kind==='committed-with-local-edits')box.clear(op.id);
  else if(result.kind==='changed'||result.kind==='invalid')box.put({...op,blocked:true});
 }catch{/* Save acknowledgement is separate from cleanup; operation remains idempotent. */}
 return result;
}
let outboxTimer=null,outboxDelay=8000,outboxRunning=false;
function scheduleCompraReplay(){
 if(outboxTimer||!account||navigator.onLine===false)return;
 const owner=account.id;
 outboxTimer=setTimeout(()=>{
  outboxTimer=null;if(account?.id===owner)void resumeCompraOutbox();
 },outboxDelay);
 outboxDelay=Math.min(120000,outboxDelay*2);
}
async function resumeCompraOutbox(includeBlocked=false){
 if(outboxRunning||compraSaving||!state||!account||navigator.onLine===false)return;
 const owner=account.id,box=journal();if(!box)return;
 outboxRunning=true;
 let needsRetry=false,redraw=false;
 try{
  const list=journalEntries().filter(op=>includeBlocked||!op.blocked);
  for(const op of list){
   if(account?.id!==owner||compraSaving)break;
   const result=await applyJournalEntry(box,op);
   if(account?.id!==owner)return;
   redraw=true;
   if(result.kind==='ok'||result.kind==='committed-with-local-edits'){
    outboxDelay=8000;
    const draft=readPurchaseDraft();
    if(draft?.id===op.item.id&&op.draft&&draftMarker(draft)===op.draft)forgetPurchaseDraft(draft.id);
    if(activeView==='compra')toast('Compra sincronizada'+(result.kind==='committed-with-local-edits'?'. Hay otros cambios locales pendientes.':'.'));
   }else if(['offline','busy','retries'].includes(result.kind)){
    needsRetry=true;break;
   }else if(result.kind==='changed'&&activeView==='compra')toast('Otra sesión cambió una compra pendiente. No se ha sobrescrito.');
  }
 }finally{
  outboxRunning=false;
  if(needsRetry&&account?.id===owner)scheduleCompraReplay();
  if(redraw&&account?.id===owner&&activeView==='compra')render();
 }
}
globalThis.resumeDinoCompraSync=()=>{void resumeCompraOutbox();};
window.addEventListener('online',()=>{outboxDelay=8000;void resumeCompraOutbox();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void resumeCompraOutbox();});
window.addEventListener('storage',e=>{
 if(account?.id&&e.key?.startsWith('dinofit-compra-outbox-v1:'+account.id+':'))void resumeCompraOutbox();
});

async function saveOrder(item,expected,msg,form=null){
 if(!state||!account||compraSaving)return;
 const owner=account.id;
 if(form)rememberPurchaseDraft(form);
 const staged=stageCompraOperation(item,expected,msg,!!form);
 if(staged.error){if(form)formError(form,staged.error);else toast(staged.error);return;}
 compraSaving=true;
 if(form){formError(form,'');form.inert=true;form.setAttribute('aria-busy','true');}
 let result;
 try{result=await applyJournalEntry(staged.box,staged.op);}
 catch{result={kind:'offline'};}
 finally{compraSaving=false;if(form){form.inert=false;form.removeAttribute('aria-busy');}}
 if(account?.id!==owner)return;
 if(result.kind==='ok'||result.kind==='committed-with-local-edits'){
  forgetPurchaseDraft(item.id);
  const dialog=document.querySelector('#compra-dialog');
  if(form&&dialog?.open)dialog.close();
  const stock=result.detail;
  if(stock&&item.inventoryReceived&&stock.skipped&&stock.linked)msg+=' Los demás productos no estaban vinculados.';
  if(stock&&item.inventoryReceived&&!stock.linked)msg='Recepción guardada. No se añadieron existencias: no hay productos vinculados a Despensa.';
  if(result.kind==='committed-with-local-edits')msg+=' Hay otros cambios locales que siguen sin sincronizarse.';
  if(activeView==='compra')render();
  toast(msg);
  return;
 }
 const messages={
  changed:'Otra sesión cambió esta compra. No se ha sobrescrito. Puedes cerrar el editor y descartar este cambio pendiente para abrir la versión guardada.',
  local:'Hay otros cambios de esta pestaña sin sincronizar. La compra no se ha escrito y el borrador sigue guardado.',
  session:'Vuelve a entrar en tu cuenta para guardar la compra.',
  retries:'La cuenta está cambiando en otra sesión. El cambio queda pendiente y se reintentará automáticamente.',
  busy:'Hay un guardado en curso. Vuelve a intentarlo en un momento.',
  offline:'Sin confirmación del servidor. La compra queda pendiente y se guardará al recuperar la conexión.',
  invalid:'No se pudo guardar la compra. Revisa los datos.'
 };
 if(['offline','busy','retries'].includes(result.kind))scheduleCompraReplay();
 const problem=result.message||messages[result.kind]||messages.offline;
 if(form&&form.isConnected)formError(form,problem);else toast(problem);
}
document.addEventListener('input',e=>{const form=e.target.closest('#compra-order');if(form){totals();rememberPurchaseDraft(form);}});
document.addEventListener('error',e=>{if(e.target.matches?.('.compra-thumb img'))e.target.hidden=true},true);
document.addEventListener('submit',e=>{
 const form=e.target;
 if(!form.matches('#compra-order,#compra-plan,.compra-override'))return;
 e.preventDefault();e.stopImmediatePropagation();
 const data=Object.fromEntries(new FormData(form));
 if(form.id==='compra-order'){
  if(compraSaving||!editorDraft||editorDraft.id!==form.dataset.id)return;
  const previous=editorDraft.expected;
  const items=[...form.querySelectorAll('.compra-item')].map(row=>{
   const item=collected(row),old=previous?.items.find(x=>x.id===item.id);
   if(old&&old.name!==item.name){delete item.inventory;delete item.imageUrl;delete item.productId;}
   if(!item.inventory)item.inventory=globalThis.suggestDinoCompraInventory?.(item)||undefined;
   return item;
  });
  if(!items.length){formError(form,'Añade al menos un producto.');return;}
  if(data.coverEnd<data.coverStart){formError(form,'El último día no puede ser anterior al inicio.');form.querySelector('.compra-period').open=true;return;}
  if(data.deliveryDate&&data.deliveryDate<data.orderDate){formError(form,'La entrega no puede ser anterior al pedido.');return;}
  if(!previous?.purchased&&data.reminderDate&&data.reminderDate!==previous?.reminderDate&&madridTime(data.reminderDate,PURCHASE_REMINDER_TIME)<=Date.now()){
   formError(form,'Elige una fecha cuyo aviso de las 11:30 todavía no haya pasado.');return;
  }
  const two=x=>x.map(z=>[z.name,z.pack,z.qty,z.cents]);
  const same=previous&&JSON.stringify(two(previous.items))===JSON.stringify(two(items));
  const item=cleanPurchaseOrder({...previous,...data,coverEnd:addShopDays(data.coverEnd,1),id:editorDraft.id,items,deliveryDate:data.deliveryDate||null,reminderDate:data.reminderDate||null,
   totalCents:same?previous.totalCents:undefined,feesCents:same?previous.feesCents:undefined});
  if(!item){formError(form,'Revisa el nombre, las cantidades, los precios y las fechas.');return;}
  void saveOrder(item,previous,item.reminderDate&&!item.purchased?'Compra guardada con aviso a las 11:30.':'Compra guardada.',form);
  return;
 }
 if(form.id==='compra-plan'){
  const old=currentShop().plan;
  const preserve=old?.coverStart===data.coverStart&&Number(old.cadence)===Number(data.cadence);
  if(!preserve&&Object.keys(old?.changes||{}).length&&!confirm('Al cambiar el inicio o la frecuencia se quitarán los ajustes puntuales anteriores. ¿Continuar?'))return;
  const plan=cleanShopPlan({...data,enabled:data.enabled==='on',changes:preserve?old.changes:{}});
  if(!plan){toast('Revisa las fechas y la frecuencia: no debe haber solapes.');return}
  void saveUpdate({plan},'Calendario guardado');return;
 }
 const plan=cleanShopPlan(currentShop().plan),key=form.dataset.cover;
 if(!plan||!shopUpcoming(plan).some(x=>x.start===key))return;
 const override={order:data.order,delivery:data.delivery,remind:data.remind,skip:data.skip==='on'};
 const next=cleanShopPlan({...plan,changes:{...plan.changes,[key]:override}});
 if(!next?.changes[key]||next.changes[key].remind!==data.remind){toast('Revisa las fechas: aviso antes del pedido y pedido antes de la entrega.');return}
 void saveUpdate({plan:next},'Ajuste puntual guardado');
},true);

function keyBytes(string){return Uint8Array.from(atob(string.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(string.length/4)*4,'=')),c=>c.charCodeAt(0))}
async function pushApi(action,body){
 const {data}=await db.auth.getSession();
 const token=data.session?.access_token;
 if(!token)throw Error('Entra en tu cuenta para gestionar avisos.');
 const r=await fetch(SUPABASE_URL+'/functions/v1/dinofit-push/'+action,{method:'POST',headers:{'Content-Type':'application/json',apikey:SUPABASE_KEY,Authorization:'Bearer '+token},body:JSON.stringify(body)});
 const result=await r.json().catch(()=>null);
 if(!r.ok||!result?.ok)throw Error(result?.message||'No se pudo conectar con el servicio de avisos.');
 return result;
}
let pushBusy=false,readyDevice=null,deviceLoading=null;
function preparePushDevice(){
 if(!('serviceWorker'in navigator)||!('Notification'in window)||!('PushManager'in window))return Promise.resolve(null);
 if(!deviceLoading){const owner=account?.id;deviceLoading=(async()=>{
  await navigator.serviceWorker.register('/dinofit/app-pantry.js?compra-worker=1',{scope:'/dinofit/'});
  const registration=await navigator.serviceWorker.ready;
  const {publicKey}=await pushApi('key',{});
  if(owner!==account?.id)return null;
  const subscription=await registration.pushManager.getSubscription();
  if(subscription&&Notification.permission==='granted'){
   const result=await pushApi('status',{endpoint:subscription.endpoint}).catch(()=>null);
   if(owner===account?.id)setDeviceActive(result?.active===true);
  }
  return owner===account?.id?(readyDevice={registration,applicationServerKey:keyBytes(publicKey)}):null;
 })().catch(e=>{if(owner===account?.id)deviceLoading=null;throw e});}
 return deviceLoading;
}
async function changePush(action){
 if(pushBusy)return;
 if(!('serviceWorker'in navigator)||!('Notification'in window)||!('PushManager'in window)){reportPush('Este navegador no permite avisos aquí. En iPhone, abre DinoFit desde la pantalla de inicio.');return}
 pushBusy=true;
 try{
  if(action==='subscribe'&&await Notification.requestPermission()!=='granted')throw Error('Los avisos no tienen permiso. Revisa los ajustes de notificaciones del dispositivo.');
  reportPush('Comprobando notificaciones…');
  if(!readyDevice){await preparePushDevice();if(action==='subscribe'){reportPush('Toca otra vez Activar notificaciones para vincular este dispositivo.');return}}
  if(!readyDevice)throw Error('No se pudo preparar este dispositivo.');
  const {registration,applicationServerKey}=readyDevice;
  let sub=await registration.pushManager.getSubscription();
  if(action==='subscribe'){
   if(!sub){
    sub=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey});
   }
   await pushApi('subscribe',{subscription:sub.toJSON()});
   setDeviceActive(true);
   reportPush('Avisos activados en este dispositivo. Ya puedes enviar una prueba.');
  }else if(action==='test'){
   if(!sub)throw Error('Activa primero los avisos en este dispositivo.');
   await pushApi('test',{endpoint:sub.endpoint});
   reportPush('Prueba enviada al servicio de notificaciones. Comprueba si te llega.');
  }else{
   if(sub){await pushApi('unsubscribe',{endpoint:sub.endpoint});await sub.unsubscribe();}
   setDeviceActive(false);
   reportPush('Avisos desactivados en este dispositivo.');
  }
 }catch(error){reportPush(error.message||'No se pudieron configurar los avisos.')}
 finally{pushBusy=false}
}


const imageCache=new Map(),imageQueue=[];
let imageInflight=0;
function drainProductImages(){
 while(imageInflight<4&&imageQueue.length){
  const {url,resolve}=imageQueue.shift();imageInflight++;
  void pushApi('image',{url}).then(r=>resolve(
   typeof r.image==='string'&&r.image.length<350000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(r.image)?r.image:null
  ),()=>resolve(null)).finally(()=>{imageInflight--;drainProductImages()});
 }
}
function productImage(url){
 if(!imageCache.has(url)){
  imageCache.set(url,new Promise(resolve=>{imageQueue.push({url,resolve});drainProductImages()}));
  if(imageCache.size>96)imageCache.delete(imageCache.keys().next().value);
 }
 const promise=imageCache.get(url);
 return promise.then(src=>{if(!src&&imageCache.get(url)===promise)imageCache.delete(url);return src});
}
function hydrateProductImage(thumb){
 const img=thumb.querySelector('img[data-mercadona-image]');if(!img)return;
 const url=img.dataset.mercadonaImage;
 if(!url)return;delete img.dataset.mercadonaImage;
 void productImage(url).then(src=>{if(src&&img.isConnected){img.addEventListener('load',()=>{img.hidden=false},{once:true});img.src=src}});
}
let productObserver;
function prepareProductImages(root){
 const thumbs=root.querySelectorAll('.compra-thumb:has(img[data-mercadona-image])');
 if(typeof IntersectionObserver==='undefined'){for(const el of thumbs)hydrateProductImage(el);return;}
 if(!productObserver)productObserver=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){productObserver.unobserve(entry.target);hydrateProductImage(entry.target)}
 },{rootMargin:'120px'});
 for(const el of thumbs)productObserver.observe(el);
}

function setDeviceActive(value){
 deviceActive=value;
 const button=document.querySelector('#compra-push-control'),options=document.querySelector('#compra-push-options');
 if(button){button.disabled=value;button.innerHTML=promptStatus();}
 if(options)options.hidden=!value;
}
function removePurchaseProduct(button){
 const row=button.closest('.compra-item');if(!row)return;
 const dialog=row.closest('.compra-dialog');
 const scrolls=[dialog,dialog?.querySelector('.compra-modal-body')].filter(Boolean).map(el=>[el,el.scrollTop]);
 const nearest=row.nextElementSibling||row.previousElementSibling;
 const focus=nearest?.querySelector('[data-shop="remove"]')||dialog?.querySelector('[data-shop="add"]');
 row.remove();totals();
 focus?.focus({preventScroll:true});
 for(const [el,top] of scrolls)el.scrollTop=Math.min(top,Math.max(0,el.scrollHeight-el.clientHeight));
}
function reportPush(msg){pushStatus=msg;const el=document.querySelector('#compra-push-status');if(el)el.textContent=msg}
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-shop]');if(!button)return;
 e.preventDefault();e.stopImmediatePropagation();
 const a=button.dataset.shop;
 if(a==='retry-outbox'){outboxDelay=8000;void resumeCompraOutbox(true);}
 else if(a==='discard-blocked'){
  const box=journal(),op=journalEntries().find(entry=>entry.id===button.dataset.id&&entry.blocked);
  if(!box||!op||!confirm('¿Descartar este cambio rechazado y su borrador? La compra guardada no se modificará.'))return;
  try{box.clear(op.id);forgetPurchaseDraft(op.item.id);render();}catch{toast('No se pudo retirar este cambio del dispositivo.');}
 }
 else if(a==='continue-draft'){const draft=readPurchaseDraft();if(draft?.id)viewOrder(draft.expected,draft);}
 else if(a==='discard-draft'){const draft=readPurchaseDraft();if(draft&&confirm('¿Descartar este borrador?')){forgetPurchaseDraft(draft.id);render();}}
 else if(a==='new'){if(readPurchaseDraft()&&!confirm('Hay un borrador sin guardar. ¿Quieres descartarlo y empezar otra compra?'))return;const draft=readPurchaseDraft();if(draft)forgetPurchaseDraft(draft.id);viewOrder();}
 else if(a==='close')document.querySelector('#compra-dialog')?.close();
 else if(a==='edit'){
  const existing=orders().find(o=>o.id===button.dataset.id),draft=readPurchaseDraft();if(!existing)return;
  if(draft?.id===existing.id){viewOrder(draft.expected,draft);return;}
  if(draft&&!confirm('Hay otro borrador sin guardar. ¿Quieres descartarlo antes de abrir esta compra?'))return;
  if(draft)forgetPurchaseDraft(draft.id);viewOrder(existing);
 }
 else if(a==='toggle'||a==='receive'){
  const previous=orders().find(o=>o.id===button.dataset.id);if(!previous)return;
  if(a==='receive'&&previous.deliveryDate>shopLocalDate()){toast('Aún no ha llegado la fecha de entrega. Confirma la entrada cuando recibas el pedido.');return;}
  const purchased=a==='receive'||!previous.purchased;
  const received=purchased&&(a==='receive'||!previous.deliveryDate);
  const item=cleanPurchaseOrder({...previous,purchased,inventoryReceived:received,inventoryReceivedAt:received?new Date().toISOString():null,
   reminderDate:!purchased&&previous.reminderDate&&madridTime(previous.reminderDate,PURCHASE_REMINDER_TIME)<=Date.now()?null:previous.reminderDate,
   items:previous.items.map(x=>({...x,id:x.id||crypto.randomUUID(),inventory:x.inventory||globalThis.suggestDinoCompraInventory?.(x)||undefined}))});
  if(item)void saveOrder(item,previous,received?'Recepción guardada. Los productos reconocidos se han añadido a Despensa.':purchased?'Compra marcada como comprada.':'Compra marcada como pendiente.');
 }else if(a==='add'){
  const el=document.querySelector('#compra-products');if(!el)return;
  if(el.children.length>=100){toast('La lista admite hasta 100 productos.');return}
  el.insertAdjacentHTML('beforeend',purchaseRow());el.lastElementChild.querySelector('input').focus();totals();rememberPurchaseDraft(el.closest('form'));
 }else if(a==='remove'){
  removePurchaseProduct(button);
 }else if(a==='usual'){const latest=usualPurchase(currentShop().orders);if(latest)replaceProducts(latest.items)}
 else if(a==='previous-list')replaceProducts(currentShop().items||[]);
 else if(a==='clear')replaceProducts([]);
 else if(a==='sample')void saveUpdate({plan:sample},'Ejemplo guardado sin avisos activados');
 else if(a==='reset'){
  const plan=cleanShopPlan(currentShop().plan);if(plan){delete plan.changes[button.dataset.cover];void saveUpdate({plan},'Fechas habituales restauradas')}
 }else void changePush(a);
},true);
window.addEventListener('hashchange',()=>{if(location.hash==='#compra'&&state&&account){activeView='compra';render()}});
if(typeof activeView!=='undefined'&&activeView==='compra')render();

})();}
