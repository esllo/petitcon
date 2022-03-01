const { ipcSend } = require("./ipc")
const { uuid, xes } = require('./hash-parser')

const THROW_DENOM = 30

function handleEvent(pet, loadPtc) {
  const { instance, clearBehavior, setBehavior } = pet

  window.onmousedown = ({ buttons }) => {
    if (buttons === 1) {
      instance.clicked = true
      clearBehavior()
      instance.currentAction = 'fall'
      ipcSend('requestFocus', uuid)
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
    ipcSend('showMenu', { uuid, name: instance.info.name })
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
}

module.exports = {
  handleEvent
}