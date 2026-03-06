import { supabase } from "../lib/supabase"
import type { IdeaType } from "./offline/types"

type CaptureMode = "quick" | "deep"

type DeepAnswers = {
  q1: string
  q2: string
  q3: string
}

type GenerateNoteParams = {
  ideaId: string
  ideaType: IdeaType
  rawInput: string
  captureMode: CaptureMode
  deepAnswers?: DeepAnswers
}

type GenerateNoteResponse = {
  markdown: string
  error?: string
}

export async function generateNote(params: GenerateNoteParams): Promise<GenerateNoteResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai_extract_note`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
      },
      body: JSON.stringify({
        idea_id: params.ideaId,
        idea_type: params.ideaType,
        raw_input: params.rawInput,
        timestamp: new Date().toISOString(),
        capture_mode: params.captureMode,
        deep_answers: params.deepAnswers
      })
    })

    if (!response.ok) {
      const error = await response.json()
      return { markdown: "", error: error.error || "Failed to generate note" }
    }

    const data = await response.json()
    return { markdown: data.markdown }
  } catch (error) {
    return { 
      markdown: "", 
      error: error instanceof Error ? error.message : "Network error occurred" 
    }
  }
}