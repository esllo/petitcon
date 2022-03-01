const { app, BrowserWindow, ipcMain, screen, Tray, Menu, dialog, protocol } = require('electron')
const path = require('path')
const { startServer } = require('./src/server')

let windows = {}
let tray = null
let id = 0
let windowCount = 0;
let maxCount = 10
let sizeString
let validDisplays
let server = null


const lock = app.requestSingleInstanceLock()
if (!lock) {
  app.quit()
  return
} else {
  app.on('second-instance', (e, argv) => {
    const ptc = argv.find((arg) => arg.endsWith('.ptc'))
    createWindow(ptc)
  })
}

function initWindow() {
  protocol.registerFileProtocol('*', (req, cb) => { });
  const allDisplays = screen.getAllDisplays()
  validDisplays = allDisplays.sort(({ workArea: a }, { workArea: b }) => a.x < b.x ? -1 : 1)
  validDisplays.splice(2, validDisplays.length - 2)


  sizeString = validDisplays.reduce((prev, curr) => {
    const { width, height, x } = curr.workArea
    return prev + `&${width}-${height}-${x}`
  }, '')


  createWindow()

  tray = new Tray(path.join(app.getAppPath(), '/res/icon.png'))
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'PetitCon - ESLLO',
      type: 'normal',
      enabled: false,
    },
    {
      type: 'separator'
    },
    // {
    //   type: 'checkbox',
    //   label: '스트리머용 서버 실행',
    //   click: () => {
    //     if (!server) {
    //       server = startServer(app.getAppPath())
    //       new Array(windowCount).fill(0).forEach(() => reduceWindow(true))
    //     } else {
    //       server.close()
    //       server = null
    //       if (windowCount < 1) {
    //         createWindow()
    //       }
    //     }
    //   },
    //   checked: !!server
    // },
    {
      type: 'separator'
    },
    {
      type: 'submenu',
      label: '올뺌 데려오기',
      submenu: [
        {
          type: 'normal',
          label: '한 마리 데려오기',
          click: createWindow,
        },
        {
          type: 'normal',
          label: '다섯 마리 데려오기',
          click: () => {
            (new Array(5).fill(0).forEach(createWindow))
          },
        },
      ]
    },
    {
      label: '올뺌 집 보내기',
      type: 'submenu',
      submenu: [
        {
          type: 'normal',
          label: '한 마리 집 보내기',
          click: reduceWindow,
        },
        {
          type: 'normal',
          label: '다섯 마리 집 보내기',
          click: () => {
            (new Array(5).fill(0).forEach(reduceWindow))
          },
        },
      ]
    },
    {
      label: '액션',
      submenu: [
        {
          label: '날리기',
          click: bindSendAll('throw')
        },
        {
          label: '멀리 날리기',
          click: bindSendAll('throwFall')
        },
        ...(validDisplays.length > 1 ? [
          {
            label: '주 모니터로 옮기기',
            click: bindSendAll('moveMonitor', 0)
          },
          {
            label: '보조 모니터로 옮기기',
            click: bindSendAll('moveMonitor', 1)
          }
        ] : []),
        {
          label: '정렬하기',
          submenu: [
            {
              label: '왼쪽으로 정렬',
              click: bindSendAll('align', 'left')
            },
            {
              label: '오른쪽으로 정렬',
              click: bindSendAll('align', 'right')
            }
          ]
        }
      ]
    },
    {
      type: 'separator'
    },
    {
      label: '클릭 무시하기',
      type: 'checkbox',
      click: bindWebPreference('setIgnoreMouseEvents')
    },
    {
      label: '컨텐츠 보호 걸기',
      type: 'checkbox',
      click: bindWebPreference('setContentProtection')
    },
    {
      label: '맨 앞으로 보내기',
      type: 'normal',
      click: () => {
        mapWindows((window) => {
          window.setAlwaysOnTop(false)
          window.setAlwaysOnTop(true)
        })
      }
    },
    {
      type: 'separator'
    },
    {
      label: '종료',
      type: 'normal',
      click: () => {
        mapWindows((window) => window.close())
        app.quit()
      }
    }
  ])
  tray.setToolTip('Desktop Owl - esllo')
  tray.setContextMenu(contextMenu)
}

function reduceWindow(forced = false) {
  if (Object.keys(windows).length > 1 || forced) {
    const key = Object.keys(windows)[0]
    windows[key].webContents.send('stop')
    windows[key].close()
    windows[key] = null

    delete windows[key]
    windowCount -= 1
  } else {
    dialog.showMessageBox({
      message: '최소 한 마리는 돌아다녀야 해요'
    })
  }
}

function createWindow(resource) {
  if (Object.keys(windows).length > maxCount) {
    return
  }
  windowCount += 1
  const uuid = `id-${id++}`
  const window = new BrowserWindow({
    width: 100,
    height: 100,
    resizable: false,
    frame: false,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
    transparent: true,
    alwaysOnTop: true,
  })
  window.setFocusable(false)
  // window.setContentProtection(true)
  window.setAlwaysOnTop(true)
  window.webContents.on('did-finish-load', () => {
    window.show()

    windows[uuid] = window

    const targetResource = resource || process.argv.splice(1, 1)[0]
    window.webContents.send('launch', targetResource, app.getAppPath())
  })
  if (process.env.NODE_ENV === 'development') {
    window.webContents.openDevTools({
      mode: 'detach'
    })
  }

  window.loadFile('./src/index.html', { hash: uuid + sizeString })
}

ipcMain.on('move', (e, data) => {
  const { uuid, x, y } = data
  if (windows[uuid]) {
    try {
      windows[uuid].setPosition(parseInt(x), parseInt(y))
    } catch (e) {
      console.log(e)
    }
  }
})

ipcMain.on('dialog', (e, data) => {
  dialog.showMessageBox(data)
})

function mapWindows(func) {
  Object.values(windows).map(func)
}

function sendAll(...args) {
  mapWindows((window) => window.webContents.send(...args))
}

function bindSendAll(...args) {
  return () => sendAll(...args)
}

function bindWebPreference(key) {
  return ({ checked }) => mapWindows((window) => window[key](checked))
}

app.whenReady().then(initWindow)
app.on('window-all-closed', () => {
  if (!server) {
    app.quit()
  }
})
