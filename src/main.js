import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 组件样式由 unplugin-vue-components 按需引入；函数式调用的组件要手动引样式
import 'vant/es/toast/style'
import 'vant/es/dialog/style'
import 'vant/es/image-preview/style'
import './styles/global.css'

createApp(App).use(createPinia()).use(router).mount('#app')
