const [uuid, ...sizeString] = location.hash.substring(1).split('&')

const sizes = sizeString.map(string => string.split('-').map(str => Number(str)))
const [widths, heights, xes, totalWidth, scales] = sizes.reduce(([widths, heights, xes, totalWidth, scales], [width, height, x, scale]) => {
  return [
    [...widths, width],
    [...heights, height],
    [...xes, x],
    totalWidth + width,
    [...scales, scale]
  ]
}, [[], [], [], 0, []])

module.exports = {
  uuid,
  widths,
  heights,
  xes,
  totalWidth,
  scales,
}