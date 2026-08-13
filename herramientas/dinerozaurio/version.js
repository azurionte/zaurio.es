window.__DINEROZAURIO_VERSION__ = {
  major: 2,
  minor: 8,
  build: "1308261518",
  label: "2.8.1308261518",
};

(() => {
  const scripts = [
    './folder-mode-summary-v2.js?v=1308261518',
    './folder-mode-enhancements-v3.js?v=1308261518',
    './folder-mode-fixes-v4.js?v=1308261518',
    './ui-fixes-v5.js?v=1308261518',
    './account-balance-engine-v6.js?v=1308261518',
    './accounting-invariants-hotfix.js?v=1308261518',
    './account-routing-current.js?v=1308261518'
  ];

  const loadNext = (index = 0) => {
    if (index >= scripts.length) {
      window.__DINEROZAURIO_UI_PATCHES_READY__ = true;
      window.__DINEROZAURIO_ACCOUNTING_AUTHORITY__ = 'current-accounting-1';
      window.__DINEROZAURIO_ROUTING_AUTHORITY__ = 'current-routing-1';
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