window.__DINEROZAURIO_VERSION__ = {
  major: 2,
  minor: 3,
  build: "1308261115",
  label: "2.3.1308261115",
};

(() => {
  const scripts = [
    './folder-mode-summary-v2.js?v=1308261115',
    './folder-mode-enhancements-v3.js?v=1308261115'
  ];
  scripts.forEach(src => {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  });
})();