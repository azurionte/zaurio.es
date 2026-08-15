window.__DINEROZAURIO_VERSION__ = {
  major: 2,
  minor: 9,
  build: "1408261040",
  label: "2.9.1408261040",
};

(() => {
  document.documentElement.classList.add('dz-accounting-loading');
  const gate = document.createElement('style');
  gate.id = 'dzCanonicalRenderGate';
  gate.textContent = '.dz-accounting-loading #homeDashboard{visibility:hidden!important}';
  document.head.appendChild(gate);

  const scripts = [
    './finance/accounting-core.js?v=1408261040',
    './ui/accounts.js?v=1408261040',
    './ui/account-observed-adapter.js?v=1408261040',
    './session-drafts.js?v=1408261040'
  ];

  const revealWhenPatched = () => {
    if (window.__DZ_ACCOUNTS_UI__ !== 'accounts-ui-7' || !window.__DZ_ACCOUNT_OBSERVED_ADAPTER__) {
      console.error('DineroZaurio: el renderer baseline o su adaptación canónica no terminaron de instalarse');
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
