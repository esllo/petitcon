const express = require('express')
const path = require('path')
const app = express()
function startServer(appPath) {

  app.get('/', (req, res) => {
    res.sendFile(path.join(appPath, 'src', 'server', 'index.html'))
  })

  app.get('/pet.js', (req, res) => {
    res.sendFile(path.join(appPath, 'src', 'pet.js'))
  })

  app.get('/stream.js', (req, res) => {
    res.sendFile(path.join(appPath, 'src', 'stream.js'))
  })

  app.get('/*.png', (req, res) => {
    const { url } = req
    res.sendFile(path.join(appPath, 'res', url))
  })

  app.get('*', (req, res) => {
    res.status(404).end('')
  })

  const server = app.listen(3003)

  return server
}

module.exports = {
  startServer,
}