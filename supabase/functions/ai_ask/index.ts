import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getSupabaseClient, isStrictAuthEnabled } from '../_shared/auth.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

interface AskRequest {
  idea_id: string
  idea_type: 'product' | 'creative' | 'research'
  raw_input: string
  user_question: string
}

const IDEA_TYPES = new Set<AskRequest['idea_type']>(['product', 'creative', 'research'])
const MAX_TEXT_LENGTH = 10000
const MAX_ID_LENGTH = 200
const AI_TIMEOUT_MS = 60000

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

function isAbortError(error: unknown) {
  return (error as { name?: string })?.name === 'AbortError'
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = AI_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) {
    return corsResponse
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  let body: AskRequest
  try {
    body = await req.json()
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' })
  }

  const errors: string[] = []
  const ideaIdError = ensureString('idea_id', body.idea_id, MAX_ID_LENGTH)
  if (ideaIdError) errors.push(ideaIdError)

  const rawInputError = ensureString('raw_input', body.raw_input, MAX_TEXT_LENGTH)
  if (rawInputError) errors.push(rawInputError)

  const questionError = ensureString('user_question', body.user_question, MAX_TEXT_LENGTH)
  if (questionError) errors.push(questionError)

  if (typeof body.idea_type !== 'string' || !IDEA_TYPES.has(body.idea_type)) {
    errors.push('idea_type must be one of product, creative, research')
  }

  if (errors.length > 0) {
    return jsonResponse(400, { error: 'Validation failed', details: errors })
  }

  const strictAuth = isStrictAuthEnabled()

  let supabase: ReturnType<typeof getSupabaseClient>
  try {
    supabase = getSupabaseClient(req)
  } catch (error) {
    return jsonResponse(401, { error: (error as Error).message })
  }

  const provider = (Deno.env.get('AI_PROVIDER') || 'glm').toLowerCase()
  let baseUrl: string
  let apiKey: string | undefined
  let model: string

  if (provider === 'qwen') {
    baseUrl =
      Deno.env.get('DASHSCOPE_BASE_URL') ||
      'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'
    apiKey = Deno.env.get('DASHSCOPE_API_KEY')
    model = Deno.env.get('QWEN_MODEL') || 'qwen-plus'
  } else {
    baseUrl = Deno.env.get('GLM_BASE_URL') || 'https://open.bigmodel.cn/api/paas/v4'
    apiKey = Deno.env.get('GLM_API_KEY')
    model = Deno.env.get('GLM_MODEL') || 'glm-4.7'
  }

  if (!apiKey) {
    return jsonResponse(500, { error: 'AI provider key not configured' })
  }

  let response: Response
  try {
    response = await fetchWithTimeout(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are helping clarify questions about an idea. Keep answers short (max 3 sentences) and do not ask counter-questions.',
          },
          {
            role: 'user',
            content: `Idea context: ${body.raw_input}\n\nUser question: ${body.user_question}`,
          },
        ],
        stream: false,
      }),
    })
  } catch (error) {
    if (isAbortError(error)) {
      return jsonResponse(504, { error: 'AI provider request timed out' })
    }
    return jsonResponse(502, { error: 'AI provider request failed' })
  }

  if (!response.ok) {
    return jsonResponse(502, { error: 'AI provider request failed' })
  }

  let data: { choices?: Array<{ message?: { content?: string } }> }
  try {
    data = await response.json()
  } catch {
    return jsonResponse(502, { error: 'AI provider response invalid' })
  }

  const answer = data.choices?.[0]?.message?.content?.trim() || ''
  const normalizedAnswer = answer.replace(/？/g, '?').trim()
  if (!normalizedAnswer) {
    return jsonResponse(502, { error: 'AI provider response empty' })
  }

  const sentences = normalizedAnswer
    .split(/[.!?。！？]+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0)

  if (sentences.length === 0) {
    return jsonResponse(502, { error: 'AI provider response invalid' })
  }

  const limitedAnswer = sentences.slice(0, 3).join('. ')
  const withoutQuestions = limitedAnswer.replace(/\?/g, '').trim()
  const finalAnswer = withoutQuestions ? `${withoutQuestions}.` : ''

  if (!finalAnswer || finalAnswer.includes('?')) {
    return jsonResponse(502, { error: 'AI provider response invalid' })
  }

  const { error: insertError } = await supabase.from('idea_messages').insert({
    idea_id: body.idea_id,
    mode: 'ask',
    role: 'assistant',
    content: finalAnswer,
  })

  if (insertError && strictAuth) {
    return jsonResponse(500, { error: 'Failed to persist message' })
  }

  return jsonResponse(200, { answer: finalAnswer })
})