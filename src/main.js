const { uuid, widths, heights, xes, totalWidth } = require('./hash-parser')
const fs = require('fs')
const jszip = require('jszip')
const pet = require('./pet')
const owlJson = require('../res/owl.json')
const ptcJson = require('../res/ptc.json')
const path = require('path')
const { ipcSend, bind, handleIpc } = require('./ipc')
const { handleEvent } = require('./eventHandler')

const FILES = ['climb-0.png', 'climb-1.png', 'fall-0.png', 'fall-1.png', 'sit-0.png', 'stand-0.png', 'tilt-0.png', 'tilt-1.png', 'walk-0.png', 'walk-1.png', 'walk-2.png', 'walk-3.png']

const img = document.getElementById('img')

const myPet = pet(img, widths, heights, xes, totalWidth, owlJson)
const { instance, launch, parseData } = myPet

function checkResize({ size }) {
  if (size) {
    if (typeof size === 'number') {
      ipcSend('resize', { uuid, width: size, height: size })
    } else if (typeof size.width === 'number' && typeof size.height === 'number') {
      const { width, height } = size
      ipcSend('resize', { uuid, width, height })
    }
  }
}

function loadOwl() {
  FILES.forEach((file) => {
    const buffer = fs.readFileSync(`${instance.appPath}/res/${file}`)
    instance.images[file] = `data:image/png;base64, ${buffer.toString('base64')}`
  })
  checkResize(owlJson)
}

function loadPtc(filepath) {
  let filename = path.basename(filepath)
  if (filename.endsWith('.ptc')) {
    filename = filename.substring(0, filename.length - 4)
  }
  fs.readFile(filepath, (err, data) => {
    jszip.loadAsync(data).then(async (zip) => {
      let json = ptcJson
      if (zip.files['behaviors.json']) {
        const jsonText = await zip.files['behaviors.json'].async('text')
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
        ipcSend('dialog', {
          message: '유효하지 않은 doa 파일이에요'
        })
      } else {
        // load 
        requiredFiles.forEach(async (file) => {
          const base64 = await zip.files[file].async('base64')
          instance.images[file] = `data:image/png;base64, ${base64}`
        })
        checkResize(json)
        parseData(json)
      }
    })
  })
}

handleIpc(myPet)
handleEvent(myPet, loadPtc)

bind('launch', (e, path, appPath) => {
  instance.appPath = appPath
  if (path && path !== '.') {
    loadPtc(path)
  } else {
    loadOwl()
  }
  launch()
})