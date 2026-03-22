const { app, BrowserWindow, ipcMain } = require('electron')

let win = null

function createWindow() {
  win = new BrowserWindow({
    width: 460,
    height: 340,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  let isDragging = false
  let startMouseX = 0
  let startMouseY = 0
  let startWinX = 0
  let startWinY = 0

  ipcMain.on('drag-start', (event, mousePosition) => {
    if (!win) return

    isDragging = true
    startMouseX = mousePosition.screenX
    startMouseY = mousePosition.screenY

    const [winX, winY] = win.getPosition()
    startWinX = winX
    startWinY = winY
  })

  ipcMain.on('drag-move', (event, mousePosition) => {
    if (!win || !isDragging) return

    const deltaX = mousePosition.screenX - startMouseX
    const deltaY = mousePosition.screenY - startMouseY

    win.setPosition(startWinX + deltaX, startWinY + deltaY)
  })

  ipcMain.on('drag-end', () => {
    isDragging = false
  })
})

app.on('window-all-closed', () => {
  app.quit()
})