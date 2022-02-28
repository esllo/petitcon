const [uuid, ...sizeString] = location.hash.substring(1).split('&')

const sizes = sizeString.map(string => string.split('-').map(str => Number(str)))
const [widths, heights, xes, totalWidth] = sizes.reduce(([widths, heights, xes, totalWidth], [width, height, x]) => {
  return [
    [...widths, width],
    [...heights, height],
    [...xes, x],
    totalWidth + width
  ]
}, [[], [], [], 0])

module.exports = {
  uuid,
  widths,
  heights,
  xes,
  totalWidth,
}