const { uuid } = require('./hash-parser')
const { ipcRenderer } = require("electron");

function ipcSend(name, ...args) {
  ipcRenderer.send(name, ...args)
}

function bind(name, func) {
  ipcRenderer.on(name, func)
}

function unbind(name, func) {
  ipcRenderer.off(name, func)
}

function handleIpc(pet) {
  const { instance, clearBehavior, getRangeRand, setBehavior, setRandomPosition, resizePet } = pet

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

  ipcRenderer.on('stop', () => {
    instance.stopped = true
    clearTimeout(instance.handler)
    instance.handler = null
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

  ipcRenderer.on('resize', (e, size) => {
    if (typeof size === 'number'
      || (typeof size.width === 'number' && typeof size.height === 'number')) {
      resizePet(size)
      ipcRenderer.send('resize', { uuid, size })
      clearBehavior()
    }
  })

  instance.tickHandler = function () {
    ipcSend('move', {
      uuid,
      x: instance.posX - instance.X_OFFSET,
      y: instance.posY - instance.Y_OFFSET,
    })
  }

}

module.exports = {
  ipcSend,
  bind,
  unbind,
  handleIpc,
}
