window.__DINEROZAURIO_VERSION__ = {
  major: 2,
  minor: 9,
  build: "1608261557",
  label: "2.9.1608261557",
};

(() => {
  const build = window.__DINEROZAURIO_VERSION__.build;
  const UX_KEY = 'dinerozaurio_preprod_ux_mode_v1';
  const uxMode = localStorage.getItem(UX_KEY) === 'consolidated' ? 'consolidated' : 'legacy';

  window.__DINEROZAURIO_PREPROD_UX_MODE__ = uxMode;
  document.documentElement.dataset.dzUxMode = uxMode;
  document.documentElement.classList.add('dz-accounting-loading');

  const gate = document.createElement('style');
  gate.id = 'dzCanonicalRenderGate';
  gate.textContent = '.dz-accounting-loading #homeDashboard{visibility:hidden!important}';
  document.head.appendChild(gate);

  const shared = [
    `./finance/accounting-core.js?v=${build}`,
    `./session-drafts.js?v=${build}`,
    `./ui/debt-settings-state-bridge.js?v=${build}`,
    `./ui/budget-period-sync.js?v=${build}`
  ];

  const legacy = [
    `./ui/accounts.js?v=${build}`,
    `./ui/account-observed-adapter.js?v=${build}`,
    `./ui/debt-settings-polish.js?v=${build}`,
    `./ui/debt-editor-wizard.js?v=${build}`,
    `./ui/configuration-modal-polish.js?v=${build}`
  ];

  const consolidated = [
    `./ui/consolidated-ux.js?v=${build}`
  ];

  const scripts = [
    ...shared,
    ...(uxMode === 'consolidated' ? consolidated : legacy),
    `./ui/preprod-ux-switch.js?v=${build}`
  ];

  const revealWhenPatched = () => {
    const ready = uxMode === 'consolidated'
      ? window.__DINEROZAURIO_CONSOLIDATED_UX__ === 'consolidated-ux-1'
      : window.__DZ_ACCOUNTS_UI__ === 'accounts-ui-7' && !!window.__DZ_ACCOUNT_OBSERVED_ADAPTER__;

    if (!ready) {
      setTimeout(revealWhenPatched, 60);
      return;
    }

    window.__DINEROZAURIO_UI_PATCHES_READY__ = true;
    window.__DINEROZAURIO_ACCOUNTING_AUTHORITY__ = 'accounting-core-2';
    window.__DINEROZAURIO_ROUTING_AUTHORITY__ = 'accounting-core-2';
    delete window.__DINEROZAURIO_ACCOUNT_DISPLAY_AUTHORITY__;
    document.documentElement.classList.remove('dz-accounting-loading');
  };

  const loadNext = (index = 0) => {
    if (index >= scripts.length) {
      if (document.readyState === 'complete') revealWhenPatched();
      else window.addEventListener('load', revealWhenPatched, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = scripts[index];
    script.async = false;
    script.onload = () => loadNext(index + 1);
    script.onerror = () => console.error('DineroZaurio: no se pudo cargar', scripts[index]);
    document.head.appendChild(script);
  };

  loadNext();
})();
