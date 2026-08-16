import { createBasicPlan, configureSalary } from '../application/configuration-service.js';

export async function renderOnboarding({root,repository,onComplete}){
  root.classList.remove('hidden');
  root.innerHTML=`<div class="onboarding"><span class="eyebrow">CONFIGURACIÓN INICIAL</span><h1>¿Cómo funciona tu mes real?</h1><p class="muted">DineroZaurio necesita saber qué sueldo financia qué periodo. No cambia la fecha del ingreso: solo evita mezclar meses que tú en la práctica gestionas juntos.</p><div class="onboardingChoices"><label><input type="radio" name="periodPreset" value="end" checked><span><strong>Cobro a final de mes</strong><small>El sueldo de finales de agosto paga septiembre.</small></span></label><label><input type="radio" name="periodPreset" value="start"><span><strong>Cobro al inicio del mes</strong><small>El sueldo que recibo en septiembre paga septiembre.</small></span></label><label><input type="radio" name="periodPreset" value="calendar"><span><strong>Prefiero mes natural</strong><small>Del día 1 al último día, sin ciclo de nómina.</small></span></label></div><div class="onboardingForm"><label>Nombre de tu cuenta principal<input id="obAccount" value="Cuenta principal"></label><label id="obSalaryNameWrap">Nombre de la nómina<input id="obSalaryName" value="Sueldo neto"></label><label id="obSalaryAmountWrap">Importe habitual (€)<input id="obSalaryAmount" type="number" min="0" step="0.01"></label><label id="obSalaryDateWrap">Fecha del próximo/último cobro<input id="obSalaryDate" type="date" value="${new Date().toISOString().slice(0,10)}"></label></div><button id="obCreate" class="primary">Crear mi plan</button><p id="obError" class="negative"></p></div>`;
  const sync=()=>{const calendar=root.querySelector('[name=periodPreset]:checked')?.value==='calendar';['obSalaryNameWrap','obSalaryAmountWrap','obSalaryDateWrap'].forEach(id=>root.querySelector(`#${id}`).classList.toggle('hidden',calendar));};
  root.querySelectorAll('[name=periodPreset]').forEach(x=>x.onchange=sync);sync();
  root.querySelector('#obCreate').onclick=async()=>{
    const error=root.querySelector('#obError');error.textContent='';
    try{
      const preset=root.querySelector('[name=periodPreset]:checked').value,calendar=preset==='calendar',accountName=root.querySelector('#obAccount').value.trim()||'Cuenta principal';
      const salaryInput=calendar?null:{name:root.querySelector('#obSalaryName').value.trim()||'Sueldo neto',amount:Number(root.querySelector('#obSalaryAmount').value||0),date:root.querySelector('#obSalaryDate').value};
      if(salaryInput&&(salaryInput.amount<=0||!salaryInput.date))throw new Error('Indica el importe y la fecha de la nómina antes de crear el plan');
      root.querySelector('#obCreate').disabled=true;
      const created=await createBasicPlan({repository,periodMode:calendar?'calendar_month':'salary_cycle',salaryFundingStrategy:preset==='end'?'funds_next_month':'funds_same_month',primaryAccountName:accountName});
      if(salaryInput)await configureSalary({repository,planId:created.plan.id,name:salaryInput.name,amount:salaryInput.amount,accountId:created.account.id,firstPaymentDate:salaryInput.date,fundingStrategy:preset==='end'?'funds_next_month':'funds_same_month'});
      await onComplete();
    }catch(err){root.querySelector('#obCreate').disabled=false;error.textContent=err.message||String(err);}
  };
}
