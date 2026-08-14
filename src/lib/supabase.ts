import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

const HEALTH_TIMEOUT_MS = 8_000

function createAppClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    return createClient('https://unavailable.invalid', 'unavailable', {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
}

export const supabase = createAppClient()

export type DatabaseAvailability =
  | { available: true }
  | { available: false; reason: 'missing_config' | 'unreachable' }

export async function checkDatabaseAvailability(): Promise<DatabaseAvailability> {
  if (!isSupabaseConfigured) {
    return { available: false, reason: 'missing_config' }
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    if (
      response.ok ||
      response.status === 400 ||
      response.status === 401 ||
      response.status === 403 ||
      response.status === 406
    ) {
      return { available: true }
    }

    return { available: false, reason: 'unreachable' }
  } catch {
    return { available: false, reason: 'unreachable' }
  } finally {
    window.clearTimeout(timeoutId)
  }
}
