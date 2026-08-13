(() => {
  'use strict';

  const PATCH_VERSION = '2.3-account-context-1';
  const SPECIAL_TRANSFER_KEY = '__folderTransfers';
  const PERSONAL_LOANS_KEY = '__personalLoans';

  function install() {
    if (window.__DZ_FOLDER_MODE_V3__ === PATCH_VERSION) return;
    if (typeof renderHomeDashboard !== 'function' || typeof normalizeMoneyOrganization !== 'function') {
      setTimeout(install, 60);
      return;
    }
    window.__DZ_FOLDER_MODE_V3__ = PATCH_VERSION;

    const baseRenderHome = renderHomeDashboard;
    renderHomeDashboard = function renderHomeDashboardV3() {
      baseRenderHome();
      try { enhanceHomeV3(); }
      catch (error) { console.error('DineroZaurio v3 home enhancement error', error); }
    };

    injectStyles();
    if (document.getElementById('homeDashboard')) renderHomeDashboard();
  }

  function org() {
    return normalizeMoneyOrganization(state.moneyOrganization);
  }

  function hostMonth() {
    return state.defaultStartMonth || (typeof todayMonth === 'function' ? todayMonth() : new Date().toISOString().slice(0, 7));
  }

  function monthAdjustment(monthKey) {
    return normalizeMonthAdjustmentShape(state.monthAdjustments?.[monthKey] || {}, monthKey);
  }

  function getSpecialMap(monthKey, key) {
    const raw = state.monthAdjustments?.[monthKey]?.expenseOverrides?.[key];
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? cloneData(raw) : {};
  }

  function setSpecialMap(monthKey, key, value) {
    const next = monthAdjustment(monthKey);
    if (value && Object.keys(value).length) next.expenseOverrides[key] = cloneData(value);
    else delete next.expenseOverrides[key];
    state.monthAdjustments[monthKey] = next;
    touchState();
  }

  function transferRecord(monthKey, accountId, folderId) {
    const map = getSpecialMap(monthKey, SPECIAL_TRANSFER_KEY);
    const raw = map[`${accountId}|${folderId || ''}`];
    return raw && typeof raw === 'object' ? raw : null;
  }

  function confirmFolderTransfer(monthKey, accountId, folderId, amount) {
    const map = getSpecialMap(monthKey, SPECIAL_TRANSFER_KEY);
    map[`${accountId}|${folderId || ''}`] = {
      amount: Math.max(0, Number(amount || 0)),
      confirmedAt: new Date().toISOString()
    };
    setSpecialMap(monthKey, SPECIAL_TRANSFER_KEY, map);
    setTimeout(() => renderHomeDashboard(), 0);
  }

  function getPersonalLoans() {
    const raw = state.monthAdjustments?.[hostMonth()]?.expenseOverrides?.[PERSONAL_LOANS_KEY];
    return Array.isArray(raw) ? cloneData(raw) : [];
  }

  function savePersonalLoans(loans) {
    const monthKey = hostMonth();
    const next = monthAdjustment(monthKey);
    if (loans.length) next.expenseOverrides[PERSONAL_LOANS_KEY] = cloneData(loans);
    else delete next.expenseOverrides[PERSONAL_LOANS_KEY];
    state.monthAdjustments[monthKey] = next;
    touchState();
    setTimeout(() => renderHomeDashboard(), 0);
  }

  function enhanceHomeV3() {
    const root = document.getElementById('homeDashboard');
    if (!root) return;
    replaceUniversalAdd(root);
    enhanceForecastBars(root);
    enhanceUpcomingChargeEditors(root);

    const organization = org();
    if (organization.enabled) enhanceFolderCards(root, organization);
    renderPersonalLoansCard(root);
  }

  function replaceUniversalAdd(root) {
    const old = root.querySelector('#addMissingExpensesBtn, #dzUniversalAdd');
    if (!old || old.dataset.dzUniversalReady === '1') return;
    const button = old.cloneNode(false);
    button.id = 'dzUniversalAdd';
    button.dataset.dzUniversalReady = '1';
    button.className = 'dzUniversalAdd';
    button.type = 'button';
    button.setAttribute('aria-label', 'Añadir');
    button.innerHTML = '<span>+</span>';
    old.replaceWith(button);

    const menu = document.createElement('div');
    menu.className = 'dzUniversalMenu';
    menu.innerHTML = `
      <button type="button" data-dz-add="expense"><strong>Gasto</strong><span>Nuevo recibo, compra o presupuesto</span></button>
      <button type="button" data-dz-add="income"><strong>Ingreso</strong><span>Nómina, ingreso puntual u otra entrada</span></button>
      <button type="button" data-dz-add="personal-loan"><strong>Préstamo personal</strong><span>Dinero prestado entre tú y otra persona</span></button>
      <button type="button" data-dz-add="debt"><strong>Deuda</strong><span>Préstamo o financiación que debes pagar</span></button>`;
    button.parentElement?.appendChild(menu);

    button.addEventListener('click', event => {
      event.stopPropagation();
      menu.classList.toggle('open');
    });
    menu.querySelectorAll('[data-dz-add]').forEach(action => action.addEventListener('click', () => {
      menu.classList.remove('open');
      const type = action.dataset.dzAdd;
      if (type === 'expense') openAddExpense();
      if (type === 'income') openAddIncome();
      if (type === 'debt') openAddDebt();
      if (type === 'personal-loan') openAddPersonalLoan();
    }));
    document.addEventListener('click', event => {
      if (!menu.contains(event.target) && event.target !== button) menu.classList.remove('open');
    }, { once: true });
  }

  function enhanceUpcomingChargeEditors(root) {
    root.querySelectorAll('.dzBankCharge[data-dz-charge-edit]').forEach(button => {
      if (button.dataset.dzAccountEditorReady === '1') return;
      button.dataset.dzAccountEditorReady = '1';
      button.addEventListener('click', () => {
        const key = String(button.dataset.dzChargeEdit || '');
        const itemId = key.split('|')[0] || '';
        if (!itemId) return;
        setTimeout(() => injectChargeAccountSelector(itemId), 0);
      });
    });
  }

  function injectChargeAccountSelector(itemId) {
    const modal = document.querySelector('#modalRoot .dzChargeEditModal');
    if (!modal || modal.querySelector('[data-dz-account-selector]')) return;
    const organization = org();
    if (!organization.enabled || organization.accounts.length < 2) return;

    const current = organization.assignments?.[itemId] || { accountId: organization.salaryAccountId, folderId: '' };
    let selectedAccountId = current.accountId || organization.salaryAccountId;
    let selectedFolderId = current.folderId || '';

    const accountSelector = document.createElement('div');
    accountSelector.className = 'dzChargeAccountSelector';
    accountSelector.dataset.dzAccountSelector = '1';
    accountSelector.innerHTML = `<label>Se cobrará en</label><div class="dzAccountSwitch">${organization.accounts.map(account => `<button type="button" data-dz-account-choice="${escapeHtml(account.id)}" class="${account.id === selectedAccountId ? 'active' : ''}">${escapeHtml(shortAccountName(account.name))}</button>`).join('')}</div><div class="dzFolderChoice"></div>`;
    const grid = modal.querySelector('.dzQuickEditGrid');
    grid?.before(accountSelector);

    const folderHost = accountSelector.querySelector('.dzFolderChoice');
    const renderFolders = () => {
      const account = organization.accounts.find(entry => entry.id === selectedAccountId);
      if (!account?.folders?.length) {
        selectedFolderId = '';
        folderHost.innerHTML = '';
        return;
      }
      if (!account.folders.some(folder => folder.id === selectedFolderId)) selectedFolderId = '';
      folderHost.innerHTML = `<label>Carpeta</label><select class="select"><option value="">Cuenta general</option>${account.folders.map(folder => `<option value="${escapeHtml(folder.id)}" ${folder.id === selectedFolderId ? 'selected' : ''}>${escapeHtml(folder.name)}</option>`).join('')}</select>`;
      folderHost.querySelector('select').onchange = event => { selectedFolderId = event.target.value || ''; };
    };
    renderFolders();

    accountSelector.querySelectorAll('[data-dz-account-choice]').forEach(choice => choice.addEventListener('click', () => {
      selectedAccountId = choice.dataset.dzAccountChoice;
      selectedFolderId = '';
      accountSelector.querySelectorAll('[data-dz-account-choice]').forEach(button => button.classList.toggle('active', button === choice));
      renderFolders();
    }));

    const save = modal.querySelector('#dzSaveChargeEdit');
    save?.addEventListener('click', () => {
      const next = org();
      next.assignments[itemId] = { accountId: selectedAccountId, folderId: selectedFolderId };
      state.moneyOrganization = next;
      touchState();
    });
  }

  function shortAccountName(name) {
    const text = String(name || 'Cuenta');
    if (/bbva/i.test(text)) return 'BBVA';
    if (/revolut/i.test(text)) return 'Revolut';
    return text.split('·')[0].trim();
  }

  function enhanceFolderCards(root, organization) {
    const summary = typeof buildTodayFinancialSnapshot === 'function' ? buildTodayFinancialSnapshot(new Date()) : null;
    if (!summary) return;
    const plan = typeof organizationPlan === 'function' ? organizationPlan(summary) : null;
    if (!plan) return;
    const salaryAccount = organization.accounts.find(account => account.id === organization.salaryAccountId);

    root.querySelectorAll('.dzAccountWidget.secondary').forEach(card => {
      const title = card.querySelector('h3')?.textContent?.trim();
      const account = organization.accounts.find(entry => entry.name === title);
      if (!account) return;

      card.querySelectorAll('.dzFolderRow').forEach(row => {
        if (row.dataset.dzFolderEnhanced === '1') return;
        const label = row.querySelector('div strong')?.textContent?.trim();
        const folder = account.folders.find(entry => entry.name === label);
        if (!folder) return;
        row.dataset.dzFolderEnhanced = '1';

        const target = Number(plan.targets.get(`${account.id}|${folder.id}`) || 0);
        const record = transferRecord(summary.periodYm, account.id, folder.id);
        const current = folder.actualBalance !== null && folder.actualBalance !== undefined
          ? Number(folder.actualBalance || 0)
          : Number(record?.amount || 0);
        const moved = Number(record?.amount || 0);
        const info = document.createElement('div');
        info.className = 'dzFolderContext';
        if (moved > 0 || folder.actualBalance !== null) {
          info.innerHTML = `<span>${moved > 0 ? `Separado desde ${escapeHtml(shortAccountName(salaryAccount?.name || 'cuenta principal'))}` : 'Saldo actualizado manualmente'}</span><div class="dzFolderActions"><button type="button" data-dz-folder-use>He usado dinero</button><button type="button" data-dz-folder-set>Corregir saldo</button></div>`;
        } else if (target > 0) {
          info.innerHTML = `<span>${euros(target)} asignados desde ${escapeHtml(shortAccountName(salaryAccount?.name || 'cuenta principal'))} · falta confirmar que ya están aquí</span><div class="dzFolderActions"><button type="button" class="primary" data-dz-folder-arrived>Ya está aquí</button></div>`;
        } else {
          info.innerHTML = `<span>Sin dinero asignado en este periodo</span><div class="dzFolderActions"><button type="button" data-dz-folder-set>Actualizar saldo</button></div>`;
        }
        row.insertAdjacentElement('afterend', info);

        info.querySelector('[data-dz-folder-arrived]')?.addEventListener('click', () => confirmFolderTransfer(summary.periodYm, account.id, folder.id, target));
        info.querySelector('[data-dz-folder-use]')?.addEventListener('click', () => openFolderUse(account.id, folder.id, current));
        info.querySelector('[data-dz-folder-set]')?.addEventListener('click', () => openFolderBalance(account.id, folder.id, current));
      });

      // The action is now contextual inside each folder instead of duplicated below.
      card.querySelector('.dzTransferList')?.remove();
    });
  }

  function openFolderUse(accountId, folderId, current) {
    const organization = org();
    const account = organization.accounts.find(entry => entry.id === accountId);
    const folder = account?.folders.find(entry => entry.id === folderId);
    if (!folder) return;
    openSimpleModal(`Usar dinero · ${folder.name}`, `Ahora mismo DineroZaurio estima ${euros(current)} en esta carpeta.`, `
      <div class="field"><label>He usado</label><input id="dzFolderUsed" class="input" type="number" min="0" step="0.01" placeholder="0,00"></div>
      <div class="field"><label>O indicar directamente cuánto queda</label><input id="dzFolderRemaining" class="input" type="number" min="0" step="0.01" placeholder="${Number(current || 0).toFixed(2)}"></div>`, () => {
      const direct = document.getElementById('dzFolderRemaining').value.trim();
      const used = Math.max(0, Number(document.getElementById('dzFolderUsed').value || 0));
      const nextBalance = direct !== '' ? Math.max(0, Number(direct || 0)) : Math.max(0, Number(current || 0) - used);
      folder.actualBalance = nextBalance;
      folder.balanceUpdatedAt = new Date().toISOString();
      account.actualBalance = null;
      account.balanceUpdatedAt = '';
      state.moneyOrganization = organization;
      touchState();
      setTimeout(() => renderHomeDashboard(), 0);
    });
  }

  function openFolderBalance(accountId, folderId, current) {
    const organization = org();
    const account = organization.accounts.find(entry => entry.id === accountId);
    const folder = account?.folders.find(entry => entry.id === folderId);
    if (!folder) return;
    openSimpleModal(`Saldo de ${folder.name}`, '', `<div class="field"><label>Dinero que queda ahora</label><input id="dzFolderBalanceDirect" class="input" type="number" min="0" step="0.01" value="${Number(current || 0)}"></div>`, () => {
      folder.actualBalance = Math.max(0, Number(document.getElementById('dzFolderBalanceDirect').value || 0));
      folder.balanceUpdatedAt = new Date().toISOString();
      account.actualBalance = null;
      account.balanceUpdatedAt = '';
      state.moneyOrganization = organization;
      touchState();
      setTimeout(() => renderHomeDashboard(), 0);
    });
  }

  function enhanceForecastBars(root) {
    const summary = typeof buildTodayFinancialSnapshot === 'function' ? buildTodayFinancialSnapshot(new Date()) : null;
    if (!summary) return;
    const rows = root.querySelectorAll('.dzForecastRow');
    rows.forEach((row, index) => {
      if (row.dataset.dzHealthReady === '1') return;
      const month = addMonthsStr(summary.periodYm, index);
      row.dataset.dzHealthReady = '1';
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      row.setAttribute('aria-label', `Explicar ${month}`);
      const open = () => openHealthExplanation(month);
      row.addEventListener('click', open);
      row.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    });
  }

  function openHealthExplanation(month) {
    const snapshot = buildForecastMonthSnapshot(month);
    const income = Number(snapshot.income || 0);
    const expense = Number(snapshot.expense || 0);
    const debt = Number(snapshot.debt || 0);
    const savings = Number(snapshot.savings || 0);
    const net = Number(snapshot.net || 0);
    const outgoing = expense + debt + savings;
    const expenses = Array.isArray(snapshot.expenseItems) ? [...snapshot.expenseItems].sort((a, b) => Number(b.monthAmount || 0) - Number(a.monthAmount || 0)) : [];
    const noteworthy = expenses.filter(entry => {
      const source = (state.expenses || []).find(item => item.name === entry.name);
      return source && normalizeExpensePeriodicity(source.periodicity) !== 'monthly';
    }).slice(0, 4);
    const top = expenses.slice(0, 4);

    const headline = net < 0
      ? `Este periodo termina ${euros(Math.abs(net))} por debajo de cero.`
      : `Este periodo deja ${euros(net)} libres.`;
    const notableText = noteworthy.length
      ? ` Lo excepcional o no mensual aquí es ${noteworthy.map(item => `${item.name} (${euros(item.monthAmount)})`).join(', ')}.`
      : '';
    const narrative = `${headline} Entran ${euros(income)} y hay ${euros(outgoing)} comprometidos: ${euros(expense)} en gastos, ${euros(debt)} en deuda y ${euros(savings)} en ahorro.${notableText}`;
    const list = top.length ? `<div class="dzExplainList">${top.map(item => `<div><span>${escapeHtml(item.name)}</span><strong>${euros(item.monthAmount)}</strong></div>`).join('')}</div>` : '';
    openSimpleModal(`Qué pasa en ${prettyMonthLabel(month)}`, narrative, `<div class="dzExplainBreakdown"><div><span>Ingresos</span><strong class="is-positive">${euros(income)}</strong></div><div><span>Gastos</span><strong>${euros(expense)}</strong></div><div><span>Deudas</span><strong>${euros(debt)}</strong></div><div><span>Ahorro</span><strong>${euros(savings)}</strong></div><div><span>Margen</span><strong class="${net >= 0 ? 'is-positive' : 'is-negative'}">${euros(net)}</strong></div></div>${list}`, null, 'Cerrar');
  }

  function accountOptions(selected = '') {
    const organization = org();
    if (!organization.enabled) return '<option value="">Sin asignar</option>';
    return organization.accounts.map(account => `<option value="${escapeHtml(account.id)}" ${account.id === selected ? 'selected' : ''}>${escapeHtml(account.name)}</option>`).join('');
  }

  function assignItem(itemId, accountId, folderId = '') {
    if (!accountId) return;
    const organization = org();
    if (!organization.enabled) return;
    const account = organization.accounts.find(entry => entry.id === accountId);
    if (!account) return;
    const safeFolder = account.folders.some(folder => folder.id === folderId) ? folderId : '';
    organization.assignments[itemId] = { accountId, folderId: safeFolder };
    state.moneyOrganization = organization;
  }

  function openAddExpense() {
    const organization = org();
    const defaultAccount = organization.salaryAccountId || organization.accounts[0]?.id || '';
    const today = new Date().toISOString().slice(0, 10);
    openSimpleModal('Añadir gasto', '', `
      <div class="dzFormGrid"><div class="field"><label>Nombre</label><input id="dzNewExpenseName" class="input" placeholder="Ej. Seguro hogar"></div><div class="field"><label>Importe</label><input id="dzNewExpenseAmount" class="input" type="number" min="0" step="0.01"></div><div class="field"><label>Periodicidad</label><select id="dzNewExpensePeriodicity" class="select">${periodicityOptions('monthly')}</select></div><div class="field"><label>Primera / próxima fecha</label><input id="dzNewExpenseDate" class="input" type="date" value="${today}"></div>${organization.enabled ? `<div class="field"><label>Se cobrará en</label><select id="dzNewExpenseAccount" class="select">${accountOptions(defaultAccount)}</select></div>` : ''}</div>`, () => {
      const name = document.getElementById('dzNewExpenseName').value.trim();
      const amount = Math.max(0, Number(document.getElementById('dzNewExpenseAmount').value || 0));
      const periodicity = document.getElementById('dzNewExpensePeriodicity').value || 'monthly';
      const date = document.getElementById('dzNewExpenseDate').value || today;
      if (!name || !amount) return;
      const item = makeExpense(name, amount, periodicity, date);
      state.expenses.push(item);
      assignItem(item.id, document.getElementById('dzNewExpenseAccount')?.value || defaultAccount);
      touchState();
      setTimeout(() => renderHomeDashboard(), 0);
    });
  }

  function openAddIncome() {
    const today = new Date().toISOString().slice(0, 10);
    openSimpleModal('Añadir ingreso', '', `<div class="dzFormGrid"><div class="field"><label>Nombre</label><input id="dzNewIncomeName" class="input" placeholder="Ej. Nómina"></div><div class="field"><label>Importe</label><input id="dzNewIncomeAmount" class="input" type="number" min="0" step="0.01"></div><div class="field"><label>Periodicidad</label><select id="dzNewIncomePeriodicity" class="select">${periodicityOptions('monthly')}</select></div><div class="field"><label>Primera / próxima fecha</label><input id="dzNewIncomeDate" class="input" type="date" value="${today}"></div></div>`, () => {
      const name = document.getElementById('dzNewIncomeName').value.trim();
      const amount = Math.max(0, Number(document.getElementById('dzNewIncomeAmount').value || 0));
      const periodicity = document.getElementById('dzNewIncomePeriodicity').value || 'monthly';
      const date = document.getElementById('dzNewIncomeDate').value || today;
      if (!name || !amount) return;
      state.incomes.push(makeIncome(name, amount, periodicity, date));
      touchState();
      setTimeout(() => renderHomeDashboard(), 0);
    });
  }

  function openAddDebt() {
    const organization = org();
    const defaultAccount = organization.salaryAccountId || organization.accounts[0]?.id || '';
    const today = new Date().toISOString().slice(0, 10);
    openSimpleModal('Añadir deuda', '', `<div class="dzFormGrid"><div class="field"><label>Nombre</label><input id="dzNewDebtName" class="input" placeholder="Ej. Préstamo banco"></div><div class="field"><label>Saldo / capital pendiente</label><input id="dzNewDebtPrincipal" class="input" type="number" min="0" step="0.01"></div><div class="field"><label>Cuota mensual</label><input id="dzNewDebtMonthly" class="input" type="number" min="0" step="0.01"></div><div class="field"><label>Próxima cuota</label><input id="dzNewDebtDate" class="input" type="date" value="${today}"></div><div class="field"><label>Cuotas restantes</label><input id="dzNewDebtRemaining" class="input" type="number" min="1" step="1" value="12"></div>${organization.enabled ? `<div class="field"><label>Se cobrará en</label><select id="dzNewDebtAccount" class="select">${accountOptions(defaultAccount)}</select></div>` : ''}</div>`, () => {
      const name = document.getElementById('dzNewDebtName').value.trim();
      const principal = Math.max(0, Number(document.getElementById('dzNewDebtPrincipal').value || 0));
      const monthly = Math.max(0, Number(document.getElementById('dzNewDebtMonthly').value || 0));
      const date = document.getElementById('dzNewDebtDate').value || today;
      const remaining = Math.max(1, Math.round(Number(document.getElementById('dzNewDebtRemaining').value || 1)));
      if (!name || !principal || !monthly) return;
      const item = makeDebt(name, principal, monthly, date, remaining);
      state.debts.push(item);
      assignItem(item.id, document.getElementById('dzNewDebtAccount')?.value || defaultAccount);
      touchState();
      setTimeout(() => renderHomeDashboard(), 0);
    });
  }

  function openAddPersonalLoan() {
    const today = new Date().toISOString().slice(0, 10);
    openSimpleModal('Registrar préstamo personal', '', `<div class="dzFormGrid"><div class="field"><label>Qué ha pasado</label><select id="dzPersonalDirection" class="select"><option value="borrowed">Me han prestado dinero</option><option value="lent">He prestado dinero</option></select></div><div class="field"><label>Persona</label><input id="dzPersonalPerson" class="input" placeholder="Nombre"></div><div class="field"><label>Importe</label><input id="dzPersonalAmount" class="input" type="number" min="0" step="0.01"></div><div class="field"><label>Fecha</label><input id="dzPersonalDate" class="input" type="date" value="${today}"></div><div class="field"><label>Fecha objetivo de devolución</label><input id="dzPersonalDue" class="input" type="date"></div><div class="field"><label>Nota</label><input id="dzPersonalNote" class="input" placeholder="Opcional"></div></div><label class="dzCheckRow"><input id="dzPersonalCashflow" type="checkbox" checked><span>Reflejar también el movimiento inicial en la previsión</span></label>`, () => {
      const direction = document.getElementById('dzPersonalDirection').value;
      const person = document.getElementById('dzPersonalPerson').value.trim();
      const amount = Math.max(0, Number(document.getElementById('dzPersonalAmount').value || 0));
      const date = document.getElementById('dzPersonalDate').value || today;
      const dueDate = document.getElementById('dzPersonalDue').value || '';
      const note = document.getElementById('dzPersonalNote').value.trim();
      if (!person || !amount) return;
      const loans = getPersonalLoans();
      loans.push({ id: uid(), direction, person, principal: amount, outstanding: amount, startDate: date, dueDate, note, status: 'open', payments: [] });
      savePersonalLoans(loans);
      if (document.getElementById('dzPersonalCashflow').checked) {
        const name = direction === 'borrowed' ? `Préstamo recibido · ${person}` : `Dinero prestado · ${person}`;
        if (direction === 'borrowed') state.incomes.push(makeIncome(name, amount, 'one_time', date));
        else state.expenses.push(makeExpense(name, amount, 'one_time', date));
        touchState();
      }
    });
  }

  function renderPersonalLoansCard(root) {
    root.querySelector('.dzPersonalLoansCard')?.remove();
    const loans = getPersonalLoans().filter(loan => loan.status !== 'closed' && Number(loan.outstanding || 0) > 0.009);
    if (!loans.length) return;
    const anchor = root.querySelector('.dzInsightsGrid') || root.querySelector('.dzAccountWidgetGrid');
    if (!anchor) return;
    const owedByMe = loans.filter(loan => loan.direction === 'borrowed').reduce((sum, loan) => sum + Number(loan.outstanding || 0), 0);
    const owedToMe = loans.filter(loan => loan.direction === 'lent').reduce((sum, loan) => sum + Number(loan.outstanding || 0), 0);
    const card = document.createElement('section');
    card.className = 'panel dzPersonalLoansCard';
    card.innerHTML = `<div class="section-title"><div><span class="dzAccountEyebrow">PRÉSTAMOS PERSONALES</span><h2>Dinero entre personas</h2></div><div class="dzPersonalTotals"><span>Debo <strong>${euros(owedByMe)}</strong></span><span>Me deben <strong>${euros(owedToMe)}</strong></span></div></div><div class="dzPersonalLoanList">${loans.map(loan => `<div class="dzPersonalLoanRow"><div><strong>${escapeHtml(loan.direction === 'borrowed' ? `Debo a ${loan.person}` : `${loan.person} me debe`)}</strong><span>${loan.dueDate ? `Objetivo: ${new Date(`${loan.dueDate}T12:00:00`).toLocaleDateString('es-ES')}` : 'Sin fecha objetivo'}${loan.note ? ` · ${escapeHtml(loan.note)}` : ''}</span></div><strong>${euros(loan.outstanding)}</strong><button class="dzTinyButton" type="button" data-dz-personal-pay="${escapeHtml(loan.id)}">Registrar devolución</button></div>`).join('')}</div>`;
    anchor.insertAdjacentElement('afterend', card);
    card.querySelectorAll('[data-dz-personal-pay]').forEach(button => button.addEventListener('click', () => openPersonalLoanPayment(button.dataset.dzPersonalPay)));
  }

  function openPersonalLoanPayment(id) {
    const loans = getPersonalLoans();
    const loan = loans.find(entry => entry.id === id);
    if (!loan) return;
    const today = new Date().toISOString().slice(0, 10);
    openSimpleModal('Registrar devolución', `${loan.direction === 'borrowed' ? `Debes a ${loan.person}` : `${loan.person} te debe`} ${euros(loan.outstanding)}.`, `<div class="dzFormGrid"><div class="field"><label>Importe devuelto</label><input id="dzPersonalPayAmount" class="input" type="number" min="0" max="${Number(loan.outstanding || 0)}" step="0.01"></div><div class="field"><label>Fecha</label><input id="dzPersonalPayDate" class="input" type="date" value="${today}"></div></div><label class="dzCheckRow"><input id="dzPersonalPayCashflow" type="checkbox" checked><span>Reflejar esta devolución en la previsión</span></label>`, () => {
      const amount = Math.min(Number(loan.outstanding || 0), Math.max(0, Number(document.getElementById('dzPersonalPayAmount').value || 0)));
      const date = document.getElementById('dzPersonalPayDate').value || today;
      if (!amount) return;
      loan.outstanding = Math.max(0, Number(loan.outstanding || 0) - amount);
      loan.payments = [...(loan.payments || []), { amount, date, recordedAt: new Date().toISOString() }];
      if (loan.outstanding <= 0.009) loan.status = 'closed';
      savePersonalLoans(loans);
      if (document.getElementById('dzPersonalPayCashflow').checked) {
        const name = loan.direction === 'borrowed' ? `Devolución préstamo · ${loan.person}` : `Devolución recibida · ${loan.person}`;
        if (loan.direction === 'borrowed') state.expenses.push(makeExpense(name, amount, 'one_time', date));
        else state.incomes.push(makeIncome(name, amount, 'one_time', date));
        touchState();
      }
    });
  }

  function makeExpense(name, amount, periodicity, isoDate) {
    const date = new Date(`${isoDate}T12:00:00`);
    return {
      id: uid(), name, amount: Number(amount), kind: 'fixed', periodicity,
      intervalMonths: 1, startMonth: isoDate.slice(0, 7), endMonth: null,
      startDate: ['weekly', 'biweekly'].includes(periodicity) ? isoDate : '', chargeLeadDays: 0,
      dueDay: date.getDate(), calendarRuleType: 'fixed_day', calendarMonthShift: 0,
      calendarBehavior: 'charge', calendarConfidence: 'confirmed', calendarNote: `Fecha confirmada desde ${isoDate}`
    };
  }

  function makeIncome(name, amount, periodicity, isoDate) {
    const date = new Date(`${isoDate}T12:00:00`);
    return {
      id: uid(), name, amount: Number(amount), kind: 'fixed', periodicity,
      intervalMonths: 1, startMonth: isoDate.slice(0, 7), endMonth: null,
      dueDay: date.getDate(), calendarRuleType: 'fixed_day', calendarMonthShift: 0,
      calendarBehavior: 'charge', calendarConfidence: 'confirmed', calendarNote: `Fecha confirmada desde ${isoDate}`
    };
  }

  function makeDebt(name, principal, monthly, isoDate, remaining) {
    const startMonth = isoDate.slice(0, 7);
    const date = new Date(`${isoDate}T12:00:00`);
    return {
      id: uid(), name, instrumentType: 'loan', paymentMode: 'installment', amount: Number(principal),
      totalBorrowed: Number(principal), currentDebt: Number(principal), currentPayment: Number(monthly), monthlyPayment: Number(monthly),
      startMonth, endMode: 'remaining', remainingInstallments: Number(remaining), lastMonth: addMonthsStr(startMonth, Number(remaining) - 1),
      periodicity: 'monthly', intervalMonths: 1, settledMonth: '', balanceMonth: startMonth,
      dueDay: date.getDate(), calendarRuleType: 'fixed_day', calendarMonthShift: 0, calendarConfidence: 'confirmed', calendarNote: `Fecha confirmada desde ${isoDate}`
    };
  }

  function periodicityOptions(selected) {
    const options = [['weekly','Semanal'],['biweekly','Cada 14 días'],['monthly','Mensual'],['bimonthly','Bimestral'],['quarterly','Trimestral'],['four_monthly','Cada 4 meses'],['yearly','Anual'],['one_time','Puntual']];
    return options.map(([value, label]) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${label}</option>`).join('');
  }

  function openSimpleModal(title, subtitle, body, onSave, saveLabel = 'Guardar') {
    const root = document.getElementById('modalRoot');
    root.className = 'modalRoot';
    root.innerHTML = `<div class="modalCard dzV3Modal"><div class="modalHead"><div><h3>${escapeHtml(title)}</h3>${subtitle ? `<div class="sub">${escapeHtml(subtitle)}</div>` : ''}</div><button id="dzV3Close" class="btn danger" type="button">Cerrar</button></div>${body}${onSave ? `<div class="btnRow" style="margin-top:18px"><button id="dzV3Save" class="btn primary" type="button">${escapeHtml(saveLabel)}</button></div>` : ''}</div>`;
    document.getElementById('dzV3Close').onclick = closeModal;
    if (onSave) document.getElementById('dzV3Save').onclick = () => { onSave(); closeModal(); };
  }

  function injectStyles() {
    if (document.getElementById('dzFolderModeV3Styles')) return;
    const style = document.createElement('style');
    style.id = 'dzFolderModeV3Styles';
    style.textContent = `
      .dzUniversalAdd{width:48px;height:48px;border:0;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--pink),var(--pink-2));color:#fff;box-shadow:0 12px 30px rgba(255,0,170,.28);cursor:pointer;flex:0 0 auto}.dzUniversalAdd span{font-size:30px;font-weight:300;line-height:1;transform:translateY(-1px)}
      .homeHeroHead{position:relative}.dzUniversalMenu{position:absolute;z-index:55;right:0;top:58px;width:min(330px,86vw);display:none;padding:9px;border-radius:18px;background:#10162f;border:1px solid rgba(255,255,255,.12);box-shadow:0 22px 55px rgba(0,0,0,.38)}.dzUniversalMenu.open{display:grid;gap:6px}.dzUniversalMenu button{display:block;width:100%;text-align:left;padding:11px 12px;border:0;border-radius:13px;background:rgba(255,255,255,.04);color:#fff;cursor:pointer}.dzUniversalMenu button:hover{background:rgba(255,255,255,.09)}.dzUniversalMenu strong{display:block;font-size:13px}.dzUniversalMenu span{display:block;margin-top:3px;color:var(--muted);font-size:11px}
      .dzChargeAccountSelector{margin:4px 0 16px;padding:13px;border-radius:15px;background:rgba(34,211,238,.055);border:1px solid rgba(34,211,238,.13)}.dzChargeAccountSelector>label,.dzFolderChoice>label{display:block;margin-bottom:8px;font-size:11px;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}.dzAccountSwitch{display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:7px}.dzAccountSwitch button{padding:10px;border:1px solid rgba(255,255,255,.1);border-radius:999px;background:rgba(255,255,255,.05);color:#fff;font-weight:850;cursor:pointer}.dzAccountSwitch button.active{background:linear-gradient(135deg,#0ea5e9,#22d3ee);color:#06141d;border-color:transparent}.dzFolderChoice{margin-top:10px}
      .dzFolderContext{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:-3px 0 7px;padding:0 2px 8px;border-bottom:1px solid rgba(255,255,255,.045)}.dzFolderContext>span{color:var(--muted);font-size:10px;line-height:1.35}.dzFolderActions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.dzFolderActions button{border:1px solid rgba(255,255,255,.09);border-radius:999px;padding:6px 9px;background:rgba(255,255,255,.06);color:#fff;font-size:10px;font-weight:850;cursor:pointer}.dzFolderActions button.primary{background:rgba(34,211,238,.14);color:#bff7ff;border-color:rgba(34,211,238,.2)}
      .dzForecastRow[data-dz-health-ready="1"]{cursor:pointer;border-radius:9px;padding:4px 5px;margin:-4px -5px}.dzForecastRow[data-dz-health-ready="1"]:hover{background:rgba(255,255,255,.045)}
      .dzExplainBreakdown{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:16px}.dzExplainBreakdown>div{padding:10px;border-radius:12px;background:rgba(255,255,255,.045)}.dzExplainBreakdown span{display:block;color:var(--muted);font-size:10px}.dzExplainBreakdown strong{display:block;margin-top:5px;font-size:14px}.dzExplainList{display:grid;gap:7px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.07)}.dzExplainList>div{display:flex;justify-content:space-between;gap:12px;font-size:12px}
      .dzFormGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.dzCheckRow{display:flex;align-items:center;gap:9px;margin-top:14px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.035);font-size:12px}.dzCheckRow input{width:18px;height:18px}
      .dzPersonalLoansCard{margin:16px 0}.dzPersonalTotals{display:flex;gap:8px;flex-wrap:wrap}.dzPersonalTotals span{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.05);font-size:11px;color:var(--muted)}.dzPersonalTotals strong{color:#fff}.dzPersonalLoanList{display:grid;gap:8px;margin-top:14px}.dzPersonalLoanRow{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:12px;align-items:center;padding:11px 12px;border-radius:14px;background:rgba(255,255,255,.035)}.dzPersonalLoanRow>div strong{display:block;font-size:13px}.dzPersonalLoanRow>div span{display:block;margin-top:3px;color:var(--muted);font-size:11px}
      @media(max-width:650px){.dzUniversalAdd{width:44px;height:44px}.dzUniversalMenu{top:54px}.dzFolderContext{align-items:flex-start;flex-direction:column}.dzFolderActions{width:100%;justify-content:flex-start}.dzFolderActions button{flex:1}.dzExplainBreakdown{grid-template-columns:1fr 1fr}.dzFormGrid{grid-template-columns:1fr}.dzPersonalLoanRow{grid-template-columns:1fr auto}.dzPersonalLoanRow .dzTinyButton{grid-column:1/-1;width:100%;margin:0}.dzChargeAccountSelector{padding:10px}}
    `;
    document.head.appendChild(style);
  }

  window.addEventListener('load', install, { once: true });
  if (document.readyState === 'complete') install();
})();