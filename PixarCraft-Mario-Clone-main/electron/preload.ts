import { contextBridge, ipcRenderer } from 'electron';

// Expose auto updater events to the renderer process safely.
//
// FIX #4: the previous implementation used ipcRenderer.on() without ever
// removing the listener. Every time the renderer navigated or the component
// re-mounted it called onUpdateStatus() again, registering an additional copy
// of the same callback. Over time this produced duplicate notifications and
// could cause memory leaks.
//
// The fix registers a single, permanent IPC listener here in the preload
// (which is loaded exactly once per renderer process) and forwards events to
// whichever callback the renderer has most recently registered via
// setUpdateCallback(). The renderer replaces the callback instead of stacking
// new ipcRenderer listeners.

let _updateCallback: ((status: string, data?: unknown) => void) | null = null;

// Single, stable IPC listener — registered once for the lifetime of this
// renderer process. Forwards to whatever callback is currently active.
ipcRenderer.on('update-status', (_event, status: string, data?: unknown) => {
  _updateCallback?.(status, data);
});

contextBridge.exposeInMainWorld('updateAPI', {
  /**
   * Register the callback that receives update-status events.
   * Calling this again replaces the previous callback — no duplicate
   * listeners accumulate.
   */
  onUpdateStatus: (callback: (status: string, data?: unknown) => void) => {
    _updateCallback = callback;
  },

  /**
   * Ask the main process to quit and install the downloaded update immediately.
   */
  applyUpdate: () => {
    ipcRenderer.invoke('apply-update');
  },
});
