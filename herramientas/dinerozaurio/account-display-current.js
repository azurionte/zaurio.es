(() => {
  'use strict';

  const VERSION = 'display-routing-2';
  const ROUTED_TYPES = new Set(['Ingreso', 'Gasto', 'Deuda']);

  function install() {
    if (window.__DZ_DISPLAY_ROUTING__ === VERSION) return;
    if (
      typeof renderHomeDashboard !== 'function' ||
      typeof normalizeMoneyOrganization !== 'function' ||
      typeof buildTodayFinancialSnapshot !== 'function'
    ) {
      setTimeout(install, 50);
      return;
    }

    window.__DZ_DISPLAY_ROUTING__ = VERSION;
    const baseRender = renderHomeDashboard;

    renderHomeDashboard = function (...args) {
      const result = baseRender.apply(this, args);
      setTimeout(() => {
        try {
          applySettledRouting();
        } catch (error) {
          console.error('DineroZaurio account display routing error', error);
        }
      }, 0);
      return result;
    };

    renderHomeDashboard();
  }

  function assignmentFor(event, organization) {
    if (!event?.itemId) {
      return { accountId: organization.salaryAccountId, folderId: '' };
    }
    return organization.assignments?.[event.itemId] || {
      accountId: organization.salaryAccountId,
      folderId: ''
    };
  }

  function folderIsObserved(organization, assignment) {
    if (!assignment?.accountId || !assignment?.folderId) return false;
    const account = organization.accounts.find(row => row.id === assignment.accountId);
    const folder = account?.folders?.find(row => row.id === assignment.folderId);
    return folder?.actualBalance !== null && folder?.actualBalance !== undefined;
  }

  function settledRoutedFlows(summary, organization) {
    const result = new Map();
    const events = (summary.snapshot?.events || []).filter(event => {
      if (!event?.itemId || !ROUTED_TYPES.has(event.type)) return false;
      if (!event.date || event.date > summary.asOf) return false;
      return Number.isFinite(Number(event.amount));
    });

    for (const event of events) {
      const assignment = assignmentFor(event, organization);
      if (!assignment.accountId || assignment.accountId === organization.salaryAccountId) continue;

      // An observed folder balance already represents the physical truth after its real movements.
      // Re-applying scheduled events on top of it would count the same movement twice.
      if (assignment.folderId && folderIsObserved(organization, assignment)) continue;

      const current = Number(result.get(assignment.accountId) || 0);
      result.set(assignment.accountId, current + Number(event.amount || 0));
    }

    return result;
  }

  function readMoney(node) {
    if (!node) return NaN;
    const normalized = String(node.textContent || '')
      .replace(/\s|€/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    return Number(normalized);
  }

  function setMoney(node, value) {
    if (!node || !Number.isFinite(value)) return;
    node.textContent = euros(value);
    node.className = value >= 0 ? 'is-positive' : 'is-negative';
  }

  function accountCard(root, account) {
    return [...root.querySelectorAll('.dzAccountWidget.secondary')]
      .find(card => card.querySelector('h3')?.textContent?.trim() === account.name);
  }

  function applySettledRouting() {
    const root = document.getElementById('homeDashboard');
    if (!root) return;

    const organization = normalizeMoneyOrganization(state.moneyOrganization);
    if (!organization.enabled) return;

    const summary = buildTodayFinancialSnapshot(new Date());
    const flows = settledRoutedFlows(summary, organization);

    const primaryCard = root.querySelector('.dzAccountWidget.salary');
    const primaryValues = primaryCard?.querySelectorAll('.dzBalanceMetric strong');
    let primaryNow = readMoney(primaryValues?.[0]);
    let primaryEnd = readMoney(primaryValues?.[1]);
    let routedNet = 0;
    const accountDiagnostics = {};

    for (const account of organization.accounts.filter(row => row.id !== organization.salaryAccountId)) {
      const net = Number(flows.get(account.id) || 0);
      if (Math.abs(net) < 0.005) continue;

      const card = accountCard(root, account);
      const values = card?.querySelectorAll('.dzBalanceMetric strong');
      const secondaryNow = readMoney(values?.[0]);
      const secondaryEnd = readMoney(values?.[1]);
      if (!Number.isFinite(secondaryNow)) continue;

      setMoney(values?.[0], secondaryNow + net);
      if (Number.isFinite(secondaryEnd)) setMoney(values?.[1], secondaryEnd + net);

      if (Number.isFinite(primaryNow)) primaryNow -= net;
      if (Number.isFinite(primaryEnd)) primaryEnd -= net;
      routedNet += net;

      accountDiagnostics[account.id] = {
        accountName: account.name,
        settledNet: net,
        before: secondaryNow,
        after: secondaryNow + net
      };
    }

    if (Number.isFinite(primaryNow)) setMoney(primaryValues?.[0], primaryNow);
    if (Number.isFinite(primaryEnd)) setMoney(primaryValues?.[1], primaryEnd);

    window.__DINEROZAURIO_ACCOUNT_DISPLAY_DIAGNOSTICS__ = {
      version: VERSION,
      month: summary.periodYm,
      routedNet,
      accounts: accountDiagnostics
    };
  }

  window.addEventListener('load', install, { once: true });
  if (document.readyState === 'complete') install();
})();