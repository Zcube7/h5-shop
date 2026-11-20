// 瀑布流分列：每张卡片放进当前较矮的一列（一样高时放左边）。
// 卡片高度用数据里自带的图片宽高估算，不用等图片加载完，排版不会跳。

export function createColumns(count = 2) {
  return Array.from({ length: count }, () => ({ items: [], height: 0 }))
}

/**
 * 把新一页的商品追加到各列，返回新的列数组（不修改传入的 columns）。
 * @param {Array<{items: any[], height: number}>} columns
 * @param {any[]} newItems
 * @param {(item: any) => number} measure 估算一张卡片的高度
 */
export function appendToColumns(columns, newItems, measure) {
  const next = columns.map((c) => ({ items: c.items.slice(), height: c.height }))
  for (const item of newItems) {
    let target = next[0]
    for (const col of next) if (col.height < target.height) target = col
    target.items.push(item)
    target.height += measure(item)
  }
  return next
}

// 卡片高度 = 图片按列宽等比缩放后的高度 + 下方文字区（标题两行 + 价格行）
export function estimateCardHeight(item, colWidth, infoHeight = 82) {
  const { w, h } = item.image
  return (colWidth * h) / w + infoHeight
}
