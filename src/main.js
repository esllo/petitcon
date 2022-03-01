const { ipcRenderer } = require('electron')
const { uuid, widths, heights, xes, totalWidth } = require('./hash-parser')
const fs = require('fs')
const jszip = require('jszip')
const owl = require('./pet')
const owlJson = require('../res/owl.json')
const ptcJson = require('../res/ptc.json')
const path = require('path')


const THROW_DENOM = 30
const FILES = ['climb-0.png', 'climb-1.png', 'fall-0.png', 'fall-1.png', 'sit-0.png', 'stand-0.png', 'tilt-0.png', 'tilt-1.png', 'walk-0.png', 'walk-1.png', 'walk-2.png', 'walk-3.png']

const img = document.getElementById('img')

const { instance, clearBehavior, setBehavior, setRandomPosition, getRangeRand, launch, parseData } = owl(img, widths, heights, xes, totalWidth, owlJson)
instance.tickHandler = sendMoveEvent

window.onmousedown = ({ buttons }) => {
  if (buttons === 1) {
    instance.clicked = true
    clearBehavior()
    instance.currentAction = 'fall'
  }
}
window.onmouseup = () => {
  if (instance.clicked) {
    for (let i = xes.length - 1; i >= 0; i--) {
      if (instance.posX > xes[i]) {
        instance.monitor = i
        break;
      }
    }
    instance.clicked = false
    clearBehavior()
    if (instance.queue.length > 5) {
      instance.queue.pop()
      instance.queue.pop()
      instance.queue.pop()
      instance.queue.pop()
      const [prevX, prevY] = instance.queue.pop()

      instance.fallAcceleration = (instance.posY - prevY) / THROW_DENOM
      instance.velX = (instance.posX - prevX) / THROW_DENOM
      instance.direction = instance.posX - prevX < 0 ? 1 : -1
      setBehavior('fall')
    }
  }
}

window.oncontextmenu = () => {
  ipcRenderer.send('showMenu', { uuid, name: instance.info.name })
}

window.onmousemove = ({ screenX, screenY }) => {
  if (instance.clicked) {
    instance.posX = Math.max(instance.fullLeft, screenX)
    instance.posY = Math.max(instance.top, screenY)
    if (instance.posX > instance.fullRight) {
      instance.posX = instance.fullRight
    }
    if (instance.posY > instance.bottom) {
      instance.posY = instance.bottom
    }
  }
}

document.body.ondragover = (e) => e.preventDefault()
document.body.ondrop = (e) => {
  e.preventDefault()
  if (e.dataTransfer.files[0]) {
    const file = e.dataTransfer.files[0]
    if (file.path.endsWith('.ptc')) {
      loadPtc(file.path)
    }
  }
}

function sendMoveEvent() {
  ipcRenderer.send('move', {
    uuid,
    x: instance.posX - instance.X_OFFSET,
    y: instance.posY - instance.Y_OFFSET,
  })
}

ipcRenderer.on('stop', () => {
  instance.stopped = true
  clearTimeout(instance.handler)
  instance.handler = null
})

function throwAll(dist) {
  clearBehavior()
  let delX = getRangeRand(dist * -1, dist) * 2
  let delY = getRangeRand(-10, -15)
  instance.fallAcceleration = delY
  delY += delY
  instance.velX = delX
  instance.direction = delX < 0 ? 1 : -1
  setBehavior('fall')()
}

ipcRenderer.on('throw', () => {
  throwAll(5)
})

ipcRenderer.on('throwFall', () => {
  throwAll(20)
})

ipcRenderer.on('moveMonitor', (e, data) => {
  instance.monitor = Number(data)
  setRandomPosition()
  setBehavior('fall')()
})

ipcRenderer.on('align', (e, data) => {
  if (data === 'left') {
    instance.posX = instance.left
    instance.posY = instance.bottom
  } else if (data === 'right') {
    instance.posX = instance.right
    instance.posY = instance.bottom
  }
  clearBehavior()
  setBehavior('stand')
})

function loadOwl() {
  FILES.forEach((file) => {
    const buffer = fs.readFileSync(`${instance.appPath}/res/${file}`)
    instance.images[file] = `data:image/png;base64, ${buffer.toString('base64')}`
  })
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
      console.log(zipFiles, requiredFiles)
      if (zipCheck || listCheck) {
        loadOwl()
        ipcRenderer.send('dialog', {
          message: '유효하지 않은 doa 파일이에요'
        })
      } else {
        // load 
        requiredFiles.forEach(async (file) => {
          const base64 = await zip.files[file].async('base64')
          instance.images[file] = `data:image/png;base64, ${base64}`
        })
        parseData(json)
      }
    })
  })
}

ipcRenderer.on('launch', (e, path, appPath) => {
  instance.appPath = appPath
  if (path && path !== '.') {
    loadPtc(path)
  } else {
    loadOwl()
  }
  launch()
})
