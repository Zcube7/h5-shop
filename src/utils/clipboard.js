import { showToast } from 'vant'

// 复制文字。navigator.clipboard 只在 https/localhost 下可用，其它情况退回 execCommand
export async function copyText(text, tip = '已复制') {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      if (!ok) throw new Error('copy failed')
    }
    showToast(tip)
  } catch {
    showToast('复制失败，请长按手动复制')
  }
}
