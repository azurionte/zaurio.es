window.__DINEROZAURIO_VERSION__ = {
  major: 2,
  minor: 6,
  build: "1308261255",
  label: "2.6.1308261255",
};

(() => {
  const scripts = [
    './folder-mode-summary-v2.js?v=1308261255',
    './folder-mode-enhancements-v3.js?v=1308261255',
    './folder-mode-fixes-v4.js?v=1308261255',
    './ui-fixes-v5.js?v=1308261255',
    './account-balance-engine-v6.js?v=1308261255'
  ];

  // These files progressively enhance the same dashboard functions.
  // Dynamic scripts are async by default, which meant an older patch could
  // occasionally execute after a newer one on reload and overwrite the UI.
  // Load them strictly in order so v6 is always the final authority.
  const loadNext = (index = 0) => {
    if (index >= scripts.length) {
      window.__DINEROZAURIO_UI_PATCHES_READY__ = true;
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