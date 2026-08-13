window.__DINEROZAURIO_VERSION__ = {
  major: 2,
  minor: 5,
  build: "1308261152",
  label: "2.5.1308261152",
};

(() => {
  const scripts = [
    './folder-mode-summary-v2.js?v=1308261152',
    './folder-mode-enhancements-v3.js?v=1308261152',
    './folder-mode-fixes-v4.js?v=1308261152',
    './ui-fixes-v5.js?v=1308261152'
  ];
  scripts.forEach(src => {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  });
})();