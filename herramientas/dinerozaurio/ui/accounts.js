(() => {
  'use strict';
  const VERSION = 'accounts-ui-2';

  function install() {
    if (window.__DZ_ACCOUNTS_UI__ === VERSION) return;
    if (typeof renderHomeDashboard !== 'function' || typeof buildTodayFinancialSnapshot !== 'function' || typeof normalizeMoneyOrganization !== 'function' || !window.DineroZaurioAccountingCore) {
      setTimeout(install, 60);
      return;
    }
    window.__DZ_ACCOUNTS_UI__ = VERSION;
    const original = renderHomeDashboard;
    renderHomeDashboard = function (...args) {
      const result = original.apply(this, args);
      applyAuthority();
      return result;
    };
    if (document.getElementById('homeDashboard')) renderHomeDashboard();
  }

  function effectiveAdjustments(periodYm) {
    const next = structuredClone(state.monthAdjustments || {});
    const transfers = next?.[periodYm]?.expenseOverrides?.__accountGeneralTransfers;
    if (!transfers) return next;
    Object.values(transfers).forEach(record => {
      if (!record?.confirmedAt) return;
      const value = new Date(record.confirmedAt);
      if (Number.isNaN(value.getTime())) return;
      value.setHours(0, 0, 0, 0);
      record.confirmedAt = value.toISOString();
    });
    return next;
  }

  function applyAuthority() {
    const root = document.getElementById('homeDashboard');
    if (!root) return;
    const organization = normalizeMoneyOrganization(state.moneyOrganization);
    if (!organization.enabled) return;
    const summary = buildTodayFinancialSnapshot(new Date());
    const model = DineroZaurioAccountingCore.resolveAccountState({
      organization,
      periodYm: summary.periodYm,
      asOf: summary.asOf || new Date(),
      events: summary.snapshot?.events || [],
      futureEvents: summary.upcomingCharges || [],
      monthAdjustments: effectiveAdjustments(summary.periodYm),
      potentialNow: summary.potentialNow
    });

    const hero = root.querySelector('.homeHeroValue');
    if (hero) hero.textContent = euros(model.total);
    updateCard(root, model.primary, null);
    model.secondary.forEach(account => updateCard(root, account, account.general));

    window.__DINEROZAURIO_ACCOUNTING_AUTHORITY__ = model.version;
    window.__DINEROZAURIO_ROUTING_AUTHORITY__ = model.version;
    window.__DINEROZAURIO_ACCOUNT_DIAGNOSTICS__ = {
      version: model.version,
      month: model.periodYm,
      total: model.total,
      primary: model.primary?.current || 0,
      secondary: model.secondaryTotal,
      splitDiff: model.splitDiff,
      accounts: Object.fromEntries(model.secondary.map(account => [account.account.id, {
        current: account.current,
        projected: account.projected,
        general: account.general.current,
        generalProjected: account.general.projected
      }]))
    };
  }

  function updateCard(root, model, general) {
    if (!model?.account) return;
    const card = [...root.querySelectorAll('.accountSummaryCard')].find(node => node.querySelector('.accountSummaryHead strong')?.textContent?.trim() === model.account.name);
    if (!card) return;
    const metrics = card.querySelectorAll('.accountSummaryMetric');
    setMetric(metrics[0], 'Saldo estimado HOY', model.current);
    setMetric(metrics[1], 'Antes de la próxima nómina', model.projected);
    if (general) setMetric(metrics[2], 'Disponible sin carpeta', general.current);
  }

  function setMetric(node, label, value) {
    if (!node) return;
    const caption = node.querySelector('.sub');
    const amount = node.querySelector('strong');
    if (caption) caption.textContent = label;
    if (amount) {
      amount.textContent = euros(value);
      amount.className = value >= 0 ? 'kpi-green' : 'kpi-red';
    }
  }

  window.addEventListener('load', install, { once: true });
  if (document.readyState === 'complete') install();
})();
