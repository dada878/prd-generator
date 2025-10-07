import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { messages, mode } = await req.json()

    const systemPrompts = {
      analyze: `你是一個需求分析專家。分析使用者的模糊需求，判斷需要澄清的關鍵問題。

請根據問題性質生成不同類型的問題：
- **single（單選）**: 只能選一個答案的問題，提供 2-4 個選項
- **multiple（多選）**: 可以選多個答案的問題，提供 3-6 個選項
- **open（開放式）**: 需要自由輸入的問題，不提供選項（options 為空陣列）

請以 JSON 格式回覆，包含以下結構：
{
  "questions": [
    {
      "id": "唯一ID（例如：q1, q2）",
      "category": "background/feature/interaction/output",
      "type": "single/multiple/open",
      "question": "問題內容",
      "options": ["選項1", "選項2", "選項3"] // 開放式問題使用空陣列 []
    }
  ]
}

範例：
{
  "questions": [
    {
      "id": "q1",
      "category": "background",
      "type": "single",
      "question": "這個產品的主要目標使用者是誰？",
      "options": ["個人用戶", "企業用戶", "開發者", "其他"]
    },
    {
      "id": "q2",
      "category": "feature",
      "type": "multiple",
      "question": "你希望包含哪些核心功能？",
      "options": ["數據分析", "即時通知", "協作功能", "自動化流程", "報表生成"]
    },
    {
      "id": "q3",
      "category": "background",
      "type": "open",
      "question": "請詳細描述這個產品要解決的核心問題",
      "options": []
    }
  ]
}`,
      generatePRD: `你是一個產品需求文件（PRD）撰寫專家。根據收集到的需求資訊，生成完整的 PRD 文件。
使用 CAST 框架（Context, Appearance, Structure, Tech Stack）格式，用繁體中文撰寫。`,
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompts[mode as keyof typeof systemPrompts] || systemPrompts.analyze,
        },
        ...messages,
      ],
    })

    return NextResponse.json({
      message: completion.choices[0].message.content,
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
