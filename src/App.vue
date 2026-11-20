<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

// 首页、分类页缓存起来：切 Tab 回来时商品流和滚动位置都还在。
// 「我的」和订单页不缓存，每次进来都拿最新数据。
const CACHED = ['Home', 'Category']
</script>

<template>
  <div class="app-shell">
    <router-view v-slot="{ Component, route: r }">
      <keep-alive :include="CACHED">
        <component :is="Component" :key="r.meta.tabbar ? r.name : r.path" />
      </keep-alive>
    </router-view>

    <van-tabbar v-if="route.meta.tabbar" route fixed safe-area-inset-bottom>
      <van-tabbar-item to="/home" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/category" icon="apps-o">分类</van-tabbar-item>
      <van-tabbar-item to="/mine" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>
