'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const v2=fs.readFileSync(path.join(root,'folder-mode-summary-v2.js'),'utf8');
const v3=fs.readFileSync(path.join(root,'folder-mode-enhancements-v3.js'),'utf8');
const v5=fs.readFileSync(path.join(root,'ui-fixes-v5.js'),'utf8');

// Universal add keeps standard dismiss behavior, directional semantics and the DineroZaurio fuchsia accent.
for(const token of ['data-dz-add="expense"','data-dz-add="income"','dzFlowIcon income','dzFlowIcon expense','pointerdown','e.key===\'Escape\''])assert.ok(v3.includes(token),token);
assert.match(v3,/position:fixed!important;right:max\(18px,env\(safe-area-inset-right\)\)/);
assert.ok(v3.includes('background:linear-gradient(135deg,var(--pink),var(--pink-2))'),'universal add must use the fuchsia palette');
assert.ok(v3.includes('rgba(255,0,170,.38)'),'mobile FAB should keep a visible fuchsia glow');

// UX observer must react to structural additions without creating a self-sustaining DOM mutation loop.
for(const token of ['function enhanceModal','record.addedNodes','node.nodeType!==1','mode.dataset.dzModePolished','if(name&&name.textContent!==\'Saldo libre\')','if(set&&!set.hidden)set.hidden=true'])assert.ok(v5.includes(token),token);
assert.equal(v5.includes("document.querySelectorAll('.dzV4Modal,.dzV3Modal,.modalCard').forEach(modal=>{if(modal.dataset.dzV5Enhanced==='1')return"),false,'observer callback must not rescan the full document on every mutation');
assert.equal(v5.includes("#dzV4Close,#dzV3Close,#closeModalBtn,.btn.danger"),false,'destructive actions must never be mistaken for modal close buttons');

// Account cards: no routine observed-balance action on the salary account, total secondary label and stable two-column metrics.
for(const token of ['Modo carpetas activado','Saldo ${m.account.name} total','Antes de próxima nómina','grid-template-columns:repeat(2,minmax(0,1fr))','data-dz-update-account'])assert.ok(v2.includes(token),token);
assert.match(v2,/const action=isSalary\?'':/);
assert.equal(v2.includes('Datos al día'),false,'account summary must not show legacy all-day/up-to-date copy');
assert.equal(v2.includes('Todo al día'),false,'account summary must not show Todo al día');

// Upcoming debt charges route into the existing debt model/editor and current-month actions.
for(const token of ['openDebtCharge','openDebtEditor','openMonthModal','openDebtPlannerModal','debtHistory','Cuota, pago parcial o aplazar','Planificar pago anticipado'])assert.ok(v2.includes(token),token);
assert.ok(v2.includes("(state.debts||[]).find"));

// Financial health remains interactive, causal and deterministic.
for(const token of ['causalNarrative','recommendations()','Margen','Ingresos','Gastos','Deudas','Ahorro','Peso de las deudas','Revisar ${prettyMonthLabel','Preparar ${escapeHtml'])assert.ok(v3.includes(token),token);
assert.ok(v3.includes('recs.slice(0,3)'));
assert.equal(/fetch\(|XMLHttpRequest|openai|chatgpt|resolveAccountState/.test(v3.match(/function recommendations\(\)[\s\S]*?function health/)?.[0]||''),false,'recommendations must be local deterministic rules');

// Mobile secondary account hides only folders/general balance; future charges remain independent.
for(const token of ['Ver todas las carpetas','dzMobileAccountDetails','dzMobileChargesAlways','dzBankCharges'])assert.ok(v5.includes(token),token);
assert.match(v5,/querySelectorAll\('\.dzGeneralHost,\.dzFolderBalances:not\(\.dzGeneralHost\)'\)/);
assert.equal(/dzGeneralHost,\.dzFolderBalances:not\(\.dzGeneralHost\),\.dzBankCharges/.test(v5),false,'future charges must not be part of the folder accordion');

// Profile menu hierarchy and form containment are polished in the existing UX module.
for(const token of ['Exportar mis datos','Configurar de cero','dzProfileMeta','max-width:100%','min-width:0','grid-template-columns:repeat(2,minmax(0,1fr))','-webkit-min-logical-width:0','.modalCard.managerModal{width:min(980px,100%)'])assert.ok(v5.includes(token),token);
assert.ok(v5.includes('.dzWizardModal{width:100%!important;max-width:100%!important'),'mobile wizard must stay inside modal root');
assert.ok(v5.includes('.dzDaySheet{width:100%!important;max-width:100%!important'),'mobile day sheet must stay inside modal root');
assert.equal(/renderHomeDashboard\s*=/.test(v5),false,'UX polish must not install a Home renderer');

// Weekly/biweekly editors expose one charge-date concept and stale delayed review data is refreshed before opening.
for(const token of ['normalizeRecurringChargeEditor','Fecha del próximo cobro','installFreshChargeReviewGuard','buildTodayFinancialSnapshot(now)','unconfirmedPastServiceEvents(freshSummary,now)','date.dataset.dzChargeDateReady'])assert.ok(v5.includes(token),token);
assert.ok(v5.includes('if(ruleField)ruleField.hidden=active'),'recurring editor must hide the competing generic date rule');
assert.ok(v5.includes('if(dueWrap)dueWrap.hidden=active'),'recurring editor must hide the competing generic due-day field');

// Settings and calendar remain the existing recovered implementations.
for(const token of ["['Cuentas','Cuenta de nómina','Carpetas','Distribución','Revisión']",'dzWizardBack','dzWizardNext','Guardar','organizationAssignableItems','normalizeMoneyOrganization','openDayDetail','dzDaySheet','dzHolidayEnabled'])assert.ok(v5.includes(token),token);
assert.equal(/DineroZaurioAccountingCore|resolveAccountState|accounting-core-2/.test(v5),false,'UX layer must not calculate account balances');

console.log('ux-polish-contract ok');
