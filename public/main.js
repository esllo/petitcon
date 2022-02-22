const { ipcRenderer } = require('electron')
const { uuid, widths, heights, xes, totalWidth } = require('./hash-parser')

const IMAGE_SIZE = 100
const NEAR_WALL_THRESHOLD = 40
const LEFT_WALL = -1, RIGHT_WALL = 1
const THROW_DENOM = 30

const img = document.getElementById('img')

let stopped = false

const instance = {
  monitor: 0,
  clicked: false,
  falling: false,
  requireSrcChange: false,
  _direction: getRangeRand(0, 1) === 0 ? 1 : -1,
  get direction() {
    return this._direction
  },
  set direction(direction) {
    this._direction = direction
    this.requireSrcChange = true
  },
  get fullLeft() {
    return this.X_OFFSET
  },
  get fullRight() {
    return totalWidth - this.X_OFFSET
  },
  get left() {
    return this.clicked ? this.fullLeft : xes[this.monitor] + this.X_OFFSET
  },
  get right() {
    return (this.clicked ? totalWidth : this.width) - this.X_OFFSET
  },
  get top() {
    return this.Y_OFFSET
  },
  get bottom() {
    return this.height - this.Y_OFFSET
  },
  get X_OFFSET() {
    return 50
  },
  get Y_OFFSET() {
    return 50
  },
  get width() {
    return xes[this.monitor] + widths[this.monitor]
  },
  get height() {
    return heights[this.monitor]
  }
}

let posX = 0, posY = 0
let velX = 0, velY = 0
let tick = 0, behaviorTick = 0, behaviorDuration = 0;
let fallAcceleration = 0;

let currentSrc = ''
let nextSrc = 'stand-0'

let currentAction = 'stand'

let queue = []

window.onmousedown = () => {
  instance.clicked = true
  clearBehavior()
  currentAction = 'fall'
}
window.onmouseup = () => {
  for (let i = xes.length - 1; i >= 0; i--) {
    if (posX > xes[i]) {
      instance.monitor = i
      break;
    }
  }
  instance.clicked = false
  clearBehavior()
  if (queue.length > 5) {
    queue.pop()
    queue.pop()
    queue.pop()
    queue.pop()
    const [prevX, prevY] = queue.pop()

    fallAcceleration = (posY - prevY) / THROW_DENOM
    velX = (posX - prevX) / THROW_DENOM
    instance.direction = posX - prevX < 0 ? 1 : -1
    setFall()
  }
}

window.onmousemove = ({ screenX, screenY }) => {
  if (instance.clicked) {
    posX = Math.max(instance.fullLeft, screenX)
    posY = Math.max(instance.top, screenY)
    if (posX > instance.fullRight) {
      posX = instance.fullRight
    }
    if (posY > instance.bottom) {
      posY = instance.bottom
    }
  }
}

function setRandomPosition() {
  posX = getRangeRand(instance.left, instance.right)
  posY = getRangeRand(instance.top, instance.bottom)
}

function hasChance(percent) {
  return Math.random() * 100 <= percent
}

function getRangeRand(from, to) {
  return from + Math.floor(Math.random() * (to - from + 1))
}

function getNeerWall() {
  if (posX < instance.left + NEAR_WALL_THRESHOLD) {
    return -1
  } else if (posX > instance.right - NEAR_WALL_THRESHOLD) {
    return 1
  }
  return 0
}

function hasNeerWall() {
  return getNeerWall() !== 0
}

function getNextBehavior() {
  if (posY < instance.bottom) {
    setFall()
  } else if (hasNeerWall() && hasChance(60)) {
    // climb wall
    setClimb()
  } else if (hasChance(40)) {
    // walk
    setWalk()
  } else if (hasChance(30)) {
    // tilt
    setTilt()
  } else if (hasChance(30)) {
    // sit
    setSit()
  } else {
    // stand
    setStand()
  }
}

function setFall() {
  currentAction = 'fall'
  behaviorDuration = 10000
  instance.falling = true
}

function setClimb() {
  instance.direction = getNeerWall();
  if (instance.direction === LEFT_WALL) {
    posX = instance.left
  } else if (instance.direction === RIGHT_WALL) {
    posX = instance.right
  }
  currentAction = 'climb'
  behaviorDuration = getRangeRand(6, 12) * 40
  velY = -0.7
}

function setWalk() {
  if (hasChance(50)) {
    // walk dir -1
    instance.direction = -1;
  } else {
    // walk dir 1
    instance.direction = 1;
  }
  velX = instance.direction;
  currentAction = 'walk'
  behaviorDuration = getRangeRand(2, 12) * 40
}

function setStand(ticks) {
  currentAction = 'stand'
  behaviorDuration = ticks ? ticks : getRangeRand(2, 5) * 30
}

function setTilt() {
  currentAction = 'tilt'
  behaviorDuration = getRangeRand(6, 9) * 20
}

function setSit() {
  currentAction = 'sit'
  behaviorDuration = getRangeRand(6, 9) * 20
}

function sendMoveEvent() {
  ipcRenderer.send('move', {
    uuid,
    x: posX - instance.X_OFFSET,
    y: posY - instance.Y_OFFSET,
  })
}

function clearBehavior() {
  tick = 0
  behaviorTick = 0
  behaviorDuration = 0
  velX = 0
  velY = 0
  instance.falling = false
  fallAcceleration = 0
}

const actions = {
  climb: function () {
    if (tick < 20) {
      nextSrc = 'climb-0'
    } else if (tick < 40) {
      nextSrc = 'climb-1'
    } else {
      tick = 0
    }
  },
  walk: function () {
    if (tick < 20) {
      nextSrc = 'walk-0'
    } else if (tick < 40) {
      nextSrc = 'walk-1'
    } else if (tick < 60) {
      nextSrc = 'walk-2'
    } else if (tick < 80) {
      nextSrc = 'walk-3'
    } else {
      tick = 0
    }
  },
  fall: function () {
    if (tick < 15) {
      nextSrc = 'fall-0'
    } else if (tick < 30) {
      nextSrc = 'fall-1'
    } else {
      tick = 0
    }
  },
  stand: function () {
    nextSrc = 'stand-0'
  },
  tilt: function () {
    if (tick < 3) {
      nextSrc = 'stand-0'
    } else if (tick < 8) {
      nextSrc = 'tilt-0'
    } else if (tick < behaviorDuration - 8) {
      nextSrc = 'tilt-1'
    } else if (tick < behaviorDuration - 3) {
      nextSrc = 'tilt-0'
    } else if (tick < behaviorDuration) {
      nextSrc = 'stand-0'
    } else {
      tick = 0;
    }
  },
  sit: function () {
    if (tick < 3) {
      nextSrc = 'stand-0'
    } else if (tick < behaviorDuration - 3) {
      nextSrc = 'sit-0'
    } else if (tick < behaviorDuration) {
      nextSrc = 'stand-0'
    } else {
      tick = 0;
    }
  }
}

ipcRenderer.on('stop', () => {
  stopped = true
})

function throwAll(dist) {
  clearBehavior()
  let delX = getRangeRand(dist * -1, dist) * 2
  let delY = getRangeRand(-10, -15)
  fallAcceleration = delY
  delY += delY
  velX = delX
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
    posX = instance.left
    posY = instance.bottom
  } else if (data === 'right') {
    posX = instance.right
    posY = instance.bottom
  }
  clearBehavior()
  setStand(120)
})

ipcRenderer.on('launch', (e, [data]) => {
  if (data) {
    // set resource
    console.log(data)
  }
  launch()
})


function launch() {
  setRandomPosition()
  const handler = setInterval(() => {
    if (stopped) {
      clearInterval(handler)
      return
    }
    if (behaviorTick > behaviorDuration && !instance.clicked) {
      if (currentAction === 'climb') {
        velX = instance.direction * -1;
        velY = 0
        setFall()
      } else {
        clearBehavior()
        getNextBehavior()
      }
    } else {
      tick++
      behaviorTick++;
      if (actions[currentAction]) {
        actions[currentAction]()
      } else {
        clearBehavior()
      }
    }

    if (instance.falling) {
      fallAcceleration += 0.98 / 10
    }

    posX = posX + velX
    posY = posY + velY + fallAcceleration
    if (posX < instance.left) {
      posX = instance.left
      if (currentAction === 'walk') {
        clearBehavior()
      } else if (currentAction === 'fall') {
        if (hasChance(10)) {
          clearBehavior()
          setClimb()
        } else {
          instance.direction = instance.direction * -1
          velX = velX * -0.7
          console.log('bump')
        }
      }
    }
    if (posY < instance.top) {
      posY = instance.top
      if (currentAction === 'walk') {
        clearBehavior()
      } else if (currentAction === 'fall') {
        console.log('g')
        velX = velX * 0.9
        fallAcceleration = fallAcceleration * -0.3
      }
    }
    if (posX > instance.right) {
      posX = instance.right
      if (currentAction === 'walk') {
        clearBehavior()
      } else if (currentAction === 'fall') {
        if (hasChance(10)) {
          clearBehavior()
          setClimb()
        } else {
          instance.direction = instance.direction * -1
          velX = velX * -0.7
          console.log('bump')
        }
      }
    }
    if (posY > instance.bottom) {
      posY = instance.bottom;
      if (currentAction === 'walk' || currentAction === 'fall') {
        clearBehavior()
        setSit()
      }
    }

    queue.push([posX, posY])
    if (queue.length > 30) {
      queue.splice(0, 20)
    }

    if (currentSrc !== nextSrc || instance.requireSrcChange) {
      instance.requireSrcChange = false
      currentSrc = nextSrc
      img.className = `${currentAction}-${instance.direction === 1 ? 'right' : 'left'}${instance.clicked ? ' clicked' : ''}`
      img.src = `../res/${currentSrc}.png`
    }

    sendMoveEvent()
  }, 16)
}