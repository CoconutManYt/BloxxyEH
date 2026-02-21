const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron')
const path = require('path')
const fs = require('fs')
const { execFile } = require('child_process')

let win
let currentShortcut = null

const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json')

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
      return JSON.parse(raw)
    }
  } catch (err) {
    console.error('Failed to load settings:', err)
  }
  return null
}

function saveSettings(data) {
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('Failed to save settings:', err)
  }
}

function createWindow() {
  win = new BrowserWindow({
    titleBarStyle: 'hidden',
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.loadFile(path.join(__dirname, 'index.html'))
}

// Window controls
ipcMain.on('minimize-window', () => win?.minimize())
ipcMain.on('close-window', () => win?.close())
ipcMain.on('toggle-maximize', () => {
  if (!win) return
  win.isMaximized() ? win.unmaximize() : win.maximize()
})

// Screen size
ipcMain.handle('get-screen-size', () => {
  const { width, height } = screen.getPrimaryDisplay().size
  return { width, height }
})

// Run EXE
ipcMain.handle('run-exe', (_, exePath, args = []) =>
  new Promise((resolve, reject) => {
    execFile(exePath, args, (err, stdout, stderr) => {
      if (err) reject(err)
      else resolve({ stdout, stderr })
    })
  })
)

// Settings IPC
ipcMain.on('save-all-options', (event, options) => {
  saveSettings(options)
  event.sender.send('options-saved')
})

ipcMain.handle('load-all-options', () => loadSettings())

// App lifecycle
app.whenReady().then(() => {
  createWindow()

  ipcMain.on('register-keybind', (event, key, responseChannel) => {
  if (!key) return
  globalShortcut.unregister(key)
  const success = globalShortcut.register(key, () => {
    event.sender.send(responseChannel)
  })
  if (!success) console.error('Failed to register shortcut:', key, responseChannel)
})

  app.on('will-quit', () => globalShortcut.unregisterAll())
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// exec

const { exec } = require('child_process')

ipcMain.on('exec-cmd', (_, command) => {
  exec(command, (err) => {
    if (err) console.error('exec error:', err)
  })
})