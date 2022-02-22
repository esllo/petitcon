const { app, BrowserWindow, ipcMain, screen, Tray, Menu, dialog, protocol } = require('electron')
const path = require('path')

let windows = {}
let tray = null
let ignoreClick = false
let id = 0
let maxCount = 10
let sizeString
let validDisplays

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
      label: 'Desktop Owl - ESLLO',
      type: 'normal',
      enabled: false,
    },
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
          click: throwAll
        },
        {
          label: '멀리 날리기',
          click: throwFallAll
        },
        ...(validDisplays.length > 1 ? [
          {
            label: '주 모니터로 옮기기',
            click: () => moveToMonitor(0)
          },
          {
            label: '보조 모니터로 옮기기',
            click: () => moveToMonitor(1)
          }
        ] : []),
        {
          label: '정렬하기',
          submenu: [
            {
              label: '왼쪽으로 정렬',
              click: () => changeAlign('left')
            },
            {
              label: '오른쪽으로 정렬',
              click: () => changeAlign('right')
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
      checked: ignoreClick,
      click: changeIgnoreClick
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

function reduceWindow() {
  if (Object.keys(windows).length > 1) {
    const key = Object.keys(windows)[0]
    windows[key].webContents.send('stop')
    windows[key].close()
    windows[key] = null

    delete windows[key]
  } else {
    dialog.showMessageBox({
      message: '최소 한 마리는 돌아다녀야 해요'
    })
  }
}

function createWindow() {
  if (Object.keys(windows).length > maxCount) {
    return
  }
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
      backgroundThrottling: false,
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
    window.webContents.send('launch', process.argv.splice(1, 1))
  })
  if (id === 1) {
    window.webContents.openDevTools({
      mode: 'detach'
    })
  }

  windows[uuid] = window

  window.loadFile('./public/index.html', { hash: uuid + sizeString })
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

function mapWindows(func) {
  Object.values(windows).map(func)
}

function sendAll(...args) {
  mapWindows((window) => window.webContents.send(...args))
}

function throwAll() {
  sendAll('throw')
}
function throwFallAll() {
  sendAll('throwFall')
}

function moveToMonitor(monitor) {
  sendAll('moveMonitor', monitor)
}

function changeAlign(align) {
  sendAll('align', align)
}

function changeIgnoreClick(e) {
  const { checked } = e
  if (checked) {
    mapWindows((window) => window.setIgnoreMouseEvents(true))
    ignoreClick = true
  } else {
    mapWindows((window) => window.setIgnoreMouseEvents(false))
  }
}

app.on('will-finish-launching', () => {
  app.on('open-file', (e, file) => {

  })
})
app.whenReady().then(initWindow)
app.on('window-all-closed', app.quit)