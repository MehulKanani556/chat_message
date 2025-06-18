// const { contextBridge, ipcRenderer } = require('electron');

// contextBridge.exposeInMainWorld('electronAPI', {
//     send: (channel, data) => ipcRenderer.send(channel, data),
//     receive: (channel, func) => {
//         ipcRenderer.on(channel, (event, ...args) => func(...args));
//     },
// });
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Screen sharing
  getSources: () => ipcRenderer.invoke('get-sources'),
  getScreenDimensions: () => ipcRenderer.invoke('get-screen-dimensions'),
  
  // Remote control
  remoteControl: {
    moveMouse: (x, y) => {
      console.log("4. Preload: Sending mousemove to main process", { x, y });
      return ipcRenderer.invoke('remote-control', { type: 'mousemove', payload: { x, y } })
        .then(() => {
          console.log("4.1. Preload: Mousemove completed successfully");
        })
        .catch((error) => {
          console.error("4.2. Preload: Mousemove failed:", error);
          throw error;
        });
    },
    click: () => ipcRenderer.invoke('remote-control', { type: 'click', payload: {} }),
    rightClick: () => ipcRenderer.invoke('remote-control', { type: 'rightClick', payload: {} }),
    doubleClick: () => ipcRenderer.invoke('remote-control', { type: 'doubleClick', payload: {} }),
    pressKey: (key) => ipcRenderer.invoke('remote-control', { type: 'keydown', payload: { key } }),
    scroll: (amount) => ipcRenderer.invoke('remote-control', { type: 'scroll', payload: { amount } })
  }
});
