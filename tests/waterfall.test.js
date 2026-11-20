import { describe, expect, it } from 'vitest'
import { appendToColumns, createColumns, estimateCardHeight } from '../src/utils/waterfall.js'

const item = (id, h) => ({ id, h })
const measure = (it) => it.h
const ids = (col) => col.items.map((i) => i.id)

describe('瀑布流分列', () => {
  it('一样高的卡片左右交替，平局放左边', () => {
    const cols = appendToColumns(createColumns(), [1, 2, 3, 4, 5].map((i) => item(i, 100)), measure)
    expect(ids(cols[0])).toEqual([1, 3, 5])
    expect(ids(cols[1])).toEqual([2, 4])
  })

  it('总是放进较矮的那一列', () => {
    const cols = appendToColumns(createColumns(), [item('a', 300), item('b', 100), item('c', 100), item('d', 100)], measure)
    expect(ids(cols[0])).toEqual(['a'])
    expect(ids(cols[1])).toEqual(['b', 'c', 'd'])
    expect(cols[0].height).toBe(300)
    expect(cols[1].height).toBe(300)
  })

  it('分页追加：不改动传入的列，已有卡片位置不变', () => {
    const first = appendToColumns(createColumns(), [item(1, 120), item(2, 200)], measure)
    const snapshot = JSON.stringify(first)
    const second = appendToColumns(first, [item(3, 90), item(4, 90)], measure)
    expect(JSON.stringify(first)).toBe(snapshot)
    expect(ids(second[0]).slice(0, 1)).toEqual([1])
    expect(ids(second[1]).slice(0, 1)).toEqual([2])
    // 左 120 < 右 200 → 3 放左（左变 210）；此时右 200 更矮 → 4 放右
    expect(ids(second[0])).toEqual([1, 3])
    expect(ids(second[1])).toEqual([2, 4])
  })

  it('随机高度：数量不丢、每列内顺序递增、两列高差不超过最高的一张卡', () => {
    let seed = 1
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
    const all = Array.from({ length: 200 }, (_, i) => item(i, 80 + Math.floor(rand() * 220)))
    let cols = createColumns()
    for (let i = 0; i < all.length; i += 10) cols = appendToColumns(cols, all.slice(i, i + 10), measure)
    const placed = cols.flatMap(ids)
    expect(placed.sort((a, b) => a - b)).toEqual(all.map((x) => x.id))
    for (const c of cols) expect(ids(c)).toEqual(ids(c).slice().sort((a, b) => a - b))
    const maxH = Math.max(...all.map((x) => x.h))
    expect(Math.abs(cols[0].height - cols[1].height)).toBeLessThanOrEqual(maxH)
  })

  it('卡片高度按图片比例缩放', () => {
    expect(estimateCardHeight({ image: { w: 300, h: 450 } }, 170, 80)).toBe(255 + 80)
  })
})
