import { getSupabaseClient, isStrictAuthEnabled } from "../_shared/auth.ts"
import { corsHeaders, handleCors } from "../_shared/cors.ts"

type CaptureMode = "quick" | "deep"

type DeepAnswers = {
  q1: string
  q2: string
  q3: string
}

type ExtractRequest = {
  idea_id: string
  idea_type: "product" | "creative" | "research"
  raw_input: string
  timestamp: string
  capture_mode: CaptureMode
  deep_answers?: DeepAnswers
  // v1 compatibility
  collected?: Record<string, unknown> | Array<unknown>
}

const IDEA_TYPES = new Set<ExtractRequest["idea_type"]>(["product", "creative", "research"])
const MAX_TEXT_LENGTH = 10000
const MAX_ID_LENGTH = 200
const AI_TIMEOUT_MS = 90000

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  })
}

function ensureString(name: string, value: unknown, maxLength: number) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return `${name} must be a non-empty string`
  }
  if (value.length > maxLength) {
    return `${name} exceeds ${maxLength} characters`
  }
  return null
}

function parseTimestamp(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed
}

function formatTimestamp(value: Date) {
  const iso = value.toISOString()
  return iso.slice(0, 16).replace("T", " ")
}

function extractActionItems(markdown: string) {
  const match = markdown.match(/##\s*📋\s*行动项([\s\S]*?)(?=\n##\s|$)/)
  if (!match) {
    return []
  }
  const section = match[1] || ""
  return section.match(/^- \[ \].+/gm) || []
}

function parseMinutes(text: string) {
  const match = text.match(/(\d{1,3})\s*(min|mins|minute|minutes|分钟)/i)
  if (!match) {
    return null
  }
  const minutes = Number.parseInt(match[1], 10)
  return Number.isFinite(minutes) ? minutes : null
}

function isResearchOrValidation(text: string) {
  return /research|validate|validation|调研|研究|验证/i.test(text)
}

function resolveProvider() {
  const glmKey = Deno.env.get("GLM_API_KEY")
  const qwenKey = Deno.env.get("DASHSCOPE_API_KEY")
  const provider = Deno.env.get("AI_PROVIDER")?.toLowerCase()

  if (provider === "qwen" || (!provider && qwenKey && !glmKey)) {
    return {
      name: "qwen",
      apiKey: qwenKey,
      model: Deno.env.get("QWEN_MODEL") || "qwen-plus",
      baseUrl:
        Deno.env.get("DASHSCOPE_BASE_URL") ||
        "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
    }
  }

  return {
    name: "glm",
    apiKey: glmKey,
    model: Deno.env.get("GLM_MODEL") || "glm-4.7",
    baseUrl: Deno.env.get("GLM_BASE_URL") || "https://open.bigmodel.cn/api/paas/v4"
  }
}

function isAbortError(error: unknown) {
  return (error as { name?: string })?.name === "AbortError"
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

function buildQuickModePrompt(
  ideaType: ExtractRequest["idea_type"],
  rawInput: string,
  formattedTimestamp: string
): string {
  return [
    "You are an expert product/creative/research assistant for Every Idea Counts.",
    "Return ONLY Markdown. No JSON, no code fences, no extra commentary.",
    "",
    "Based on the user's brief idea input, INFER and EXPAND the following:",
    "- Target users and their pain points",
    "- Usage scenarios",
    "- Current alternatives and solutions",
    "- Unique value proposition",
    "",
    "Use the exact template structure and headings (including emoji) below.",
    "Fill all sections with concrete, concise content.",
    "",
    "Action items must include at least 2 checkbox items:",
    "- First item is a quick win that can be done in <= 15 minutes (state the minutes explicitly).",
    "- Second item must be research/validation oriented (use words like research/validate or 调研/验证).",
    "Generate 3-5 short tags in the tags line.",
    "",
    "Template:",
    "# [AI 生成的标题]",
    "",
    "## 💡 核心概念",
    "[1-2 句话总结核心理念]",
    "",
    "## 🎯 解决的问题",
    "[具体描述要解决的痛点]",
    "",
    "## 👥 目标用户",
    "[用户画像描述]",
    "",
    "## ✨ 独特价值",
    "[与竞品的差异化]",
    "",
    "## 🔍 关键洞察",
    "[基于想法推断的深度思考]",
    "",
    "## ❓ 待探索问题",
    "[需要进一步验证的假设]",
    "",
    "## 📋 行动项",
    "- [ ] 具体可执行的下一步",
    "- [ ] 需要调研的信息",
    "- [ ] 可联系的相关人员",
    "",
    "---",
    `*创建时间：${formattedTimestamp}*`,
    "*标签：tag1, tag2, tag3*",
    "",
    "Input:",
    `idea_type: ${ideaType}`,
    `raw_input: ${rawInput}`,
    "capture_mode: quick"
  ].join("\n")
}

function buildDeepModePrompt(
  ideaType: ExtractRequest["idea_type"],
  rawInput: string,
  deepAnswers: DeepAnswers,
  formattedTimestamp: string
): string {
  return [
    "You are an expert product/creative/research assistant for Every Idea Counts.",
    "Return ONLY Markdown. No JSON, no code fences, no extra commentary.",
    "",
    "The user has provided detailed answers to 3 clarifying questions.",
    "Generate a comprehensive note based on BOTH the raw idea AND the user's answers.",
    "",
    "Use the exact template structure and headings (including emoji) below.",
    "Fill all sections with concrete, concise content based on ALL inputs.",
    "",
    "Action items must include at least 2 checkbox items:",
    "- First item is a quick win that can be done in <= 15 minutes (state the minutes explicitly).",
    "- Second item must be research/validation oriented (use words like research/validate or 调研/验证).",
    "Generate 3-5 short tags in the tags line.",
    "",
    "Template:",
    "# [AI 生成的标题]",
    "",
    "## 💡 核心概念",
    "[1-2 句话总结核心理念]",
    "",
    "## 🎯 解决的问题",
    "[具体描述要解决的痛点]",
    "",
    "## 👥 目标用户",
    "[用户画像描述，基于用户回答]",
    "",
    "## ✨ 独特价值",
    "[与竞品的差异化，基于用户对现状的了解]",
    "",
    "## 🔍 关键洞察",
    "[综合用户答案提炼的深度思考]",
    "",
    "## ❓ 待探索问题",
    "[需要进一步验证的假设]",
    "",
    "## 📋 行动项",
    "- [ ] 具体可执行的下一步",
    "- [ ] 需要调研的信息",
    "- [ ] 可联系的相关人员",
    "",
    "---",
    `*创建时间：${formattedTimestamp}*`,
    "*标签：tag1, tag2, tag3*",
    "",
    "Input:",
    `idea_type: ${ideaType}`,
    `raw_input: ${rawInput}`,
    "capture_mode: deep",
    "",
    "User Answers:",
    `Q1: ${deepAnswers.q1}`,
    `Q2: ${deepAnswers.q2}`,
    `Q3: ${deepAnswers.q3}`
  ].join("\n")
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) {
    return corsResponse
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" })
  }

  let body: ExtractRequest
  try {
    body = await req.json()
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" })
  }

  const errors: string[] = []
  const ideaIdError = ensureString("idea_id", body.idea_id, MAX_ID_LENGTH)
  if (ideaIdError) errors.push(ideaIdError)

  if (!IDEA_TYPES.has(body.idea_type)) {
    errors.push("idea_type must be one of product, creative, research")
  }

  const rawInputError = ensureString("raw_input", body.raw_input, MAX_TEXT_LENGTH)
  if (rawInputError) errors.push(rawInputError)

  const timestampError = ensureString("timestamp", body.timestamp, 64)
  if (timestampError) errors.push(timestampError)

  const parsedTimestamp = typeof body.timestamp === "string" ? parseTimestamp(body.timestamp) : null
  if (!parsedTimestamp) {
    errors.push("timestamp must be a valid date string")
  }

  // Validate capture_mode
  if (body.capture_mode !== "quick" && body.capture_mode !== "deep") {
    errors.push("capture_mode must be 'quick' or 'deep'")
  }

  // Validate deep_answers for deep mode
  if (body.capture_mode === "deep") {
    if (!body.deep_answers) {
      errors.push("deep_answers is required for deep mode")
    } else {
      if (!body.deep_answers.q1 || typeof body.deep_answers.q1 !== "string" || !body.deep_answers.q1.trim()) {
        errors.push("deep_answers.q1 must be a non-empty string")
      }
      if (!body.deep_answers.q2 || typeof body.deep_answers.q2 !== "string" || !body.deep_answers.q2.trim()) {
        errors.push("deep_answers.q2 must be a non-empty string")
      }
      if (!body.deep_answers.q3 || typeof body.deep_answers.q3 !== "string" || !body.deep_answers.q3.trim()) {
        errors.push("deep_answers.q3 must be a non-empty string")
      }
    }
  }

  if (errors.length > 0) {
    return jsonResponse(400, { error: "Validation failed", details: errors })
  }

  const strictAuth = isStrictAuthEnabled()

  let supabase: ReturnType<typeof getSupabaseClient>
  try {
    supabase = getSupabaseClient(req)
  } catch (error) {
    return jsonResponse(401, { error: (error as Error).message })
  }

  if (strictAuth) {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
      return jsonResponse(401, { error: "Unauthorized" })
    }

    const allowedEmail = Deno.env.get("ALLOWED_EMAIL")
    if (allowedEmail && userData.user.email?.toLowerCase() !== allowedEmail.toLowerCase()) {
      return jsonResponse(403, { error: "Forbidden" })
    }
  }

  const provider = resolveProvider()
  if (!provider.apiKey) {
    return jsonResponse(500, { error: "AI provider key not configured" })
  }

  const formattedTimestamp = formatTimestamp(parsedTimestamp)
  
  // Build prompt based on capture mode
  const prompt = body.capture_mode === "quick"
    ? buildQuickModePrompt(body.idea_type, body.raw_input, formattedTimestamp)
    : buildDeepModePrompt(body.idea_type, body.raw_input, body.deep_answers!, formattedTimestamp)

  let response: Response
  try {
    response = await fetchWithTimeout(
      `${provider.baseUrl.replace(/\/+$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: provider.model,
          stream: false,
          messages: [
            { role: "system", content: "You generate structured Markdown notes." },
            { role: "user", content: prompt }
          ]
        })
      }
    )
  } catch (error) {
    if (isAbortError(error)) {
      return jsonResponse(504, { error: "AI provider request timed out" })
    }
    return jsonResponse(502, { error: "AI provider request failed" })
  }

  if (!response.ok) {
    return jsonResponse(502, { error: "AI provider request failed" })
  }

  let completion: { choices?: Array<{ message?: { content?: string } }> }
  try {
    completion = await response.json()
  } catch {
    return jsonResponse(502, { error: "AI provider response invalid" })
  }

  const markdown = completion?.choices?.[0]?.message?.content?.trim()
  if (!markdown) {
    return jsonResponse(502, { error: "AI provider response empty" })
  }

  const actionItems = extractActionItems(markdown)
  if (actionItems.length < 2) {
    return jsonResponse(502, { error: "AI provider returned insufficient action items" })
  }

  const firstMinutes = parseMinutes(actionItems[0])
  if (firstMinutes === null || firstMinutes > 15) {
    return jsonResponse(502, { error: "AI provider returned invalid quick-win action item" })
  }

  if (!isResearchOrValidation(actionItems[1])) {
    return jsonResponse(502, { error: "AI provider returned invalid research action item" })
  }

  // Try to find the idea in the database
  const { data: ideaData } = await supabase
    .from("ideas")
    .select("final_note")
    .eq("id", body.idea_id)
    .maybeSingle()

  // If idea exists in DB, update it
  if (ideaData) {
    const delimiter = `---\nAI draft (${formattedTimestamp})\n`
    const existing = ideaData.final_note?.trim() || ""
    const appended = `${existing ? `${existing}\n\n` : ""}${delimiter}${markdown.trim()}\n`

    await supabase
      .from("ideas")
      .update({ final_note: appended })
      .eq("id", body.idea_id)

    await supabase.from("idea_messages").insert({
      idea_id: body.idea_id,
      mode: "incubate",
      role: "assistant",
      content: markdown
    })
  }

  // Always return the generated markdown, even if idea doesn't exist in DB
  return jsonResponse(200, { markdown })
})