window.__DINEROZAURIO_VERSION__ = {
  major: 2,
  minor: 9,
  build: "1308262006",
  label: "2.9.1308262006",
};

(() => {
  document.documentElement.classList.add('dz-accounting-loading');
  const gate = document.createElement('style');
  gate.id = 'dzCanonicalRenderGate';
  gate.textContent = '.dz-accounting-loading #homeDashboard{visibility:hidden!important}';
  document.head.appendChild(gate);

  const scripts = [
    './finance/accounting-core.js?v=1308262006',
    './ui/accounts.js?v=1308262006'
  ];

  const modulesReady = new Promise((resolve, reject) => {
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

  window.__DINEROZAURIO_CANONICAL_READY__ = modulesReady.then(() => new Promise((resolve, reject) => {
    const activate = () => {
      const installed = window.DineroZaurioAccountsUI?.install?.();
      if (!installed) {
        document.documentElement.classList.remove('dz-accounting-loading');
        reject(new Error('DineroZaurio: renderer canónico no disponible'));
        return;
      }
      resolve(true);
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', activate, { once: true });
    } else {
      activate();
    }
  }));

  window.__DINEROZAURIO_CANONICAL_READY__.catch(error => console.error(error));
})();
