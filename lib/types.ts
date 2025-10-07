export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  options?: string[]
}

export type QuestionType = 'single' | 'multiple' | 'open'

export type Category = 'background' | 'feature' | 'interaction' | 'output' | 'tech'

export interface Assumption {
  id: string
  category: Category
  point: string
  reasoning: string
}

export interface Question {
  id: string
  assumptionId?: string
  category: Category
  type: QuestionType
  question: string
  options?: string[]
  answer?: string | string[]
}

export interface TechStackTemplate {
  id: string
  name: string
  description?: string
  stack: string[]
  excludedTech?: string[]
  locked: boolean
}

export interface PRDData {
  requirement: string
  draftPRD?: string
  assumptions?: Assumption[]
  answers: Record<string, string | string[]>
  finalPRD?: string
  techStack?: TechStackTemplate
}
