'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { parseJSON } from 'partial-json-parser'
import { PageCard } from '@/components/page-card'
import { PageListEditor } from '@/components/page-list-editor'
import { QuestionCard } from '@/components/question-card'
import { TechStackTemplateCard, DEFAULT_TECH_STACK } from '@/components/tech-stack-template'
import { PRDModeSelector } from '@/components/prd-mode-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Page, TechStackTemplate, Question, PRDMode } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Progress } from '@/components/ui/progress'
import { Copy } from 'lucide-react'

type Stage =
  | 'initial'
  | 'generating-initial-prd'
  | 'initial-prd'
  | 'generating-questions'
  | 'questioning'
  | 'generating-refined-prd'
  | 'refined-prd'
  | 'generating-pages-list'
  | 'editing-pages-list'
  | 'generating-details'
  | 'pages-complete'
  | 'generating-final-prd'
  | 'done'

export default function Home() {
  const [requirement, setRequirement] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [stage, setStage] = useState<Stage>('initial')
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' })

  // 問答相關
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [initialPRD, setInitialPRD] = useState('')
  const [refinedPRD, setRefinedPRD] = useState('')

  // PRD 對話相關
  const [prdChatInput, setPrdChatInput] = useState('')
  const [prdChatHistory, setPrdChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [refinedPrdChatInput, setRefinedPrdChatInput] = useState('')
  const [refinedPrdChatHistory, setRefinedPrdChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [finalPrdChatInput, setFinalPrdChatInput] = useState('')
  const [finalPrdChatHistory, setFinalPrdChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])

  // 頁面相關
  const [pages, setPages] = useState<Page[]>([])
  const [finalPRD, setFinalPRD] = useState('')
  const [techStack, setTechStack] = useState<TechStackTemplate | undefined>(DEFAULT_TECH_STACK)
  const [mode, setMode] = useState<PRDMode>('mvp')

  // Helper: Clean and extract JSON from response
  const cleanJsonResponse = (text: string): string => {
    // 1. 移除 markdown 標記
    let cleaned = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()

    // 2. 裁切字串：從第一個 { 到最後一個 }
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1)
    }

    return cleaned
  }

  // Helper: Parse JSON with partial-json-parser
  const parseJsonSafely = (text: string): any => {
    const cleaned = cleanJsonResponse(text)

    try {
      // 優先使用標準 JSON.parse
      return JSON.parse(cleaned)
    } catch (e) {
      console.warn('Standard JSON.parse failed, using partial-json-parser...', e)
      console.log('Problematic JSON:', cleaned.substring(0, 200))

      try {
        // 使用 partial-json-parser 處理不完整的 JSON
        return parseJSON(cleaned)
      } catch (e2) {
        console.error('Both parsers failed:', e2)
        throw e2
      }
    }
  }

  // Step 1: Generate initial PRD with streaming
  const handleGenerateInitialPRD = async () => {
    if (!requirement.trim()) return

    setIsLoading(true)
    setStage('generating-initial-prd')
    setInitialPRD('') // 清空之前的內容

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: requirement },
          ],
          mode: 'generateInitialPRD',
          techStack,
          prdMode: mode,
          stream: true,
        }),
      })

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        accumulatedText += chunk
        setInitialPRD(accumulatedText)
      }

      setStage('initial-prd')
    } catch (error) {
      console.error('Error:', error)
      alert('發生錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 1.5: Chat with PRD and refine it
  const handlePRDChat = async () => {
    if (!prdChatInput.trim()) return

    setIsLoading(true)
    const userMessage = prdChatInput.trim()
    setPrdChatInput('')

    // 添加用戶訊息到歷史
    const newHistory = [...prdChatHistory, { role: 'user' as const, content: userMessage }]
    setPrdChatHistory(newHistory)

    try {
      // 構建完整的對話上下文
      const messages = [
        { role: 'system', content: `當前 PRD 內容：\n${initialPRD}` },
        ...newHistory.map(msg => ({ role: msg.role, content: msg.content })),
      ]

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          mode: 'refinePRDChat',
          techStack,
          prdMode: mode,
          stream: true,
        }),
      })

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        accumulatedText += chunk
        setInitialPRD(accumulatedText)
      }

      // 添加 AI 回應到歷史（簡化版，只記錄修改了 PRD）
      setPrdChatHistory([...newHistory, { role: 'assistant', content: '已根據你的意見更新 PRD' }])
    } catch (error) {
      console.error('Error:', error)
      alert('發生錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 1.6: Chat with Refined PRD and adjust it
  const handleRefinedPRDChat = async () => {
    if (!refinedPrdChatInput.trim()) return

    setIsLoading(true)
    const userMessage = refinedPrdChatInput.trim()
    setRefinedPrdChatInput('')

    // 添加用戶訊息到歷史
    const newHistory = [...refinedPrdChatHistory, { role: 'user' as const, content: userMessage }]
    setRefinedPrdChatHistory(newHistory)

    try {
      // 構建完整的對話上下文
      const messages = [
        { role: 'system', content: `當前精煉 PRD 內容：\n${refinedPRD}` },
        ...newHistory.map(msg => ({ role: msg.role, content: msg.content })),
      ]

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          mode: 'refinePRDChat',
          techStack,
          prdMode: mode,
          stream: true,
        }),
      })

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        accumulatedText += chunk
        setRefinedPRD(accumulatedText)
      }

      // 添加 AI 回應到歷史
      setRefinedPrdChatHistory([...newHistory, { role: 'assistant', content: '已根據你的意見更新精煉 PRD' }])
    } catch (error) {
      console.error('Error:', error)
      alert('發生錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 1.7: Chat with Final PRD and adjust it
  const handleFinalPRDChat = async () => {
    if (!finalPrdChatInput.trim()) return

    setIsLoading(true)
    const userMessage = finalPrdChatInput.trim()
    setFinalPrdChatInput('')

    // 添加用戶訊息到歷史
    const newHistory = [...finalPrdChatHistory, { role: 'user' as const, content: userMessage }]
    setFinalPrdChatHistory(newHistory)

    try {
      // 構建完整的對話上下文
      const messages = [
        { role: 'system', content: `當前完整 PRD 內容：\n${finalPRD}` },
        ...newHistory.map(msg => ({ role: msg.role, content: msg.content })),
      ]

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          mode: 'refinePRDChat',
          techStack,
          prdMode: mode,
          stream: true,
        }),
      })

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        accumulatedText += chunk
        setFinalPRD(accumulatedText)
      }

      // 添加 AI 回應到歷史
      setFinalPrdChatHistory([...newHistory, { role: 'assistant', content: '已根據你的意見更新完整 PRD' }])
    } catch (error) {
      console.error('Error:', error)
      alert('發生錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Generate clarification questions
  const handleGenerateQuestions = async () => {
    setIsLoading(true)
    setStage('generating-questions')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: `分析以下需求並生成澄清問題：${requirement}` },
          ],
          mode: 'analyze',
          prdMode: mode,
        }),
      })

      const data = await response.json()
      const questionsData = parseJsonSafely(data.message)
      setQuestions(questionsData.questions)
      setStage('questioning')
    } catch (error) {
      console.error('Error:', error)
      alert('發生錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2.5: Generate more clarification questions based on current answers
  const handleGenerateMoreQuestions = async () => {
    setIsLoading(true)

    try {
      const formatAnswer = (answer: string | string[] | undefined) => {
        if (!answer) return '未回答'
        if (Array.isArray(answer)) {
          return answer.length > 0 ? answer.join('、') : '未回答'
        }
        return answer
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `根據以下已經回答的需求澄清問題，生成更多深入的澄清問題：

初始需求：${requirement}

已回答的問題：
${questions.map((q) => `問：${q.question}\n答：${formatAnswer(answers[q.id])}`).join('\n\n')}

請基於這些已有的資訊，生成 3-5 個更深入、更具體的澄清問題，幫助進一步理解產品需求。`,
            },
          ],
          mode: 'analyze',
          prdMode: mode,
        }),
      })

      const data = await response.json()
      const questionsData = parseJsonSafely(data.message)

      // 將新問題添加到現有問題列表中
      const newQuestions = questionsData.questions.map((q: Question, index: number) => ({
        ...q,
        id: `q${questions.length + index + 1}`, // 確保 ID 不重複
      }))

      setQuestions([...questions, ...newQuestions])
    } catch (error) {
      console.error('Error:', error)
      alert('發生錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Generate refined PRD based on Q&A with streaming
  const handleGenerateRefinedPRD = async () => {
    setIsLoading(true)
    setStage('generating-refined-prd')
    setRefinedPRD('') // 清空之前的內容

    try {
      const formatAnswer = (answer: string | string[] | undefined) => {
        if (!answer) return '未回答'
        if (Array.isArray(answer)) {
          return answer.length > 0 ? answer.join('、') : '未回答'
        }
        return answer
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `根據以下資訊生成精煉後的 PRD：\n初始需求：${requirement}\n\n問答記錄：\n${questions
                .map((q) => `${q.question}\n答：${formatAnswer(answers[q.id])}`)
                .join('\n\n')}`,
            },
          ],
          mode: 'generateRefinedPRD',
          techStack,
          prdMode: mode,
          stream: true,
        }),
      })

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        accumulatedText += chunk
        setRefinedPRD(accumulatedText)
      }

      setStage('refined-prd')
    } catch (error) {
      console.error('Error:', error)
      alert('發生錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 4: Generate pages list (only basic info)
  const handleGeneratePagesList = async () => {
    if (!requirement.trim()) return

    setIsLoading(true)
    setStage('generating-pages-list')

    try {
      // 生成頁面列表
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: requirement },
          ],
          mode: 'generatePagesList',
          techStack,
          prdMode: mode,
        }),
      })

      const data = await response.json()
      const pagesListData = parseJsonSafely(data.message)

      // 初始化頁面（只有基本資訊）
      const initialPages: Page[] = pagesListData.pages.map((p: any) => ({
        ...p,
        features: [],
        layout: '',
      }))

      setPages(initialPages)
      setStage('editing-pages-list')
    } catch (error) {
      console.error('Error:', error)
      alert('發生錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Generate details for all pages
  const handleGenerateDetails = async () => {
    setIsLoading(true)
    setStage('generating-details')

    try {
      // 過濾掉已刪除的頁面
      const activePages = pages.filter(p => !p.deleted)

      // 逐個生成頁面的完整資訊（詳細功能）
      for (let i = 0; i < activePages.length; i++) {
        const page = activePages[i]

        // 生成功能列表和 UI 架構
        setProgress({
          current: i + 1,
          total: activePages.length,
          message: `生成「${page.name}」的功能列表... (頁面 ${i + 1}/${activePages.length})`
        })

        // 組合 prompt，包含備註
        const notesText = page.notes ? `\n\n用戶備註：${page.notes}` : ''
        const detailsResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content: `原始需求：${requirement}\n\n頁面資訊：\n名稱：${page.name}\nURL：${page.urlPath}\n描述：${page.description}${notesText}\n\n請為這個頁面生成詳細的功能列表和 UI 架構描述。`
              },
            ],
            mode: 'generatePageDetails',
            techStack,
            prdMode: mode,
          }),
        })

        const detailsData = await detailsResponse.json()
        const details = parseJsonSafely(detailsData.message)

        // 立即更新這個頁面的詳細資訊
        setPages(prev => prev.map(p =>
          p.id === page.id
            ? { ...p, features: details.features, layout: details.layout }
            : p
        ))
      }

      // 全部完成
      setStage('pages-complete')
      setProgress({ current: 0, total: 0, message: '' })
    } catch (error) {
      console.error('Error:', error)
      alert('發生錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  // Update page
  const handleUpdatePage = (updatedPage: Page) => {
    setPages(pages.map(p => p.id === updatedPage.id ? updatedPage : p))
  }

  // Handle answer change
  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  // Step 7: Generate final PRD with streaming
  const handleGenerateFinalPRD = async () => {
    setIsLoading(true)
    setStage('generating-final-prd')
    setFinalPRD('') // 清空之前的內容

    try {
      // 處理未刪除的頁面
      const activePages = pages.filter(p => !p.deleted)
      const pagesDescription = activePages
        .map(p => {
          const featuresText = p.features.map(f => `  - ${f.name}: ${f.description}`).join('\n')
          const notesText = p.notes ? `\n  補充說明：${p.notes}` : ''
          return `## ${p.name} (${p.urlPath})\n排版架構：${p.layout}\n功能：\n${featuresText}${notesText}`
        })
        .join('\n\n')

      // 處理已刪除的頁面（讓 AI 知道哪些頁面被移除以及原因）
      const deletedPages = pages.filter(p => p.deleted)
      const deletedPagesInfo = deletedPages.length > 0
        ? `\n\n## 已移除的頁面\n以下頁面在初期規劃後被移除：\n${deletedPages.map(p => {
            const reasonText = p.deleteReason ? ` - 移除理由：${p.deleteReason}` : ''
            return `- ${p.name} (${p.urlPath})${reasonText}`
          }).join('\n')}`
        : ''

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `原始需求：${requirement}\n\n頁面詳情：\n${pagesDescription}${deletedPagesInfo}`,
            },
          ],
          mode: 'generatePRD',
          techStack,
          prdMode: mode,
          stream: true,
        }),
      })

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        accumulatedText += chunk
        setFinalPRD(accumulatedText)
      }

      setStage('done')
    } catch (error) {
      console.error('Error:', error)
      alert('發生錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([finalPRD], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'PRD.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(finalPRD)
      alert('已複製到剪貼簿！')
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('複製失敗，請稍後再試')
    }
  }

  const handleReset = () => {
    setRequirement('')
    setPages([])
    setFinalPRD('')
    setInitialPRD('')
    setRefinedPRD('')
    setTechStack(undefined)
    setMode('normal')
    setStage('initial')
    setProgress({ current: 0, total: 0, message: '' })
    setPrdChatInput('')
    setPrdChatHistory([])
    setRefinedPrdChatInput('')
    setRefinedPrdChatHistory([])
    setFinalPrdChatInput('')
    setFinalPrdChatHistory([])
    setQuestions([])
    setAnswers({})
  }

  return (
    <div className="flex flex-col h-screen w-full p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">📄 Page-Based PRD Generator</h1>
        <p className="text-muted-foreground">模糊需求 → 頁面列表 → 功能詳情 → Mock UI → 完整 PRD</p>
      </div>

      {/* Stage 1: Initial Input */}
      {stage === 'initial' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  請描述你想做什麼產品或功能？
                </label>
                <Input
                  placeholder="例如：我想做一個餐廳訂位網站"
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleGeneratePages()
                    }
                  }}
                  className="text-base"
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">💡 或試試範例：</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { emoji: '🍽️', prompt: '餐廳訂位網站' },
                    { emoji: '📝', prompt: '待辦事項網站' },
                    { emoji: '🎓', prompt: '線上課程平台' },
                    { emoji: '🏋️', prompt: '健身記錄網站' },
                    { emoji: '🛒', prompt: '電商購物平台' },
                    { emoji: '💰', prompt: '記帳理財工具' },
                    { emoji: '✈️', prompt: '旅遊規劃平台' },
                    { emoji: '👥', prompt: '社群交友網站' },
                    { emoji: '📚', prompt: '電子書閱讀器' },
                  ].map((example, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setRequirement(`幫我做一個${example.prompt}`)}
                      className="text-xs"
                    >
                      {example.emoji} {example.prompt}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerateInitialPRD}
                disabled={isLoading || !requirement.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span>分析需求中...</span>
                  </div>
                ) : '開始分析需求'}
              </Button>
            </div>
          </Card>

          <TechStackTemplateCard template={techStack} onChange={setTechStack} />

          <PRDModeSelector mode={mode} onChange={setMode} />
        </div>
      )}

      {/* Stage 2: Generating Initial PRD */}
      {stage === 'generating-initial-prd' && (
        <>
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                正在生成初始 PRD，請稍候...
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
            {/* Left: PRD Content */}
            <Card className="p-6 overflow-auto">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {initialPRD || '正在生成中...'}
                </ReactMarkdown>
              </div>
            </Card>

            {/* Right: Chat Interface (Disabled) */}
            <div className="flex flex-col">
              <Card className="flex-1 flex flex-col min-h-0 opacity-50 cursor-not-allowed">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">💬 與 AI 對話調整 PRD</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    例如：「這應該只需要給單一店家使用」
                  </p>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-auto p-4 space-y-3">
                  <div className="text-center text-sm text-muted-foreground py-8">
                    在此輸入你的意見，AI 會幫你調整 PRD
                  </div>
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="輸入你的意見..."
                      disabled
                    />
                    <Button
                      disabled
                      size="sm"
                    >
                      發送
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Stage 3: Initial PRD */}
      {stage === 'initial-prd' && (
        <>
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ✅ 初始 PRD 已生成！你可以在下方與 AI 對話調整 PRD，或選擇進入下一階段。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
            {/* Left: PRD Content */}
            <Card className="p-6 overflow-auto">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {initialPRD}
                </ReactMarkdown>
              </div>
            </Card>

            {/* Right: Chat Interface */}
            <div className="flex flex-col">
              <Card className="flex-1 flex flex-col min-h-0">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">💬 與 AI 對話調整 PRD</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    例如：「這應該只需要給單一店家使用」
                  </p>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-auto p-4 space-y-3">
                  {prdChatHistory.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      在此輸入你的意見，AI 會幫你調整 PRD
                    </div>
                  )}
                  {prdChatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-8'
                          : 'bg-muted mr-8'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mr-8">
                      <Spinner size="sm" />
                      <p className="text-sm text-muted-foreground">AI 正在調整 PRD...</p>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="輸入你的意見..."
                      value={prdChatInput}
                      onChange={(e) => setPrdChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handlePRDChat()
                        }
                      }}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handlePRDChat}
                      disabled={isLoading || !prdChatInput.trim()}
                      size="sm"
                    >
                      發送
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              重新開始
            </Button>
            <Button onClick={handleGenerateQuestions} className="flex-1" size="lg">
              進入需求澄清
            </Button>
          </div>
        </>
      )}

      {/* Stage 4: Generating Questions */}
      {stage === 'generating-questions' && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Spinner size="lg" className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold">生成澄清問題...</h2>
            <p className="text-sm text-muted-foreground">
              正在分析需求並生成針對性的澄清問題...
            </p>
          </div>
        </Card>
      )}

      {/* Stage 5: Questioning */}
      {stage === 'questioning' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h2 className="text-lg font-semibold mb-1 text-blue-900 dark:text-blue-100">
              🤔 需求澄清 ({Object.values(answers).filter((a) => {
                if (Array.isArray(a)) return a.length > 0
                return typeof a === 'string' && a.trim()
              }).length}/{questions.length})
            </h2>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              請回答以下問題，幫助我們更好地理解你的需求
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onAnswerChange={handleAnswerChange}
                answer={answers[question.id]}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStage('initial-prd')}>
              返回初始 PRD
            </Button>
            <Button
              variant="secondary"
              onClick={handleGenerateMoreQuestions}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>生成更多問題...</span>
                </div>
              ) : '繼續澄清'}
            </Button>
            <Button onClick={handleGenerateRefinedPRD} className="flex-1" size="lg">
              完成澄清
            </Button>
          </div>
        </div>
      )}

      {/* Stage 6: Generating Refined PRD */}
      {stage === 'generating-refined-prd' && (
        <>
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                正在生成精煉 PRD，整合你的回答...
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
            {/* Left: PRD Content */}
            <Card className="p-6 overflow-auto">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {refinedPRD || '正在生成中...'}
                </ReactMarkdown>
              </div>
            </Card>

            {/* Right: Chat Interface (Disabled) */}
            <div className="flex flex-col">
              <Card className="flex-1 flex flex-col min-h-0 opacity-50 cursor-not-allowed">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">💬 與 AI 對話調整 PRD</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    例如：「功能優先級需要調整」
                  </p>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-auto p-4 space-y-3">
                  <div className="text-center text-sm text-muted-foreground py-8">
                    在此輸入你的意見，AI 會幫你調整精煉 PRD
                  </div>
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="輸入你的意見..."
                      disabled
                    />
                    <Button
                      disabled
                      size="sm"
                    >
                      發送
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Stage 7: Refined PRD */}
      {stage === 'refined-prd' && (
        <>
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✅ 精煉 PRD 已生成！你可以在下方與 AI 對話調整 PRD，或選擇進入頁面規劃階段。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
            {/* Left: PRD Content */}
            <Card className="p-6 overflow-auto">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {refinedPRD}
                </ReactMarkdown>
              </div>
            </Card>

            {/* Right: Chat Interface */}
            <div className="flex flex-col">
              <Card className="flex-1 flex flex-col min-h-0">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">💬 與 AI 對話調整 PRD</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    例如：「功能優先級需要調整」
                  </p>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-auto p-4 space-y-3">
                  {refinedPrdChatHistory.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      在此輸入你的意見，AI 會幫你調整精煉 PRD
                    </div>
                  )}
                  {refinedPrdChatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-8'
                          : 'bg-muted mr-8'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mr-8">
                      <Spinner size="sm" />
                      <p className="text-sm text-muted-foreground">AI 正在調整 PRD...</p>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="輸入你的意見..."
                      value={refinedPrdChatInput}
                      onChange={(e) => setRefinedPrdChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleRefinedPRDChat()
                        }
                      }}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleRefinedPRDChat}
                      disabled={isLoading || !refinedPrdChatInput.trim()}
                      size="sm"
                    >
                      發送
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              重新開始
            </Button>
            <Button onClick={handleGeneratePagesList} className="flex-1" size="lg">
              進入頁面規劃
            </Button>
          </div>
        </>
      )}

      {/* Stage 8: Generating Pages List */}
      {stage === 'generating-pages-list' && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Spinner size="lg" className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold">分析需求，生成頁面列表...</h2>
            <p className="text-sm text-muted-foreground">
              正在分析你的需求並規劃所需的頁面...
            </p>
          </div>
        </Card>
      )}

      {/* Stage 9: Editing Pages List */}
      {stage === 'editing-pages-list' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h2 className="text-lg font-semibold mb-1 text-blue-900 dark:text-blue-100">
              📝 已生成 {pages.filter(p => !p.deleted).length} 個頁面
            </h2>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              請檢視並編輯頁面列表，你可以新增、移除或修改頁面資訊，也可以為每個頁面添加特殊需求備註
            </p>
          </div>
          <PageListEditor
            pages={pages}
            onUpdate={setPages}
            onConfirm={handleGenerateDetails}
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              重新開始
            </Button>
          </div>
        </div>
      )}

      {/* Stage 10: Generating Details */}
      {stage === 'generating-details' && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                🔄 正在生成頁面詳細資訊
              </h2>
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  {Math.round((progress.current / progress.total) * 100)}%
                </span>
              </div>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              {progress.message}
            </p>
            <Progress value={(progress.current / progress.total) * 100} className="h-2" />
          </div>

          {/* Pages Grid Layout - Show pages as they generate */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-6 p-6">
              {pages.filter(p => !p.deleted).map((page) => (
                <PageCard
                  key={page.id}
                  page={page}
                  onUpdate={handleUpdatePage}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stage 11: Pages Complete */}
      {stage === 'pages-complete' && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <h2 className="text-lg font-semibold mb-1 text-green-900 dark:text-green-100">
              ✅ 已完成 {pages.filter(p => !p.deleted).length} 個頁面
            </h2>
            <p className="text-sm text-green-800 dark:text-green-200">
              所有頁面的詳細資訊和 UI Mock 已生成完成，請檢視每個頁面，你可以針對各頁面補充額外的需求說明
            </p>
          </div>

          {/* Pages Grid Layout */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-6 p-6">
              {pages.filter(p => !p.deleted).map((page) => (
                <PageCard
                  key={page.id}
                  page={page}
                  onUpdate={handleUpdatePage}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              重新開始
            </Button>
            <Button
              onClick={handleGenerateFinalPRD}
              disabled={isLoading}
              className="flex-1"
              size="lg"
            >
              生成最終 PRD
            </Button>
          </div>
        </div>
      )}

      {/* Stage 12: Generating Final PRD */}
      {stage === 'generating-final-prd' && (
        <>
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                正在生成最終 PRD，整合所有頁面資訊...
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
            {/* Left: PRD Content */}
            <Card className="p-6 overflow-auto">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {finalPRD || '正在生成中...'}
                </ReactMarkdown>
              </div>
            </Card>

            {/* Right: Chat Interface (Disabled) */}
            <div className="flex flex-col">
              <Card className="flex-1 flex flex-col min-h-0 opacity-50 cursor-not-allowed">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">💬 與 AI 對話調整 PRD</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    例如：「調整技術架構說明」
                  </p>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-auto p-4 space-y-3">
                  <div className="text-center text-sm text-muted-foreground py-8">
                    在此輸入你的意見，AI 會幫你調整完整 PRD
                  </div>
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="輸入你的意見..."
                      disabled
                    />
                    <Button
                      disabled
                      size="sm"
                    >
                      發送
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Stage 13: Done */}
      {stage === 'done' && (
        <>
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✅ 完整 PRD 已生成！已整合所有 {pages.filter(p => !p.deleted).length} 個頁面的詳細資訊。你可以在下方與 AI 對話調整 PRD，或直接下載。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
            {/* Left: PRD Content */}
            <Card className="p-6 overflow-auto">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {finalPRD}
                </ReactMarkdown>
              </div>
            </Card>

            {/* Right: Chat Interface */}
            <div className="flex flex-col">
              <Card className="flex-1 flex flex-col min-h-0">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">💬 與 AI 對話調整 PRD</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    例如：「調整技術架構說明」
                  </p>
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-auto p-4 space-y-3">
                  {finalPrdChatHistory.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      在此輸入你的意見，AI 會幫你調整完整 PRD
                    </div>
                  )}
                  {finalPrdChatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-8'
                          : 'bg-muted mr-8'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mr-8">
                      <Spinner size="sm" />
                      <p className="text-sm text-muted-foreground">AI 正在調整 PRD...</p>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="輸入你的意見..."
                      value={finalPrdChatInput}
                      onChange={(e) => setFinalPrdChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleFinalPRDChat()
                        }
                      }}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleFinalPRDChat}
                      disabled={isLoading || !finalPrdChatInput.trim()}
                      size="sm"
                    >
                      發送
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              重新開始
            </Button>
            <Button onClick={handleCopy} variant="outline" size="lg">
              <Copy className="h-4 w-4 mr-2" />
              複製 PRD
            </Button>
            <Button onClick={handleDownload} className="flex-1" size="lg">
              📥 下載 PRD (Markdown)
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
