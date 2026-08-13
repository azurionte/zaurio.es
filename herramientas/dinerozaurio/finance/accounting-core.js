(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DineroZaurioAccountingCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION = 'accounting-routing-1';
  const KEYS = {
    folderTransfers: '__folderTransfers',
    generalTransfers: '__accountGeneralTransfers',
    generalBalances: '__accountGeneralBalances',
    savingsConfirmations: '__savingsTransferConfirmations'
  };

  function round2(value) {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }

  function toDate(value) {
    if (!value) return null;
    const date = value instanceof Date ? new Date(value) : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function endOfDay(value) {
    const date = toDate(value) || new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  }

  function monthStart(ym) {
    const match = String(ym || '').match(/^(\d{4})-(\d{2})$/);
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, 1, 0, 0, 0, 0) : new Date(0);
  }

  function specialMap(monthAdjustments, ym, key) {
    const raw = monthAdjustments?.[ym]?.expenseOverrides?.[key];
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  }

  function assignmentFor(event, organization) {
    if (!event?.itemId) return { accountId: organization.salaryAccountId, folderId: '' };
    const assigned = organization.assignments?.[event.itemId];
    if (!assigned?.accountId) return { accountId: organization.salaryAccountId, folderId: '' };
    return { accountId: assigned.accountId, folderId: assigned.folderId || '' };
  }

  function isFinancialFlow(event) {
    const type = String(event?.type || '');
    return type === 'Gasto' || type === 'Deuda' || type === 'Ingreso' || type === 'Ingreso extraordinario';
  }

  function isReservation(event) {
    return String(event?.type || '') === 'Ahorro' || String(event?.type || '') === 'Presupuesto';
  }

  function signedAmount(event) {
    const value = Number(event?.amount || 0);
    return Number.isFinite(value) ? value : 0;
  }

  function earliestAnchor(values, fallback) {
    const dates = values.map(toDate).filter(Boolean).sort((a, b) => a - b);
    return dates[0] || fallback;
  }

  function eventAfterAnchor(event, anchor, asOf) {
    const date = toDate(event?.date);
    if (!date || date > asOf) return false;
    return !anchor || date >= anchor;
  }

  function routedEvents(events, organization, accountId, folderId, predicate) {
    const wantedFolder = folderId || '';
    return (events || []).filter(event => {
      if (!isFinancialFlow(event)) return false;
      const assigned = assignmentFor(event, organization);
      if (assigned.accountId !== accountId || (assigned.folderId || '') !== wantedFolder) return false;
      return predicate ? predicate(event) : true;
    });
  }

  function resolveGeneralBucket(input, account) {
    const { monthAdjustments, periodYm, events, futureEvents, organization, asOf } = input;
    const observedRecord = specialMap(monthAdjustments, periodYm, KEYS.generalBalances)[account.id] || {};
    const transferRecord = specialMap(monthAdjustments, periodYm, KEYS.generalTransfers)[account.id] || {};
    const observed = Number(observedRecord.amount || 0);
    const transferred = Number(transferRecord.amount || 0);
    const base = observed + transferred;
    const anchor = earliestAnchor([observedRecord.updatedAt, transferRecord.confirmedAt], monthStart(periodYm));
    const settled = routedEvents(events, organization, account.id, '', event => eventAfterAnchor(event, anchor, asOf));
    const settledNet = settled.reduce((sum, event) => sum + signedAmount(event), 0);
    const future = routedEvents(futureEvents, organization, account.id, '');
    const futureNet = future.reduce((sum, event) => sum + signedAmount(event), 0);
    const current = round2(base + settledNet);
    const projected = round2(current + futureNet);
    return {
      id: `${account.id}|`,
      accountId: account.id,
      folderId: '',
      label: 'Disponible sin carpeta',
      base: round2(base),
      current,
      projected,
      settledNet: round2(settledNet),
      futureNet: round2(futureNet),
      observed: round2(observed),
      transferred: round2(transferred),
      anchor: anchor?.toISOString?.() || null,
      settledEvents: settled,
      futureEvents: future
    };
  }

  function resolveFolderBucket(input, account, folder) {
    const { monthAdjustments, periodYm, events, futureEvents, organization, asOf } = input;
    const key = `${account.id}|${folder.id}`;
    const transferRecord = specialMap(monthAdjustments, periodYm, KEYS.folderTransfers)[key] || {};
    const transferred = Number(transferRecord.amount || 0);
    const hasObserved = folder.actualBalance !== null && folder.actualBalance !== undefined;
    const observed = hasObserved ? Number(folder.actualBalance || 0) : null;
    const base = hasObserved ? observed : transferred;
    const anchor = hasObserved
      ? (toDate(folder.balanceUpdatedAt) || asOf)
      : (toDate(transferRecord.confirmedAt) || monthStart(periodYm));
    const settled = routedEvents(events, organization, account.id, folder.id, event => eventAfterAnchor(event, anchor, asOf));
    const settledNet = settled.reduce((sum, event) => sum + signedAmount(event), 0);
    const future = routedEvents(futureEvents, organization, account.id, folder.id);
    const futureNet = future.reduce((sum, event) => sum + signedAmount(event), 0);
    const current = round2(base + settledNet);
    const projected = round2(current + futureNet);
    return {
      id: key,
      accountId: account.id,
      folderId: folder.id,
      label: folder.name || 'Carpeta',
      base: round2(base),
      current,
      projected,
      settledNet: round2(settledNet),
      futureNet: round2(futureNet),
      observed: observed === null ? null : round2(observed),
      transferred: round2(transferred),
      anchor: anchor?.toISOString?.() || null,
      settledEvents: settled,
      futureEvents: future
    };
  }

  function empiricalAdjustment(input, secondaryAccounts) {
    const { monthAdjustments, periodYm } = input;
    const observedGeneral = specialMap(monthAdjustments, periodYm, KEYS.generalBalances);
    const folderTransfers = specialMap(monthAdjustments, periodYm, KEYS.folderTransfers);
    let delta = 0;
    for (const account of secondaryAccounts) {
      delta += Number(observedGeneral[account.id]?.amount || 0);
      for (const folder of account.folders || []) {
        if (folder.actualBalance === null || folder.actualBalance === undefined) continue;
        const transferred = Number(folderTransfers[`${account.id}|${folder.id}`]?.amount || 0);
        delta += Number(folder.actualBalance || 0) - transferred;
      }
    }
    return round2(delta);
  }

  function reservationCorrection(events, asOf) {
    return round2((events || [])
      .filter(event => isReservation(event) && String(event.type) === 'Ahorro')
      .filter(event => {
        const date = toDate(event.date);
        return date && date <= asOf;
      })
      .reduce((sum, event) => sum + Math.abs(Math.min(0, signedAmount(event))), 0));
  }

  function resolveAccountState(options) {
    const organization = options.organization || { accounts: [], assignments: {}, salaryAccountId: '' };
    const periodYm = options.periodYm || '';
    const asOf = endOfDay(options.asOf || new Date());
    const events = options.events || [];
    const futureEvents = options.futureEvents || [];
    const monthAdjustments = options.monthAdjustments || {};
    const accounts = organization.accounts || [];
    const salaryAccount = accounts.find(account => account.id === organization.salaryAccountId) || accounts[0] || null;
    const secondaryAccounts = accounts.filter(account => !salaryAccount || account.id !== salaryAccount.id);
    const input = { organization, periodYm, asOf, events, futureEvents, monthAdjustments };

    const secondary = secondaryAccounts.map(account => {
      const general = resolveGeneralBucket(input, account);
      const folders = (account.folders || []).map(folder => resolveFolderBucket(input, account, folder));
      const buckets = [general, ...folders];
      const current = round2(buckets.reduce((sum, bucket) => sum + bucket.current, 0));
      const projected = round2(buckets.reduce((sum, bucket) => sum + bucket.projected, 0));
      return { account, current, projected, general, folders, buckets };
    });

    const adjustment = empiricalAdjustment(input, secondaryAccounts);
    const savingsCorrection = reservationCorrection(events, asOf);
    const total = round2(Number(options.potentialNow || 0) + adjustment + savingsCorrection);
    const secondaryTotal = round2(secondary.reduce((sum, model) => sum + model.current, 0));
    const primaryCurrent = round2(total - secondaryTotal);
    const primaryFutureNet = salaryAccount
      ? routedEvents(futureEvents, organization, salaryAccount.id, '', null).reduce((sum, event) => sum + signedAmount(event), 0)
      : 0;
    const primaryProjected = round2(primaryCurrent + primaryFutureNet);
    const primary = salaryAccount ? { account: salaryAccount, current: primaryCurrent, projected: primaryProjected } : null;
    const splitDiff = round2(Math.abs(total - (primaryCurrent + secondaryTotal)));

    return {
      version: VERSION,
      periodYm,
      asOf,
      total,
      primary,
      secondary,
      secondaryTotal,
      empiricalAdjustment: adjustment,
      savingsReservationCorrection: savingsCorrection,
      splitDiff
    };
  }

  return {
    VERSION,
    KEYS,
    round2,
    assignmentFor,
    resolveAccountState
  };
});