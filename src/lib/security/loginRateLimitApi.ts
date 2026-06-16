import { supabase } from '@/lib/supabase'

const DAY_BLOCK_MS = 24 * 60 * 60 * 1000
const LOCAL_BLOCK_KEY = 'gemma_login_ip_block_until'

export type IpBlockStatus = {
  allowed: boolean
  blockedUntil: string | null
  remainingMs: number
}

type RateLimitResponse = {
  allowed: boolean
  blockedUntil?: string
}

function getRemainingMs(blockedUntil: string | null): number {
  if (!blockedUntil) {
    return 0
  }

  return Math.max(0, new Date(blockedUntil).getTime() - Date.now())
}

function formatBlockMessage(remainingMs: number): string {
  const hours = Math.ceil(remainingMs / (60 * 60 * 1000))

  if (hours <= 1) {
    return 'Acesso bloqueado por segurança. Tente novamente em cerca de 1 hora.'
  }

  return `Acesso bloqueado por segurança. Tente novamente em cerca de ${hours} horas.`
}

export { formatBlockMessage, DAY_BLOCK_MS }

function getLocalBlockStatus(): IpBlockStatus | null {
  const stored = sessionStorage.getItem(LOCAL_BLOCK_KEY)

  if (!stored) {
    return null
  }

  const remainingMs = getRemainingMs(stored)

  if (remainingMs <= 0) {
    sessionStorage.removeItem(LOCAL_BLOCK_KEY)
    return null
  }

  return {
    allowed: false,
    blockedUntil: stored,
    remainingMs,
  }
}

function setLocalBlock(): IpBlockStatus {
  const blockedUntil = new Date(Date.now() + DAY_BLOCK_MS).toISOString()
  sessionStorage.setItem(LOCAL_BLOCK_KEY, blockedUntil)

  return {
    allowed: false,
    blockedUntil,
    remainingMs: DAY_BLOCK_MS,
  }
}

export function clearLocalLoginBlock(): void {
  sessionStorage.removeItem(LOCAL_BLOCK_KEY)
}

export async function checkIpBlockStatus(): Promise<IpBlockStatus> {
  const localBlock = getLocalBlockStatus()

  if (localBlock) {
    return localBlock
  }

  const { data, error } = await supabase.functions.invoke<RateLimitResponse>(
    'login-rate-limit',
    { body: { action: 'check' } },
  )

  if (error || !data) {
    return { allowed: true, blockedUntil: null, remainingMs: 0 }
  }

  if (!data.allowed && data.blockedUntil) {
    return {
      allowed: false,
      blockedUntil: data.blockedUntil,
      remainingMs: getRemainingMs(data.blockedUntil),
    }
  }

  return { allowed: true, blockedUntil: null, remainingMs: 0 }
}

export async function blockIpForOneDay(): Promise<IpBlockStatus> {
  const { data, error } = await supabase.functions.invoke<RateLimitResponse>(
    'login-rate-limit',
    { body: { action: 'block' } },
  )

  if (error || !data?.blockedUntil) {
    return setLocalBlock()
  }

  return {
    allowed: false,
    blockedUntil: data.blockedUntil,
    remainingMs: getRemainingMs(data.blockedUntil),
  }
}
