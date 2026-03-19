const { app, BrowserWindow } = require('electron');

let mainWindow;

function createWindow() {
  console.log('开始创建窗口');

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: true,
    backgroundColor: '#ffffff'
  });

  console.log('窗口创建完成');

  mainWindow.loadURL('data:text/html;charset=UTF-8,<h1>Hello Mind Ball</h1>');

  mainWindow.on('closed', () => {
    console.log('窗口已关闭');
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  console.log('Electron 已准备好');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('所有窗口都关闭了');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});