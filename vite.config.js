import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { readFileSync, existsSync } from 'fs'

// 讀取 package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

const LEGACY_OUT_DIR = '../GPMVehicleControlSystem/GPMVehicleControlSystem/wwwroot'
const legacyParentDir = path.resolve(process.cwd(), '../GPMVehicleControlSystem/GPMVehicleControlSystem')
const outDir = process.env.VITE_OUT_DIR
  ? path.resolve(process.cwd(), process.env.VITE_OUT_DIR)
  : (existsSync(legacyParentDir) ? path.resolve(process.cwd(), LEGACY_OUT_DIR) : path.resolve(process.cwd(), 'dist'))

export default defineConfig({
    plugins: [
        vue(),
        Components({
            resolvers: [ElementPlusResolver()],
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    define: {
        __VUE_I18N_FULL_INSTALL__: true,
        __VUE_I18N_LEGACY_API__: false,
        __INTLIFY_PROD_DEVTOOLS__: false,
        'import.meta.env.VITE_PACKAGE_VERSION': JSON.stringify(packageJson.version)
    },
    server: {
        port: 8080
    },
    build: {
        outDir,
        assetsDir: 'assets',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                // 為檔案名稱加入內容雜湊
                entryFileNames: 'assets/[name].[hash].js',
                chunkFileNames: 'assets/[name].[hash].js',
                assetFileNames: 'assets/[name].[hash].[ext]'
            }
        }
    }
}) 