(() => {
  'use strict';

  const VERSION = 'current-routing-1';
  if (window.__DZ_CURRENT_ROUTING__ === VERSION) return;

  function install() {
    if (window.__DZ_CURRENT_ROUTING__ === VERSION) return;
    if (typeof normalizeMoneyOrganization !== 'function' || typeof renderHomeDashboard !== 'function') {
      setTimeout(install, 60);
      return;
    }
    window.__DZ_CURRENT_ROUTING__ = VERSION;

    wrapEditor('openSimpleEditor', ({ item, kind }) => {
      if (!item?.id || !['expense', 'income'].includes(kind)) return;
      injectRoutingEditor({
        itemId: item.id,
        title: kind === 'income' ? 'Cuenta de ingreso' : 'Cuenta de cobro',
        allowFolder: kind === 'expense',
        saveButtonId: 'saveSimpleBtn'
      });
    });

    wrapEditor('openDebtEditor', ({ item }) => {
      if (!item?.id) return;
      injectRoutingEditor({ itemId: item.id, title: 'Cuenta de cobro', allowFolder: false, saveButtonId: 'saveDebtBtn' });
    });

    wrapEditor('openGoalEditor', ({ item }) => {
      if (!item?.id) return;
      injectRoutingEditor({ itemId: item.id, title: 'Destino del ahorro', allowFolder: true, saveButtonId: 'saveGoalBtn', requireFolder: true });
    });

    // Current quick-create modals already support account routing for expenses/debts.
    // This observer makes routing visible in any editor introduced elsewhere without duplicating accounting logic.
    const observer = new MutationObserver(() => {
      const root = document.getElementById('modalRoot');
      if (!root || root.classList.contains('hidden')) return;
      const save = root.querySelector('#saveSimpleBtn,#saveDebtBtn,#saveGoalBtn');
      if (!save || root.querySelector('[data-dz-current-routing]')) return;
      const id = root.dataset.dzRoutingItemId;
      if (id) injectRoutingEditor({ itemId: id, title: 'Cuenta', allowFolder: true, saveButtonId: save.id });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function wrapEditor(name, afterOpen) {
    const original = window[name];
    if (typeof original !== 'function' || original.__dzRoutingWrapped) return;
    const wrapped = function (...args) {
      const result = original.apply(this, args);
      const item = args[0];
      const kind = name === 'openSimpleEditor' ? args[0] && args[1] : null;
      const root = document.getElementById('modalRoot');
      if (root && item?.id) root.dataset.dzRoutingItemId = item.id;
      queueMicrotask(() => {
        if (name === 'openSimpleEditor') afterOpen({ kind: args[0], item: args[1] });
        else afterOpen({ item: args[0] });
      });
      return result;
    };
    wrapped.__dzRoutingWrapped = true;
    window[name] = wrapped;
  }

  function organization() {
    return normalizeMoneyOrganization(state.moneyOrganization);
  }

  function injectRoutingEditor({ itemId, title, allowFolder, saveButtonId, requireFolder = false }) {
    const root = document.getElementById('modalRoot');
    const modal = root?.querySelector('.modalCard');
    if (!modal || modal.querySelector('[data-dz-current-routing]')) return;
    const org = organization();
    if (!org.enabled || !org.accounts.length) return;

    const current = org.assignments?.[itemId] || { accountId: org.salaryAccountId || org.accounts[0].id, folderId: '' };
    let accountId = current.accountId || org.salaryAccountId || org.accounts[0].id;
    let folderId = current.folderId || '';

    const block = document.createElement('section');
    block.className = 'dzCurrentRouting';
    block.dataset.dzCurrentRouting = '1';
    block.innerHTML = `
      <div class="dzCurrentRoutingTitle">${escapeHtml(title)}</div>
      <div class="dzCurrentAccountSwitch">${org.accounts.map(account => `
        <button type="button" data-dz-route-account="${escapeHtml(account.id)}" class="${account.id === accountId ? 'active' : ''}">${escapeHtml(shortName(account.name))}</button>
      `).join('')}</div>
      <div class="dzCurrentFolderRoute"></div>
      <div class="dzCurrentRoutingHint">Este dato determina qué cuenta cambia cuando el movimiento ocurre. Cambiar la fecha o el importe no debe cambiar la cuenta.</div>`;

    const form = modal.querySelector('.modalGrid') || modal.querySelector('.dzFormGrid') || modal.querySelector('.btnRow');
    if (form?.classList.contains('btnRow')) form.before(block);
    else form?.insertAdjacentElement('afterend', block);

    const folderHost = block.querySelector('.dzCurrentFolderRoute');
    function renderFolders() {
      const account = org.accounts.find(row => row.id === accountId);
      const folders = allowFolder ? (account?.folders || []) : [];
      if (!folders.length) {
        folderId = '';
        folderHost.innerHTML = requireFolder ? '<div class="dzCurrentRoutingWarning">Esta cuenta no tiene carpetas. Crea una carpeta o elige otra cuenta.</div>' : '';
        return;
      }
      if (!folders.some(folder => folder.id === folderId)) folderId = '';
      folderHost.innerHTML = `<label>${requireFolder ? 'Carpeta de destino' : 'Carpeta (opcional)'}</label><select class="select" data-dz-route-folder><option value="">${requireFolder ? 'Selecciona una carpeta' : 'Disponible sin carpeta'}</option>${folders.map(folder => `<option value="${escapeHtml(folder.id)}" ${folder.id === folderId ? 'selected' : ''}>${escapeHtml(folder.name)}</option>`).join('')}</select>`;
      folderHost.querySelector('[data-dz-route-folder]').onchange = event => { folderId = event.target.value || ''; };
    }
    renderFolders();

    block.querySelectorAll('[data-dz-route-account]').forEach(button => {
      button.onclick = () => {
        accountId = button.dataset.dzRouteAccount;
        folderId = '';
        block.querySelectorAll('[data-dz-route-account]').forEach(node => node.classList.toggle('active', node === button));
        renderFolders();
      };
    });

    const save = document.getElementById(saveButtonId);
    save?.addEventListener('click', event => {
      if (requireFolder && !folderId) {
        event.preventDefault();
        event.stopImmediatePropagation();
        folderHost.querySelector('select')?.focus();
        return;
      }
      const next = organization();
      next.assignments[itemId] = { accountId, folderId: allowFolder ? folderId : '' };
      state.moneyOrganization = next;
      if (typeof cacheLocal === 'function') cacheLocal();
    }, true);
  }

  function shortName(name) {
    const text = String(name || 'Cuenta');
    if (/bbva/i.test(text)) return 'BBVA';
    if (/revolut/i.test(text)) return 'Revolut';
    return text.split('·')[0].trim();
  }

  function injectStyles() {
    if (document.getElementById('dzCurrentRoutingStyles')) return;
    const style = document.createElement('style');
    style.id = 'dzCurrentRoutingStyles';
    style.textContent = `
      .dzCurrentRouting{margin:14px 0;padding:13px;border-radius:15px;background:rgba(34,211,238,.055);border:1px solid rgba(34,211,238,.14)}
      .dzCurrentRoutingTitle{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:9px}
      .dzCurrentAccountSwitch{display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:7px}
      .dzCurrentAccountSwitch button{padding:10px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#fff;font-weight:850;cursor:pointer}
      .dzCurrentAccountSwitch button.active{background:linear-gradient(135deg,#0ea5e9,#22d3ee);color:#06141d;border-color:transparent}
      .dzCurrentFolderRoute{margin-top:10px}.dzCurrentFolderRoute label{display:block;margin-bottom:6px;font-size:11px;color:var(--muted);font-weight:800}
      .dzCurrentRoutingHint{margin-top:9px;font-size:10px;line-height:1.4;color:var(--muted)}
      .dzCurrentRoutingWarning{padding:9px 10px;border-radius:10px;background:rgba(251,191,36,.09);color:#ffe084;font-size:11px}
    `;
    document.head.appendChild(style);
  }

  injectStyles();
  window.addEventListener('load', install, { once: true });
  if (document.readyState === 'complete') install();
})();