const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  outputDir: 'C:/Users/jinwei/Documents/gpm_vms/wwwroot',
  configureWebpack: {
    devtool: 'source-map'
  }
})
