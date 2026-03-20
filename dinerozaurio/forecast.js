export function euros(n=0){ return Number(n||0).toLocaleString('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:2}); }
export function ymNow(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
export function addMonths(ym, add){ const [y,m]=ym.split('-').map(Number); const d=new Date(y,m-1+add,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }
export function ymLabel(ym){ const [y,m]=ym.split('-').map(Number); return new Date(y,m-1,1).toLocaleDateString('es-ES',{month:'long',year:'numeric'}); }
export function monthDiff(a,b){ const [ay,am]=a.split('-').map(Number); const [by,bm]=b.split('-').map(Number); return (by-ay)*12+(bm-am); }
export function monthsRange(fromYm,toYm){ const out=[]; let cur=fromYm; while(cur<=toYm){ out.push(cur); cur=addMonths(cur,1);} return out; }
export function periodicityApplies(periodicity,startYm,ym){ const diff=monthDiff(startYm,ym); if(diff<0)return false; if(periodicity==='one_time')return diff===0; if(periodicity==='monthly')return true; if(periodicity==='bimonthly')return diff%2===0; if(periodicity==='quarterly')return diff%3===0; if(periodicity==='yearly')return diff%12===0; return true; }
export function h(str=''){ return String(str).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }