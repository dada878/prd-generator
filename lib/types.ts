export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  options?: string[]
}

export interface Question {
  id: string
  type: 'single' | 'multiple' | 'boolean'
  question: string
  options: string[]
}

// Page-based types
export interface PageFeature {
  id: string
  name: string
  description: string
}

export interface Page {
  id: string
  name: string
  urlPath: string
  description?: string // 頁面簡介
  features: PageFeature[]
  featuresMarkdown?: string // 功能列表的 Markdown 格式
  layout: string // 描述 UI 排版架構
  notes?: string // 用戶補充的資訊
  deleted?: boolean // 是否標記為刪除
  deleteReason?: string // 刪除理由
}

export interface TechStackTemplate {
  id: string
  name: string
  description?: string
  stack: string[]
  excludedTech?: string[]
  locked: boolean
}

export type PRDMode = 'normal' | 'mvp'

export interface PRDData {
  requirement: string
  pages: Page[]
  finalPRD?: string
  techStack?: TechStackTemplate
  mode?: PRDMode
}
