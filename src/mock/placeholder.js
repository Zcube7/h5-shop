// 本地生成的 SVG 占位图（data URI），离线可用。以后换成真图片地址即可。

const escapeXml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c])

// 按字数折行，最多 maxLines 行
function wrap(text, perLine, maxLines) {
  const chars = Array.from(text)
  const lines = []
  for (let i = 0; i < chars.length && lines.length < maxLines; i += perLine) {
    lines.push(chars.slice(i, i + perLine).join(''))
  }
  return lines
}

const FONT = "PingFang SC, 'Microsoft YaHei', 'Noto Sans SC', sans-serif"

/**
 * @param {{w:number, h:number, hue:number, title:string, sub?:string, mark?:string, layout?:'card'|'banner'}} opts
 */
export function placeholder({ w, h, hue, title, sub = '', mark = '', layout = 'card' }) {
  const c1 = `hsl(${hue},72%,66%)`
  const c2 = `hsl(${(hue + 28) % 360},70%,52%)`
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>`,
    `<rect width="${w}" height="${h}" fill="url(#g)"/>`,
    `<circle cx="${w * 0.82}" cy="${h * 0.18}" r="${Math.min(w, h) * 0.32}" fill="#fff" fill-opacity=".14"/>`,
    `<circle cx="${w * 0.1}" cy="${h * 0.92}" r="${Math.min(w, h) * 0.22}" fill="#fff" fill-opacity=".1"/>`,
  ]

  if (layout === 'banner') {
    parts.push(
      `<text x="${w * 0.07}" y="${h * 0.46}" font-family="${FONT}" font-size="${h * 0.17}" font-weight="700" fill="#fff">${escapeXml(title)}</text>`,
      `<text x="${w * 0.07}" y="${h * 0.66}" font-family="${FONT}" font-size="${h * 0.09}" fill="#fff" fill-opacity=".9">${escapeXml(sub)}</text>`,
    )
  } else {
    if (mark) {
      parts.push(
        `<text x="${w / 2}" y="${h * 0.42}" font-family="${FONT}" font-size="${w * 0.36}" font-weight="700" fill="#fff" fill-opacity=".28" text-anchor="middle" dominant-baseline="middle">${escapeXml(mark)}</text>`,
      )
    }
    const fontSize = Math.round(w * 0.085)
    const lines = wrap(title, 9, 2)
    const top = h * 0.68 - ((lines.length - 1) * fontSize * 1.3) / 2
    lines.forEach((line, i) => {
      parts.push(
        `<text x="${w / 2}" y="${top + i * fontSize * 1.3}" font-family="${FONT}" font-size="${fontSize}" font-weight="600" fill="#fff" text-anchor="middle">${escapeXml(line)}</text>`,
      )
    })
    if (sub) {
      parts.push(
        `<text x="${w / 2}" y="${h * 0.9}" font-family="${FONT}" font-size="${Math.round(w * 0.055)}" fill="#fff" fill-opacity=".85" text-anchor="middle">${escapeXml(sub)}</text>`,
      )
    }
  }

  parts.push('</svg>')
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(parts.join(''))}`
}
