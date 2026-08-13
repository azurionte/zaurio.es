(() => {
  'use strict';

  const PATCH_VERSION = '2.2-folder-summary-1';
  const SPECIAL_TRANSFER_KEY = '__folderTransfers';

  function install() {
    if (window.__DZ_FOLDER_SUMMARY_PATCH__ === PATCH_VERSION) return;
    if (typeof renderHomeDashboard !== 'function' || typeof buildTodayFinancialSnapshot !== 'function') {
      setTimeout(install, 50);
      return;
    }
    window.__DZ_FOLDER_SUMMARY_PATCH__ = PATCH_VERSION;

    const originalBuildTodayFinancialSnapshot = buildTodayFinancialSnapshot;
    const originalRenderHomeDashboard = renderHomeDashboard;

    // "Hoy" must only include income/charges whose calendar date has actually arrived.
    buildTodayFinancialSnapshot = function patchedBuildTodayFinancialSnapshot(asOf = new Date()) {
      const summary = originalBuildTodayFinancialSnapshot(asOf);
      try {
        const cleanAsOf = new Date(asOf);
        cleanAsOf.setHours(23, 59, 59, 999);
        const events = (summary.snapshot?.events || []).filter(event => event.date >= summary.periodStart && event.date <= summary.periodEnd);
        const incomeAvailable = events
          .filter(event => Number(event.amount || 0) > 0 && event.date <= cleanAsOf)
          .reduce((sum, event) => sum + Number(event.amount || 0), 0);
        const charged = events
          .filter(event => Number(event.amount || 0) < 0 && event.type !== 'Presupuesto' && event.date <= cleanAsOf)
          .reduce((sum, event) => sum + Math.abs(Number(event.amount || 0)), 0);
        const budgetEvents = events.filter(event => event.type === 'Presupuesto');
        const budgetsReserved = budgetEvents.reduce((sum, event) => sum + Math.abs(Number(event.amount || 0)), 0);
        const budgetsReservedToDate = budgetEvents
          .filter(event => event.date <= cleanAsOf)
          .reduce((sum, event) => sum + Math.abs(Number(event.amount || 0)), 0);
        const upcomingCharges = events
          .filter(event => Number(event.amount || 0) < 0 && event.type !== 'Presupuesto' && event.date > cleanAsOf)
          .sort((a, b) => a.date - b.date);

        summary.incomeAvailable = incomeAvailable;
        summary.charged = charged;
        summary.potentialNow = Number(summary.openingBalance || 0) + incomeAvailable - charged;
        summary.budgetsReserved = budgetsReserved;
        summary.budgetsReservedToDate = budgetsReservedToDate;
        summary.operatingBalanceNow = summary.potentialNow - budgetsReservedToDate;
        summary.upcomingCharges = upcomingCharges;
        summary.upcomingTotal = upcomingCharges.reduce((sum, event) => sum + Math.abs(Number(event.amount || 0)), 0);
        summary.asOf = cleanAsOf;
      } catch (error) {
        console.error('DineroZaurio folder summary: no se pudo recalcular el saldo de hoy', error);
      }
      return summary;
    };

    renderHomeDashboard = function patchedRenderHomeDashboard() {
      originalRenderHomeDashboard();
      try {
        enhanceFolderModeHome();
      } catch (error) {
        console.error('DineroZaurio folder summary: no se pudo mejorar Resumen', error);
      }
    };

    injectStyles();
    if (document.getElementById('homeDashboard')) renderHomeDashboard();
  }

  function currentOrganization() {
    return normalizeMoneyOrganization(state.moneyOrganization);
  }

  function transferMapForMonth(monthKey) {
    const raw = state.monthAdjustments?.[monthKey]?.expenseOverrides?.[SPECIAL_TRANSFER_KEY];
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? cloneData(raw) : {};
  }

  function bucketKey(accountId, folderId = '') {
    return `${accountId}|${folderId || ''}`;
  }

  function getTransferRecord(monthKey, accountId, folderId = '') {
    const raw = transferMapForMonth(monthKey)[bucketKey(accountId, folderId)];
    if (!raw || typeof raw !== 'object') return { amount: 0, confirmedAt: '' };
    return {
      amount: Math.max(0, Number(raw.amount || 0)),
      confirmedAt: String(raw.confirmedAt || '')
    };
  }

  function saveTransferRecord(monthKey, accountId, folderId, amount) {
    const nextAdj = normalizeMonthAdjustmentShape(state.monthAdjustments?.[monthKey] || {}, monthKey);
    const map = nextAdj.expenseOverrides?.[SPECIAL_TRANSFER_KEY] && typeof nextAdj.expenseOverrides[SPECIAL_TRANSFER_KEY] === 'object'
      ? cloneData(nextAdj.expenseOverrides[SPECIAL_TRANSFER_KEY])
      : {};
    const key = bucketKey(accountId, folderId);
    if (Number(amount || 0) <= 0) {
      delete map[key];
    } else {
      map[key] = { amount: Number(amount), confirmedAt: new Date().toISOString() };
    }
    if (Object.keys(map).length) nextAdj.expenseOverrides[SPECIAL_TRANSFER_KEY] = map;
    else delete nextAdj.expenseOverrides[SPECIAL_TRANSFER_KEY];
    state.monthAdjustments[monthKey] = nextAdj;
    touchState();
    setTimeout(() => renderHomeDashboard(), 0);
  }

  function eventAssignment(event, organization) {
    if (!event?.itemId) return { accountId: organization.salaryAccountId, folderId: '' };
    const assigned = organization.assignments?.[event.itemId];
    if (!assigned?.accountId) return { accountId: organization.salaryAccountId, folderId: '' };
    return { accountId: assigned.accountId, folderId: assigned.folderId || '' };
  }

  function bucketEvents(summary, organization, accountId, folderId = '') {
    const today = summary.asOf || (() => { const d = new Date(); d.setHours(23,59,59,999); return d; })();
    return (summary.snapshot?.events || [])
      .filter(event => Number(event.amount || 0) < 0)
      .filter(event => {
        const assigned = eventAssignment(event, organization);
        return assigned.accountId === accountId && (assigned.folderId || '') === (folderId || '');
      })
      .map(event => ({ ...event, amountAbs: Math.abs(Number(event.amount || 0)), isPast: event.date <= today }));
  }

  function bucketCurrentEstimate(summary, organization, accountId, folderId = '') {
    const record = getTransferRecord(summary.periodYm, accountId, folderId);
    if (!record.amount) return 0;
    const confirmedAt = record.confirmedAt ? new Date(record.confirmedAt) : summary.periodStart;
    const chargesAfterTransfer = bucketEvents(summary, organization, accountId, folderId)
      .filter(event => event.type !== 'Presupuesto' && event.type !== 'Ahorro' && event.isPast && event.date >= confirmedAt)
      .reduce((sum, event) => sum + event.amountAbs, 0);
    return Number(record.amount || 0) - chargesAfterTransfer;
  }

  function bucketProjection(summary, organization, accountId, folderId, target) {
    const current = bucketCurrentEstimate(summary, organization, accountId, folderId);
    const record = getTransferRecord(summary.periodYm, accountId, folderId);
    const pendingTransfer = Math.max(0, Number(target || 0) - Math.max(0, current));
    const events = bucketEvents(summary, organization, accountId, folderId);
    const futureCharges = events
      .filter(event => !event.isPast && event.type !== 'Presupuesto' && event.type !== 'Ahorro')
      .reduce((sum, event) => sum + event.amountAbs, 0);
    const budgetToConsume = events
      .filter(event => event.type === 'Presupuesto')
      .reduce((sum, event) => sum + event.amountAbs, 0);
    const projected = current + pendingTransfer - futureCharges - budgetToConsume;
    return { current, projected, pendingTransfer, record };
  }

  function accountModel(summary, organization, plan, account) {
    const isSalary = account.id === organization.salaryAccountId;
    if (isSalary) return null;

    const buckets = [
      { folderId: '', label: 'Cuenta / recibos', target: Number(plan.targets.get(`${account.id}|`) || 0) },
      ...account.folders.map(folder => ({
        folderId: folder.id,
        label: folder.name,
        target: Number(plan.targets.get(`${account.id}|${folder.id}`) || 0)
      }))
    ];

    let current = 0;
    let projected = 0;
    let pendingTransfer = 0;
    const bucketModels = buckets.map(bucket => {
      const model = bucketProjection(summary, organization, account.id, bucket.folderId, bucket.target);
      current += model.current;
      projected += model.projected;
      pendingTransfer += model.pendingTransfer;
      return { ...bucket, ...model };
    });

    if (account.actualBalance !== null && account.actualBalance !== undefined) {
      const informed = Number(account.actualBalance || 0);
      const delta = informed - current;
      current = informed;
      projected += delta;
    }

    return {
      account,
      current,
      projected,
      pendingTransfer,
      buckets: bucketModels,
      informed: account.actualBalance !== null && account.actualBalance !== undefined
    };
  }

  function folderModeModels(summary) {
    const organization = currentOrganization();
    const plan = organizationPlan(summary);
    const secondary = organization.accounts
      .filter(account => account.id !== organization.salaryAccountId)
      .map(account => accountModel(summary, organization, plan, account));

    const totalSecondaryNow = secondary.reduce((sum, model) => sum + Number(model.current || 0), 0);
    const salaryAccount = organization.accounts.find(account => account.id === organization.salaryAccountId) || organization.accounts[0];
    const salaryNow = Number(summary.potentialNow || 0) - totalSecondaryNow;

    const totalSecondaryEnd = secondary.reduce((sum, model) => sum + Number(model.projected || 0), 0);
    const salaryEnd = Number(summary.endingBalance || 0) - totalSecondaryEnd;

    const salaryModel = salaryAccount ? {
      account: salaryAccount,
      current: salaryNow,
      projected: salaryEnd,
      pendingTransfer: secondary.reduce((sum, model) => sum + Number(model.pendingTransfer || 0), 0),
      buckets: [],
      informed: false,
      isSalary: true
    } : null;

    return { organization, plan, salaryModel, secondary, models: [salaryModel, ...secondary].filter(Boolean) };
  }

  function accountWidget(model, summary) {
    const account = model.account;
    const currentClass = model.current >= 0 ? 'is-positive' : 'is-negative';
    const endClass = model.projected >= 0 ? 'is-positive' : 'is-negative';
    const rows = model.isSalary ? '' : model.buckets
      .filter(bucket => bucket.target > 0 || bucket.record.amount > 0)
      .map(bucket => {
        const covered = bucket.pendingTransfer <= 0.009;
        const action = covered
          ? `<button class="dzTransferUndo" type="button" data-dz-transfer-undo="${escapeHtml(account.id)}|${escapeHtml(bucket.folderId)}">Movido ✓</button>`
          : `<button class="dzTransferConfirm" type="button" data-dz-transfer-confirm="${escapeHtml(account.id)}|${escapeHtml(bucket.folderId)}" data-dz-transfer-target="${Number(bucket.target || 0)}">Confirmar ${euros(bucket.pendingTransfer)}</button>`;
        return `<div class="dzTransferRow"><div><strong>${escapeHtml(bucket.label)}</strong><span>${covered ? `Hay ${euros(bucket.current)} estimados aquí` : `Faltan por ubicar ${euros(bucket.pendingTransfer)}`}</span></div>${action}</div>`;
      }).join('');

    const subtitle = model.isSalary
      ? `Cuenta principal · ${model.pendingTransfer > 0 ? `${euros(model.pendingTransfer)} todavía pendientes de mover a otras cuentas` : 'reparto entre cuentas al día'}`
      : `${model.informed ? 'Saldo real informado como referencia' : 'Estimado según movimientos confirmados'}${model.pendingTransfer > 0 ? ` · ${euros(model.pendingTransfer)} pendientes de mover` : ''}`;

    return `<article class="dzAccountWidget ${model.isSalary ? 'salary' : 'secondary'}">
      <div class="dzAccountWidgetHead"><div><span class="dzAccountEyebrow">${model.isSalary ? 'CUENTA PRINCIPAL' : 'CUENTA SECUNDARIA'}</span><h3>${escapeHtml(account.name)}</h3><p>${escapeHtml(subtitle)}</p></div>${!model.isSalary ? `<button class="dzTinyButton" type="button" data-update-account-balance="${escapeHtml(account.id)}">Informar saldo real</button>` : ''}</div>
      <div class="dzBalancePair">
        <div class="dzBalanceMetric"><span>Saldo estimado HOY</span><strong class="${currentClass}">${euros(model.current)}</strong><small>No descuenta cargos con fecha futura.</small></div>
        <div class="dzBalanceMetric"><span>Antes de la próxima nómina</span><strong class="${endClass}">${euros(model.projected)}</strong><small>Asume cargos y movimientos pendientes del periodo.</small></div>
      </div>
      ${rows ? `<div class="dzTransferList"><div class="dzTransferTitle">¿Dónde está ya el dinero?</div>${rows}</div>` : ''}
    </article>`;
  }

  function enhanceFolderModeHome() {
    const root = document.getElementById('homeDashboard');
    if (!root) return;
    const organization = currentOrganization();
    if (!organization.enabled || organization.accounts.length === 0) return;

    const summary = buildTodayFinancialSnapshot(new Date());
    const data = folderModeModels(summary);
    const grid = root.querySelector('.homeGrid');
    if (grid) {
      grid.className = 'dzAccountWidgetGrid';
      grid.innerHTML = data.models.map(model => accountWidget(model, summary)).join('');
    }

    const heroLabel = root.querySelector('.homeHero .label');
    const heroValue = root.querySelector('.homeHero .homeHeroValue');
    const heroSub = root.querySelector('.homeHero .sub');
    const heroFootnote = root.querySelector('.homeFootnote');
    if (heroLabel) heroLabel.textContent = 'Dinero total estimado hoy';
    if (heroValue) heroValue.textContent = euros(summary.potentialNow);
    if (heroSub) heroSub.textContent = `${budgetPeriodCaption(summary.periodYm)} · total entre cuentas antes de separar dónde está físicamente cada parte`;
    if (heroFootnote) heroFootnote.textContent = 'Este total no es el saldo de BBVA. Las tarjetas de cuenta de abajo reparten el dinero entre BBVA, Revolut y sus carpetas según los movimientos que hayas confirmado.';

    const oldOrganization = root.querySelector('.organizationSection');
    if (oldOrganization) oldOrganization.remove();

    root.querySelectorAll('[data-dz-transfer-confirm]').forEach(button => {
      button.addEventListener('click', () => {
        const [accountId, folderId = ''] = String(button.dataset.dzTransferConfirm || '').split('|');
        const target = Number(button.dataset.dzTransferTarget || 0);
        const model = data.secondary.find(entry => entry.account.id === accountId);
        const bucket = model?.buckets.find(entry => (entry.folderId || '') === folderId);
        if (!bucket) return;
        const currentRecord = getTransferRecord(summary.periodYm, accountId, folderId);
        const nextAmount = Number(currentRecord.amount || 0) + Number(bucket.pendingTransfer || 0);
        saveTransferRecord(summary.periodYm, accountId, folderId, nextAmount || target);
      });
    });

    root.querySelectorAll('[data-dz-transfer-undo]').forEach(button => {
      button.addEventListener('click', () => {
        const [accountId, folderId = ''] = String(button.dataset.dzTransferUndo || '').split('|');
        saveTransferRecord(summary.periodYm, accountId, folderId, 0);
      });
    });

    root.querySelectorAll('[data-update-account-balance]').forEach(button => {
      button.addEventListener('click', () => openAccountBalanceEditor(button.dataset.updateAccountBalance));
    });
  }

  function injectStyles() {
    if (document.getElementById('dzFolderSummaryStyles')) return;
    const style = document.createElement('style');
    style.id = 'dzFolderSummaryStyles';
    style.textContent = `
      .dzAccountWidgetGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:16px 0}
      .dzAccountWidget{position:relative;overflow:hidden;padding:20px;border-radius:22px;border:1px solid rgba(255,255,255,.11);background:linear-gradient(145deg,rgba(23,31,62,.96),rgba(11,15,35,.96));box-shadow:0 18px 44px rgba(0,0,0,.2)}
      .dzAccountWidget.salary{background:linear-gradient(145deg,rgba(31,19,68,.98),rgba(12,15,38,.98))}
      .dzAccountWidget.secondary{background:linear-gradient(145deg,rgba(10,43,58,.94),rgba(10,18,37,.98))}
      .dzAccountWidgetHead{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}
      .dzAccountWidgetHead h3{font-size:21px;margin:4px 0 5px}.dzAccountWidgetHead p{margin:0;color:var(--muted);font-size:12px;line-height:1.45}
      .dzAccountEyebrow{font-size:10px;letter-spacing:.12em;font-weight:900;color:#9fe8f5}
      .dzBalancePair{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:17px}
      .dzBalanceMetric{padding:15px;border-radius:16px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.065)}
      .dzBalanceMetric span{display:block;color:var(--muted);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
      .dzBalanceMetric strong{display:block;font-size:28px;line-height:1.1;margin:8px 0 5px}.dzBalanceMetric strong.is-positive{color:#74f1a7}.dzBalanceMetric strong.is-negative{color:#ff7f9d}
      .dzBalanceMetric small{display:block;color:rgba(255,255,255,.52);font-size:11px;line-height:1.35}
      .dzTransferList{margin-top:15px;padding-top:13px;border-top:1px solid rgba(255,255,255,.08);display:grid;gap:8px}.dzTransferTitle{font-size:11px;font-weight:900;color:rgba(255,255,255,.65);text-transform:uppercase;letter-spacing:.06em}
      .dzTransferRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 11px;border-radius:13px;background:rgba(0,0,0,.16)}
      .dzTransferRow strong{display:block;font-size:13px}.dzTransferRow span{display:block;margin-top:3px;color:var(--muted);font-size:11px}
      .dzTransferConfirm,.dzTransferUndo,.dzTinyButton{border:0;border-radius:999px;padding:8px 11px;font-weight:850;font-size:11px;cursor:pointer;color:#fff;white-space:nowrap}
      .dzTransferConfirm{background:linear-gradient(135deg,#009fd1,#22d3ee);color:#04131a}.dzTransferUndo{background:rgba(74,222,128,.13);color:#8bf5b5;border:1px solid rgba(74,222,128,.22)}.dzTinyButton{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.09)}
      @media(max-width:900px){.dzAccountWidgetGrid{grid-template-columns:1fr}.dzBalancePair{grid-template-columns:1fr 1fr}}
      @media(max-width:520px){.dzBalancePair{grid-template-columns:1fr}.dzAccountWidgetHead{display:block}.dzTinyButton{margin-top:10px}.dzTransferRow{align-items:flex-start;flex-direction:column}.dzTransferConfirm,.dzTransferUndo{width:100%}}
    `;
    document.head.appendChild(style);
  }

  window.addEventListener('load', install, { once: true });
  if (document.readyState === 'complete') install();
})();
