const { uuid, widths, heights, xes, totalWidth } = require('./hash-parser')
const fs = require('fs')
const jszip = require('jszip')
const pet = require('./pet')
const owlJson = require('../res/owl.json')
const ptcJson = require('../res/ptc.json')
const path = require('path')
const { ipcSend, bind, handleIpc } = require('./ipc')
const { handleEvent } = require('./eventHandler')
const { BASE64_META, OWL_FILES, NUMBER, CUSTOM_FILE_EXTENSION, BEHAVIOR_JSON, FILE_NOT_VALID, IPC_DIALOG, IPC_LAUNCH, CURRENT_DIRECTORY, IPC_RESIZE } = require('./constants')
const img = document.getElementById('img')

const myPet = pet(img, widths, heights, xes, totalWidth, owlJson)
const { instance, launch, parseData } = myPet

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
    instance.images[file] = `${BASE64_META}${buffer.toString('base64')}`
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
          instance.images[file] = `${BASE64_META}${base64}`
        })
        checkResize(json)
        parseData(json)
      }
    })
  })
}

handleIpc(myPet)
handleEvent(myPet, loadPtc)

bind(IPC_LAUNCH, (e, path, appPath) => {
  instance.appPath = appPath
  if (path && path !== CURRENT_DIRECTORY) {
    loadPtc(path)
  } else {
    loadOwl()
  }
  launch()
})