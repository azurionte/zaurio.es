'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const v3=fs.readFileSync(path.join(root,'folder-mode-enhancements-v3.js'),'utf8');
const v5=fs.readFileSync(path.join(root,'ui-fixes-v5.js'),'utf8');

// Universal add: user-facing flow icons plus standard dismiss behavior.
for(const token of ['data-dz-add="expense"','data-dz-add="income"','dzFlowIcon income','dzFlowIcon expense','pointerdown','e.key===\'Escape\''])assert.ok(v3.includes(token),token);
assert.match(v3,/position:fixed!important;right:max\(18px,env\(safe-area-inset-right\)\)/);

// Financial health remains interactive and explains the month in human terms.
for(const token of ['Salud financiera ·','Te faltarían','Te quedarían','Qué pesa más este mes','Margen final'])assert.ok(v3.includes(token),token);
assert.equal(/debug|resolveAccountState|accounting-core-2/.test(v3.match(/function healthModal[\s\S]*?function loans/)?.[0]||''),false,'health explanation must not expose implementation language');

// Home copy and folder actions are polished without introducing a renderer.
for(const token of ['Saldo libre','Dinero sin asignar a carpetas','Incluye los próximos cargos previstos','Actualizar saldo','Ver todas las carpetas','Ver más','Ver menos'])assert.ok(v5.includes(token),token);
assert.equal(/renderHomeDashboard\s*=/.test(v5),false,'UX polish must not install a Home renderer');

// Settings are a five-step wizard over the existing organization model.
for(const token of ["['Cuentas','Cuenta de nómina','Carpetas','Distribución','Revisión']",'dzWizardBack','dzWizardNext','Guardar','organizationAssignableItems','normalizeMoneyOrganization'])assert.ok(v5.includes(token),token);

// Calendar: responsive 7-column layout, day detail, separate holidays and opt-out.
for(const token of ['grid-template-columns:repeat(7,minmax(0,1fr))!important','min-width:0!important','openDayDetail','dzDaySheet','Festivo ·','dzHolidayEnabled','Solo festivos nacionales','Cataluña','buildCalendarEvents'])assert.ok(v5.includes(token),token);
assert.ok(v5.includes("HOLIDAY_KEY='dz-holidays-v1'"));
assert.equal(/DineroZaurioAccountingCore|resolveAccountState|accounting-core-2/.test(v5),false,'UX layer must not calculate account balances');

console.log('ux-polish-contract ok');
