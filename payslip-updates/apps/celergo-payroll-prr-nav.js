'use strict';

async function prrDownloadXLSX(){
  if(!window.JSZip){ alert('XLSX packaging library unavailable.'); return; }
  var country=state.country, config=prrCountryConfig(country), rows=prrBuildRows(country);
  var chunkNames=['celergo-prr-template-1.txt','celergo-prr-template-2.txt','celergo-prr-template-3.txt','celergo-prr-template-4.txt'];
  var chunks=await Promise.all(chunkNames.map(async function(name){var r=await fetch(name);if(!r.ok)throw new Error('PRR template file is unavailable.');return r.text();}));
  var raw=atob(chunks.join('').replace(/\s+/g,'')), bytes=new Uint8Array(raw.length);
  for(var bi=0;bi<raw.length;bi++) bytes[bi]=raw.charCodeAt(bi);
  var zip=await JSZip.loadAsync(bytes);
  var workbook=xmlDoc(await zip.file('xl/workbook.xml').async('string'));
  var rels=xmlDoc(await zip.file('xl/_rels/workbook.xml.rels').async('string'));
  var firstSheet=workbook.getElementsByTagNameNS('http://schemas.openxmlformats.org/spreadsheetml/2006/main','sheet')[0]||workbook.getElementsByTagName('sheet')[0];
  var relId=firstSheet&&firstSheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')||firstSheet&&firstSheet.getAttribute('r:id');
  var rel=Array.from(rels.getElementsByTagName('Relationship')).find(function(r){return r.getAttribute('Id')===relId;});
  var sheetPath=relTargetPath(rel&&rel.getAttribute('Target')||'worksheets/sheet1.xml');
  var sheetDoc=xmlDoc(await zip.file(sheetPath).async('string'));
  var sheetData=sheetDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/spreadsheetml/2006/main','sheetData')[0]||sheetDoc.getElementsByTagName('sheetData')[0];
  var styleRow=findRow(sheetData,2)||findRow(sheetData,3), startRow=2;
  function setPRRCell(cell,value,colIndex){
    clearCell(cell);
    var numeric=(colIndex===4 && value!=='' && value!=null) || (colIndex===3 && /^\d+$/.test(String(value)));
    if(numeric){ var v=sheetDoc.createElementNS('http://schemas.openxmlformats.org/spreadsheetml/2006/main','v'); v.textContent=String(Number(value)); cell.appendChild(v); return; }
    cell.setAttribute('t','inlineStr');
    var is=sheetDoc.createElementNS('http://schemas.openxmlformats.org/spreadsheetml/2006/main','is'), t=sheetDoc.createElementNS('http://schemas.openxmlformats.org/spreadsheetml/2006/main','t');
    t.textContent=value==null?'':String(value); is.appendChild(t); cell.appendChild(is);
  }
  rows.forEach(function(row,rowIndex){
    var rowNum=startRow+rowIndex, rowEl=ensureRow(sheetDoc,sheetData,rowNum);
    PRR_COLUMNS.forEach(function(_header,colIndex){
      var addr=cellRef(rowNum,colIndex), styleAddr=cellRef(2,colIndex), styleCell=styleRow&&findCell(styleRow,styleAddr), cell=ensureCell(sheetDoc,rowEl,addr,colIndex,styleCell);
      setPRRCell(cell,row[colIndex],colIndex);
    });
  });
  var dim=sheetDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/spreadsheetml/2006/main','dimension')[0]||sheetDoc.getElementsByTagName('dimension')[0];
  if(dim && rows.length+1>85) dim.setAttribute('ref','A1:L'+(rows.length+1));
  zip.file(sheetPath,xmlOut(sheetDoc));
  var blob=await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  download(blob,'PRR_DEMO_'+config.label+' Local Monthly_template.xlsx');
}

var originalRenderSteps=renderSteps;
renderSteps=function(){
  var supported=prrSupported(state.country), first=PRR_STEP_LABELS.slice(0,5), second=supported?PRR_STEP_LABELS.slice(5):['PRR coming soon'];
  var html='<span class="phase-label">Client input · P&amp;D</span>'+first.map(function(label,i){return '<button class="step-dot '+(i===step?'active':i<step?'done':'')+'" type="button" data-step="'+i+'">'+(i+1)+'. '+label+'</button>';}).join('');
  html+='<span class="phase-label prr">Partner output · PRR</span>';
  if(supported) html+=second.map(function(label,j){var i=j+5;return '<button class="step-dot '+(i===step?'active':i<step?'done':'')+'" type="button" data-step="'+i+'">'+(j+1)+'. '+label+'</button>';}).join('');
  else html+='<button class="step-dot '+(step===5?'active':'')+'" type="button" data-step="5">PRR · Coming soon</button>';
  $('steps').innerHTML=html;
};
show=function(i){
  var supported=prrSupported(state.country), max=supported?8:5;
  if(i<0||i>max)return;
  step=i;
  document.querySelectorAll('.screen').forEach(function(x){x.classList.toggle('active',Number(x.dataset.screen)===step);});
  $('back').disabled=step===0;
  $('next').disabled=false;
  var terminal=(supported&&step===8)||(!supported&&step===5);
  $('next').innerHTML=terminal?'Done':'Next<i class="fa-solid fa-arrow-right"></i>';
  if(step===4)$('next').innerHTML='Continue to PRR<i class="fa-solid fa-arrow-right"></i>';
  $('skipFooter').style.display=step===1?'inline-flex':'none';
  renderSteps();
  if(step===2)renderEmployees();
  if(step===4)renderPreview();
  if(step===5)prrRenderSalary();
  if(step===6)prrRenderSingles();
  if(step===7)prrRenderDeductions();
  if(step===8)prrRenderExport();
};
jumpTo=function(i){
  if(!canLeaveCountry(i))return;
  var max=prrSupported(state.country)?8:5;
  if(i>=0&&i<=max)show(i);
};

function prrHandleClick(e){
  var b=e.target.closest('[data-prr-random-salaries]'); if(b){e.preventDefault();prrRandomizeSalaries(state.country);prrRenderSalary();return;}
  b=e.target.closest('[data-prr-random-salary]'); if(b){e.preventDefault();var d=prrEnsureCountry(state.country),id=b.dataset.prrRandomSalary;d.salaries[id]=prrRandomSalary(state.country);prrRebalanceEmployee(state.country,id,d);save();prrRenderSalary();return;}
  b=e.target.closest('[data-prr-random-singles]'); if(b){e.preventDefault();var ds=prrEnsureCountry(state.country);prrGenerateSingles(state.country,ds);ds.singlesGenerated=true;prrRebalanceAll(state.country,ds);save();prrRenderSingles();return;}
  b=e.target.closest('[data-prr-remove-single]'); if(b){e.preventDefault();var p=b.dataset.prrRemoveSingle.split('|'),dr=prrEnsureCountry(state.country);delete dr.singles[p[0]][p.slice(1).join('|')];prrRebalanceEmployee(state.country,p[0],dr);save();prrRenderSingles();return;}
  b=e.target.closest('[data-prr-add-single]'); if(b){e.preventDefault();var id=b.dataset.prrAddSingle,sel=document.querySelector('[data-prr-add-select="'+CSS.escape(id)+'"]'),da=prrEnsureCountry(state.country);if(sel&&sel.value){da.singles[id][sel.value]=prrSingleAmount(state.country,sel.value,da.salaries[id]);prrRebalanceEmployee(state.country,id,da);save();prrRenderSingles();}return;}
  b=e.target.closest('[data-prr-random-deductions]'); if(b){e.preventDefault();prrRandomizeDeductions(state.country);prrRenderDeductions();return;}
  b=e.target.closest('[data-prr-reset-locks]'); if(b){e.preventDefault();var dl=prrEnsureCountry(state.country);prrCurrentEmployees().forEach(function(emp){dl.locks[String(emp.id)]={};prrRebalanceEmployee(state.country,String(emp.id),dl);});save();prrRenderDeductions();return;}
  b=e.target.closest('[data-prr-apply-pct]'); if(b){e.preventDefault();var input=$('prrSetAllPct'),v=Number(input&&input.value);if(!Number.isFinite(v)||v<0){alert('Enter a valid percentage.');return}var dp=prrEnsureCountry(state.country);prrCurrentEmployees().forEach(function(emp){var id=String(emp.id);dp.deductionPct[id]=v;prrRebalanceEmployee(state.country,id,dp);});save();prrRenderDeductions();return;}
  b=e.target.closest('[data-prr-download]'); if(b){e.preventDefault();prrDownloadXLSX().catch(function(err){console.error(err);alert('Could not build the PRR workbook.');});return;}
}
function prrHandleChange(e){
  var input=e.target.closest('[data-prr-salary]'); if(input){var d=prrEnsureCountry(state.country),id=input.dataset.prrSalary;d.salaries[id]=Math.max(0,prrRound(input.value));prrRebalanceEmployee(state.country,id,d);save();return;}
  input=e.target.closest('[data-prr-single-amount]'); if(input){var ps=input.dataset.prrSingleAmount.split('|'),ds=prrEnsureCountry(state.country),sid=ps[0],el=ps.slice(1).join('|');ds.singles[sid][el]=Math.max(0,prrRound(input.value));prrRebalanceEmployee(state.country,sid,ds);save();return;}
  input=e.target.closest('[data-prr-pct]'); if(input){var dd=prrEnsureCountry(state.country),pid=input.dataset.prrPct;dd.deductionPct[pid]=Math.max(0,Number(input.value)||0);prrRebalanceEmployee(state.country,pid,dd);save();prrRenderDeductions();return;}
  input=e.target.closest('[data-prr-bucket]'); if(input){var pb=input.dataset.prrBucket.split('|');prrSetBucket(state.country,pb[0],pb.slice(1).join('|'),input.value);prrRenderDeductions();return;}
  input=e.target.closest('[data-prr-range]'); if(input){var cfg=prrEditableConfig(state.country),kind=input.dataset.prrRange;cfg[kind==='min'?'rateMin':'rateMax']=Math.max(0,Number(input.value)||0);save();return;}
  input=e.target.closest('[data-prr-weight]'); if(input){var cfgw=prrEditableConfig(state.country),idx=Number(input.dataset.prrWeight);cfgw.weights[idx]=Math.max(0,Number(input.value)||0);var dw=prrEnsureCountry(state.country);prrRebalanceAll(state.country,dw);save();prrRenderDeductions();return;}
}

prrInstallStyle();
prrInstallScreens();
document.addEventListener('click',prrHandleClick,true);
document.addEventListener('change',prrHandleChange,true);
// Country selection is handled by the original mini-app listener first. This later bubble listener
// resets navigation against the newly selected country's PRR capability so an unsupported country
// can never leave the PRR screens stuck in the coming-soon state when switching to FR/DE.
document.addEventListener('click',function(e){
  var countryButton=e.target.closest('[data-country]');
  if(!countryButton)return;
  show(0);
},false);
$('next').onclick=function(){
  var terminal=(prrSupported(state.country)&&step===8)||(!prrSupported(state.country)&&step===5);
  if(terminal){show(0);return;}
  if(!canLeaveCountry(step+1))return;
  show(step+1);
};
$('back').onclick=function(){show(step-1);};
APP_DATA.version='1.15';
var prrVersionBadge=document.querySelector('[data-mini-version="celergo-monthly-changes"]');
if(prrVersionBadge)prrVersionBadge.textContent='V1.15';
renderSteps();