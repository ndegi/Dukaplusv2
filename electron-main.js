const { app, BrowserWindow, ipcMain } = require("electron");
const isDev = require("electron-is-dev");
const path = require("path");
const http = require("http");
const fs = require("fs");
const { createServer } = require("http-server");

let mainWindow;
let server;

function startServer() {
  const distPath = path.join(__dirname, ".next/standalone/public");

  if (!isDev && fs.existsSync(distPath)) {
    server = http.createServer((req, res) => {
      const url = req.url === "/" ? "/index.html" : req.url;
      const filePath = path.join(distPath, url);

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(fs.readFileSync(path.join(distPath, "index.html")));
          return;
        }

        const ext = path.extname(filePath);
        const contentType =
          ext === ".js"
            ? "application/javascript"
            : ext === ".css"
            ? "text/css"
            : "text/html";

        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      });
    });

    server.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const startUrl = isDev ? "http://localhost:3000" : "http://localhost:3000";

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", () => {
  if (!isDev) {
    startServer();
  }
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (server) {
      server.close();
    }
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for offline functionality
ipcMain.handle("get-offline-data", async () => {
  // Return cached data for offline mode
  return { success: true };
});
