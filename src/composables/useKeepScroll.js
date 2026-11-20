import { onActivated, onBeforeUnmount, onMounted } from 'vue'

/**
 * keep-alive 页面的滚动位置保持。
 * 页面被切走时 DOM 已经脱离文档、scrollTop 会归零，所以不能在 onDeactivated 里读，
 * 而是滚动时随时记下来，切回来（onActivated）再恢复。
 * 注意：Chrome 在元素脱离文档后还会补发一次 scroll 事件（此时 scrollTop=0），必须忽略。
 * @param {import('vue').Ref<HTMLElement|null>} elRef 页面自己的滚动容器
 */
export function useKeepScroll(elRef) {
  let top = 0
  const onScroll = () => {
    const el = elRef.value
    if (el && el.isConnected) top = el.scrollTop
  }
  onMounted(() => elRef.value?.addEventListener('scroll', onScroll, { passive: true }))
  onBeforeUnmount(() => elRef.value?.removeEventListener('scroll', onScroll))
  onActivated(() => {
    if (elRef.value && top) elRef.value.scrollTop = top
  })
  return {
    resetScroll() {
      top = 0
      if (elRef.value) elRef.value.scrollTop = 0
    },
  }
}
