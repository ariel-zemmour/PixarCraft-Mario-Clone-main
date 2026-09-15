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

app.whenReady().then(() => {
  createWindow();

  // Setup auto updater
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;

  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();

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

// Auto Updater Events
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
  mainWindow?.webContents.send('update-status', 'error', err.message);
});

autoUpdater.on('download-progress', (progressObj) => {
  mainWindow?.webContents.send('update-status', 'downloading', progressObj.percent);
});

autoUpdater.on('update-downloaded', (info) => {
  mainWindow?.webContents.send('update-status', 'downloaded', info.version);
});

// IPC Handler to apply the update and restart
ipcMain.handle('apply-update', () => {
  autoUpdater.quitAndInstall();
});
