export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  options?: string[]
}

export type QuestionType = 'single' | 'multiple' | 'open'

export interface Question {
  id: string
  category: 'background' | 'feature' | 'interaction' | 'output'
  type: QuestionType
  question: string
  options?: string[]
  answer?: string | string[]
}

export interface PRDData {
  requirement: string
  answers: Record<string, string | string[]>
  prd?: string
}
