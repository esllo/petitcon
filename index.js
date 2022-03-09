const { app, BrowserWindow, ipcMain, screen, Tray, Menu, dialog, protocol } = require('electron')
const path = require('path')
const { IPC_REQUEST_FOCUS, IPC_RESIZE, IPC_DIALOG, IPC_SHOW_MENU, IPC_MOVE, ELECTRON_WINDOW_ALL_CLOSED, ELECTRON_SECOND_INSTANCE, CUSTOM_FILE_EXTENSION, ALWAYS_ON_TOP_LEVEL, IPC_THROW, IPC_THROW_FAR, IPC_MOVE_MONITOR, IPC_STOP, IPC_LAUNCH, NUMBER, IPC_MOUSE_IGNORE } = require('./src/constants')
const { startServer } = require('./src/server')

let windows = {}
let sizes = {}
let tray = null
let id = 0
let windowCount = 0;
let maxCount = 10
let sizeString
let validDisplays
let server = null
// 'screen-saver'

function init() {
  const lock = app.requestSingleInstanceLock()
  if (!lock) {
    app.quit()
    return
  } else {
    app.commandLine.appendSwitch('high-dpi-support', 1)
    app.commandLine.appendSwitch('force-device-scale-factor', 1)
    app.on(ELECTRON_SECOND_INSTANCE, (e, argv) => {
      const ptc = argv.find((arg) => arg.endsWith(CUSTOM_FILE_EXTENSION))
      createWindow(ptc)
    })
  }

  function initWindow() {
    protocol.registerFileProtocol('*', (req, cb) => { });
    const allDisplays = screen.getAllDisplays()
    validDisplays = allDisplays.sort(({ workArea: a }, { workArea: b }) => a.x < b.x ? -1 : 1)
    validDisplays.splice(2, validDisplays.length - 2)


    sizeString = validDisplays.reduce((prev, { scaleFactor, workArea }) => {
      const { width, height, x } = workArea
      const sWidth = parseInt(width * scaleFactor)
      const sHeight = parseInt(height * scaleFactor)
      return prev + `&${sWidth}-${sHeight}-${x}-${scaleFactor}`
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
            click: bindSendAll(IPC_THROW)
          },
          {
            label: '멀리 날리기',
            click: bindSendAll(IPC_THROW_FAR)
          },
          ...(validDisplays.length > 1 ? [
            {
              label: '주 모니터로 옮기기',
              click: bindSendAll(IPC_MOVE_MONITOR, 0)
            },
            {
              label: '보조 모니터로 옮기기',
              click: bindSendAll(IPC_MOVE_MONITOR, 1)
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
            window.setAlwaysOnTop(true, ALWAYS_ON_TOP_LEVEL)
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
      const uuid = Object.keys(windows)[0]
      removeWindow(uuid)
    } else {
      dialog.showMessageBox({
        message: '최소 한 마리는 돌아다녀야 해요'
      })
    }
  }

  function removeWindow(uuid) {
    windows[uuid].webContents.send(IPC_STOP)
    windows[uuid].close()
    windows[uuid] = null
    delete windows[uuid]

    windowCount -= 1

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
    })
    window.setFocusable(false)
    // window.setContentProtection(true)
    window.setAlwaysOnTop(true, ALWAYS_ON_TOP_LEVEL)
    window.webContents.on('did-finish-load', () => {
      window.show()

      windows[uuid] = window
      sizes[uuid] = [100, 100]

      const targetResource = resource || process.argv.splice(1, 1)[0]
      window.webContents.send(IPC_LAUNCH, targetResource, app.getAppPath())
    })
    if (process.env.NODE_ENV === 'development') {
      window.webContents.openDevTools({
        mode: 'detach'
      })
    }

    window.loadFile('./src/index.html', { hash: uuid + sizeString })
  }

  ipcMain.on(IPC_MOVE, (e, data) => {
    const { uuid, x, y } = data
    if (windows[uuid]) {
      try {
        const [width, height] = sizes[uuid]
        windows[uuid].setBounds({
          x: parseInt(x), y: parseInt(y),
          width,
          height,
        })
      } catch (e) {
        console.log(e)
      }
    }
  })

  const resizeValues = [50, 80, 100, 120]

  function buildMenu({ uuid, name }) {
    const menu = Menu.buildFromTemplate([
      {
        label: `PetitCon - ${name}`,
        type: 'normal',
        enabled: false,
      },
      {
        type: 'separator'
      },
      {
        type: 'submenu',
        label: '크기 변경',
        submenu: resizeValues.map((size) => ({
          type: 'normal',
          label: `${size}%`,
          click: bindResizeWindow(uuid, size),
        }))
      },
      {
        type: 'separator'
      },
      {
        label: '집 보내기',
        click: bindRemoveWindow(uuid)
      }
    ])
    return menu
  }

  ipcMain.on(IPC_SHOW_MENU, (e, data) => {
    const contextMenu = buildMenu(data)
    contextMenu.popup()
  })

  ipcMain.on(IPC_DIALOG, (e, data) => {
    dialog.showMessageBox(data)
  })

  ipcMain.on(IPC_RESIZE, (e, { uuid, size }) => {
    if (windows[uuid]) {
      if (typeof size === NUMBER) {
        sizes[uuid] = [size, size]
        windows[uuid].setBounds({ width: size, height: size })
      } else if (typeof size.width === NUMBER && typeof size.height === NUMBER) {
        sizes[uuid] = [size.width, size.height]
        windows[uuid].setBounds(size)
      }
    }
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

  function bindRemoveWindow(uuid) {
    return () => removeWindow(uuid)
  }

  function bindResizeWindow(uuid, size) {
    return () => windows[uuid].webContents.send(IPC_RESIZE, size)
  }

  ipcMain.on(IPC_REQUEST_FOCUS, (e, uuid) => {
    if (windows[uuid]) {
      windows[uuid].setAlwaysOnTop(false)
      windows[uuid].setAlwaysOnTop(true, ALWAYS_ON_TOP_LEVEL)
    }
  })

  ipcMain.on(IPC_MOUSE_IGNORE, (e, { uuid, ignore }) => {
    if (windows[uuid]) {
      if (ignore) {
        windows[uuid].setIgnoreMouseEvents(true, { forward: true })
      } else {
        windows[uuid].setIgnoreMouseEvents(false)
      }
    }
  })

  app.whenReady().then(initWindow)
  app.on(ELECTRON_WINDOW_ALL_CLOSED, () => {
    if (!server) {
      app.quit()
    }
  })
}

init()