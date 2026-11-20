// 金额一律用整数「分」存储，只在展示时换算成元
export function formatPrice(cents) {
  const n = Number(cents) || 0
  return (n / 100).toFixed(2)
}

const pad = (n) => String(n).padStart(2, '0')

export function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  )
}

export function formatSales(n) {
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, '')}万`
  return String(n)
}

export function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone || ''
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}
