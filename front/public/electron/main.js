const { app, BrowserWindow, ipcMain, Tray, Menu, desktopCapturer, dialog,nativeImage } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
const { screen,Region ,getWindows} = require("@nut-tree-fork/nut-js");
const { handleControlEvent } = require("./remoteControl");

app.commandLine.appendSwitch("enable-usermedia-screen-capturing");
app.commandLine.appendSwitch("allow-http-screen-capture");
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

let tray = null;
let mainWindow = null;

async function createWindow() {
  let store;
  try {
   const Store = require("electron-store");
    store = new Store();

  } catch (err) {
    console.error("Failed to load electron-store:", err);
    dialog.showErrorBox('Error', 'Failed to load electron-store'+ err);
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000/login"
      : `file://${path.join(__dirname, "..", "index.html")}`
  );

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Tray setup
  tray = new Tray(path.join(__dirname,"..", "chat.png"));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow.show() },
    { label: 'Quit', click: () => { app.isQuiting = true; app.quit(); } }
  ]);
  tray.setToolTip('ChatApp');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    mainWindow.show();
  });

  mainWindow.on('close', function (event) {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  // IPC handlers for auth/session
  ipcMain.handle("save-auth-data", (event, { token, userId, refToken }) => {
    store.set("authToken", token);
    store.set("userId", userId);
    store.set("refToken", refToken);
  });

  ipcMain.handle("get-auth-token", () => {
    return store.get("authToken");
  });

  ipcMain.handle("get-user-id", () => {
    return store.get("userId");
  });

  ipcMain.handle("get-ref-token", () => {
    return store.get("refToken");
  });

  ipcMain.handle("clear-auth-data", () => {
    store.delete("authToken");
    store.delete("refToken");
    store.delete("userId");
  });

  // Handle screen sharing
  // ipcMain.handle("get-sources", async () => {
  //   const sources = await desktopCapturer.getSources({
  //     types: ["screen", "window"],
  //     thumbnailSize: { width: 150, height: 150 },
  //   });
  //   const data = sources.map((source) => ({
  //     id: source.id,
  //     name: source.name,
  //     thumbnail: source.thumbnail.toDataURL(),
  //   }));
  //   return data;
  // });

  ipcMain.handle("get-sources", async () => {
    const windows = await getWindows();
    const data = [];
  
    for (const win of windows) {
      try {
        const title = await win.getTitle();
        const bounds = await win.getBounds();
  
        // Skip windows without titles (often system/internal)
        if (!title || title.trim() === "") continue;
  
        // Define region to capture
        const region = new Region(bounds.left, bounds.top, bounds.width, bounds.height);
  
        // Capture image from screen
        const image = await screen.captureRegion(region);
  
        // Convert to base64 (like toDataURL())
        const base64 = nativeImage
          .createFromBuffer(await image.toPNG())
          .resize({ width: 150,height: 150 }) // Thumbnail size
          .toDataURL();
  
        data.push({
          name: title,
          handle: win.getHandle(),
          id: `${bounds.left}-${bounds.top}-${title}`,
          thumbnail: base64,
        });
      } catch (err) {
        console.error("Failed to process window:", err.message);
      }
    }
  
    return data;
  });

  // Handle remote control events
  ipcMain.handle("remote-control", async (event, data) => {
    try {
      await handleControlEvent(data);
    } catch (error) {
      throw error;
    }
  });

  ipcMain.on('set-active-window', async (event, windowName) => {
    const windows = await getWindows();
    for (const win of windows) {
      const title = await win.getTitle();
      if (title.includes(windowName)) {
        await win.bringToTop();
        break;
      }
    }
  });

  // Get screen dimensions
  ipcMain.handle("get-screen-dimensions", async () => {
    const dimensions = (await screen.width()) + "x" + (await screen.height());
    return dimensions;
  });
}

// Auto-launch on Windows startup
app.setLoginItemSettings({
  openAtLogin: true,
  path: process.execPath,
});

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