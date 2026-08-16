(() => {
  'use strict';

  const MARKER='future-charge-editor-1';
  window.__DINEROZAURIO_FUTURE_CHARGE_EDITOR__=MARKER;

  const EXPENSE_TYPES=new Set(['Presupuesto','Gasto','Gasto extraordinario','Gasto puntual']);

  function runtimeReady(){
    try{
      return typeof buildTodayFinancialSnapshot==='function' &&
        typeof commitMonthAdjustmentGlobal==='function' &&
        typeof closeModal==='function' &&
        typeof state!=='undefined';
    }