const AUTH_STORAGE_KEY = 'horizon_auth'
const JWT_SECRET = 'horizon-enterprise-jwt-demo-v1'

export const PLATFORM_USERS = [
  {
    id: 'usr_saurabh',
    username: 'Saurabh',
    password: 'admin123',
    name: 'Saurabh',
    role: 'Administrator',
    org: 'TCS AI Engineering Studio',
    department: 'Platform Admin',
    avatar: 'S',
    permissions: ['*'],
  },
  {
    id: 'usr_dwarak',
    username: 'J Dwarak',
    password: 'admin123',
    name: 'J Dwarak',
    role: 'Administrator',
    org: 'TCS AI Engineering Studio',
    department: 'Platform Admin',
    avatar: 'JD',
    permissions: ['*'],
  },
  {
    id: 'usr_kumar',
    username: 'Kumar A',
    password: 'admin123',
    name: 'Kumar A',
    role: 'Administrator',
    org: 'TCS AI Engineering Studio',
    department: 'Platform Admin',
    avatar: 'KA',
    permissions: ['*'],
  },
  {
    id: 'usr_ram',
    username: 'Ram V',
    password: 'admin123',
    name: 'Ram V',
    role: 'Administrator',
    org: 'TCS AI Engineering Studio',
    department: 'Platform Admin',
    avatar: 'RV',
    permissions: ['*'],
  },
]

/** @deprecated use PLATFORM_USERS */
export const ADMIN_USER = PLATFORM_USERS[0]

export function findUserByUsername(username) {
  const normalized = username.trim().toLowerCase()
  return PLATFORM_USERS.find((u) => u.username.toLowerCase() === normalized) ?? null
}

function base64UrlEncode(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data)
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  bytes.forEach((b) => { binary += String.fromCharCode(b) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str) {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4)
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

async function signHmac(data) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(sig)))
}

export async function createJWT(payload, expiresInSec = 3600) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSec,
    iss: 'horizon-ai-engineering',
    aud: 'horizon-platform',
  }
  const h = base64UrlEncode(header)
  const p = base64UrlEncode(body)
  const signature = await signHmac(`${h}.${p}`)
  return `${h}.${p}.${signature}`
}

export async function verifyJWT(token) {
  if (!token || typeof token !== 'string') return { valid: false, error: 'No token' }
  const parts = token.split('.')
  if (parts.length !== 3) return { valid: false, error: 'Malformed token' }

  const [h, p, sig] = parts
  const expected = await signHmac(`${h}.${p}`)
  if (sig !== expected) return { valid: false, error: 'Invalid signature' }

  try {
    const payload = JSON.parse(base64UrlDecode(p))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired', payload }
    }
    return { valid: true, payload }
  } catch {
    return { valid: false, error: 'Invalid payload' }
  }
}

export function decodeJWT(token) {
  try {
    const p = token.split('.')[1]
    return JSON.parse(base64UrlDecode(p))
  } catch {
    return null
  }
}

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveAuth(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  window.dispatchEvent(new CustomEvent('horizon-auth', { detail: session }))
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('horizon-auth', { detail: null }))
}

export async function loginWithCredentials(username, password, remember = true) {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 400))

  const user = findUserByUsername(username)
  if (!user || user.password !== password) {
    return { ok: false, error: 'Invalid username or password' }
  }

  const { password: _, ...profile } = user
  const accessToken = await createJWT(
    {
      sub: profile.id,
      username: profile.username,
      name: profile.name,
      role: profile.role,
      org: profile.org,
      permissions: profile.permissions,
    },
    remember ? 86400 : 3600
  )
  const refreshToken = await createJWT({ sub: profile.id, type: 'refresh' }, 604800)

  const session = {
    user: profile,
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresAt: Date.now() + (remember ? 86400 : 3600) * 1000,
    issuedAt: new Date().toISOString(),
  }

  saveAuth(session)
  return { ok: true, session }
}

export async function loginWithPassword(password, remember = true) {
  return loginWithCredentials(PLATFORM_USERS[0].username, password, remember)
}

export async function validateSession() {
  const stored = getStoredAuth()
  if (!stored?.accessToken) return null

  const result = await verifyJWT(stored.accessToken)
  if (!result.valid) {
    if (stored.refreshToken) {
      const refresh = await verifyJWT(stored.refreshToken)
      if (refresh.valid) {
        const newAccess = await createJWT({
          sub: refresh.payload.sub,
          username: stored.user.username,
          name: stored.user.name,
          role: stored.user.role,
          org: stored.user.org,
          permissions: stored.user.permissions,
        })
        const updated = { ...stored, accessToken: newAccess, expiresAt: Date.now() + 3600000 }
        saveAuth(updated)
        return updated
      }
    }
    clearAuth()
    return null
  }
  return stored
}

export function logout() {
  clearAuth()
}

export function getTokenPreview(token) {
  if (!token) return ''
  return `${token.slice(0, 24)}…${token.slice(-12)}`
}
