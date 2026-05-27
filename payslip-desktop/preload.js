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

window.addEventListener('DOMContentLoaded', () => {
  const headerRight = document.querySelector('#header > div:last-child');
  if (!headerRight || document.getElementById('desktopUpdatePanel')) return;

  const panel = document.createElement('span');
  panel.id = 'desktopUpdatePanel';
  panel.style.display = 'inline-flex';
  panel.style.alignItems = 'center';
  panel.style.gap = '8px';
  panel.style.marginRight = '10px';
  panel.style.verticalAlign = 'middle';
  panel.innerHTML = `
    <span id="desktopUpdateStatus" style="color:#dbeafe;font-size:12px;font-weight:800;">Checking updates...</span>
    <button id="desktopUpdateCheck" type="button" style="border:1px solid rgba(96,165,250,.35);background:rgba(37,99,235,.18);color:#fff;border-radius:999px;padding:7px 10px;font-weight:900;cursor:pointer;">Look for updates</button>
    <button id="desktopUpdateInstall" type="button" style="display:none;border:0;background:#facc15;color:#07111f;border-radius:999px;padding:7px 10px;font-weight:900;cursor:pointer;">Restart</button>
  `;
  headerRight.insertBefore(panel, headerRight.firstChild);

  const statusText = document.getElementById('desktopUpdateStatus');
  const checkButton = document.getElementById('desktopUpdateCheck');
  const installButton = document.getElementById('desktopUpdateInstall');

  function render(status) {
    statusText.textContent = status?.message || 'Update status unavailable.';
    installButton.style.display = status?.state === 'downloaded' ? 'inline-block' : 'none';
    checkButton.disabled = status?.state === 'checking' || status?.state === 'downloading';
    checkButton.style.opacity = checkButton.disabled ? '.55' : '1';
  }

  updaterApi.onStatus(render);
  updaterApi.getStatus().then(render).catch(() => {
    statusText.textContent = 'Update status unavailable.';
  });
  checkButton.addEventListener('click', () => {
    updaterApi.check().then(render).catch((error) => {
      statusText.textContent = 'Update check failed. Try again later.';
    });
  });
  installButton.addEventListener('click', () => {
    updaterApi.install();
  });
});
