const { uuid } = require('./hash-parser')
const { ipcRenderer } = require("electron");
const { IPC_STOP, IPC_THROW, IPC_THROW_FAR, IPC_MOVE_MONITOR, IPC_ALIGN, IPC_RESIZE, IPC_MOVE, NUMBER } = require('./constants');

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

  ipcRenderer.on(IPC_STOP, () => {
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

  ipcRenderer.on(IPC_THROW, () => {
    throwAll(5)
  })

  ipcRenderer.on(IPC_THROW_FAR, () => {
    throwAll(20)
  })

  ipcRenderer.on(IPC_MOVE_MONITOR, (e, data) => {
    instance.monitor = Number(data)
    setRandomPosition()
    setBehavior('fall')()
  })

  ipcRenderer.on(IPC_STOP, () => {
    instance.stopped = true
    clearTimeout(instance.handler)
    instance.handler = null
  })

  ipcRenderer.on(IPC_ALIGN, (e, data) => {
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

  ipcRenderer.on(IPC_RESIZE, (e, size) => {
    if (typeof size === NUMBER
      || (typeof size.width === NUMBER && typeof size.height === NUMBER)) {
      resizePet(size)
      ipcRenderer.send(IPC_RESIZE, { uuid, size })
      clearBehavior()
    }
  })

  instance.tickHandler = function () {
    ipcSend(IPC_MOVE, {
      uuid,
      x: instance.renderX - instance.X_OFFSET,
      y: instance.renderY - instance.Y_OFFSET,
    })
  }

}

module.exports = {
  ipcSend,
  bind,
  unbind,
  handleIpc,
}
