const DEFAULT_PATH = '/'

/**
 * Evita open redirect após login — só permite caminhos internos da SPA.
 */
export function getSafeInternalPath(path: unknown, fallback = DEFAULT_PATH): string {
  if (typeof path !== 'string') {
    return fallback
  }

  const trimmed = path.trim()

  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes(':') ||
    trimmed.includes('\\') ||
    trimmed.includes('..')
  ) {
    return fallback
  }

  const pathname = trimmed.split(/[?#]/)[0] ?? fallback

  if (!/^\/[a-zA-Z0-9/_-]*$/.test(pathname)) {
    return fallback
  }

  return pathname || fallback
}
