const { app, BrowserWindow, Menu, shell, ipcMain } = require("electron");
const { createServer } = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { handleApi } = require("./api.cjs");
const { trustedExternalUrl } = require("./server/external-links.cjs");
const { configurePersistentCache } = require("./server/http.cjs");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

let localServer;
let appearanceOrigin;
function appearancePath() { return path.join(app.getPath('userData'), 'appearance.json'); }
function checkAppearanceSender(event) {
  if (!appearanceOrigin || event.senderFrame !== event.sender.mainFrame || new URL(event.senderFrame.url).origin !== appearanceOrigin) throw new Error('Untrusted appearance request');
}
ipcMain.handle('appearance:load', event => {
  checkAppearanceSender(event);
  try {
    const theme = JSON.parse(fs.readFileSync(appearancePath(), 'utf8')).theme;
    return ['classic', 'aurora', 'nocturne'].includes(theme) ? theme : 'aurora';
  } catch { return 'aurora'; }
});
ipcMain.handle('appearance:save', (event, theme) => {
  checkAppearanceSender(event);
  if (!['classic', 'aurora', 'nocturne'].includes(theme)) throw new Error('Invalid theme');
  fs.writeFileSync(appearancePath(), JSON.stringify({ theme }));
});

function statePath() {
  return path.join(app.getPath("userData"), "window-state.json");
}

function loadWindowState() {
  try {
    const state = JSON.parse(fs.readFileSync(statePath(), "utf8"));
    return {
      width: Math.max(900, Number(state.width) || 1360),
      height: Math.max(650, Number(state.height) || 860),
      x: Number.isFinite(state.x) ? state.x : undefined,
      y: Number.isFinite(state.y) ? state.y : undefined,
      maximized: Boolean(state.maximized),
    };
  } catch {
    return { width: 1360, height: 860, maximized: false };
  }
}

function saveWindowState(window) {
  if (window.isDestroyed()) return;
  const bounds = window.isMaximized() ? window.getNormalBounds() : window.getBounds();
  fs.writeFileSync(statePath(), JSON.stringify({ ...bounds, maximized: window.isMaximized() }));
}

function contentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".wav": "audio/wav",
    ".json": "application/json; charset=utf-8",
  }[extension] || "application/octet-stream";
}

function startLocalServer() {
  const rendererRoot = path.join(__dirname, "renderer-dist");
  localServer = createServer(async (request, response) => {
    if (await handleApi(request, response)) return;

    const requestUrl = new URL(request.url, "http://127.0.0.1");
    const requestedPath = requestUrl.pathname === "/" ? "index.html" : decodeURIComponent(requestUrl.pathname.slice(1));
    let filePath = path.resolve(rendererRoot, requestedPath);
    if (!filePath.startsWith(path.resolve(rendererRoot))) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(rendererRoot, "index.html");
    try {
      response.writeHead(200, {
        "Content-Type": contentType(filePath),
        "Cache-Control": filePath.endsWith("index.html") ? "no-cache" : "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      });
      fs.createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(500).end("Odin’s Glasses could not load");
    }
  });

  return new Promise((resolve, reject) => {
    localServer.once("error", reject);
    localServer.listen(0, "127.0.0.1", () => {
      const address = localServer.address();
      resolve(`http://127.0.0.1:${address.port}/`);
    });
  });
}

function createWindow(appUrl) {
  const state = loadWindowState();
  const window = new BrowserWindow({
    show: process.env.ODINS_GLASSES_SMOKE_TEST !== '1',
    title: "Odin’s Glasses",
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: "#f5efe5",
    icon: path.join(__dirname, "assets", "icon-512.png"),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  if (state.maximized) window.maximize();
  const localOrigin = new URL(appUrl).origin;
  appearanceOrigin = localOrigin;

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (new URL(url).origin === localOrigin) return { action: "allow" };
    const trustedUrl = trustedExternalUrl(url);
    if (trustedUrl) void shell.openExternal(trustedUrl);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (new URL(url).origin !== localOrigin) {
      event.preventDefault();
      const trustedUrl = trustedExternalUrl(url);
      if (trustedUrl) void shell.openExternal(trustedUrl);
    }
  });

  window.on("close", () => saveWindowState(window));
  window.loadURL(appUrl);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const window = BrowserWindow.getAllWindows()[0];
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });

  app.whenReady().then(async () => {
    configurePersistentCache(path.join(app.getPath('userData'), 'data-cache'));
    Menu.setApplicationMenu(null);
    const appUrl = await startLocalServer();
    createWindow(appUrl);
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow(appUrl);
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (localServer) localServer.close();
});
