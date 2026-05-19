const { app, BrowserWindow, ipcMain, screen } = require('electron')
const fs = require('fs')
const path = require('path')

let win = null

const windowStatePath = path.join(app.getPath('userData'), 'window-state.json')

function readWindowState() {
  const defaultState = {
    width: 500,
    height: 380
  }

  try {
    if (!fs.existsSync(windowStatePath)) {
      return defaultState
    }

    const raw = fs.readFileSync(windowStatePath, 'utf-8')
    const state = JSON.parse(raw)

    if (
      typeof state !== 'object' ||
      typeof state.width !== 'number' ||
      typeof state.height !== 'number'
    ) {
      return defaultState
    }

    return {
      width: state.width,
      height: state.height,
      x: typeof state.x === 'number' ? state.x : undefined,
      y: typeof state.y === 'number' ? state.y : undefined
    }
  } catch (error) {
    console.error('读取窗口状态失败：', error)
    return defaultState
  }
}

function saveWindowState() {
  if (!win) return

  try {
    const [x, y] = win.getPosition()
    const [width, height] = win.getSize()

    const state = { x, y, width, height }
    fs.writeFileSync(windowStatePath, JSON.stringify(state, null, 2), 'utf-8')
  } catch (error) {
    console.error('保存窗口状态失败：', error)
  }
}

function getSafeWindowBounds(state) {
  const displays = screen.getAllDisplays()

  const windowWidth = state.width || 500
  const windowHeight = state.height || 380

  if (typeof state.x !== 'number' || typeof state.y !== 'number') {
    return {
      width: windowWidth,
      height: windowHeight
    }
  }

  const isVisibleOnAnyDisplay = displays.some((display) => {
    const { x, y, width, height } = display.workArea

    const visibleWidth = 80
    const visibleHeight = 80

    const windowRight = state.x + visibleWidth
    const windowBottom = state.y + visibleHeight
    const displayRight = x + width
    const displayBottom = y + height

    return (
      windowRight > x &&
      state.x < displayRight &&
      windowBottom > y &&
      state.y < displayBottom
    )
  })

  if (!isVisibleOnAnyDisplay) {
    return {
      width: windowWidth,
      height: windowHeight
    }
  }

  return {
    x: state.x,
    y: state.y,
    width: windowWidth,
    height: windowHeight
  }
}

function createWindow() {
  const savedState = readWindowState()
  const safeBounds = getSafeWindowBounds(savedState)

  win = new BrowserWindow({
    ...safeBounds,
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

  win.on('move', () => {
    saveWindowState()
  })

  win.on('close', () => {
    saveWindowState()
  })

  win.on('blur', () => {
    if (!win || win.isDestroyed()) return
    win.webContents.send('window-blur')
  })
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
    saveWindowState()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})