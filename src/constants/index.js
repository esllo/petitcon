const electron = require('./electron')
const ipc = require('./ipc')
const plain = require('./plain')
const text = require('./text')



module.exports = {
  ...electron,
  ...ipc,
  ...plain,
  ...text,
}