import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (existingSession) {
        setSession(existingSession)
        setLoading(false)
        return
      }

      // No session - sign in anonymously
      // Workaround: Use signUp endpoint since /auth/v1/anonymous is not available
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/signup`, {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ anonymous: true })
        })
        
        if (response.ok) {
          const data = await response.json()
          // Set the session using the returned tokens
          await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token
          })
        } else {
          console.error('Anonymous sign-in failed')
        }
      } catch (error) {
        console.error('Anonymous sign-in error:', error)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { session, loading }
}
