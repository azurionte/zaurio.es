window.__DINEROZAURIO_VERSION__ = {
  major: 2,
  minor: 4,
  build: "1308261131",
  label: "2.4.1308261131",
};

(() => {
  const scripts = [
    './folder-mode-summary-v2.js?v=1308261131',
    './folder-mode-enhancements-v3.js?v=1308261131',
    './folder-mode-fixes-v4.js?v=1308261131'
  ];
  scripts.forEach(src => {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  });
})();