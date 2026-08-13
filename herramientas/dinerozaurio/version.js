window.__DINEROZAURIO_VERSION__ = {
  major: 2,
  minor: 6,
  build: "1308261207",
  label: "2.6.1308261207",
};

(() => {
  const scripts = [
    './folder-mode-summary-v2.js?v=1308261207',
    './folder-mode-enhancements-v3.js?v=1308261207',
    './folder-mode-fixes-v4.js?v=1308261207',
    './ui-fixes-v5.js?v=1308261207',
    './account-balance-engine-v6.js?v=1308261207'
  ];
  scripts.forEach(src => {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  });
})();