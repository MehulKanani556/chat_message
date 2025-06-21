const { app, BrowserWindow, ipcMain, desktopCapturer } = require("electron");
const path = require("path");
const isDev = require('electron-is-dev');
const {
  mouse,
  keyboard,
  screen,
  getActiveWindow,
} = require("@nut-tree-fork/nut-js");
const { handleControlEvent } = require("./remoteControl");
const { dialog } = require('electron');

// Configure nut.js
mouse.config.autoDelayMs = 100;
keyboard.config.autoDelayMs = 100;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000/login'
      : `file://${path.join(__dirname, '..', 'index.html')}`
  );

  // Open the DevTools in development.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle screen sharing
  ipcMain.handle("get-sources", async () => {
    const sources = await desktopCapturer.getSources({
      types: ["window", "screen"],
      thumbnailSize: { width: 150, height: 150 },
    });
    return sources;
  });

  // Handle remote control events
  ipcMain.handle('remote-control', async (event, data) => {
    // Force log to both console and a file for debugging
    console.log("5. Main: Received remote control event:", data);
    // dialog.showMessageBox({
    //   type: 'info',
    //   message: `5. Main: Received remote control event: ${JSON.stringify(data)}`
    // });
    
    try {
      await handleControlEvent(data);
      console.log("5.1. Main: Control event executed successfully");
      // dialog.showMessageBox({
      //   type: 'info',
      //   message: "5.1. Main: Control event executed successfully"
      // });
    } catch (error) {
      console.error("5.2. Main: Error executing control event:", error);
      // dialog.showMessageBox({
      //   type: 'error',
      //   message: `5.2. Main: Error executing control event: ${error.message}`
      // });
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
