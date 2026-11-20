// 返回上一页；如果是直接打开的链接（没有上一页），就去兜底页面
export function goBack(router, fallback = '/home') {
  if (window.history.state?.back) router.back()
  else router.replace(fallback)
}
