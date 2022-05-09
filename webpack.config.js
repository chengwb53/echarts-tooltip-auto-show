const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: {
    'echarts-tooltip-auto-show': './src/index.js',
    'echarts-tooltip-auto-show.min': './src/index.js',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    library: 'echartsTooltipAutoShow',
    libraryExport: 'default',
    libraryTarget: 'umd'
  },
  mode: 'none',
  module: {
    rules: [{
      test: /.js$/,
      use: 'babel-loader'
    }]
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        include: /\.min\.js$/
      })
    ]
  }
}
