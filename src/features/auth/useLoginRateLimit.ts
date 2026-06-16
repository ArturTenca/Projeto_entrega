import { useCallback, useEffect, useRef, useState } from 'react'
import {
  blockIpForOneDay,
  checkIpBlockStatus,
  formatBlockMessage,
  type IpBlockStatus,
} from '@/lib/security/loginRateLimitApi'

const MAX_ATTEMPTS = 5
const COOLDOWN_MS = 30_000

type RateLimitPhase = 'normal' | 'cooldown' | 'watch' | 'ip_blocked'

export function useLoginRateLimit() {
  const failedAttemptsRef = useRef(0)
  const [phase, setPhase] = useState<RateLimitPhase>('normal')
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [ipBlock, setIpBlock] = useState<IpBlockStatus | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const isCooldown = phase === 'cooldown' && lockedUntil !== null && now < lockedUntil
  const isIpBlocked = phase === 'ip_blocked' && (ipBlock?.remainingMs ?? 0) > 0
  const isLocked = isCooldown || isIpBlocked

  const remainingSeconds = isCooldown
    ? Math.ceil((lockedUntil! - now) / 1000)
    : 0

  const blockMessage = isIpBlocked
    ? formatBlockMessage(ipBlock?.remainingMs ?? 0)
    : null

  useEffect(() => {
    async function loadIpStatus() {
      const status = await checkIpBlockStatus()

      if (!status.allowed) {
        setIpBlock(status)
        setPhase('ip_blocked')
      }
    }

    void loadIpStatus()
  }, [])

  useEffect(() => {
    if (!isCooldown && !isIpBlocked) {
      return
    }

    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isCooldown, isIpBlocked])

  useEffect(() => {
    if (phase !== 'cooldown' || lockedUntil === null) {
      return
    }

    if (now >= lockedUntil) {
      setLockedUntil(null)
      setPhase('watch')
    }
  }, [phase, lockedUntil, now])

  useEffect(() => {
    if (phase !== 'ip_blocked' || !ipBlock?.blockedUntil) {
      return
    }

    const remaining = new Date(ipBlock.blockedUntil).getTime() - now

    if (remaining <= 0) {
      setIpBlock(null)
      setPhase('normal')
      failedAttemptsRef.current = 0
    } else {
      setIpBlock((previous) =>
        previous
          ? { ...previous, remainingMs: remaining }
          : previous,
      )
    }
  }, [phase, ipBlock?.blockedUntil, now])

  const recordFailure = useCallback(async (): Promise<{
    ipBlocked: boolean
    message?: string
  }> => {
    if (phase === 'watch') {
      const status = await blockIpForOneDay()
      setIpBlock(status)
      setPhase('ip_blocked')
      failedAttemptsRef.current = 0
      return {
        ipBlocked: true,
        message: formatBlockMessage(status.remainingMs),
      }
    }

    failedAttemptsRef.current += 1

    if (failedAttemptsRef.current >= MAX_ATTEMPTS) {
      failedAttemptsRef.current = 0
      setLockedUntil(Date.now() + COOLDOWN_MS)
      setPhase('cooldown')
    }

    return { ipBlocked: false }
  }, [phase])

  const reset = useCallback(() => {
    failedAttemptsRef.current = 0
    setLockedUntil(null)
    setPhase('normal')
  }, [])

  const refreshIpBlock = useCallback(async () => {
    const status = await checkIpBlockStatus()

    if (!status.allowed) {
      setIpBlock(status)
      setPhase('ip_blocked')
      return false
    }

    return true
  }, [])

  return {
    phase,
    isLocked,
    isCooldown,
    isIpBlocked,
    isWatchMode: phase === 'watch',
    remainingSeconds,
    blockMessage,
    recordFailure,
    reset,
    refreshIpBlock,
  }
}
