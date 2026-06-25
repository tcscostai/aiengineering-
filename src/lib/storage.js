const PREFIX = 'horizon_'

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function saveJSON(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent('horizon-storage', { detail: { key } }))
}

export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
