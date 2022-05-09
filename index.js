if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/echarts-tooltip-auto-show.min.js')
} else {
  module.exports = require('./dist/echarts-tooltip-auto-show.js')
}