// const { contextBridge, ipcRenderer } = require('electron');

// contextBridge.exposeInMainWorld('electronAPI', {
//     send: (channel, data) => ipcRenderer.send(channel, data),
//     receive: (channel, func) => {
//         ipcRenderer.on(channel, (event, ...args) => func(...args));
//     },
// });
const { contextBridge, ipcRenderer,desktopCapturer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  // Screen sharing
  getSources: () => ipcRenderer.invoke('get-sources'),
  // getSources: async () => {
  //   const sources = await desktopCapturer.getSources({
  //     types: ['window', 'screen'],
  //     thumbnailSize: { width: 300, height: 200 }
  //   });
  //   console.log(sources);
    
  //   // Return the thumbnail as a dataURL string, not as a NativeImage
  //   return sources.map(source => ({
  //     id: source.id,
  //     name: source.name,
  //     thumbnail: source.thumbnail.toDataURL(), // Convert here!
  //   }));
  // },
  getScreenDimensions: () => ipcRenderer.invoke('get-screen-dimensions'),
  
  // Remote control
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
  // getSources: (opts) => desktopCapturer.getSources(opts),
  remoteControl: {
    moveMouse: (x, y) => {
      return ipcRenderer
        .invoke("remote-control", { type: "mousemove", payload: { x, y } })
        .then(() => {})
        .catch((error) => {
          // console.error("4.2. Preload: Mousemove failed:", error);
          throw error;
        });
    },
    click: () =>
      ipcRenderer.invoke("remote-control", { type: "click", payload: {} }),
    rightClick: () =>
      ipcRenderer.invoke("remote-control", { type: "rightClick", payload: {} }),
    doubleClick: () =>
      ipcRenderer.invoke("remote-control", {
        type: "doubleClick",
        payload: {},
      }),
    pressKey: (key) =>
      ipcRenderer.invoke("remote-control", {
        type: "keydown",
        payload: { key },
      }),
    scroll: (amount) =>
      ipcRenderer.invoke("remote-control", {
        type: "scroll",
        payload: { amount },
      }),
    pressButton: () => ipcRenderer.invoke('remote-control',  { type: "pressButton", payload: {} }),
    releaseButton: () => ipcRenderer.invoke('remote-control', { type: "releaseButton", payload: {} }),
  },
});
