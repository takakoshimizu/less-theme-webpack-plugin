const LessThemeWebpackPlugin = require('./index');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require('path');

const extractPlugin = new MiniCssExtractPlugin({
  filename: 'css/base.css'
});

module.exports = {
  mode: 'production',
  entry: './test.js',
  output: {
    filename: 'test.js'
  },
  module: {
    rules: [
      { test: /(\.css$|\.less$)/, use: [
        { loader: MiniCssExtractPlugin.loader },
        'css-loader',
        'less-loader'
      ] }
    ]
  },
  plugins: [
    new LessThemeWebpackPlugin({
      sourceFile: extractPlugin.options.filename, // use the output of the extract plugin for the input of this one
      genericFile: 'generic.less',
      themePath: path.resolve(__dirname, 'themes'),
      sourceChunk: 'main'
    }),
    extractPlugin
  ]
};