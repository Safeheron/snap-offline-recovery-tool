const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin').default;

const isProd = process.env.NODE_ENV === "production"

const configs = {
  webpack: {
    plugins: {
      add: [
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
        })
      ]
    },

    configure: (webpackConfig, {env, paths}) => {

      webpackConfig.output.publicPath = isProd ? "./" : ""
      webpackConfig.resolve.fallback = {
        crypto: require.resolve("crypto-browserify"),
        buffer: require.resolve("buffer/"),
        stream: require.resolve("stream-browserify"),
      }
      webpackConfig.plugins.forEach(plugin => {
        if (plugin instanceof HtmlWebpackPlugin) {
          plugin.userOptions.inject = 'body'
        }
      })

      return webpackConfig;
    },
  },
}

if (isProd) {
  configs.webpack.plugins.add.push(
    new HtmlInlineScriptPlugin({
      scriptMatchPattern: [/.+[.]js$/]
    }),
    new HTMLInlineCSSWebpackPlugin())
}

module.exports = configs;
