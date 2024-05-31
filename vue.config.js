const { defineConfig } = require('@vue/cli-service')
const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = defineConfig({
  transpileDependencies: true,
  outputDir: '../GPMVehicleControlSystem/GPMVehicleControlSystem/wwwroot',
  runtimeCompiler: isDevelopment, // 開發模式為 true，否則為 false
  configureWebpack: {
    devtool: 'source-map'
  }
})
