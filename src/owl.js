function owl(img, widths, heights, xes, totalWidth, behaviorData) {
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
    behaviorDuration: -1,
    fallAcceleration: 0,
    currentSrc: '',
    nextSrc: '',
    currentAction: '',
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
    images: {},
    actions: {},
    behaviors: {},
    conditions: [],
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

  function isNotGround() {
    return instance.posY < instance.bottom
  }

  function getNextBehavior() {
    const { conditions } = instance
    for (let i = 0; i < conditions.length; i++) {
      const { condition, chance, action } = conditions[i]
      let realCondition = callFunction(condition)
      if (realCondition === undefined) {
        realCondition = true
      }
      const realChance = hasChance(chance || 100)
      if (realCondition && realChance) {
        setBehavior(action)
        return
      }
    }
  }

  function setRandomDirection() {
    if (hasChance(50)) {
      instance.direction = -1;
    } else {
      instance.direction = 1;
    }
  }

  function dockToNeerWall() {
    instance.direction = getNeerWall();
    if (instance.direction === LEFT_WALL) {
      instance.posX = instance.left
    } else if (instance.direction === RIGHT_WALL) {
      instance.posX = instance.right
    }
  }

  function setBehavior(action) {
    instance.behaviors[action]()
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

  function callFunction(name) {
    switch (name) {
      case 'dockToNeerWall':
        dockToNeerWall()
        break
      case 'setRandomDirection':
        setRandomDirection()
        break
      case 'hasNeerWall':
        return hasNeerWall()
      case 'isNotGround':
        return isNotGround()
      default:
        return undefined
    }
  }

  function parseData(data) {
    let parseTarget = behaviorData
    if (data) {
      parseTarget = data
    }
    const { name, author, behaviors } = parseTarget
    instance.actions = {}
    instance.behaviors = {}
    instance.conditions = []
    behaviors.forEach(behavior => {
      const { action, condition, duration, durationRange, evaluate, chance } = behavior;
      instance.actions[action] = function () {
        if (duration && duration.length > 0) {
          // instance duration check
          for (let i = 0; i < duration.length; i++) {
            if (instance.tick < duration[i]) {
              instance.nextSrc = `${action}-${i}`
              return
            }
          }
          // instance tick reset
          instance.tick = 0
        } else {
          instance.nextSrc = `${action}-0`
        }
      }
      instance.behaviors[action] = function () {
        if (evaluate && Array.isArray(evaluate)) {
          evaluate.forEach(({ func, variable, value, key }) => {
            if (func) {
              callFunction(func)
            } else if (variable && (value || key)) {
              instance[variable] = value || instance[key]
            }
          })
        }
        instance.currentAction = action
        const { fixed, min, max, multiply } = durationRange
        if (fixed) {
          instance.behaviorDuration = fixed
        } else if (min > -1 && max > -1) {
          const duration = getRangeRand(min, max) * (multiply || 1)
          instance.behaviorDuration = duration
        } else {
          // similar to 1 sec
          instance.behaviorDuration = 60
        }
      }
      instance.conditions.push({
        condition,
        chance,
        action
      })
    })
  }

  parseData()

  function tick() {
    if (instance.stopped) {
      clearInterval(instance.handler)
      return
    }
    if (instance.behaviorTick > instance.behaviorDuration && !instance.clicked) {
      if (instance.currentAction === 'climb') {
        instance.velX = instance.direction * -1;
        instance.velY = 0
        setBehavior('fall')
      } else {
        clearBehavior()
        getNextBehavior()
      }
    } else {
      instance.tick++
      instance.behaviorTick++;
      if (instance.actions[instance.currentAction]) {
        instance.actions[instance.currentAction]()
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
          setBehavior('climb')
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
          setBehavior('climb')
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
        setBehavior('sit')
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
    setBehavior,
    setRandomPosition,
    getNeerWall,
    getNextBehavior,
    getRangeRand,
    tick,
    parseData,
  }
}
if (typeof module !== 'undefined') {
  module.exports = owl
}