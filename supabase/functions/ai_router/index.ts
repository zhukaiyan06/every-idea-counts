import { getSupabaseClient } from '../_shared/auth.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

type RouterRequest = {
  idea_id: string
  idea_type: 'product' | 'creative' | 'research'
  current_state: string
  current_state_goal: string
  current_step_index: number
  turn_count_in_state: number
  raw_input: string
  user_latest_reply: string
}

type RouterResponse = {
  action: 'FOLLOW_UP' | 'ADVANCE'
  question: string
}

const MAX_TEXT_LENGTH = 10000
const MAX_STATE_LENGTH = 200
const MAX_GOAL_LENGTH = 1000

const ACTIONS = new Set<RouterResponse['action']>(['FOLLOW_UP', 'ADVANCE'])
const IDEA_TYPES = new Set<RouterRequest['idea_type']>(['product', 'creative', 'research'])

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function ensureString(name: string, value: unknown, maxLength: number) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return `${name} must be a non-empty string`
  }
  if (value.length > maxLength) {
    return `${name} exceeds ${maxLength} characters`
  }
  return null
}

function ensureNumber(name: string, value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return `${name} must be a number`
  }
  return null
}

function normalizeQuestion(question: string) {
  let normalized = question.replace(/？/g, '?').trim()
  const count = (normalized.match(/\?/g) || []).length
  if (count === 0) {
    normalized = `${normalized}?`
  } else if (count > 1) {
    const first = normalized.indexOf('?')
    normalized = `${normalized.slice(0, first)}?`
  }
  return normalized.trim()
}

function extractJson(text: string) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    return null
  }
  const candidate = text.slice(start, end + 1)
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

function resolveProvider() {
  const zaiKey = Deno.env.get('ZAI_API_KEY')
  const qwenKey = Deno.env.get('DASHSCOPE_API_KEY')
  const provider = Deno.env.get('AI_PROVIDER')?.toLowerCase()

  if (provider === 'qwen' || (!provider && qwenKey && !zaiKey)) {
    return {
      name: 'qwen',
      apiKey: qwenKey,
      model: Deno.env.get('QWEN_MODEL') || 'qwen-plus',
      baseUrl:
        Deno.env.get('DASHSCOPE_BASE_URL') ||
        'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    }
  }

  return {
    name: 'glm',
    apiKey: zaiKey,
    model: Deno.env.get('GLM_MODEL') || 'glm-4.6',
    baseUrl: Deno.env.get('ZAI_BASE_URL') || 'https://api.z.ai/api/paas/v4',
  }
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) {
    return corsResponse
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  let body: RouterRequest
  try {
    body = await req.json()
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' })
  }

  const errors: string[] = []
  const ideaIdError = ensureString('idea_id', body.idea_id, 200)
  if (ideaIdError) errors.push(ideaIdError)

  if (!IDEA_TYPES.has(body.idea_type)) {
    errors.push('idea_type must be one of product, creative, research')
  }

  const currentStateError = ensureString('current_state', body.current_state, MAX_STATE_LENGTH)
  if (currentStateError) errors.push(currentStateError)

  const goalError = ensureString('current_state_goal', body.current_state_goal, MAX_GOAL_LENGTH)
  if (goalError) errors.push(goalError)

  const rawInputError = ensureString('raw_input', body.raw_input, MAX_TEXT_LENGTH)
  if (rawInputError) errors.push(rawInputError)

  const latestReplyError = ensureString('user_latest_reply', body.user_latest_reply, MAX_TEXT_LENGTH)
  if (latestReplyError) errors.push(latestReplyError)

  const stepError = ensureNumber('current_step_index', body.current_step_index)
  if (stepError) errors.push(stepError)

  const turnCountError = ensureNumber('turn_count_in_state', body.turn_count_in_state)
  if (turnCountError) errors.push(turnCountError)

  if (errors.length > 0) {
    return jsonResponse(400, { error: 'Validation failed', details: errors })
  }

  let supabase: ReturnType<typeof getSupabaseClient>
  try {
    supabase = getSupabaseClient(req)
  } catch (error) {
    return jsonResponse(401, { error: (error as Error).message })
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return jsonResponse(401, { error: 'Unauthorized' })
  }

  const allowedEmail = Deno.env.get('ALLOWED_EMAIL')
  if (allowedEmail && userData.user.email?.toLowerCase() !== allowedEmail.toLowerCase()) {
    return jsonResponse(403, { error: 'Forbidden' })
  }

  const provider = resolveProvider()
  if (!provider.apiKey) {
    return jsonResponse(500, { error: 'AI provider key not configured' })
  }

  const prompt = [
    'You are the incubation router for Every Idea Counts.',
    'Return ONLY a strict JSON object with keys action and question.',
    'action must be FOLLOW_UP or ADVANCE.',
    'question must be a single concise question ending with one question mark.',
    'Do not include any additional text.',
    `idea_type: ${body.idea_type}`,
    `current_state: ${body.current_state}`,
    `current_state_goal: ${body.current_state_goal}`,
    `current_step_index: ${body.current_step_index}`,
    `turn_count_in_state: ${body.turn_count_in_state}`,
    `raw_input: ${body.raw_input}`,
    `user_latest_reply: ${body.user_latest_reply}`,
  ].join('\n')

  const response = await fetch(
    `${provider.baseUrl.replace(/\/+$/, '')}/chat/completions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: provider.model,
        stream: false,
        messages: [
          { role: 'system', content: 'You route incubation steps.' },
          { role: 'user', content: prompt },
        ],
      }),
    }
  )

  if (!response.ok) {
    return jsonResponse(502, { error: 'AI provider request failed' })
  }

  let completion: { choices?: Array<{ message?: { content?: string } }> }
  try {
    completion = await response.json()
  } catch {
    return jsonResponse(502, { error: 'AI provider response invalid' })
  }

  const content = completion?.choices?.[0]?.message?.content
  if (!content) {
    return jsonResponse(502, { error: 'AI provider response empty' })
  }

  const parsed = extractJson(content)
  if (!parsed) {
    return jsonResponse(502, { error: 'AI provider returned non-JSON output' })
  }

  const action = typeof parsed.action === 'string' ? parsed.action.toUpperCase() : ''
  const question = typeof parsed.question === 'string' ? normalizeQuestion(parsed.question) : ''

  if (!ACTIONS.has(action as RouterResponse['action'])) {
    return jsonResponse(502, { error: 'AI provider returned invalid action' })
  }

  const questionCount = (question.match(/\?/g) || []).length
  if (!question || questionCount !== 1) {
    return jsonResponse(502, { error: 'AI provider returned invalid question' })
  }

  const { error: insertError } = await supabase.from('idea_messages').insert({
    idea_id: body.idea_id,
    mode: 'incubate',
    role: 'assistant',
    content: question,
  })

  if (insertError) {
    return jsonResponse(500, { error: 'Failed to persist message' })
  }

  return jsonResponse(200, { action, question })
})
