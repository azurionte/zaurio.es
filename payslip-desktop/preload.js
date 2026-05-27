const { contextBridge, ipcRenderer } = require('electron');

const updaterApi = {
  getStatus: () => ipcRenderer.invoke('updater:get-status'),
  check: () => ipcRenderer.invoke('updater:check'),
  install: () => ipcRenderer.invoke('updater:install'),
  onStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on('updater:status', listener);
    return () => ipcRenderer.removeListener('updater:status', listener);
  }
};

contextBridge.exposeInMainWorld('payslipUpdater', updaterApi);

contextBridge.exposeInMainWorld('payslipDesktop', {
  selectPdf: () => ipcRenderer.invoke('pdf:select')
});
