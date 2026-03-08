import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

type EnvConfig = {
  url: string
  anonKey: string
}

type TestResult = {
  name: string
  ok: boolean
  details?: string
}

const DEFAULT_URL = 'http://localhost:54321'
const PASSWORD = 'local-smoke-Password!123'

function readConfig(): EnvConfig {
  const url = process.env.SUPABASE_URL || DEFAULT_URL
  const anonKey = process.env.SUPABASE_ANON_KEY

  if (!anonKey) {
    throw new Error('SUPABASE_ANON_KEY is required')
  }

  return { url, anonKey }
}

function nowSuffix() {
  return new Date().toISOString().replace(/[-:.TZ]/g, '')
}

function buildEmail(prefix: string) {
  return `rls_smoke_${prefix}_${nowSuffix()}@example.com`
}

async function signUpAndLogin(url: string, anonKey: string, email: string) {
  const client = createClient(url, anonKey)
  const signUp = await client.auth.signUp({ email, password: PASSWORD })
  if (signUp.error && !signUp.error.message.toLowerCase().includes('already registered')) {
    throw new Error(`Sign up failed for ${email}: ${signUp.error.message}`)
  }

  const signIn = await client.auth.signInWithPassword({ email, password: PASSWORD })
  if (signIn.error || !signIn.data.session?.access_token) {
    throw new Error(`Sign in failed for ${email}: ${signIn.error?.message || 'no session'}`)
  }

  const accessToken = signIn.data.session.access_token
  const authed = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })

  return { client: authed, accessToken }
}

async function run() {
  const config = readConfig()
  const results: TestResult[] = []

  const emailA = buildEmail('a')
  const emailB = buildEmail('b')

  const userA = await signUpAndLogin(config.url, config.anonKey, emailA)
  const userB = await signUpAndLogin(config.url, config.anonKey, emailB)

  const ideaId = randomUUID()

  const insertIdea = await userA.client.from('ideas').insert({
    id: ideaId,
    idea_type: 'product',
    title: 'RLS Smoke Test',
    raw_input: 'Ensure cross-user access is blocked.',
    status: 'draft',
  })

  results.push({
    name: 'User A can insert idea',
    ok: !insertIdea.error,
    details: insertIdea.error?.message,
  })

  const insertMessage = await userA.client.from('idea_messages').insert({
    idea_id: ideaId,
    mode: 'incubate',
    role: 'user',
    content: 'Seed message for RLS smoke.',
  })

  results.push({
    name: 'User A can insert message',
    ok: !insertMessage.error,
    details: insertMessage.error?.message,
  })

  const readOwn = await userA.client.from('ideas').select('*').eq('id', ideaId)
  results.push({
    name: 'User A can read own idea',
    ok: !readOwn.error && (readOwn.data?.length || 0) === 1,
    details: readOwn.error?.message,
  })

  const readOther = await userB.client.from('ideas').select('*').eq('id', ideaId)
  results.push({
    name: 'User B cannot read User A idea',
    ok: !readOther.error && (readOther.data?.length || 0) === 0,
    details: readOther.error?.message,
  })

  const updateOther = await userB.client
    .from('ideas')
    .update({ title: 'Unauthorized update' })
    .eq('id', ideaId)
    .select('id')

  results.push({
    name: 'User B cannot update User A idea',
    ok: !updateOther.error && (updateOther.data?.length || 0) === 0,
    details: updateOther.error?.message,
  })

  const readMessageOther = await userB.client
    .from('idea_messages')
    .select('*')
    .eq('idea_id', ideaId)

  results.push({
    name: 'User B cannot read User A messages',
    ok: !readMessageOther.error && (readMessageOther.data?.length || 0) === 0,
    details: readMessageOther.error?.message,
  })

  const failed = results.filter((item) => !item.ok)
  if (failed.length === 0) {
    console.log('PASS: RLS smoke checks succeeded')
    return
  }

  console.error('FAIL: RLS smoke checks failed')
  for (const item of failed) {
    console.error(`- ${item.name}${item.details ? `: ${item.details}` : ''}`)
  }
  process.exit(1)
}

run().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
