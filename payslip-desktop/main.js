const { app, BrowserWindow, dialog, ipcMain, net, protocol } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { pathToFileURL } = require('url');

app.setName('Demo Building Tools');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let lastUpdateStatus = {
  state: 'idle',
  message: 'Not checked yet.',
  checkedAt: null,
};

const MINI_APP_BASE_URL = 'https://zaurio.es/payslip-updates/apps/';
const GRAPH_AUTHORITY_BASE = 'https://login.microsoftonline.com';
const GRAPH_CLIENT_ID = '14d82eec-204b-4c2f-b7e8-296a0dab67ef';
const GRAPH_SCOPES = 'User.Read Files.ReadWrite.All Sites.ReadWrite.All';
let graphAccessToken = '';
let graphAuthority = 'common';

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
    const installedPrefix = '/installed-mini-apps/';

    if (requestedPath.startsWith(installedPrefix)) {
      const relativeInstalledPath = requestedPath.slice(installedPrefix.length);
      const installedRoot = path.resolve(app.getPath('userData'), 'mini-apps');
      const resolvedInstalledPath = path.resolve(installedRoot, relativeInstalledPath);
      if (resolvedInstalledPath !== installedRoot && !resolvedInstalledPath.startsWith(`${installedRoot}${path.sep}`)) {
        return new Response('Not found', { status: 404 });
      }
      return net.fetch(pathToFileURL(resolvedInstalledPath).toString());
    }

    const resolvedPath = path.resolve(__dirname, `.${requestedPath}`);
    const appRoot = path.resolve(__dirname);

    if (resolvedPath !== appRoot && !resolvedPath.startsWith(`${appRoot}${path.sep}`)) {
      return new Response('Not found', { status: 404 });
    }

    return net.fetch(pathToFileURL(resolvedPath).toString());
  });
}

function normalizeReleaseNotes(info = {}) {
  const notes = info.releaseNotes || info.releaseName || '';
  if (Array.isArray(notes)) {
    return notes.map((item) => {
      if (typeof item === 'string') return item;
      return [item.version, item.note].filter(Boolean).join('\n');
    }).filter(Boolean).join('\n\n');
  }
  return String(notes || '').trim();
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
  autoUpdater.autoDownload = false;
  autoUpdater.on('checking-for-update', () => {
    sendUpdateStatus('checking', 'Checking for updates...');
  });
  autoUpdater.on('update-available', (info) => {
    sendUpdateStatus('available', `Version ${info.version} is available.`, { updateVersion: info.version, releaseNotes: normalizeReleaseNotes(info) });
  });
  autoUpdater.on('update-not-available', () => {
    sendUpdateStatus('current', `Version ${app.getVersion()} is the latest.`);
  });
  autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus('downloading', `Downloading update ${Math.round(progress.percent || 0)}%...`);
  });
  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateStatus('downloaded', `Version ${info.version} is ready. Restart to install.`, { updateVersion: info.version, releaseNotes: normalizeReleaseNotes(info) || lastUpdateStatus.releaseNotes || '' });
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
  ipcMain.handle('updater:download', async () => {
    if (!app.isPackaged) {
      sendUpdateStatus('dev', `Version ${app.getVersion()} is running in development mode.`);
      return lastUpdateStatus;
    }
    try {
      sendUpdateStatus('downloading', 'Downloading update 0%...');
      await autoUpdater.downloadUpdate();
    } catch (error) {
      sendUpdateStatus('error', readableUpdateError(error));
    }
    return lastUpdateStatus;
  });
  ipcMain.handle('updater:install', () => {
    if (lastUpdateStatus.state !== 'downloaded') {
      return lastUpdateStatus;
    }
    autoUpdater.quitAndInstall(false, true);
    return lastUpdateStatus;
  });
  ipcMain.handle('user:get-name', () => {
    try {
      return os.userInfo().username || '';
    } catch (_error) {
      return '';
    }
  });
}


function safeMiniAppPart(value) {
  return String(value || '').replace(/[^A-Za-z0-9._-]/g, '-').replace(/^-+|-+$/g, '') || 'mini-app';
}

function miniAppRoot(key) {
  return path.join(app.getPath('userData'), 'mini-apps', safeMiniAppPart(key));
}

function miniAppMetaPath(key) {
  return path.join(miniAppRoot(key), 'manifest.json');
}

function normalizeMiniAppManifest(manifest = {}, info = {}) {
  const entry = String(manifest.entry || info.entry || `${safeMiniAppPart(info.slug || info.key)}.html`).replace(/^\/+/, '');
  const entryPath = entry.split('?')[0];
  return {
    ...manifest,
    key: safeMiniAppPart(info.key || manifest.key),
    slug: safeMiniAppPart(info.slug || manifest.slug || info.key || manifest.key),
    version: String(manifest.version || '0').replace(/^v/i, '').trim(),
    entry,
    entryPath,
    updatedAt: manifest.updatedAt || new Date().toISOString(),
  };
}

async function fetchJson(url) {
  const response = await net.fetch(url, { bypassCustomProtocolHandlers: true });
  if (!response.ok) throw new Error(`Request failed ${response.status}: ${url}`);
  return response.json();
}

async function fetchBuffer(url) {
  const response = await net.fetch(url, { bypassCustomProtocolHandlers: true });
  if (!response.ok) throw new Error(`Request failed ${response.status}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function postForm(url, form) {
  const response = await net.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(form).toString(),
    bypassCustomProtocolHandlers: true
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error_description || payload.error || `Request failed ${response.status}`;
    const error = new Error(message);
    error.payload = payload;
    throw error;
  }
  return payload;
}

function shareLinkId(url) {
  return `u!${Buffer.from(String(url || ''), 'utf8').toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;
}

function cleanGraphAuthority(value) {
  return String(value || 'common').trim().replace(/^https:\/\/login\.microsoftonline\.com\//i, '').replace(/\/.*$/, '') || 'common';
}

function registerGraphDiagnostics() {
  ipcMain.handle('graph:start-device-login', async (_event, authority) => {
    graphAuthority = cleanGraphAuthority(authority);
    return postForm(`${GRAPH_AUTHORITY_BASE}/${graphAuthority}/oauth2/v2.0/devicecode`, {
    client_id: GRAPH_CLIENT_ID,
    scope: GRAPH_SCOPES
    });
  });

  ipcMain.handle('graph:poll-device-login', async (_event, deviceCode) => {
    const token = await postForm(`${GRAPH_AUTHORITY_BASE}/${graphAuthority}/oauth2/v2.0/token`, {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      client_id: GRAPH_CLIENT_ID,
      device_code: deviceCode
    });
    graphAccessToken = token.access_token || '';
    return {
      ok: Boolean(graphAccessToken),
      expiresIn: token.expires_in || 0,
      scope: token.scope || ''
    };
  });

  ipcMain.handle('graph:test-sharepoint-folder', async (_event, folderUrl) => {
    if (!graphAccessToken) throw new Error('Not signed in to Microsoft Graph yet.');
    const endpoints = [
      '/me',
      '/sites/adponline.sharepoint.com:/sites/Pre-sales-Product-Experience-Team',
      `/shares/${shareLinkId(folderUrl)}/driveItem`
    ];
    const results = [];
    for (const endpoint of endpoints) {
      try {
        const response = await net.fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
          headers: { Authorization: `Bearer ${graphAccessToken}` },
          bypassCustomProtocolHandlers: true
        });
        const payload = await response.json().catch(() => ({}));
        results.push({
          endpoint,
          ok: response.ok,
          status: response.status,
          name: payload.displayName || payload.name || payload.webUrl || '',
          message: response.ok ? 'OK' : (payload?.error?.message || `Request failed ${response.status}`)
        });
      } catch (error) {
        results.push({ endpoint, ok: false, status: 0, name: '', message: String(error?.message || error) });
      }
    }
    return results;
  });
}

function miniAppManifestUrl(info = {}) {
  const slug = safeMiniAppPart(info.slug || info.key);
  return `${MINI_APP_BASE_URL}${slug}.json?ts=${Date.now()}`;
}

function miniAppPackageUrl(filePath, manifest, info = {}) {
  const asString = String(filePath || '').replace(/^\/+/, '');
  if (/^https?:\/\//i.test(asString)) return asString;
  const baseUrl = String(manifest.baseUrl || `${MINI_APP_BASE_URL}`).replace(/\/+$/, '/');
  return `${baseUrl}${asString}`;
}

async function readInstalledMiniApp(key) {
  try {
    return JSON.parse(await fs.readFile(miniAppMetaPath(key), 'utf8'));
  } catch (_error) {
    return null;
  }
}

async function writeMiniAppFile(root, relativePath, bytes) {
  const cleanRelativePath = String(relativePath || '').replace(/^\/+/, '');
  const target = path.resolve(root, cleanRelativePath);
  const resolvedRoot = path.resolve(root);
  if (target !== resolvedRoot && !target.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error('Mini-app package contains an unsafe path.');
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, bytes);
}

async function installMiniAppPackage(info = {}) {
  const manifest = normalizeMiniAppManifest(await fetchJson(miniAppManifestUrl(info)), info);
  const root = miniAppRoot(manifest.key);
  const nextRoot = `${root}.download`;
  await fs.rm(nextRoot, { recursive: true, force: true });
  await fs.mkdir(nextRoot, { recursive: true });

  const files = Array.isArray(manifest.files) && manifest.files.length
    ? manifest.files
    : [{ path: manifest.entryPath || manifest.entry.split('?')[0], url: manifest.entry }];

  for (const file of files) {
    const relativePath = (typeof file === 'string' ? file : (file.path || file.name || file.url)).split('?')[0];
    const urlPath = typeof file === 'string' ? file : (file.url || relativePath);
    await writeMiniAppFile(nextRoot, relativePath, await fetchBuffer(miniAppPackageUrl(urlPath, manifest, info)));
  }

  const installedManifest = {
    ...manifest,
    installedAt: new Date().toISOString(),
    localEntry: `installed-mini-apps/${manifest.key}/${manifest.entry}`,
  };
  await fs.writeFile(path.join(nextRoot, 'manifest.json'), JSON.stringify(installedManifest, null, 2));
  await fs.rm(root, { recursive: true, force: true });
  await fs.rename(nextRoot, root);
  return installedManifest;
}

function registerMiniAppUpdater() {
  ipcMain.handle('miniapp:get-installed', async (_event, key) => readInstalledMiniApp(key));
  ipcMain.handle('miniapp:check', async (_event, info = {}) => {
    const manifest = normalizeMiniAppManifest(await fetchJson(miniAppManifestUrl(info)), info);
    const installed = await readInstalledMiniApp(manifest.key);
    return { manifest, installed };
  });
  ipcMain.handle('miniapp:install', async (_event, info = {}) => installMiniAppPackage(info));
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

  ipcMain.handle('pdf:save-html', async (_event, payload = {}) => {
    const title = String(payload.title || 'Demo Building Tools document').replace(/[\\/:*?"<>|]+/g, '-');
    const html = String(payload.html || '');
    if (!html.trim()) return { canceled: true };

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save PDF',
      defaultPath: `${title}.pdf`,
      filters: [{ name: 'PDF files', extensions: ['pdf'] }]
    });
    if (result.canceled || !result.filePath) return { canceled: true };

    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true
      }
    });
    try {
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      const pdf = await printWindow.webContents.printToPDF({
        printBackground: true,
        marginsType: 0,
        pageSize: 'A4'
      });
      await fs.writeFile(result.filePath, pdf);
      return { canceled: false, filePath: result.filePath };
    } finally {
      if (!printWindow.isDestroyed()) printWindow.destroy();
    }
  });
}

/**
 * Create the main application window. This loads the bundled HTML
 * payslip converter into an Electron BrowserWindow. The window is sized
 * reasonably and disables Node integration in the renderer for security.
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'Demo Building Tools',
    icon: path.join(__dirname, 'assets', 'dbt-icon.ico'),
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
    // safely fail. When an update exists, the renderer shows a button so
    // the user can choose when to download and restart.
    if (!app.isPackaged) return;
    autoUpdater.checkForUpdates().catch((err) => {
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
  registerMiniAppUpdater();
  registerGraphDiagnostics();
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
