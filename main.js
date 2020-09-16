const { app, BrowserWindow, Tray, dialog, ipcMain } = require('electron')
const path = require('path')

let win

app.commandLine.appendSwitch('no-proxy-server')

async function timeCheck (complete) {
  const timeSync = require('ntp-time-sync').default.getInstance({
    // list of NTP time servers, optionally including a port (defaults to 123)
    servers: [
      'ntp.aliyun.com',
      'time.apple.com',
      'time.windows.com',
      'pool.ntp.org'
    ],

    // required amount of valid samples in order to calculate the time
    sampleCount: 3,

    // amount of time in milliseconds to wait for a single NTP response
    replyTimeout: 1500,

    // defaults as of RFC5905
    ntpDefaults: {
      port: 123,
      version: 4,
      tolerance: 15e-6,
      minPoll: 4,
      maxPoll: 17,
      maxDispersion: 16,
      minDispersion: 0.005,
      maxDistance: 1,
      maxStratum: 16,
      precision: -18,
      referenceDate: new Date('Jan 01 1900 GMT')
    }
  })
  const result = await timeSync.getTime()
  console.log(result.offset)
  if (result.offset > 30000) {
    dialog.showErrorBox(app.getName(), `当前时间为${result.now}\n你的本地时间与网络时间差${(result.offset / 1000).toFixed(2)}秒，使用上可能会有问题，请校准时间以修复这个问题。`)
    return
  }
  if (typeof complete === 'function') complete()
}

function init () {
  // BrowserWindow
  const width = 320
  const height = 510
  win = new BrowserWindow({
    width,
    height,
    show: false,
    resizable: false,
    frame: false,
    maximizable: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      devTools: !app.isPackaged,
      // devTools: true,
      nodeIntegration: true
    }
  })

  if (app.isPackaged) {
    // win.webContents.openDevTools()
    win.loadFile('./dist/index.html')
  } else {
    win.loadFile('./dist/index.html')
    // win.webContents.openDevTools()
  }

  win.once('ready-to-show', () => {
    win.show()
  })
  global.win = win
  // Tray
  global.tray = new Tray(path.join(__dirname, process.platform === 'darwin' ? 'assets/iconOff@2x.png' : 'assets/iconOff.ico'))
  global.tray.on('click', () => {
    win.show()
  })
  // IPC
  ipcMain.on('show', () => {
    win.show()
  })
}

//if (process.platform === 'darwin') {
// app.dock.hide()
//}

app.on('window-all-closed', () => {
  app.quit()
})

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 当运行第二个实例时,将会聚焦到myWindow这个窗口
    if (!win) return
    win.show()
  })

  app.on('ready', () => {
    timeCheck(() => {
    })
    init()
  })
}
