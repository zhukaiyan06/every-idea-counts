import { createClient } from '@supabase/supabase-js'

export function isStrictAuthEnabled() {
  return Deno.env.get('STRICT_AUTH')?.toLowerCase() === 'true'
}

export function getSupabaseClient(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (isStrictAuthEnabled() && !authHeader) {
    throw new Error('Missing authorization header')
  }

  const globalHeaders = authHeader ? { Authorization: authHeader } : undefined

  // Use service role key for database operations to bypass RLS
  // Note: SUPABASE_SERVICE_ROLE_KEY is auto-injected by Supabase runtime
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (serviceKey) {
    return createClient(
      Deno.env.get('SUPABASE_URL') || '',
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  }

  return createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_ANON_KEY') || '',
    globalHeaders ? { global: { headers: globalHeaders } } : undefined
  )
}