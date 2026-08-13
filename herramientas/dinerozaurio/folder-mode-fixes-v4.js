(() => {
  'use strict';

  const PATCH_VERSION = '2.4-folder-balance-fix-1';
  const TRANSFER_KEY = '__folderTransfers';
  const CORRECTION_KEY = '__folderBalanceCorrections';

  function install() {
    if (window.__DZ_FOLDER_MODE_V4__ === PATCH_VERSION) return;
    if (typeof renderHomeDashboard !== 'function' || typeof buildTodayFinancialSnapshot !== 'function') {
      setTimeout(install, 60);
      return;
    }
    window.__DZ_FOLDER_MODE_V4__ = PATCH_VERSION;

    const previousRenderHome = renderHomeDashboard;
    renderHomeDashboard = function renderHomeDashboardV4() {
      previousRenderHome();
      try { applyV4(); }
      catch (error) { console.error('DineroZaurio v4 enhancement error', error); }
    };

    injectStyles();
    if (document.getElementById('homeDashboard')) renderHomeDashboard();
  }

  function organization() {
    return normalizeMoneyOrganization(state.moneyOrganization);
  }

  function eventAssignment(event, org) {
    if (!event?.itemId) return { accountId: org.salaryAccountId, folderId: '' };
    return org.assignments?.[event.itemId] || { accountId: org.salaryAccountId, folderId: '' };
  }

  function specialMap(monthKey, key) {
    const raw = state.monthAdjustments?.[monthKey]?.expenseOverrides?.[key];
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? cloneData(raw) : {};
  }

  function saveSpecialMap(monthKey, key, map) {
    const next = normalizeMonthAdjustmentShape(state.monthAdjustments?.[monthKey] || {}, monthKey);
    if (Object.keys(map || {}).length) next.expenseOverrides[key] = cloneData(map);
    else delete next.expenseOverrides[key];
    state.monthAdjustments[monthKey] = next;
  }

  function transferRecord(monthKey, accountId, folderId) {
    return specialMap(monthKey, TRANSFER_KEY)[`${accountId}|${folderId}`] || null;
  }

  function applyV4() {
    const root = document.getElementById('homeDashboard');
    if (!root) return;
    const org = organization();
    if (org.enabled) {
      const summary = buildTodayFinancialSnapshot(new Date());
      fixPrimaryAccountWidget(root, org, summary);
      renderFolderMiniWidgets(root, org, summary);
    }
    replaceHealthInteractions(root);
  }

  function fixPrimaryAccountWidget(root, org, summary) {
    const account = org.accounts.find(entry => entry.id === org.salaryAccountId);
    const card = root.querySelector('.dzAccountWidget.salary');
    if (!account || !card) return;

    // An observed balance in Revolut is information about Revolut. It is NOT a new transfer
    // and therefore must never be subtracted from BBVA merely because a folder was corrected.
    const current = account.actualBalance !== null && account.actualBalance !== undefined
      ? Number(account.actualBalance || 0)
      : Number(summary.potentialNow || 0);
    const future = (summary.upcomingCharges || [])
      .filter(event => eventAssignment(event, org).accountId === account.id)
      .reduce((sum, event) => sum + Math.abs(Number(event.amount || 0)), 0);
    const projected = current - future;

    const values = card.querySelectorAll('.dzBalanceMetric strong');
    if (values[0]) {
      values[0].textContent = euros(current);
      values[0].className = current >= 0 ? 'is-positive' : 'is-negative';
    }
    if (values[1]) {
      values[1].textContent = euros(projected);
      values[1].className = projected >= 0 ? 'is-positive' : 'is-negative';
    }

    const head = card.querySelector('.dzAccountWidgetHead');
    if (head && !head.querySelector('[data-dz-primary-balance]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'dzTinyButton';
      button.dataset.dzPrimaryBalance = '1';
      button.textContent = 'Actualizar saldo';
      button.onclick = () => openPrimaryBalanceEditor(account.id, current);
      head.appendChild(button);
    }

    const subtitle = card.querySelector('.dzAccountWidgetHead p');
    if (subtitle) subtitle.textContent = account.actualBalance !== null ? 'Saldo informado por ti' : 'Saldo estimado por movimientos del periodo';
  }

  function openPrimaryBalanceEditor(accountId, current) {
    const org = organization();
    const account = org.accounts.find(entry => entry.id === accountId);
    if (!account) return;
    simpleModal(`Saldo de ${account.name}`, 'Actualizar este valor no mueve dinero entre cuentas.', `
      <div class="field"><label>Saldo actual</label><input id="dzV4PrimaryBalance" class="input" type="number" step="0.01" value="${Number(current || 0).toFixed(2)}"></div>`, () => {
      account.actualBalance = Number(document.getElementById('dzV4PrimaryBalance').value || 0);
      account.balanceUpdatedAt = new Date().toISOString();
      state.moneyOrganization = org;
      touchState();
      setTimeout(() => renderHomeDashboard(), 0);
    });
  }

  function renderFolderMiniWidgets(root, org, summary) {
    root.querySelectorAll('.dzFolderContext').forEach(node => node.remove());
    root.querySelectorAll('.dzTransferList').forEach(node => node.remove());

    root.querySelectorAll('.dzAccountWidget.secondary').forEach(card => {
      const accountName = card.querySelector('h3')?.textContent?.trim();
      const account = org.accounts.find(entry => entry.name === accountName);
      const host = card.querySelector('.dzFolderBalances');
      if (!account || !host) return;

      const plan = organizationPlan(summary);
      host.classList.add('dzFolderMiniGrid');
      const title = host.querySelector('.dzSectionMiniTitle');
      if (title) title.textContent = 'Carpetas';

      host.querySelectorAll('.dzFolderRow').forEach(row => {
        const folderName = row.querySelector('div strong')?.textContent?.trim();
        const folder = account.folders.find(entry => entry.name === folderName);
        if (!folder) return;
        const target = Number(plan.targets.get(`${account.id}|${folder.id}`) || 0);
        const transfer = transferRecord(summary.periodYm, account.id, folder.id);
        const current = folder.actualBalance !== null && folder.actualBalance !== undefined
          ? Number(folder.actualBalance || 0)
          : Number(transfer?.amount || 0);

        row.className = 'dzFolderMini';
        row.innerHTML = `<span>${escapeHtml(folder.name)}</span><strong class="${current >= 0 ? 'is-positive' : 'is-negative'}">${euros(current)}</strong>${target > 0 ? `<small>Separado este periodo: ${euros(target)}</small>` : '<small>Sin asignación este periodo</small>'}`;
        row.tabIndex = 0;
        row.setAttribute('role', 'button');
        row.setAttribute('aria-label', `Corregir saldo de ${folder.name}`);
        const open = () => openFolderCorrection(account.id, folder.id, current, summary.periodYm);
        row.onclick = open;
        row.onkeydown = event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
        };
      });
    });
  }

  function openFolderCorrection(accountId, folderId, current, monthKey) {
    const org = organization();
    const account = org.accounts.find(entry => entry.id === accountId);
    const folder = account?.folders.find(entry => entry.id === folderId);
    if (!account || !folder) return;
    const sourceAccounts = org.accounts.filter(entry => entry.id !== accountId);

    simpleModal(folder.name, `Ahora hay ${euros(current)} según DineroZaurio.`, `
      <div class="field"><label>Nuevo saldo de la carpeta</label><input id="dzV4FolderNew" class="input" type="number" min="0" step="0.01" value="${Number(current || 0).toFixed(2)}"></div>
      <div id="dzV4IncreaseSource" class="dzV4IncreaseSource hidden">
        <div class="field"><label>El saldo aumentó. ¿De dónde salió ese dinero?</label><select id="dzV4FolderSource" class="select">
          <option value="correction">Ya estaba aquí / estoy corrigiendo el saldo</option>
          ${sourceAccounts.map(source => `<option value="account:${escapeHtml(source.id)}">Transferencia desde ${escapeHtml(source.name)}</option>`).join('')}
          <option value="external">Entró desde fuera de mis cuentas</option>
        </select></div>
      </div>
      <div id="dzV4DecreaseNote" class="dzV4DecreaseNote hidden">Si el nuevo saldo es menor, DineroZaurio asumirá que la diferencia se gastó desde esta carpeta. No modificará BBVA.</div>`, () => {
      const nextValue = Math.max(0, Number(document.getElementById('dzV4FolderNew').value || 0));
      const delta = nextValue - Number(current || 0);
      const source = document.getElementById('dzV4FolderSource')?.value || 'correction';

      folder.actualBalance = nextValue;
      folder.balanceUpdatedAt = new Date().toISOString();
      // A folder correction does not imply that the containing account total or BBVA changed now.
      // We intentionally leave every other account untouched unless the user explicitly says transfer.
      if (delta > 0.009 && source.startsWith('account:')) {
        const sourceId = source.slice('account:'.length);
        const sourceAccount = org.accounts.find(entry => entry.id === sourceId);
        if (sourceAccount && sourceAccount.actualBalance !== null && sourceAccount.actualBalance !== undefined) {
          sourceAccount.actualBalance = Number(sourceAccount.actualBalance || 0) - delta;
          sourceAccount.balanceUpdatedAt = new Date().toISOString();
        }
        const transfers = specialMap(monthKey, TRANSFER_KEY);
        const key = `${account.id}|${folder.id}`;
        const previous = Number(transfers[key]?.amount || 0);
        transfers[key] = { amount: previous + delta, confirmedAt: new Date().toISOString(), sourceAccountId: sourceId };
        saveSpecialMap(monthKey, TRANSFER_KEY, transfers);
      }

      const corrections = specialMap(monthKey, CORRECTION_KEY);
      corrections[`${account.id}|${folder.id}`] = {
        balance: nextValue,
        previousBalance: Number(current || 0),
        delta,
        source: delta > 0.009 ? source : delta < -0.009 ? 'spent' : 'unchanged',
        correctedAt: new Date().toISOString()
      };
      saveSpecialMap(monthKey, CORRECTION_KEY, corrections);
      state.moneyOrganization = org;
      touchState();
      setTimeout(() => renderHomeDashboard(), 0);
    });

    const input = document.getElementById('dzV4FolderNew');
    const increase = document.getElementById('dzV4IncreaseSource');
    const decrease = document.getElementById('dzV4DecreaseNote');
    const sync = () => {
      const next = Number(input.value || 0);
      increase.classList.toggle('hidden', next <= Number(current || 0) + 0.009);
      decrease.classList.toggle('hidden', next >= Number(current || 0) - 0.009);
    };
    input.addEventListener('input', sync);
    sync();
  }

  function replaceHealthInteractions(root) {
    const summary = typeof buildTodayFinancialSnapshot === 'function' ? buildTodayFinancialSnapshot(new Date()) : null;
    if (!summary) return;
    root.querySelectorAll('.dzForecastRow').forEach((row, index) => {
      if (row.dataset.dzV4Health === '1') return;
      row.dataset.dzV4Health = '1';
      const month = addMonthsStr(summary.periodYm, index);
      const handler = event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        openHumanHealthExplanation(month);
      };
      row.addEventListener('click', handler, true);
      row.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') handler(event);
      }, true);
    });
  }

  function snapshotExpenseMap(snapshot) {
    const map = new Map();
    (snapshot.expenseItems || []).forEach(item => map.set(item.name, Number(item.monthAmount || item.amount || 0)));
    return map;
  }

  function recurringInsights(month, snapshot) {
    const insights = [];
    const events = Array.isArray(snapshot.events) ? snapshot.events : [];
    (state.expenses || []).forEach(item => {
      const periodicity = normalizeExpensePeriodicity(item.periodicity);
      if (!['weekly', 'biweekly'].includes(periodicity)) return;
      const itemEvents = events.filter(event => event.itemId === item.id && Number(event.amount || 0) < 0 && event.type !== 'Presupuesto');
      let dates = itemEvents.map(event => event.date).sort((a, b) => a - b);
      if (!dates.length && typeof recurringChargeDatesForMonth === 'function') dates = recurringChargeDatesForMonth(item, month);
      const count = dates.length;
      const normalCount = periodicity === 'biweekly' ? 2 : 4;
      if (count > normalCount) {
        const extraCount = count - normalCount;
        const unit = Number(item.amount || 0);
        const extra = extraCount * unit;
        insights.push({
          name: item.name,
          impact: extra,
          text: `${item.name} cae ${count} veces en este periodo (${dates.map(date => new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })).join(', ')}), en vez de las ${normalCount} habituales. Eso añade ${euros(extra)}.`
        });
      }
    });
    return insights;
  }

  function openHumanHealthExplanation(month) {
    const snapshot = buildForecastMonthSnapshot(month);
    const previousMonth = addMonthsStr(month, -1);
    const previous = buildForecastMonthSnapshot(previousMonth);
    const income = Number(snapshot.income || 0);
    const expense = Number(snapshot.expense || 0);
    const debt = Number(snapshot.debt || 0);
    const savings = Number(snapshot.savings || 0);
    const net = Number(snapshot.net || 0);
    const previousNet = Number(previous.net || 0);
    const recurring = recurringInsights(month, snapshot);

    const currentExpenses = snapshotExpenseMap(snapshot);
    const previousExpenses = snapshotExpenseMap(previous);
    const changes = [];
    new Set([...currentExpenses.keys(), ...previousExpenses.keys()]).forEach(name => {
      const now = Number(currentExpenses.get(name) || 0);
      const before = Number(previousExpenses.get(name) || 0);
      const diff = now - before;
      if (Math.abs(diff) >= 0.01) changes.push({ name, now, before, diff });
    });
    changes.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

    const sentences = [];
    sentences.push(net < 0
      ? `${prettyMonthLabel(month)} termina con un déficit previsto de ${euros(Math.abs(net))}.`
      : `${prettyMonthLabel(month)} termina con un margen previsto de ${euros(net)}.`);

    if (recurring.length) recurring.forEach(item => sentences.push(item.text));

    const recurringNames = new Set(recurring.map(item => item.name));
    changes.filter(change => !recurringNames.has(change.name)).slice(0, 3).forEach(change => {
      if (change.diff > 0) sentences.push(`${change.name} cuesta ${euros(change.diff)} más que en el periodo anterior.`);
      else sentences.push(`${change.name} cuesta ${euros(Math.abs(change.diff))} menos que en el periodo anterior.`);
    });

    const marginDelta = net - previousNet;
    if (Math.abs(marginDelta) >= 0.01) {
      sentences.push(`En conjunto, el margen cambia ${euros(Math.abs(marginDelta))} ${marginDelta < 0 ? 'a peor' : 'a mejor'} frente a ${prettyMonthLabel(previousMonth)}.`);
    }

    if (!recurring.length && !changes.length) {
      sentences.push(`No hay una anomalía puntual clara: el resultado viene de la combinación habitual de ${euros(expense)} en gastos, ${euros(debt)} en deuda y ${euros(savings)} en ahorro.`);
    }

    const drivers = [
      ...recurring.map(item => ({ label: item.name, value: `+${euros(item.impact)} extra` })),
      ...changes.filter(change => !recurringNames.has(change.name)).slice(0, 4).map(change => ({ label: change.name, value: `${change.diff >= 0 ? '+' : '−'}${euros(Math.abs(change.diff))}` }))
    ];

    simpleModal(`Qué pasa en ${prettyMonthLabel(month)}`, sentences.join(' '), `
      <div class="dzV4HealthTotals"><div><span>Ingresos</span><strong class="is-positive">${euros(income)}</strong></div><div><span>Gastos</span><strong>${euros(expense)}</strong></div><div><span>Deuda</span><strong>${euros(debt)}</strong></div><div><span>Ahorro</span><strong>${euros(savings)}</strong></div><div><span>Margen</span><strong class="${net >= 0 ? 'is-positive' : 'is-negative'}">${euros(net)}</strong></div></div>
      ${drivers.length ? `<div class="dzV4Drivers"><strong>Qué lo está moviendo</strong>${drivers.map(driver => `<div><span>${escapeHtml(driver.label)}</span><b>${driver.value}</b></div>`).join('')}</div>` : ''}`, null, 'Cerrar');
  }

  function simpleModal(title, subtitle, body, onSave, saveLabel = 'Guardar') {
    const root = document.getElementById('modalRoot');
    root.className = 'modalRoot';
    root.innerHTML = `<div class="modalCard dzV4Modal"><div class="modalHead"><div><h3>${escapeHtml(title)}</h3>${subtitle ? `<div class="dzV4Narrative">${escapeHtml(subtitle)}</div>` : ''}</div><button id="dzV4Close" class="btn danger" type="button">Cerrar</button></div>${body}${onSave ? `<div class="btnRow" style="margin-top:18px"><button id="dzV4Save" class="btn primary" type="button">${escapeHtml(saveLabel)}</button></div>` : ''}</div>`;
    document.getElementById('dzV4Close').onclick = closeModal;
    if (onSave) document.getElementById('dzV4Save').onclick = () => { onSave(); closeModal(); };
  }

  function injectStyles() {
    if (document.getElementById('dzFolderModeV4Styles')) return;
    const style = document.createElement('style');
    style.id = 'dzFolderModeV4Styles';
    style.textContent = `
      .dzFolderBalances.dzFolderMiniGrid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px!important;border-top:1px solid rgba(255,255,255,.08);padding-top:13px!important}
      .dzFolderMiniGrid>.dzSectionMiniTitle{grid-column:1/-1;margin:0 0 1px}.dzFolderMini{min-width:0;display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:space-between!important;gap:5px!important;padding:12px!important;border-radius:15px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.07)!important;cursor:pointer;transition:.15s ease all}.dzFolderMini:hover{background:rgba(255,255,255,.075)!important;transform:translateY(-1px)}.dzFolderMini>span{font-size:11px;color:var(--muted);font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%}.dzFolderMini>strong{font-size:20px!important}.dzFolderMini>small{font-size:9px;color:rgba(255,255,255,.48);line-height:1.3}
      .dzV4IncreaseSource,.dzV4DecreaseNote{margin-top:12px}.dzV4DecreaseNote{padding:10px 12px;border-radius:12px;background:rgba(74,222,128,.08);color:#bdf7d1;font-size:12px;line-height:1.45}.dzV4Narrative{margin-top:7px;color:var(--muted);font-size:13px;line-height:1.55;max-width:700px}.dzV4HealthTotals{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:17px}.dzV4HealthTotals>div{padding:10px;border-radius:12px;background:rgba(255,255,255,.04)}.dzV4HealthTotals span{display:block;color:var(--muted);font-size:10px}.dzV4HealthTotals strong{display:block;margin-top:5px;font-size:14px}.dzV4Drivers{margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,.08)}.dzV4Drivers>strong{display:block;margin-bottom:8px;font-size:12px}.dzV4Drivers>div{display:flex;justify-content:space-between;gap:12px;padding:7px 0;font-size:12px}.dzV4Drivers>div span{color:#e6ebf8}.dzV4Drivers>div b{white-space:nowrap}
      @media(max-width:900px){.dzFolderBalances.dzFolderMiniGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
      @media(max-width:600px){.dzFolderBalances.dzFolderMiniGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}.dzFolderMini{padding:10px!important}.dzFolderMini>strong{font-size:18px!important}.dzV4HealthTotals{grid-template-columns:1fr 1fr}.dzV4HealthTotals>div:last-child{grid-column:1/-1}.dzV4Modal{padding:16px!important}}
    `;
    document.head.appendChild(style);
  }

  window.addEventListener('load', install, { once: true });
  if (document.readyState === 'complete') install();
})();