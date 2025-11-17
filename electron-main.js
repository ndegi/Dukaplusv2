const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")
const { spawn } = require("child_process")
const fs = require("fs")

let mainWindow
let serverProcess = null

function startServer() {
  console.log("[DukaPlus] Starting embedded server...")
  
  const serverPath = path.join(process.resourcesPath, "app", ".next", "standalone", "server.js")
  
  if (!fs.existsSync(serverPath)) {
    console.error("[DukaPlus] Server file not found at:", serverPath)
    console.error("[DukaPlus] Please rebuild with: npm run dist:win")
    return false
  }

  console.log("[DukaPlus] Server found at:", serverPath)

  serverProcess = spawn("node", [serverPath], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: "3000",
      HOSTNAME: "localhost",
    },
    cwd: path.join(process.resourcesPath, "app", ".next", "standalone"),
  })

  serverProcess.stdout.on("data", (data) => {
    console.log(`[Server] ${data}`)
  })

  serverProcess.stderr.on("data", (data) => {
    console.error(`[Server] ${data}`)
  })

  serverProcess.on("close", (code) => {
    console.log(`[Server] Process exited with code ${code}`)
  })

  return true
}

function createWindow() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "app", "public", "icon.ico")
    : path.join(__dirname, "public", "icon.ico")

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  })

  const loadApp = (retries = 3) => {
    mainWindow.loadURL("http://localhost:3000").catch((err) => {
      console.error("[DukaPlus] Failed to load app:", err.message)
      if (retries > 0) {
        console.log(`[DukaPlus] Retrying... (${retries} attempts left)`)
        setTimeout(() => loadApp(retries - 1), 2000)
      }
    })
  }
  
  loadApp()

  if (app.isPackaged) {
    mainWindow.webContents.openDevTools()
  }
}

app.whenReady().then(() => {
  if (app.isPackaged) {
    console.log("[DukaPlus] Running in packaged mode - starting embedded server")
    if (startServer()) {
      setTimeout(() => {
        createWindow()
      }, 3000)
    } else {
      console.error("[DukaPlus] Failed to start server")
      app.quit()
    }
  } else {
    console.log("[DukaPlus] Running in dev mode - connecting to external server")
    createWindow()
  }
})

app.on("window-all-closed", () => {
  if (serverProcess) {
    serverProcess.kill()
  }
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on("will-quit", () => {
  if (serverProcess) {
    serverProcess.kill()
  }
})

ipcMain.handle("get-offline-data", async () => {
  return { success: true }
})
