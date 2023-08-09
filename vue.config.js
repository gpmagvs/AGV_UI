const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  outputDir: '../GPMVehicleControlSystem/GPMVehicleControlSystem/wwwroot',
  configureWebpack: {
    devtool: 'source-map'
  }
})
