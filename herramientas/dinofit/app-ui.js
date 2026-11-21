
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
function currentDay(){
 const records=timeLine(),value=weightForDay(),last=latestWeight(),first=records[0],log=dayLogs();
 const sum=log.reduce((n,e)=>n+logTotal(e.parts),0);
 const change=last&&first?first.weight-last.weight:null;
 const latest=last?htmlSafe(readableDate(last.date)):'Sin datos';
 let rows=[
  ['Peso de '+htmlSafe(shortDate(selectedDate)),value?locale(value.weight,1):'—','kg',value?'Medición registrada':'No se pesó este día','metric-main'],
  ['Último peso conocido',last?locale(last.weight,1):'—','kg',latest,''],
  ['Desde el primer registro',change==null?'—':(change>=0?'−':'+')+locale(Math.abs(change),1),'kg',htmlSafe(readableDate(first?.date)),''],
  ['Comidas registradas',log.length?locale(sum,0):'—','kcal',log.length+' entradas','']
 ];
 let out='<div class="view-head"><span class="eyebrow">TU SEGUIMIENTO</span><h1>'+ (selectedDate===isoToday()?'Hoy':'Tu día')+' · '+htmlSafe(readableDate(selectedDate))+'</h1><p>Elige una fecha arriba para consultar o registrar sus datos.</p></div>';
 if(notice)out+='<div class="notice section-gap">'+htmlSafe(notice)+'</div>';
 out+='<div class="metrics-row">'+rows.map(([label,val,unit,hint,cls])=>'<section class="section metric-card '+cls+'"><span class="eyebrow">'+label+'</span><div class="'+(cls?'big':'value')+'">'+val+' <span>'+unit+'</span></div><div class="micro">'+hint+'</div></section>').join('')+'</div>';
 out+=weightGraph()+metricGrid()+quickFoods()+dayRecords();
 return out;
}
function quickFoods(){
 const groups=[
  {id:'usual',title:'Habituales',hint:'Café, lácteos y tentempiés'},
  {id:'mixed',title:'Tuppers con salteados',hint:'Salteado de pollo y patata con Frankfurt; aceite repartido entre 8 raciones'},
  {id:'plain',title:'Tuppers solo proteína',hint:'Cuando hay hamburguesas, se cuentan siempre dos'}
 ];
 const buttons=r=>'<button class="food-button" type="button" data-action="add-food" data-recipe="'+r.id+'">'+
  '<span class="food-top"><span class="em" aria-hidden="true">'+r.emoji+'</span><span class="plus">＋</span></span><strong>'+htmlSafe(r.name)+'</strong><small>'+htmlSafe(r.hint)+'</small></button>';
 return '<section class="section"><div class="section-head"><div><h2>Añadir una comida</h2><p>Tuppers aproximados, sin necesidad de pesar ingredientes · '+htmlSafe(readableDate(selectedDate))+'</p></div><span class="helper">Puedes ajustar cantidades</span></div>'+
  groups.map(g=>'<div class="quick-group"><h3>'+htmlSafe(g.title)+'</h3><p class="helper">'+htmlSafe(g.hint)+'</p><div class="quick-grid">'+
   RECIPES.filter(r=>r.group===g.id).map(buttons).join('')+'</div></div>').join('')+'</section>';
}
function dayRecords(){
 const entries=dayLogs().sort((a,b)=>(a.meal||'').localeCompare(b.meal||'')),activities=getActivity(selectedDate);
 let body=entries.length?entries.map(e=>'<div class="day-entry"><div><strong>'+htmlSafe(e.title||'Comida')+'</strong><small>'+htmlSafe(e.meal||'Otro')+' · '+(e.parts||[]).map(p=>htmlSafe(food(p.foodId)?.name||p.foodId)+' × '+locale(p.qty,0)).join(' · ')+'</small></div><span class="calories">'+locale(logTotal(e.parts))+' kcal</span><button type="button" class="click sm" data-action="edit-food" data-id="'+htmlSafe(e.id)+'">Editar</button></div>').join(''):
 '<div class="empty">Todavía no hay comidas registradas para esta fecha.</div>';
 let sport=activities.length?activities.map(a=>'<div class="day-entry"><div><strong>'+htmlSafe(a.type||'Actividad')+'</strong><small>'+htmlSafe(a.note||'Actividad física')+'</small></div><strong>'+locale(a.minutes,1)+' min</strong><button type="button" class="click sm" data-action="delete-activity" data-id="'+htmlSafe(a.id)+'">Eliminar</button></div>').join(''):
 '<div class="helper">Sin actividad registrada.</div>';
 return '<section class="section"><div class="section-head"><div><h2>Registro del día</h2><p>'+entries.length+' comidas anotadas</p></div>'+
 '<label class="checkrow"><input type="checkbox" id="dayComplete" '+((state.completeDays||[]).includes(selectedDate)?'checked':'')+'>Día completo</label></div>'+
 '<div class="day-entries">'+body+'</div><div class="section-gap section-head"><div><h3>Actividad física</h3><p>Minutos reales, sin confundirlos con sesiones simuladas.</p></div><button type="button" class="click sm" data-action="add-activity">+ Actividad</button></div>'+sport+'</section>';
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
