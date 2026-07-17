const { contextBridge, ipcRenderer } = require('electron');

const updaterApi = {
  getStatus: () => ipcRenderer.invoke('updater:get-status'),
  check: () => ipcRenderer.invoke('updater:check'),
  download: () => ipcRenderer.invoke('updater:download'),
  install: () => ipcRenderer.invoke('updater:install'),
  onStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on('updater:status', listener);
    return () => ipcRenderer.removeListener('updater:status', listener);
  }
};

contextBridge.exposeInMainWorld('payslipUpdater', updaterApi);

contextBridge.exposeInMainWorld('payslipDesktop', {
  selectPdf: () => ipcRenderer.invoke('pdf:select'),
  saveHtmlAsPdf: (payload) => ipcRenderer.invoke('pdf:save-html', payload),
  saveHtmlBatch: (payload) => ipcRenderer.invoke('pdf:save-html-batch', payload)
});

contextBridge.exposeInMainWorld('payslipMiniApps', {
  getInstalled: (key) => ipcRenderer.invoke('miniapp:get-installed', key),
  check: (info) => ipcRenderer.invoke('miniapp:check', info),
  install: (info) => ipcRenderer.invoke('miniapp:install', info),
});

contextBridge.exposeInMainWorld('dbtUser', {
  getUsername: () => ipcRenderer.invoke('user:get-name')
});
