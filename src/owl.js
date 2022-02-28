function owl(img, widths, heights, xes, totalWidth) {
  const NEAR_WALL_THRESHOLD = 40
  const LEFT_WALL = -1, RIGHT_WALL = 1

  const instance = {
    monitor: 0,
    clicked: false,
    falling: false,
    stopped: false,
    requireSrcChange: false,
    posX: 0,
    posY: 0,
    velX: 0,
    velY: 0,
    tick: 0,
    behaviorTick: 0,
    behaviorDuration: 0,
    fallAcceleration: 0,
    currentSrc: '',
    nextSrc: 'stand-0',
    currentAction: 'stand',
    queue: [],
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
    },
    get src() {
      return this.images[`${this.currentSrc}.png`]
    },
    images: {
    },
    tickHandler: () => { }
  }


  function setRandomPosition() {
    instance.posX = getRangeRand(instance.left, instance.right)
    instance.posY = getRangeRand(instance.top, instance.bottom)
  }

  function hasChance(percent) {
    return Math.random() * 100 <= percent
  }

  function getRangeRand(from, to) {
    return from + Math.floor(Math.random() * (to - from + 1))
  }

  function getNeerWall() {
    if (instance.posX < instance.left + NEAR_WALL_THRESHOLD) {
      return -1
    } else if (instance.posX > instance.right - NEAR_WALL_THRESHOLD) {
      return 1
    }
    return 0
  }

  function hasNeerWall() {
    return getNeerWall() !== 0
  }

  function getNextBehavior() {
    if (instance.posY < instance.bottom) {
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
    instance.currentAction = 'fall'
    instance.behaviorDuration = 10000
    instance.falling = true
  }

  function setClimb() {
    instance.direction = getNeerWall();
    if (instance.direction === LEFT_WALL) {
      instance.posX = instance.left
    } else if (instance.direction === RIGHT_WALL) {
      instance.posX = instance.right
    }
    instance.currentAction = 'climb'
    instance.behaviorDuration = getRangeRand(6, 12) * 40
    instance.velY = -0.7
  }

  function setWalk() {
    if (hasChance(50)) {
      // walk dir -1
      instance.direction = -1;
    } else {
      // walk dir 1
      instance.direction = 1;
    }
    instance.velX = instance.direction;
    instance.currentAction = 'walk'
    instance.behaviorDuration = getRangeRand(2, 12) * 40
  }

  function setStand(ticks) {
    instance.currentAction = 'stand'
    instance.behaviorDuration = instance.ticks ? ticks : getRangeRand(2, 5) * 30
  }

  function setTilt() {
    instance.currentAction = 'tilt'
    instance.behaviorDuration = getRangeRand(6, 9) * 20
  }

  function setSit() {
    instance.currentAction = 'sit'
    instance.behaviorDuration = getRangeRand(6, 9) * 20
  }


  function clearBehavior() {
    instance.tick = 0
    instance.behaviorTick = 0
    instance.behaviorDuration = 0
    instance.velX = 0
    instance.velY = 0
    instance.falling = false
    instance.fallAcceleration = 0
  }

  const actions = {
    climb: function () {
      if (instance.tick < 20) {
        instance.nextSrc = 'climb-0'
      } else if (instance.tick < 40) {
        instance.nextSrc = 'climb-1'
      } else {
        instance.tick = 0
      }
    },
    walk: function () {
      if (instance.tick < 20) {
        instance.nextSrc = 'walk-0'
      } else if (instance.tick < 40) {
        instance.nextSrc = 'walk-1'
      } else if (instance.tick < 60) {
        instance.nextSrc = 'walk-2'
      } else if (instance.tick < 80) {
        instance.nextSrc = 'walk-3'
      } else {
        instance.tick = 0
      }
    },
    fall: function () {
      if (instance.tick < 15) {
        instance.nextSrc = 'fall-0'
      } else if (instance.tick < 30) {
        instance.nextSrc = 'fall-1'
      } else {
        instance.tick = 0
      }
    },
    stand: function () {
      instance.nextSrc = 'stand-0'
    },
    tilt: function () {
      if (instance.tick < 15) {
        instance.nextSrc = 'tilt-0'
      } else if (instance.tick < 30) {
        instance.nextSrc = 'tilt-1'
      } else {
        instance.tick = 0;
      }
    },
    sit: function () {
      if (instance.tick < 3) {
        instance.nextSrc = 'stand-0'
      } else if (instance.tick < instance.behaviorDuration - 3) {
        instance.nextSrc = 'sit-0'
      } else if (instance.tick < instance.behaviorDuration) {
        instance.nextSrc = 'stand-0'
      } else {
        instance.tick = 0;
      }
    }
  }

  function tick() {
    if (instance.stopped) {
      clearInterval(instance.handler)
      return
    }
    if (instance.behaviorTick > instance.behaviorDuration && !instance.clicked) {
      if (instance.currentAction === 'climb') {
        instance.velX = instance.direction * -1;
        instance.velY = 0
        setFall()
      } else {
        clearBehavior()
        getNextBehavior()
      }
    } else {
      instance.tick++
      instance.behaviorTick++;
      if (actions[instance.currentAction]) {
        actions[instance.currentAction]()
      } else {
        clearBehavior()
      }
    }

    if (instance.falling) {
      instance.fallAcceleration += 0.98 / 10
    }

    instance.posX = instance.posX + instance.velX
    instance.posY = instance.posY + instance.velY + instance.fallAcceleration
    if (instance.posX < instance.left) {
      instance.posX = instance.left
      if (instance.currentAction === 'walk') {
        clearBehavior()
      } else if (instance.currentAction === 'fall') {
        if (hasChance(10)) {
          clearBehavior()
          setClimb()
        } else {
          instance.direction = instance.direction * -1
          instance.velX = instance.velX * -0.7
        }
      }
    }
    if (instance.posY < instance.top) {
      instance.posY = instance.top
      if (instance.currentAction === 'walk') {
        clearBehavior()
      } else if (instance.currentAction === 'fall') {
        instance.velX = instance.velX * 0.9
        instance.fallAcceleration = instance.fallAcceleration * -0.3
      }
    }
    if (instance.posX > instance.right) {
      instance.posX = instance.right
      if (instance.currentAction === 'walk') {
        clearBehavior()
      } else if (instance.currentAction === 'fall') {
        if (hasChance(10)) {
          clearBehavior()
          setClimb()
        } else {
          instance.direction = instance.direction * -1
          instance.velX = instance.velX * -0.7
        }
      }
    }
    if (instance.posY > instance.bottom) {
      instance.posY = instance.bottom;
      if (instance.currentAction === 'walk' || instance.currentAction === 'fall') {
        clearBehavior()
        setSit()
      }
    }

    instance.queue.push([instance.posX, instance.posY])
    if (instance.queue.length > 30) {
      instance.queue.splice(0, 20)
    }

    if (instance.currentSrc !== instance.nextSrc || instance.requireSrcChange) {
      instance.requireSrcChange = false
      instance.currentSrc = instance.nextSrc
      img.className = `owl ${instance.currentAction} ${instance.direction === 1 ? 'right' : 'left'}${instance.clicked ? ' clicked' : ''} `
      if (instance.src) {
        img.src = instance.src
      }
    }

    if (instance.tickHandler) {
      instance.tickHandler()
    }
  }

  function launch() {
    setRandomPosition()
    instance.handler = setInterval(tick, 16)
  }

  return {
    img,
    clearBehavior,
    launch,
    instance,
    setClimb,
    setFall,
    setRandomPosition,
    setSit,
    setStand,
    setTilt,
    setWalk,
    getNeerWall,
    getNextBehavior,
    getRangeRand,
    tick,
  }
}
if (typeof module !== 'undefined') {
  module.exports = owl
}