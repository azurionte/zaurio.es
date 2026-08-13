window.__DINEROZAURIO_VERSION__ = {
  major: 2,
  minor: 9,
  build: "1308261812",
  label: "2.9.1308261812",
};

(() => {
  const scripts = [
    './finance/accounting-core.js?v=1308261812',
    './ui/accounts.js?v=1308261812'
  ];

  const loadNext = (index = 0) => {
    if (index >= scripts.length) {
      window.__DINEROZAURIO_UI_PATCHES_READY__ = true;
      window.__DINEROZAURIO_ACCOUNTING_AUTHORITY__ = 'accounting-core-2';
      window.__DINEROZAURIO_ROUTING_AUTHORITY__ = 'accounting-core-2';
      delete window.__DINEROZAURIO_ACCOUNT_DISPLAY_AUTHORITY__;
      if (typeof renderHomeDashboard === 'function' && document.getElementById('homeDashboard')) {
        setTimeout(() => renderHomeDashboard(), 0);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = scripts[index];
    script.async = false;
    script.onload = () => loadNext(index + 1);
    script.onerror = () => {
      console.error('DineroZaurio: no se pudo cargar', scripts[index]);
      loadNext(index + 1);
    };
    document.head.appendChild(script);
  };

  loadNext();
})();
