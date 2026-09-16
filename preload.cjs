const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('odinsGlassesAppearance', {
  load: () => ipcRenderer.invoke('appearance:load'),
  save: theme => ipcRenderer.invoke('appearance:save', theme),
});
