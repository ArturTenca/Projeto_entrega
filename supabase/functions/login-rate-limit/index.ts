import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const DAY_MS = 24 * 60 * 60 * 1000

function getClientIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for')

  if (forwarded) {
    const ip = forwarded.split(',')[0]?.trim()
    if (ip) return ip
  }

  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  const cfIp = req.headers.get('cf-connecting-ip')?.trim()
  if (cfIp) return cfIp

  return null
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'server_misconfigured' }, 500)
  }

  const ip = getClientIp(req)

  if (!ip) {
    return jsonResponse({ allowed: true })
  }

  let body: { action?: string }

  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'invalid_body' }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  if (body.action === 'check') {
    const { data, error } = await supabase
      .from('login_ip_blocks')
      .select('blocked_until')
      .eq('ip_address', ip)
      .maybeSingle()

    if (error) {
      return jsonResponse({ error: 'check_failed' }, 500)
    }

    if (data?.blocked_until) {
      const blockedUntil = new Date(data.blocked_until)

      if (blockedUntil.getTime() > Date.now()) {
        return jsonResponse({
          allowed: false,
          blockedUntil: blockedUntil.toISOString(),
        })
      }
    }

    return jsonResponse({ allowed: true })
  }

  if (body.action === 'block') {
    const blockedUntil = new Date(Date.now() + DAY_MS).toISOString()

    const { error } = await supabase.from('login_ip_blocks').upsert(
      {
        ip_address: ip,
        blocked_until: blockedUntil,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'ip_address' },
    )

    if (error) {
      return jsonResponse({ error: 'block_failed' }, 500)
    }

    return jsonResponse({
      allowed: false,
      blockedUntil,
    })
  }

  return jsonResponse({ error: 'invalid_action' }, 400)
})
