import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the API URL for the electron environment
process.env.VITE_API_URL = process.env.VITE_API_URL || '';

let mainWindow: BrowserWindow | null = null;

// ─── Auto-updater configuration ───────────────────────────────────────────────
// autoDownload: silently download the update in the background.
// autoInstallOnAppQuit: install when the user naturally quits, so they are
//   never interrupted mid-game. The renderer can also prompt an immediate
//   restart via the 'apply-update' IPC channel.
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true; // FIX #2: was false — update was downloaded but never applied

// ─── Auto-updater event handlers (registered before createWindow so they are
//     ready even if an update is found while the window is still loading) ──────
//
// FIX #1: events were previously registered AFTER app.whenReady() / createWindow(),
// which meant mainWindow was guaranteed to be non-null — but 'checking-for-update'
// fires synchronously in some electron-updater versions, before the window is
// fully constructed. Moving the handlers here (before createWindow) and guarding
// each send with `mainWindow?.` makes them safe at any point in the lifecycle.

autoUpdater.on('checking-for-update', () => {
  mainWindow?.webContents.send('update-status', 'checking');
});

autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update-status', 'available', info.version);
});

autoUpdater.on('update-not-available', () => {
  mainWindow?.webContents.send('update-status', 'not-available');
});

autoUpdater.on('error', (err) => {
  // Log to stderr so the error appears in production logs even without DevTools
  console.error('[auto-updater] error:', err.message);
  mainWindow?.webContents.send('update-status', 'error', err.message);
});

autoUpdater.on('download-progress', (progressObj) => {
  mainWindow?.webContents.send('update-status', 'downloading', progressObj.percent);
});

autoUpdater.on('update-downloaded', (info) => {
  // Notify the renderer so it can show a "Restart to update" prompt.
  // The update will also be applied automatically on next quit (autoInstallOnAppQuit).
  mainWindow?.webContents.send('update-status', 'downloaded', info.version);
});

// ─── Window creation ──────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    title: 'Mario Clone',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the Vite dev server or the built app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL + '#/play');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, the renderer is placed in dist/ and main in dist-electron/
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'play' });
  }
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();

  // FIX #1 (continued): perform the initial update check only after the window
  // has finished loading so that any IPC messages sent during the check are
  // guaranteed to reach the renderer process.
  mainWindow!.webContents.once('did-finish-load', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });

  // FIX #3: re-check for updates every 4 hours so long-running sessions still
  // receive patches without requiring a manual restart or reinstall.
  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, FOUR_HOURS_MS);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ─── IPC handlers ─────────────────────────────────────────────────────────────

// Allows the renderer to trigger an immediate restart-and-install (user-initiated).
ipcMain.handle('apply-update', () => {
  autoUpdater.quitAndInstall();
});
