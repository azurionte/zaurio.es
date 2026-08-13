(() => {
  'use strict';

  const PATCH_VERSION = '2.2-folder-summary-2';
  const SPECIAL_TRANSFER_KEY = '__folderTransfers';
  const expandedChargeAccounts = new Set();
  let lastChargeLookup = new Map();

  function install() {
    if (window.__DZ_FOLDER_SUMMARY_PATCH__ === PATCH_VERSION) return;
    if (typeof renderHomeDashboard !== 'function' || typeof buildTodayFinancialSnapshot !== 'function') {
      setTimeout(install, 50);
      return;
    }
    window.__DZ_FOLDER_SUMMARY_PATCH__ = PATCH_VERSION;

    const originalBuildTodayFinancialSnapshot = buildTodayFinancialSnapshot;
    const originalRenderHomeDashboard = renderHomeDashboard;

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

  function formatShortDate(date) {
    return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  function formatLongDate(date) {
    return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
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
    if (Number(amount || 0) <= 0) delete map[key];
    else map[key] = { amount: Number(amount), confirmedAt: new Date().toISOString() };
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

  function eventLookupKey(event) {
    return `${event.itemId || ''}|${dateIsoLocal(event.date)}|${event.type || ''}|${event.attributedYm || ''}`;
  }

  function bucketEvents(summary, organization, accountId, folderId = '') {
    const today = summary.asOf || (() => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; })();
    return (summary.snapshot?.events || [])
      .filter(event => Number(event.amount || 0) < 0)
      .filter(event => {
        const assigned = eventAssignment(event, organization);
        return assigned.accountId === accountId && (assigned.folderId || '') === (folderId || '');
      })
      .map(event => ({ ...event, amountAbs: Math.abs(Number(event.amount || 0)), isPast: event.date <= today }));
  }

  function balanceUpdatedThisPeriod(updatedAt, summary) {
    if (!updatedAt) return false;
    const date = new Date(updatedAt);
    return !Number.isNaN(date.getTime()) && date >= summary.periodStart;
  }

  function bucketCurrentEstimate(summary, organization, accountId, folderId = '', actualBalance = null, balanceUpdatedAt = '') {
    if (actualBalance !== null && actualBalance !== undefined) return Number(actualBalance || 0);
    const record = getTransferRecord(summary.periodYm, accountId, folderId);
    if (!record.amount) return 0;
    const confirmedAt = record.confirmedAt ? new Date(record.confirmedAt) : summary.periodStart;
    const chargesAfterTransfer = bucketEvents(summary, organization, accountId, folderId)
      .filter(event => event.type !== 'Presupuesto' && event.type !== 'Ahorro' && event.isPast && event.date >= confirmedAt)
      .reduce((sum, event) => sum + event.amountAbs, 0);
    return Number(record.amount || 0) - chargesAfterTransfer;
  }

  function bucketProjection(summary, organization, accountId, folderId, target, actualBalance = null, balanceUpdatedAt = '') {
    const current = bucketCurrentEstimate(summary, organization, accountId, folderId, actualBalance, balanceUpdatedAt);
    const record = getTransferRecord(summary.periodYm, accountId, folderId);
    const balanceIsFresh = balanceUpdatedThisPeriod(balanceUpdatedAt, summary);
    const pendingTransfer = balanceIsFresh
      ? 0
      : Math.max(0, Number(target || 0) - Math.max(0, current));
    const futureCharges = bucketEvents(summary, organization, accountId, folderId)
      .filter(event => !event.isPast && event.type !== 'Presupuesto' && event.type !== 'Ahorro')
      .reduce((sum, event) => sum + event.amountAbs, 0);
    const projected = current + pendingTransfer - futureCharges;
    return { current, projected, pendingTransfer, record, balanceIsFresh };
  }

  function accountModel(summary, organization, plan, account) {
    if (account.id === organization.salaryAccountId) return null;

    const buckets = [
      {
        folderId: '',
        label: 'Cuenta / recibos',
        target: Number(plan.targets.get(`${account.id}|`) || 0),
        actualBalance: null,
        balanceUpdatedAt: ''
      },
      ...account.folders.map(folder => ({
        folderId: folder.id,
        label: folder.name,
        target: Number(plan.targets.get(`${account.id}|${folder.id}`) || 0),
        actualBalance: folder.actualBalance,
        balanceUpdatedAt: folder.balanceUpdatedAt || ''
      }))
    ];

    const bucketModels = buckets.map(bucket => ({
      ...bucket,
      ...bucketProjection(
        summary,
        organization,
        account.id,
        bucket.folderId,
        bucket.target,
        bucket.actualBalance,
        bucket.balanceUpdatedAt
      )
    }));

    const calculatedCurrent = bucketModels.reduce((sum, bucket) => sum + Number(bucket.current || 0), 0);
    const accountIsFresh = balanceUpdatedThisPeriod(account.balanceUpdatedAt, summary);
    const current = account.actualBalance !== null && account.actualBalance !== undefined
      ? Number(account.actualBalance || 0)
      : calculatedCurrent;
    const pendingTransfer = bucketModels.reduce((sum, bucket) => sum + Number(bucket.pendingTransfer || 0), 0);
    const futureCharges = (summary.upcomingCharges || [])
      .filter(event => eventAssignment(event, organization).accountId === account.id)
      .reduce((sum, event) => sum + Math.abs(Number(event.amount || 0)), 0);
    const projected = current + (accountIsFresh ? 0 : pendingTransfer) - futureCharges;

    return {
      account,
      current,
      projected,
      pendingTransfer: accountIsFresh ? 0 : pendingTransfer,
      buckets: bucketModels,
      informed: account.actualBalance !== null && account.actualBalance !== undefined,
      isSalary: false
    };
  }

  function folderModeModels(summary) {
    const organization = currentOrganization();
    const plan = organizationPlan(summary);
    const secondary = organization.accounts
      .filter(account => account.id !== organization.salaryAccountId)
      .map(account => accountModel(summary, organization, plan, account));

    const totalSecondaryNow = secondary.reduce((sum, model) => sum + Number(model.current || 0), 0);
    const totalSecondaryEnd = secondary.reduce((sum, model) => sum + Number(model.projected || 0), 0);
    const salaryAccount = organization.accounts.find(account => account.id === organization.salaryAccountId) || organization.accounts[0];

    const salaryModel = salaryAccount ? {
      account: salaryAccount,
      current: Number(summary.potentialNow || 0) - totalSecondaryNow,
      projected: Number(summary.endingBalance || 0) - totalSecondaryEnd,
      pendingTransfer: secondary.reduce((sum, model) => sum + Number(model.pendingTransfer || 0), 0),
      buckets: [],
      informed: false,
      isSalary: true
    } : null;

    return { organization, plan, salaryModel, secondary, models: [salaryModel, ...secondary].filter(Boolean) };
  }

  function accountUpcomingCharges(model, summary, organization) {
    return (summary.upcomingCharges || []).filter(event => eventAssignment(event, organization).accountId === model.account.id);
  }

  function accountUnconfirmedCharges(model, summary, organization) {
    if (typeof unconfirmedPastServiceEvents !== 'function') return [];
    const today = new Date();
    return unconfirmedPastServiceEvents(summary, today)
      .filter(event => eventAssignment(event, organization).accountId === model.account.id);
  }

  function upcomingChargesHtml(model, summary, organization) {
    const charges = accountUpcomingCharges(model, summary, organization);
    if (!charges.length) return '';
    const expanded = expandedChargeAccounts.has(model.account.id);
    const visible = expanded ? charges : charges.slice(0, 3);
    const rows = visible.map(event => {
      const key = eventLookupKey(event);
      lastChargeLookup.set(key, event);
      return `<button class="dzBankCharge" type="button" data-dz-charge-edit="${escapeHtml(key)}">
        <span class="dzBankChargeDate">${formatShortDate(event.date)}</span>
        <span class="dzBankChargeMain"><strong>${escapeHtml(event.name)}</strong><small>${escapeHtml(event.type || 'Cargo')}</small></span>
        <strong class="dzBankChargeAmount">−${euros(Math.abs(Number(event.amount || 0)))}</strong>
      </button>`;
    }).join('');
    const more = charges.length > 3
      ? `<button class="dzLoadMore" type="button" data-dz-load-more="${escapeHtml(model.account.id)}">${expanded ? 'Ver menos' : `Cargar más (${charges.length - 3})`}</button>`
      : '';
    return `<div class="dzBankCharges"><div class="dzSectionMiniTitle">Próximos cargos</div>${rows}${more}</div>`;
  }

  function folderRowsHtml(model) {
    if (model.isSalary || !model.buckets.length) return '';
    const rows = model.buckets
      .filter(bucket => bucket.folderId)
      .map(bucket => {
        const current = Number(bucket.current || 0);
        const pending = Number(bucket.pendingTransfer || 0);
        const status = pending > 0.009 ? `Pendiente ${euros(pending)}` : 'Actualizado';
        return `<div class="dzFolderRow">
          <div><strong>${escapeHtml(bucket.label)}</strong><span>${status}</span></div>
          <strong class="${current >= 0 ? 'is-positive' : 'is-negative'}">${euros(current)}</strong>
        </div>`;
      }).join('');
    return rows ? `<div class="dzFolderBalances"><div class="dzSectionMiniTitle">Carpetas</div>${rows}</div>` : '';
  }

  function transferRowsHtml(model) {
    if (model.isSalary) return '';
    const rows = model.buckets
      .filter(bucket => bucket.target > 0 && bucket.pendingTransfer > 0.009)
      .map(bucket => `<div class="dzTransferRow">
        <div><strong>${escapeHtml(bucket.label)}</strong><span>Por ubicar en esta cuenta</span></div>
        <button class="dzTransferConfirm" type="button" data-dz-transfer-confirm="${escapeHtml(model.account.id)}|${escapeHtml(bucket.folderId)}" data-dz-transfer-target="${Number(bucket.target || 0)}">Confirmar ${euros(bucket.pendingTransfer)}</button>
      </div>`).join('');
    return rows ? `<div class="dzTransferList"><div class="dzSectionMiniTitle">Movimientos pendientes</div>${rows}</div>` : '';
  }

  function reconcileHtml(model, summary, organization) {
    const events = accountUnconfirmedCharges(model, summary, organization);
    if (!events.length) return '';
    return `<div class="dzReconcileInline"><div><strong>${events.length} cargo${events.length === 1 ? '' : 's'} por confirmar</strong><span>Comprueba importe y fecha reales.</span></div><button class="dzTinyButton" type="button" data-dz-reconcile-account="${escapeHtml(model.account.id)}">Revisar</button></div>`;
  }

  function accountWidget(model, summary, organization) {
    const currentClass = model.current >= 0 ? 'is-positive' : 'is-negative';
    const endClass = model.projected >= 0 ? 'is-positive' : 'is-negative';
    const subtitle = model.isSalary
      ? (model.pendingTransfer > 0 ? `${euros(model.pendingTransfer)} pendientes de mover a otras cuentas` : 'Reparto entre cuentas al día')
      : (model.pendingTransfer > 0 ? `${euros(model.pendingTransfer)} pendientes de mover` : 'Datos al día');

    return `<article class="dzAccountWidget ${model.isSalary ? 'salary' : 'secondary'}">
      <div class="dzAccountWidgetHead">
        <div><span class="dzAccountEyebrow">${model.isSalary ? 'CUENTA PRINCIPAL' : 'CUENTA SECUNDARIA'}</span><h3>${escapeHtml(model.account.name)}</h3><p>${escapeHtml(subtitle)}</p></div>
        ${!model.isSalary ? `<button class="dzTinyButton" type="button" data-dz-update-account-data="${escapeHtml(model.account.id)}">Actualizar datos</button>` : ''}
      </div>
      <div class="dzBalancePair">
        <div class="dzBalanceMetric"><span>Saldo estimado HOY</span><strong class="${currentClass}">${euros(model.current)}</strong></div>
        <div class="dzBalanceMetric"><span>Antes de la próxima nómina</span><strong class="${endClass}">${euros(model.projected)}</strong></div>
      </div>
      ${folderRowsHtml(model)}
      ${transferRowsHtml(model)}
      ${reconcileHtml(model, summary, organization)}
      ${upcomingChargesHtml(model, summary, organization)}
    </article>`;
  }

  function moneyFlowInsights(summary) {
    const snapshot = summary.snapshot || {};
    const expense = Math.max(0, Number(snapshot.expense || 0));
    const debt = Math.max(0, Number(snapshot.debt || 0));
    const savings = Math.max(0, Number(snapshot.savings || 0));
    const free = Math.max(0, Number(snapshot.net || 0));
    const total = expense + debt + savings + free || 1;
    const pExpense = expense / total * 100;
    const pDebt = debt / total * 100;
    const pSavings = savings / total * 100;
    const stop1 = pExpense;
    const stop2 = stop1 + pDebt;
    const stop3 = stop2 + pSavings;

    const months = Array.from({ length: 6 }, (_, index) => addMonthsStr(summary.periodYm, index));
    const forecast = months.map(month => {
      const item = buildForecastMonthSnapshot(month);
      return { month, net: Number(item.net || 0) };
    });
    const maxAbs = Math.max(1, ...forecast.map(item => Math.abs(item.net)));
    const bars = forecast.map(item => {
      const size = Math.max(4, Math.round(Math.abs(item.net) / maxAbs * 100));
      return `<div class="dzForecastRow"><span>${escapeHtml(prettyMonthLabel(item.month).replace(/ de \d{4}$/i, ''))}</span><div class="dzForecastTrack"><i class="${item.net >= 0 ? 'positive' : 'negative'}" style="width:${size}%"></i></div><strong class="${item.net >= 0 ? 'is-positive' : 'is-negative'}">${euros(item.net)}</strong></div>`;
    }).join('');

    return `<section class="dzInsightsGrid">
      <article class="panel dzInsightCard">
        <div class="dzInsightHead"><div><span class="dzAccountEyebrow">PERIODO ACTUAL</span><h3>Destino del dinero</h3></div></div>
        <div class="dzDonutWrap"><div class="dzDonut" style="--s1:${stop1}%;--s2:${stop2}%;--s3:${stop3}%"><div><strong>${euros(total)}</strong><span>planificado</span></div></div>
        <div class="dzLegend"><span><i class="expense"></i>Gastos ${euros(expense)}</span><span><i class="debt"></i>Deudas ${euros(debt)}</span><span><i class="saving"></i>Ahorro ${euros(savings)}</span><span><i class="free"></i>Sobrante ${euros(free)}</span></div></div>
      </article>
      <article class="panel dzInsightCard">
        <div class="dzInsightHead"><div><span class="dzAccountEyebrow">SALUD FINANCIERA</span><h3>Margen previsto</h3></div><span class="dzHealthPill ${forecast.every(item => item.net >= 0) ? 'good' : 'warn'}">${forecast.filter(item => item.net >= 0).length}/6 meses positivos</span></div>
        <div class="dzForecastBars">${bars}</div>
      </article>
    </section>`;
  }

  function enhanceHero(root, summary) {
    const hero = root.querySelector('.homeHero');
    if (!hero) return;
    const label = hero.querySelector('.label');
    const value = hero.querySelector('.homeHeroValue');
    const sub = hero.querySelector('.sub');
    const footnote = root.querySelector('.homeFootnote');
    const mode = hero.querySelector('.modeIndicator');

    if (label) label.innerHTML = `Dinero total estimado hoy <button class="dzInfoButton" type="button" data-dz-info="total" aria-label="Qué significa este total">i</button>`;
    if (value) value.textContent = euros(summary.potentialNow);
    if (sub) sub.textContent = `Periodo actual: ${formatLongDate(summary.periodStart)} — ${formatLongDate(summary.periodEnd)}`;
    if (footnote) footnote.remove();
    if (mode) mode.innerHTML = `Modo carpetas activo <button class="dzInfoButton" type="button" data-dz-info="folders" aria-label="Qué es el modo carpetas">i</button>`;

    hero.insertAdjacentHTML('beforeend', `<div class="dzInfoPopover" data-dz-popover="total"><button class="dzPopoverClose" type="button" data-dz-close-popover>×</button><strong>Dinero estimado en el periodo actual</strong><p>Combina el saldo de arranque del periodo con las entradas y los cargos cuya fecha ya ha llegado. Las tarjetas de cada cuenta muestran dónde debería estar físicamente ese dinero.</p></div><div class="dzInfoPopover" data-dz-popover="folders"><button class="dzPopoverClose" type="button" data-dz-close-popover>×</button><strong>Modo carpetas</strong><p>Separa el dinero entre cuentas y carpetas como Revolut, comida, Cooper o ahorro. DineroZaurio usa tus confirmaciones para mantener actualizado dónde está cada parte.</p><button class="btn danger dzDisableFolders" type="button" data-dz-disable-folders>Desactivar modo carpetas</button></div>`);
  }

  function enhanceFolderModeHome() {
    const root = document.getElementById('homeDashboard');
    if (!root) return;
    const organization = currentOrganization();
    if (!organization.enabled || organization.accounts.length === 0) return;

    const summary = buildTodayFinancialSnapshot(new Date());
    const data = folderModeModels(summary);
    lastChargeLookup = new Map();

    enhanceHero(root, summary);

    const grid = root.querySelector('.homeGrid');
    if (grid) {
      grid.className = 'dzAccountWidgetGrid';
      grid.innerHTML = data.models.map(model => accountWidget(model, summary, data.organization)).join('');
      grid.insertAdjacentHTML('afterend', moneyFlowInsights(summary));
    }

    root.querySelector('.organizationSection')?.remove();
    root.querySelector('.reconcileBanner')?.remove();
    const oldUpcoming = Array.from(root.querySelectorAll('.panel')).find(panel => panel.querySelector('h2')?.textContent?.trim() === 'Próximos cargos');
    oldUpcoming?.remove();

    bindHomeInteractions(root, summary, data);
  }

  function bindHomeInteractions(root, summary, data) {
    root.querySelectorAll('[data-dz-info]').forEach(button => button.addEventListener('click', () => {
      const name = button.dataset.dzInfo;
      root.querySelectorAll('.dzInfoPopover').forEach(popover => popover.classList.toggle('open', popover.dataset.dzPopover === name && !popover.classList.contains('open')));
    }));
    root.querySelectorAll('[data-dz-close-popover]').forEach(button => button.addEventListener('click', () => button.closest('.dzInfoPopover')?.classList.remove('open')));
    root.querySelector('[data-dz-disable-folders]')?.addEventListener('click', () => {
      const organization = currentOrganization();
      organization.enabled = false;
      state.moneyOrganization = organization;
      touchState();
      setTimeout(() => renderHomeDashboard(), 0);
    });

    root.querySelectorAll('[data-dz-transfer-confirm]').forEach(button => button.addEventListener('click', () => {
      const [accountId, folderId = ''] = String(button.dataset.dzTransferConfirm || '').split('|');
      const model = data.secondary.find(entry => entry.account.id === accountId);
      const bucket = model?.buckets.find(entry => (entry.folderId || '') === folderId);
      if (!bucket) return;
      const record = getTransferRecord(summary.periodYm, accountId, folderId);
      saveTransferRecord(summary.periodYm, accountId, folderId, Number(record.amount || 0) + Number(bucket.pendingTransfer || 0));
    }));

    root.querySelectorAll('[data-dz-update-account-data]').forEach(button => button.addEventListener('click', () => openAccountDataEditor(button.dataset.dzUpdateAccountData, summary)));

    root.querySelectorAll('[data-dz-load-more]').forEach(button => button.addEventListener('click', () => {
      const accountId = button.dataset.dzLoadMore;
      if (expandedChargeAccounts.has(accountId)) expandedChargeAccounts.delete(accountId);
      else expandedChargeAccounts.add(accountId);
      renderHomeDashboard();
    }));

    root.querySelectorAll('[data-dz-charge-edit]').forEach(button => button.addEventListener('click', () => {
      const event = lastChargeLookup.get(button.dataset.dzChargeEdit);
      if (event) openChargeQuickEditor(event, summary);
    }));

    root.querySelectorAll('[data-dz-reconcile-account]').forEach(button => button.addEventListener('click', () => {
      const model = data.models.find(entry => entry.account.id === button.dataset.dzReconcileAccount);
      if (!model) return;
      const events = accountUnconfirmedCharges(model, summary, data.organization);
      if (events.length) openChargeReviewModal(events, summary);
    }));
  }

  function openAccountDataEditor(accountId) {
    const organization = currentOrganization();
    const account = organization.accounts.find(item => item.id === accountId);
    if (!account) return;
    const root = document.getElementById('modalRoot');
    root.className = 'modalRoot';
    const folderFields = account.folders.map(folder => `<div class="dzBalanceEditRow"><label>${escapeHtml(folder.name)}<span>Saldo que queda ahora en esta carpeta</span></label><input class="input" type="number" step="0.01" data-dz-folder-balance="${escapeHtml(folder.id)}" value="${folder.actualBalance ?? ''}"></div>`).join('');
    root.innerHTML = `<div class="modalCard dzDataModal"><div class="modalHead"><div><h3>Actualizar ${escapeHtml(account.name)}</h3><div class="sub">Usa los saldos que ves ahora mismo. El sobrante de una carpeta se conservará para el siguiente periodo.</div></div><button id="closeModalBtn" class="btn danger">Cerrar</button></div><div class="dzBalanceEditRow"><label>Saldo total de ${escapeHtml(account.name)}<span>Opcional; sirve para contrastar la suma de carpetas.</span></label><input id="dzAccountActualBalance" class="input" type="number" step="0.01" value="${account.actualBalance ?? ''}"></div>${folderFields}<div class="btnRow" style="margin-top:18px"><button id="dzSaveAccountData" class="btn primary">Guardar datos actuales</button></div></div>`;
    document.getElementById('closeModalBtn').onclick = closeModal;
    document.getElementById('dzSaveAccountData').onclick = () => {
      const totalInput = document.getElementById('dzAccountActualBalance');
      const totalRaw = totalInput.value.trim();
      account.actualBalance = totalRaw === '' ? null : Number(totalRaw || 0);
      account.balanceUpdatedAt = totalRaw === '' ? '' : new Date().toISOString();
      root.querySelectorAll('[data-dz-folder-balance]').forEach(input => {
        const folder = account.folders.find(item => item.id === input.dataset.dzFolderBalance);
        if (!folder) return;
        const raw = input.value.trim();
        folder.actualBalance = raw === '' ? null : Number(raw || 0);
        folder.balanceUpdatedAt = raw === '' ? '' : new Date().toISOString();
      });
      state.moneyOrganization = organization;
      closeModal();
      touchState();
      setTimeout(() => renderHomeDashboard(), 0);
    };
  }

  function openChargeQuickEditor(event, summary) {
    const expense = (state.expenses || []).find(item => item.id === event.itemId);
    const debt = (state.debts || []).find(item => item.id === event.itemId);
    const item = expense || debt;
    if (!item) return;
    const isExpense = !!expense;
    const root = document.getElementById('modalRoot');
    root.className = 'modalRoot';
    const currentPeriodicity = isExpense ? normalizeExpensePeriodicity(item.periodicity || 'monthly') : 'monthly';
    const options = ['weekly','biweekly','monthly','bimonthly','quarterly','four_monthly','yearly','one_time','custom_months']
      .map(value => `<option value="${value}" ${currentPeriodicity === value ? 'selected' : ''}>${periodicityText(value)}</option>`).join('');
    const originalIso = dateIsoLocal(event.date);
    root.innerHTML = `<div class="modalCard dzChargeEditModal"><div class="modalHead"><div><h3>${escapeHtml(event.name)}</h3><div class="sub">Editar cargo previsto</div></div><button id="closeModalBtn" class="btn danger">Cerrar</button></div><div class="dzQuickEditGrid"><div class="field"><label>Importe</label><input id="dzChargeAmount" class="input" type="number" min="0" step="0.01" value="${Math.abs(Number(event.amount || 0))}"></div><div class="field"><label>Fecha</label><input id="dzChargeDate" class="input" type="date" value="${originalIso}"></div>${isExpense ? `<div class="field"><label>Periodicidad</label><select id="dzChargePeriodicity" class="select">${options}</select></div>` : ''}<div class="field"><label>Aplicar cambio</label><select id="dzChargeScope" class="select"><option value="this_month">Solo este periodo</option><option value="from_here">Desde ahora</option></select></div></div><div id="dzPeriodicityScopeHint" class="dzFormHint hidden">La periodicidad solo puede cambiarse de forma permanente. Si eliges “Solo este periodo”, se mantendrá la periodicidad habitual.</div><div class="btnRow" style="margin-top:18px"><button id="dzSaveChargeEdit" class="btn primary">Guardar cambios</button></div></div>`;
    document.getElementById('closeModalBtn').onclick = closeModal;
    const scopeEl = document.getElementById('dzChargeScope');
    const periodicityEl = document.getElementById('dzChargePeriodicity');
    const hint = document.getElementById('dzPeriodicityScopeHint');
    const syncHint = () => {
      if (!periodicityEl) return;
      hint.classList.toggle('hidden', scopeEl.value !== 'this_month' || periodicityEl.value === currentPeriodicity);
    };
    scopeEl.onchange = syncHint;
    if (periodicityEl) periodicityEl.onchange = syncHint;

    document.getElementById('dzSaveChargeEdit').onclick = () => {
      const amount = Math.max(0, Number(document.getElementById('dzChargeAmount').value || 0));
      const nextIso = document.getElementById('dzChargeDate').value || originalIso;
      const scope = scopeEl.value || 'this_month';
      const nextPeriodicity = periodicityEl?.value || currentPeriodicity;
      const monthKey = event.attributedYm || summary.periodYm;
      if (isExpense) saveExpenseChargeEdit(item, monthKey, originalIso, nextIso, amount, nextPeriodicity, scope);
      else saveDebtChargeEdit(item, monthKey, nextIso, amount, scope);
      closeModal();
      setTimeout(() => renderHomeDashboard(), 0);
    };
  }

  function saveExpenseChargeEdit(item, monthKey, originalIso, nextIso, amount, periodicity, scope) {
    if (scope === 'from_here') {
      item.amount = amount;
      item.periodicity = periodicity;
      const chosen = new Date(`${nextIso}T12:00:00`);
      if (['weekly', 'biweekly'].includes(normalizeExpensePeriodicity(periodicity))) {
        item.startDate = dateIsoLocal(addDaysLocal(chosen, Math.max(0, Number(item.chargeLeadDays || 0))));
      } else {
        item.dueDay = chosen.getDate();
        item.calendarRuleType = 'fixed_day';
        item.calendarMonthShift = 0;
      }
      item.calendarConfidence = 'confirmed';
      item.calendarNote = `Fecha confirmada por el usuario desde ${nextIso}`;
      touchState();
      return;
    }

    const nextAdj = normalizeMonthAdjustmentShape(state.monthAdjustments?.[monthKey] || {}, monthKey);
    const raw = nextAdj.expenseOverrides?.[item.id];
    const base = raw && typeof raw === 'object' ? cloneData(raw) : { mode: 'this_month', amount };
    base.mode = 'this_month';
    base.amount = amount;
    if (['weekly', 'biweekly'].includes(normalizeExpensePeriodicity(item.periodicity))) {
      base.dateReplacements = { ...(base.dateReplacements || {}), [originalIso]: nextIso };
    } else {
      base.calendarDate = nextIso;
    }
    nextAdj.expenseOverrides[item.id] = base;
    state.monthAdjustments[monthKey] = nextAdj;
    touchState();
  }

  function saveDebtChargeEdit(item, monthKey, nextIso, amount, scope) {
    const nextAdj = normalizeMonthAdjustmentShape(state.monthAdjustments?.[monthKey] || {}, monthKey);
    nextAdj.debtOverrides[item.id] = {
      mode: 'custom',
      amount,
      scope: scope === 'from_here' ? 'from_here' : 'this_month',
      source: 'salary',
      calendarDate: nextIso,
      savingsGoalId: ''
    };
    state.monthAdjustments[monthKey] = nextAdj;
    touchState();
  }

  function periodicityText(value) {
    return ({
      weekly: 'Semanal',
      biweekly: 'Cada 14 días',
      monthly: 'Mensual',
      bimonthly: 'Bimestral',
      quarterly: 'Trimestral',
      four_monthly: 'Cada 4 meses',
      yearly: 'Anual',
      one_time: 'Puntual',
      custom_months: 'Cada varios meses'
    })[value] || 'Mensual';
  }

  function injectStyles() {
    if (document.getElementById('dzFolderSummaryStyles')) return;
    const style = document.createElement('style');
    style.id = 'dzFolderSummaryStyles';
    style.textContent = `
      .dzAccountWidgetGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:16px 0}
      .dzAccountWidget{position:relative;overflow:hidden;padding:20px;border-radius:22px;border:1px solid rgba(255,255,255,.11);background:linear-gradient(145deg,rgba(23,31,62,.96),rgba(11,15,35,.96));box-shadow:0 18px 44px rgba(0,0,0,.2)}
      .dzAccountWidget.salary{background:linear-gradient(145deg,rgba(31,19,68,.98),rgba(12,15,38,.98))}.dzAccountWidget.secondary{background:linear-gradient(145deg,rgba(10,43,58,.94),rgba(10,18,37,.98))}
      .dzAccountWidgetHead{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.dzAccountWidgetHead h3{font-size:21px;margin:4px 0 5px}.dzAccountWidgetHead p{margin:0;color:var(--muted);font-size:12px;line-height:1.45}
      .dzAccountEyebrow{font-size:10px;letter-spacing:.12em;font-weight:900;color:#9fe8f5}.dzBalancePair{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:17px}.dzBalanceMetric{padding:15px;border-radius:16px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.065)}
      .dzBalanceMetric span{display:block;color:var(--muted);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.dzBalanceMetric strong{display:block;font-size:28px;line-height:1.1;margin-top:8px}.is-positive{color:#74f1a7!important}.is-negative{color:#ff7f9d!important}
      .dzSectionMiniTitle{font-size:10px;font-weight:900;color:rgba(255,255,255,.58);text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px}.dzFolderBalances,.dzTransferList,.dzBankCharges{margin-top:15px;padding-top:13px;border-top:1px solid rgba(255,255,255,.08)}
      .dzFolderRow,.dzTransferRow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 2px}.dzFolderRow strong,.dzTransferRow strong{font-size:13px}.dzFolderRow span,.dzTransferRow span{display:block;margin-top:3px;color:var(--muted);font-size:11px}
      .dzTransferConfirm,.dzTinyButton,.dzLoadMore{border:0;border-radius:999px;padding:8px 11px;font-weight:850;font-size:11px;cursor:pointer;white-space:nowrap}.dzTransferConfirm{background:linear-gradient(135deg,#009fd1,#22d3ee);color:#04131a}.dzTinyButton,.dzLoadMore{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.09);color:#fff}.dzLoadMore{width:100%;margin-top:8px}
      .dzBankCharge{width:100%;display:grid;grid-template-columns:62px minmax(0,1fr) auto;gap:10px;align-items:center;text-align:left;padding:10px 2px;border:0;border-bottom:1px solid rgba(255,255,255,.06);background:transparent;color:#fff;cursor:pointer}.dzBankCharge:last-of-type{border-bottom:0}.dzBankChargeDate{font-size:11px;color:#b7c2df}.dzBankChargeMain strong{display:block;font-size:13px}.dzBankChargeMain small{display:block;margin-top:3px;color:var(--muted);font-size:10px}.dzBankChargeAmount{font-size:13px;color:#ff879f}
      .dzReconcileInline{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:15px;padding:11px 12px;border-radius:14px;background:rgba(251,191,36,.09);border:1px solid rgba(251,191,36,.16)}.dzReconcileInline strong{display:block;font-size:12px}.dzReconcileInline span{display:block;margin-top:3px;color:var(--muted);font-size:11px}
      .dzInfoButton{display:inline-grid;place-items:center;width:19px;height:19px;margin-left:5px;padding:0;border-radius:50%;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;font-size:11px;font-weight:900;cursor:pointer;vertical-align:middle}.homeHero{position:relative}.dzInfoPopover{position:absolute;z-index:40;top:76px;left:22px;width:min(420px,calc(100% - 44px));display:none;padding:18px;border-radius:18px;background:#101730;border:1px solid rgba(255,255,255,.12);box-shadow:0 20px 50px rgba(0,0,0,.35)}.dzInfoPopover.open{display:block}.dzInfoPopover strong{display:block;font-size:15px}.dzInfoPopover p{margin:8px 0 0;color:var(--muted);line-height:1.5;font-size:13px}.dzPopoverClose{position:absolute;right:10px;top:8px;border:0;background:transparent;color:#fff;font-size:22px;cursor:pointer}.dzDisableFolders{margin-top:14px}
      .dzInsightsGrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0}.dzInsightCard{margin:0}.dzInsightHead{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.dzInsightHead h3{margin:4px 0 0}.dzDonutWrap{display:grid;grid-template-columns:180px 1fr;gap:18px;align-items:center;margin-top:16px}.dzDonut{width:170px;height:170px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#fb7185 0 var(--s1),#fbbf24 var(--s1) var(--s2),#4ade80 var(--s2) var(--s3),#22d3ee var(--s3) 100%);position:relative}.dzDonut:after{content:'';position:absolute;inset:28px;border-radius:50%;background:#10162f}.dzDonut>div{position:relative;z-index:1;text-align:center}.dzDonut strong{display:block;font-size:18px}.dzDonut span{font-size:10px;color:var(--muted)}.dzLegend{display:grid;gap:9px}.dzLegend span{font-size:12px;color:#dce4f8}.dzLegend i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px}.dzLegend i.expense{background:#fb7185}.dzLegend i.debt{background:#fbbf24}.dzLegend i.saving{background:#4ade80}.dzLegend i.free{background:#22d3ee}
      .dzHealthPill{padding:6px 9px;border-radius:999px;font-size:10px;font-weight:900}.dzHealthPill.good{background:rgba(74,222,128,.12);color:#91f5b7}.dzHealthPill.warn{background:rgba(251,191,36,.12);color:#ffd66b}.dzForecastBars{display:grid;gap:10px;margin-top:18px}.dzForecastRow{display:grid;grid-template-columns:62px 1fr 78px;align-items:center;gap:9px;font-size:11px}.dzForecastTrack{height:8px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden}.dzForecastTrack i{display:block;height:100%;border-radius:99px}.dzForecastTrack i.positive{background:#4ade80}.dzForecastTrack i.negative{background:#fb7185}.dzForecastRow strong{text-align:right;font-size:11px}
      .dzBalanceEditRow{display:grid;grid-template-columns:minmax(160px,1fr) 150px;align-items:center;gap:14px;margin-top:12px;padding:12px;border-radius:14px;background:rgba(255,255,255,.035)}.dzBalanceEditRow label{font-weight:800}.dzBalanceEditRow label span{display:block;margin-top:4px;color:var(--muted);font-size:11px;font-weight:500}.dzQuickEditGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.dzFormHint{margin-top:12px;padding:10px 12px;border-radius:12px;background:rgba(251,191,36,.09);color:#ffe29b;font-size:12px}
      .dzDropdown{padding:14px!important}.dzDropdownList{gap:10px!important}.dzDropdown .profileMenuAction{margin:0!important}.dzDropdown .profileMenuAction + .profileMenuAction{margin-top:8px!important}.panel,.settingsManagerCard,.accountSetupCard,.allocationRow,.accountSummaryCard{background-clip:padding-box}
      @media(max-width:900px){.dzAccountWidgetGrid,.dzInsightsGrid{grid-template-columns:1fr}.dzDonutWrap{grid-template-columns:150px 1fr}.dzDonut{width:145px;height:145px}.dzBalancePair{grid-template-columns:1fr 1fr}}
      @media(max-width:600px){
        .page{padding-left:12px!important;padding-right:12px!important}.panel{padding-left:14px!important;padding-right:14px!important}.dzNavShell{padding-left:8px!important;padding-right:8px!important}.dzNav{padding:8px 10px!important;gap:7px!important}.dzDropdown.right{right:-6px!important;min-width:min(300px,calc(100vw - 20px))!important}
        .calendarMonth{overflow:visible!important;padding:8px!important}.calendarWeekdays,.calendarGrid{grid-template-columns:repeat(7,minmax(0,1fr))!important;min-width:0!important;width:100%!important}.calendarWeekdays div{padding:4px 1px!important;text-align:center;font-size:9px!important}.calendarDay{min-width:0!important;min-height:72px!important;padding:3px!important}.calendarDayNumber{font-size:10px!important;margin-bottom:2px!important}.calendarEventChip{display:block!important;margin-top:2px!important;padding:2px!important;font-size:8px!important;overflow:hidden!important}.calendarEventChip span:first-child{display:block!important;max-width:100%!important}.calendarEventChip strong{display:block!important;margin-top:1px;font-size:8px}.calendarDayBalance{font-size:8px!important;margin-top:3px!important;padding-top:2px!important;overflow:hidden}.calendarToolbar,.calendarSummary{grid-template-columns:1fr!important}
        .dzBalancePair,.dzQuickEditGrid,.dzBalanceEditRow{grid-template-columns:1fr}.dzAccountWidget{padding:16px}.dzAccountWidgetHead{display:block}.dzTinyButton{margin-top:10px}.dzBankCharge{grid-template-columns:52px minmax(0,1fr) auto}.dzDonutWrap{grid-template-columns:1fr;justify-items:center}.dzLegend{width:100%}.dzForecastRow{grid-template-columns:54px 1fr 70px}.dzTransferRow,.dzReconcileInline{align-items:flex-start;flex-direction:column}.dzTransferConfirm,.dzReconcileInline .dzTinyButton{width:100%}.dzInfoPopover{left:12px;width:calc(100% - 24px);top:92px}
      }
    `;
    document.head.appendChild(style);
  }

  window.addEventListener('load', install, { once: true });
  if (document.readyState === 'complete') install();
})();