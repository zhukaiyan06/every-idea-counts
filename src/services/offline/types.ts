export type IdeaType = 'product' | 'creative' | 'research'
export type IdeaStatus = 'draft' | 'incubating' | 'completed' | 'archived'

export interface IdeaRecord {
  id: string
  idea_type: IdeaType
  title: string
  raw_input: string
  status: IdeaStatus
  
  // v2.0 new fields
  capture_mode?: "quick" | "deep"
  deep_answers?: {
    q1: string
    q2: string
    q3: string
  }
  
  // Note
  final_note?: string | null

  // Timestamps
  created_at: string
  updated_at: string
}

export type MutationOpType = 'create' | 'update' | 'delete' | 'archive'

export interface MutationEnvelope {
  idempotency_key: string
  idea_id: string
  op_type: MutationOpType
  payload: Partial<IdeaRecord> | IdeaRecord
  created_at: string
}
