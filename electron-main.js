const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")
const fs = require("fs")

const isDev = !app.isPackaged
let mainWindow

const resolveResourcePath = (...segments) => {
  if (isDev) {
    return path.join(__dirname, ...segments)
  }
  return path.join(process.resourcesPath, "app", ...segments)
}

function createWindow() {
  const iconPath = resolveResourcePath("public", "icon.ico")

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: resolveResourcePath("preload.js"),
    },
  })

  const targetUrl = isDev
    ? process.env.ELECTRON_START_URL || "http://localhost:3000"
    : "https://pos.duka.plus/"; // hosted POS app

  mainWindow.loadURL(targetUrl)
}

const prepareApp = async () => {
  try {
    if (isDev) {
      console.log("[DukaPlus] Dev mode - expecting external Next.js server.")
      createWindow()
      return
    }

    console.log("[DukaPlus] Production mode - loading hosted POS app...")
    createWindow()
  } catch (error) {
    console.error("[DukaPlus] Failed to initialize application:", error)
    app.quit()
  }
}

app.whenReady().then(prepareApp)

const stopServer = () => {
  // No embedded server in this configuration – nothing to stop.
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    stopServer()
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on("will-quit", stopServer)

ipcMain.handle("get-offline-data", async () => {
  return { success: true }
})
