const OWL_FILES = ['climb-0.png', 'climb-1.png', 'fall-0.png', 'fall-1.png', 'sit-0.png', 'stand-0.png', 'tilt-0.png', 'tilt-1.png', 'walk-0.png', 'walk-1.png', 'walk-2.png', 'walk-3.png']
const BASE64_META = 'data:image/png;base64, '
const BEHAVIOR_JSON = 'behaviors.json'
const CUSTOM_FILE_EXTENSION = '.ptc'
const CURRENT_DIRECTORY = '.'
const NUMBER = 'number'
const THROW_DENOM = 30

const FILE_NOT_VALID = '유효하지 않은 파일이에요.'

const IPC_RESIZE = 'resize'
const IPC_DIALOG = 'dialog'
const IPC_LAUNCH = 'launch'
const IPC_THROW = 'throw'
const IPC_THROW_FAR = 'throwFar'
const IPC_MOVE_MONITOR = 'moveMonitor'
const IPC_STOP = 'stop'
const IPC_ALIGN = 'align'
const IPC_MOVE = 'move'
const IPC_REQUEST_FOCUS = 'requestFocus'
const IPC_SHOW_MENU = 'showMenu'

const ELECTRON_SECOND_INSTANCE = 'second-instance'
const ELECTRON_WINDOW_ALL_CLOSED = 'window-all-closed'

const ALWAYS_ON_TOP_LEVEL = 'pop-up-menu'

module.exports = {
  OWL_FILES,
  BASE64_META,
  BEHAVIOR_JSON,
  NUMBER,
  THROW_DENOM,
  CUSTOM_FILE_EXTENSION,
  CURRENT_DIRECTORY,
  FILE_NOT_VALID,
  IPC_RESIZE,
  IPC_DIALOG,
  IPC_LAUNCH,
  IPC_THROW,
  IPC_THROW_FAR,
  IPC_MOVE_MONITOR,
  IPC_STOP,
  IPC_ALIGN,
  IPC_MOVE,
  IPC_REQUEST_FOCUS,
  IPC_SHOW_MENU,
  ELECTRON_SECOND_INSTANCE,
  ELECTRON_WINDOW_ALL_CLOSED,
  ALWAYS_ON_TOP_LEVEL,
}