const { ipcRenderer } = require('electron')
const { uuid, widths, heights, xes, totalWidth } = require('./hash-parser')
const fs = require('fs')
const jszip = require('jszip')
const owl = require('../src/owl')


const THROW_DENOM = 30
const FILES = ['climb-0.png', 'climb-1.png', 'fall-0.png', 'fall-1.png', 'sit-0.png', 'stand-0.png', 'tilt-0.png', 'tilt-1.png', 'walk-0.png', 'walk-1.png', 'walk-2.png', 'walk-3.png']

const img = document.getElementById('img')

const { instance, clearBehavior, setFall, setRandomPosition, getRangeRand, setStand, launch } = owl(img, widths, heights, xes, totalWidth)
instance.tickHandler = sendMoveEvent

window.onmousedown = () => {
  instance.clicked = true
  clearBehavior()
  instance.currentAction = 'fall'
}
window.onmouseup = () => {
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
    setFall()
  }
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
    if (file.path.endsWith('.doa')) {
      loadDoa(file.path)
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
})

function throwAll(dist) {
  clearBehavior()
  let delX = getRangeRand(dist * -1, dist) * 2
  let delY = getRangeRand(-10, -15)
  instance.fallAcceleration = delY
  delY += delY
  instance.velX = delX
  instance.direction = delX < 0 ? 1 : -1
  setFall()
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
  setFall()
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
  setStand(120)
})

function loadOwl() {
  FILES.forEach((file) => {
    const buffer = fs.readFileSync(`${instance.appPath}/res/${file}`)
    instance.images[file] = `data:image/png;base64, ${buffer.toString('base64')}`
  })
}

function loadDoa(path) {
  fs.readFile(path, (err, data) => {
    jszip.loadAsync(data).then((zip) => {
      const notExists = Object.keys(zip.files).some((filename) => !FILES.includes(filename))
      if (notExists) {
        loadOwl()
      } else {
        // load 
        FILES.forEach(async (file) => {
          const base64 = await zip.files[file].async('base64')
          instance.images[file] = `data:image/png;base64, ${base64}`
        })
      }
    })
  })
}

ipcRenderer.on('launch', (e, path, appPath) => {
  instance.appPath = appPath
  if (path && path !== '.') {
    loadDoa(path)
  } else {
    loadOwl()
  }
  launch()
})
