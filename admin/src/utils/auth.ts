// ============================================================
// Token 工具 - 管理 localStorage 中的 token
// ============================================================

const TOKEN_KEY = 'hn_admin_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}