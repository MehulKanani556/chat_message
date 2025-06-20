const { app, BrowserWindow, ipcMain ,desktopCapturer} = require("electron");
const path = require("path");
const isDev = require('electron-is-dev');
const {
  screen,
  getActiveWindow,
} = require("@nut-tree-fork/nut-js");
const { handleControlEvent } = require("./remoteControl");


app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
app.commandLine.appendSwitch('allow-http-screen-capture');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,  
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000/login'
      : `file://${path.join(__dirname, '..', 'index.html')}`
  );


  // Open the DevTools in development.123
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle screen sharing
  ipcMain.handle("get-sources", async () => {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 150, height: 150 },
    });
   const data = sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(), // Convert here!
    }));

    // console.log(data);
    return data
  });

  // Handle remote control events
  ipcMain.handle('remote-control', async (event, data) => {
    try {
      await handleControlEvent(data);
    } catch (error) {
      throw error;
    }
  });

  // Get screen dimensions
  ipcMain.handle("get-screen-dimensions", async () => {
    const dimensions = (await screen.width()) + "x" + (await screen.height());
    return dimensions;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
