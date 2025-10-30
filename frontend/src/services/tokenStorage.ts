const ACCESS_TOKEN_KEY = "sp_access_token"
const REFRESH_TOKEN_KEY = "sp_refresh_token"

export interface Tokens {
  accessToken: string
  refreshToken: string
}

// Leo el access token desde localStorage si estoy en el navegador
function getAccessToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(ACCESS_TOKEN_KEY)
}

// Leo el refresh token desde localStorage si estoy en el navegador
function getRefreshToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(REFRESH_TOKEN_KEY)
}

// Guardo ambos tokens de sesión de forma atómica
function setTokens(tokens: Tokens) {
  if (typeof window === "undefined") return
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
}

// Elimino los tokens para cerrar sesión o ante errores
function clearTokens() {
  if (typeof window === "undefined") return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const tokenStorage = {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
}

