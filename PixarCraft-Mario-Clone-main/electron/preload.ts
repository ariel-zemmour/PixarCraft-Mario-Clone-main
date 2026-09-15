import { contextBridge, ipcRenderer } from 'electron';

// Expose auto updater events to the renderer process safely
contextBridge.exposeInMainWorld('updateAPI', {
  onUpdateStatus: (callback: (status: string, data?: any) => void) => {
    ipcRenderer.on('update-status', (_event, status, data) => callback(status, data));
  },
  applyUpdate: () => {
    ipcRenderer.invoke('apply-update');
  }
});
