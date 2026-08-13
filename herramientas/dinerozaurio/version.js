window.__DINEROZAURIO_VERSION__ = {
  major: 2,
  minor: 9,
  build: "1308261942",
  label: "2.9.1308261942",
};

(() => {
  document.documentElement.classList.add('dz-accounting-loading');
  const gate = document.createElement('style');
  gate.id = 'dzCanonicalRenderGate';
  gate.textContent = '.dz-accounting-loading #homeDashboard{visibility:hidden!important}';
  document.head.appendChild(gate);

  const scripts = [
    './finance/accounting-core.js?v=1308261942',
    './ui/accounts.js?v=1308261942'
  ];

  window.__DINEROZAURIO_CANONICAL_READY__ = new Promise((resolve, reject) => {
    const loadNext = (index = 0) => {
      if (index >= scripts.length) {
        window.__DINEROZAURIO_UI_PATCHES_READY__ = true;
        window.__DINEROZAURIO_ACCOUNTING_AUTHORITY__ = 'accounting-core-2';
        window.__DINEROZAURIO_ROUTING_AUTHORITY__ = 'accounting-core-2';
        delete window.__DINEROZAURIO_ACCOUNT_DISPLAY_AUTHORITY__;
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = scripts[index];
      script.async = false;
      script.onload = () => loadNext(index + 1);
      script.onerror = () => reject(new Error(`DineroZaurio: no se pudo cargar ${scripts[index]}`));
      document.head.appendChild(script);
    };
    loadNext();
  });
})();
