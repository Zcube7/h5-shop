// 假数据的持久化：浏览器里存 localStorage，测试里用内存版
const PREFIX = 'h5shop:'

export function createMemoryStorage() {
  const map = new Map()
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    keys: () => [...map.keys()],
  }
}

function storageKeys(storage) {
  if (typeof storage.keys === 'function') return storage.keys()
  const out = []
  for (let i = 0; i < storage.length; i++) out.push(storage.key(i))
  return out
}

export function createDb(storage) {
  return {
    load(key, fallback) {
      try {
        const raw = storage.getItem(PREFIX + key)
        return raw == null ? fallback : JSON.parse(raw)
      } catch {
        return fallback
      }
    },
    save(key, value) {
      storage.setItem(PREFIX + key, JSON.stringify(value))
    },
    resetAll() {
      storageKeys(storage)
        .filter((k) => k && k.startsWith(PREFIX))
        .forEach((k) => storage.removeItem(k))
    },
  }
}

export function defaultStorage() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage
  } catch {
    /* 隐私模式等情况下访问 localStorage 会抛错 */
  }
  return createMemoryStorage()
}
