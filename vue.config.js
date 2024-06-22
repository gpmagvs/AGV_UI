const { defineConfig } = require('@vue/cli-service')
const isDevelopment = process.env.NODE_ENV === 'development';

const webpack = require('webpack');
const packageJson = require('./package.json');

module.exports = defineConfig({
  transpileDependencies: false,
  outputDir: '../GPMVehicleControlSystem/GPMVehicleControlSystem/wwwroot',
  runtimeCompiler: isDevelopment, // 開發模式為 true，否則為 false
  devServer: {
    client: {
      overlay: {
        errors: false,
        warnings: false
      }
    }
  },
  configureWebpack: {
    devtool: 'source-map',

    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          PACKAGE_VERSION: JSON.stringify(packageJson.version)
        }
      })
    ]
  }
})
