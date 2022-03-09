const { uuid, widths, heights, xes, totalWidth } = require('./hash-parser')
const fs = require('fs')
const jszip = require('jszip')
const pet = require('./pet')
const owlJson = require('../res/owl.json')
const ptcJson = require('../res/ptc.json')
const path = require('path')
const { ipcSend, bind, handleIpc } = require('./ipc')
const { handleEvent } = require('./eventHandler')
const { BASE64_META, OWL_FILES, NUMBER, CUSTOM_FILE_EXTENSION, BEHAVIOR_JSON, FILE_NOT_VALID, IPC_DIALOG, IPC_LAUNCH, CURRENT_DIRECTORY, IPC_RESIZE, IPC_MOUSE_IGNORE } = require('./constants')
const img = document.getElementById('img')
const canvas = document.getElementById('canvas')
const context = canvas.getContext('2d')

const myPet = pet(canvas, widths, heights, xes, totalWidth, owlJson)
const { instance, launch, parseData, addTickHandler } = myPet

function render(requireRender) {
  if (requireRender && instance.image) {
    const { width, height } = instance.size
    canvas.width = width
    canvas.height = height
    context.clearRect(0, 0, width, height)
    context.drawImage(instance.image, 0, 0, width, height)
  }
}

addTickHandler(render)

function checkResize({ size }) {
  if (size) {
    if (typeof size === NUMBER) {
      ipcSend(IPC_RESIZE, { uuid, width: size, height: size })
    } else if (typeof size.width === NUMBER && typeof size.height === NUMBER) {
      const { width, height } = size
      ipcSend(IPC_RESIZE, { uuid, width, height })
    }
  }
}

function loadOwl() {
  OWL_FILES.forEach((file) => {
    const buffer = fs.readFileSync(`${instance.appPath}/res/${file}`)
    const image = new Image()
    image.src = `${BASE64_META}${buffer.toString('base64')}`
    instance.images[file] = image
  })
  checkResize(owlJson)
}

function loadPtc(filepath) {
  let filename = path.basename(filepath)
  if (filename.endsWith(CUSTOM_FILE_EXTENSION)) {
    filename = filename.substring(0, filename.length - CUSTOM_FILE_EXTENSION.length)
  }
  fs.readFile(filepath, (err, data) => {
    jszip.loadAsync(data).then(async (zip) => {
      let json = ptcJson
      if (zip.files[BEHAVIOR_JSON]) {
        const jsonText = await zip.files[BEHAVIOR_JSON].async('text')
        try {
          const jsonData = JSON.parse(jsonText)
          json = jsonData
        } catch (e) {
          console.error(e)
        }
      }
      if (!json.name) {
        json.name = filename
      }
      const requiredFiles = json.behaviors.reduce((prev, { action, duration }) => {
        let files = duration.map((_, i) => `${action}-${i}.png`)
        if (files.length === 0) {
          files = [`${action}-0.png`]
        }
        return [...prev, ...files]
      }, [])
      const zipFiles = Object.keys(zip.files).filter((file) => file.endsWith('.png'))
      const zipCheck = zipFiles.find((file) => !requiredFiles.includes(file))
      const listCheck = requiredFiles.find((file) => !zipFiles.includes(file))
      if (zipCheck || listCheck) {
        loadOwl()
        ipcSend(IPC_DIALOG, {
          message: FILE_NOT_VALID
        })
      } else {
        // load 
        requiredFiles.forEach(async (file) => {
          const base64 = await zip.files[file].async('base64')
          const image = new Image()
          image.src = `${BASE64_META}${base64}`
          instance.images[file] = image
        })
        checkResize(json)
        parseData(json)
      }
    })
  })
}

function handleMouseMove(x, y) {
  const alpha = context.getImageData(x, y, 1, 1).data[3]
  ipcSend(IPC_MOUSE_IGNORE, {
    uuid,
    ignore: alpha === 0,
  })
}

handleIpc(myPet)
handleEvent(myPet, loadPtc, handleMouseMove)

bind(IPC_LAUNCH, (e, path, appPath) => {
  instance.appPath = appPath
  if (path && path !== CURRENT_DIRECTORY) {
    loadPtc(path)
  } else {
    loadOwl()
  }
  launch()
})