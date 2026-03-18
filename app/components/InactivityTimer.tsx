'use client'
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const INACTIVE_MINUTES = 30

export default function InactivityTimer() {
  const timer = useRef<NodeJS.Timeout>()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    function resetTimer() {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/login?reason=inactivity')
      }, INACTIVE_MINUTES * 60 * 1000)
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      if (timer.current) clearTimeout(timer.current)
      events.forEach(e => window.removeEventListener(e, resetTimer))
    }
  }, [])

  return null
}
