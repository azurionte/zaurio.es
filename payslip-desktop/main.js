const { app, BrowserWindow, dialog, ipcMain, net, protocol } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs/promises');
const path = require('path');
const { pathToFileURL } = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let lastUpdateStatus = {
  state: 'idle',
  message: 'Not checked yet.',
  checkedAt: null,
};

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
]);

function registerAppProtocol() {
  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    const requestedPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const resolvedPath = path.resolve(__dirname, `.${requestedPath}`);
    const appRoot = path.resolve(__dirname);

    if (resolvedPath !== appRoot && !resolvedPath.startsWith(`${appRoot}${path.sep}`)) {
      return new Response('Not found', { status: 404 });
    }

    return net.fetch(pathToFileURL(resolvedPath).toString());
  });
}

function sendUpdateStatus(state, message, extra = {}) {
  const checkedAt = ['current', 'error', 'dev', 'downloaded'].includes(state)
    ? new Date().toISOString()
    : lastUpdateStatus.checkedAt;
  lastUpdateStatus = {
    state,
    message,
    version: app.getVersion(),
    checkedAt,
    ...extra
  };
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', lastUpdateStatus);
  }
}

function readableUpdateError(error) {
  const raw = String(error?.message || error || '');
  if (raw.includes('latest.yml') && (raw.includes('404') || raw.includes('Cannot find channel'))) {
    return 'No update feed found yet. Upload latest.yml and the installer files in the Zaurio admin panel.';
  }
  if (/net::|ENOTFOUND|ECONN|ETIMEDOUT|fetch failed/i.test(raw)) {
    return 'Could not reach the update server. Check your internet connection and try again.';
  }
  return 'Update check failed. Try again later or ask Zaurio admin to verify the update files.';
}

function registerUpdaterEvents() {
  autoUpdater.autoDownload = true;
  autoUpdater.on('checking-for-update', () => {
    sendUpdateStatus('checking', 'Checking for updates...');
  });
  autoUpdater.on('update-available', (info) => {
    sendUpdateStatus('available', `Downloading version ${info.version}...`, { updateVersion: info.version });
  });
  autoUpdater.on('update-not-available', () => {
    sendUpdateStatus('current', `Version ${app.getVersion()} is the latest.`);
  });
  autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus('downloading', `Downloading update ${Math.round(progress.percent || 0)}%...`);
  });
  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateStatus('downloaded', `Version ${info.version} is ready. Restart to install.`, { updateVersion: info.version });
  });
  autoUpdater.on('error', (error) => {
    sendUpdateStatus('error', readableUpdateError(error));
  });

  ipcMain.handle('updater:get-status', () => lastUpdateStatus);
  ipcMain.handle('updater:check', async () => {
    if (!app.isPackaged) {
      sendUpdateStatus('dev', `Version ${app.getVersion()} is running in development mode.`);
      return lastUpdateStatus;
    }
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      sendUpdateStatus('error', readableUpdateError(error));
    }
    return lastUpdateStatus;
  });
  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall(false, true);
  });
}

function registerDesktopFilePicker() {
  ipcMain.handle('pdf:select', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select payslip PDF',
      properties: ['openFile'],
      filters: [{ name: 'PDF files', extensions: ['pdf'] }]
    });

    if (result.canceled || !result.filePaths.length) {
      return { canceled: true };
    }

    const filePath = result.filePaths[0];
    const data = await fs.readFile(filePath);
    return {
      canceled: false,
      fileName: path.basename(filePath),
      base64: data.toString('base64')
    };
  });
}

/**
 * Create the main application window. This loads the bundled HTML
 * payslip converter into an Electron BrowserWindow. The window is sized
 * reasonably and disables Node integration in the renderer for security.
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    webPreferences: {
      // Disable Node integration in the renderer for security. If your
      // HTML requires Node features, set this to true and carefully
      // expose only the APIs you need via preload scripts.
      nodeIntegration: false,
      contextIsolation: true,
      // Use a preload script if you need to expose limited APIs to
      // the renderer. Not needed for this simple app.
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true
    }
  });

  mainWindow.loadURL('app://payslip/index.html');

  // Once the window is ready, we can check for updates. The autoUpdater
  // will look for a release feed specified in your package.json under
  // the "publish" field. See electron-updater docs for configuration.
  mainWindow.once('ready-to-show', () => {
    // In corporate environments without internet access, this call will
    // safely fail; in open environments it will automatically download
    // and install updates in the background (per-user installation).
    if (!app.isPackaged) return;
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      // swallow update errors silently; updates are optional
      console.warn('Auto update error:', err);
    });
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  registerAppProtocol();
  registerUpdaterEvents();
  registerDesktopFilePicker();
  createMainWindow();

  // On macOS it's common to re-create a window when the dock icon is clicked
  // and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
