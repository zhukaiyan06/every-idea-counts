import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { getSupabaseClient } from '../_shared/auth.ts'

interface AskRequest {
  idea_id: string
  current_state: string
  current_state_goal: string
  idea_type: string
  raw_input: string
  user_question: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCors(req)
  }

  try {
    const body: AskRequest = await req.json()
    
    if (!body.idea_id || !body.user_question) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = getSupabaseClient(req)
    const provider = Deno.env.get('AI_PROVIDER') || 'glm'
    let answer: string

    if (provider === 'qwen') {
      const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('DASHSCOPE_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages: [
            {
              role: 'system',
              content: \`You are helping clarify questions about an idea. Keep answers short (max 3 sentences) and do not ask counter-questions.\`
            },
            {
              role: 'user',
              content: \`Idea context: \${body.raw_input}\\n\\nUser question: \${body.user_question}\`
            }
          ],
          stream: false,
        }),
      })

      const data = await response.json()
      answer = data.choices?.[0]?.message?.content || ''
    } else {
      const response = await fetch(\`\${Deno.env.get('ZAI_BASE_URL')}/chat/completions\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${Deno.env.get('ZAI_API_KEY')}\`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'glm-4.6',
          messages: [
            {
              role: 'system',
              content: \`You are helping clarify questions about an idea. Keep answers short (max 3 sentences) and do not ask counter-questions.\`
            },
            {
              role: 'user',
              content: \`Idea context: \${body.raw_input}\\n\\nUser question: \${body.user_question}\`
            }
          ],
          stream: false,
        }),
      })

      const data = await response.json()
      answer = data.choices?.[0]?.message?.content || ''
    }

    const sentences = answer.split(/[.!?。！？]+/).filter(s => s.trim().length > 0)
    const limitedAnswer = sentences.slice(0, 3).join('. ') + '.'
    const finalAnswer = limitedAnswer.replace(/[?？]/g, '')

    await supabase.from('idea_messages').insert({
      idea_id: body.idea_id,
      mode: 'ask',
      role: 'assistant',
      content: finalAnswer,
    })

    return new Response(
      JSON.stringify({ answer: finalAnswer }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
