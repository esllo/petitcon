const { ipcSend } = require("./ipc")
const { uuid, xes } = require('./hash-parser')
const { IPC_REQUEST_FOCUS, IPC_SHOW_MENU, CUSTOM_FILE_EXTENSION, THROW_DENOM } = require("./constants")

function handleEvent(pet, loadPtc) {
  const { instance, clearBehavior, setBehavior } = pet

  window.onmousedown = ({ buttons }) => {
    if (buttons === 1) {
      instance.clicked = true
      clearBehavior()
      if (instance.actions['pick']) {
        instance.currentAction = 'pick'
      } else {
        instance.currentAction = 'fall'
      }
      ipcSend(IPC_REQUEST_FOCUS, uuid)
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
    ipcSend(IPC_SHOW_MENU, { uuid, name: instance.info.name })
  }

  window.onmousemove = ({ screenX, screenY }) => {
    if (instance.clicked) {
      instance.posX = screenX
      instance.posY = screenY
    }
  }

  document.body.ondragover = (e) => e.preventDefault()
  document.body.ondrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.path.endsWith(CUSTOM_FILE_EXTENSION)) {
        loadPtc(file.path)
      }
    }
  }
}

module.exports = {
  handleEvent
}