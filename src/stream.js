const totalWidth = document.body.clientWidth
const widths = [totalWidth]
const heights = [document.body.clientHeight]
const xes = [0]
const FILES = ['climb-0.png', 'climb-1.png', 'fall-0.png', 'fall-1.png', 'sit-0.png', 'stand-0.png', 'tilt-0.png', 'tilt-1.png', 'walk-0.png', 'walk-1.png', 'walk-2.png', 'walk-3.png']


function addOwl() {
  const img = document.createElement('img')
  img.className = 'owl'
  document.body.appendChild(img)
  const myOwl = owl(img, widths, heights, xes, totalWidth)
  myOwl.instance.tickHandler = () => {
    myOwl.img.style = `--x: ${myOwl.instance.posX - myOwl.instance.X_OFFSET}px; --y: ${myOwl.instance.posY - myOwl.instance.Y_OFFSET}px;`
  }
  return myOwl
}

function loadOwl(owl) {
  FILES.forEach((file) => {
    fetch(file).then(e => e.blob()).then(blob => {
      const src = window.URL.createObjectURL(blob)
      owl.instance.images[file] = src
    })
  })
}

const owls = []

new Array(10).fill(0).forEach(i => {
  const myOwl = addOwl()
  myOwl.setRandomPosition()
  loadOwl(myOwl)
  owls.push(myOwl)
})

setInterval(() => {
  owls.forEach(owl => owl.tick())
}, 16)
