import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'

// 开发时预先打包 Vant 每个组件的样式入口。否则第一次进某个页面时，
// Vite 发现新依赖会整页刷新一次，keep-alive 缓存的页面状态（滚动位置、已加载的商品）就丢了。
// （optimizeDeps.include 写通配符 'vant/es/*/style/index' 实测不生效，所以逐条列出）
const vantEs = fileURLToPath(new URL('./node_modules/vant/es', import.meta.url))
const vantStyleEntries = existsSync(vantEs)
  ? readdirSync(vantEs)
      .filter((d) => existsSync(`${vantEs}/${d}/style/index.mjs`))
      .map((d) => `vant/es/${d}/style/index`)
  : []

export default defineConfig({
  // 相对路径：打包后的 dist 放到任意子目录都能打开（配合哈希路由）
  base: './',
  plugins: [
    vue(),
    // 模板里写 <van-button> 就自动按需引入组件和样式
    Components({ resolvers: [VantResolver()], dts: false }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 4194, strictPort: true },
  optimizeDeps: { include: ['vant/es', ...vantStyleEntries] },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
})
