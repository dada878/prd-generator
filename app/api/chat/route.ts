import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { messages, mode, techStack } = await req.json()

    const getTechStackConstraint = () => {
      if (!techStack || !techStack.locked) return ''

      const stackList = techStack.stack.join('、')
      const excludedList = techStack.excludedTech?.length
        ? `\n\n**嚴格禁止使用**：${techStack.excludedTech.join('、')}`
        : ''

      return `\n\n**Tech Stack 限制（必須遵守）**：
此專案必須使用以下技術堆疊：${stackList}${excludedList}
請不要建議或使用任何不在此列表中的技術。`
    }

    const systemPrompts = {
      draftPRD: `你是一個產品需求文件（PRD）撰寫專家。根據使用者提供的需求，生成完整的 PRD 文件。

使用 CAST 框架（Context, Appearance, Structure, Tech Stack）格式，用繁體中文撰寫。
請盡可能詳細地描述產品的各個方面，包含所有必要的細節和規格。${getTechStackConstraint()}`,

      analyzeAssumptions: `你是一個需求分析專家。請比較「原始需求」和「生成的 PRD」，找出所有**功能性需求的猜測**。

**重點**：
- 只列出「具體功能、使用者類型、技術選擇、互動方式」等需要向用戶確認的猜測
- **不要列出**：產業背景描述、市場趨勢分析、通用的設計原則等鋪陳性內容

**應該列為猜測的範例**：
✅ 目標用戶是個人還是企業
✅ 需要會員系統嗎
✅ 支援手機 App 還是只要網頁
✅ 需要金流功能嗎
✅ 需要後台管理系統嗎

**不應該列為猜測的範例**：
❌ 「隨著餐飲業數位化趨勢...」（產業背景）
❌ 「採用響應式設計提升體驗」（通用設計原則）
❌ 「確保資料安全性」（基本要求）

**重要**：請直接回傳純 JSON 格式，不要包含 \`\`\`json 或任何 markdown 標記。

JSON 格式：
{
  "assumptions": [
    {
      "id": "唯一ID（例如：a1, a2）",
      "category": "background/feature/interaction/output/tech",
      "point": "PRD 中的具體功能或選擇",
      "reasoning": "原始需求中缺少此資訊"
    }
  ]
}`,

      generateQuestions: `你是一個需求澄清專家。根據剛才分析出的猜測點，為每個猜測點生成對應的澄清問題。

請根據問題性質生成不同類型的問題：
- **single（單選）**: 只能選一個答案的問題，提供 2-4 個選項
- **multiple（多選）**: 可以選多個答案的問題，提供 3-6 個選項
- **open（開放式）**: 需要自由輸入的問題，不提供選項（options 為空陣列）

**重要**：請直接回傳純 JSON 格式，不要包含 \`\`\`json 或任何 markdown 標記。

JSON 格式：
{
  "questions": [
    {
      "id": "唯一ID（例如：q1, q2）",
      "assumptionId": "對應的猜測點 ID",
      "category": "background/feature/interaction/output/tech",
      "type": "single/multiple/open",
      "question": "問題內容",
      "options": ["選項1", "選項2", "選項3"] // 開放式問題使用空陣列 []
    }
  ]
}`,

      generatePRD: `你是一個產品需求文件（PRD）撰寫專家。根據：
1. 初步 PRD 草稿
2. 猜測點列表
3. 使用者的澄清回答

生成最終的、完整的、精確的 PRD 文件。

使用 CAST 框架（Context, Appearance, Structure, Tech Stack）格式，用繁體中文撰寫。
確保所有之前的猜測都已根據用戶回答進行修正。${getTechStackConstraint()}`,
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
