'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AssumptionCard } from '@/components/assumption-card'
import { QuestionCard } from '@/components/question-card'
import { TechStackTemplateCard } from '@/components/tech-stack-template'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Question, Assumption, TechStackTemplate } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

type Stage = 'initial' | 'draftPRD' | 'assumptions' | 'questioning' | 'generating' | 'done'

export default function Home() {
  const [requirement, setRequirement] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [stage, setStage] = useState<Stage>('initial')

  const [draftPRD, setDraftPRD] = useState('')
  const [assumptions, setAssumptions] = useState<Assumption[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [finalPRD, setFinalPRD] = useState('')
  const [techStack, setTechStack] = useState<TechStackTemplate | undefined>(undefined)

  // Helper: Clean JSON response (remove markdown code blocks)
  const cleanJsonResponse = (text: string): string => {
    return text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()
  }

  // Step 1: Generate draft PRD
  const handleStartAnalysis = async () => {
    if (!requirement.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: requirement },
          ],
          mode: 'draftPRD',
          techStack,
        }),
      })

      const data = await response.json()
      setDraftPRD(data.message)
      setStage('draftPRD')
    } catch (error) {
      console.error('Error:', error)
      alert('發生錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Analyze assumptions
  const handleAnalyzeAssumptions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: `原始需求：${requirement}\n\nPRD 草稿：\n${draftPRD}` },
          ],
          mode: 'analyzeAssumptions',
        }),
      })

      const data = await response.json()
      const cleanedMessage = cleanJsonResponse(data.message)
      const assumptionsData = JSON.parse(cleanedMessage)
      setAssumptions(assumptionsData.assumptions)
      setStage('assumptions')
    } catch (error) {
      console.error('Error:', error)
      alert('發生錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 3: Generate questions from assumptions
  const handleGenerateQuestions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `猜測點列表：\n${assumptions.map(a => `- ${a.point} (${a.reasoning})`).join('\n')}`
            },
          ],
          mode: 'generateQuestions',
        }),
      })

      const data = await response.json()
      const cleanedMessage = cleanJsonResponse(data.message)
      const questionsData = JSON.parse(cleanedMessage)
      setQuestions(questionsData.questions)
      setStage('questioning')
    } catch (error) {
      console.error('Error:', error)
      alert('發生錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  // Step 4: Generate final PRD
  const handleGenerateFinalPRD = async () => {
    setIsLoading(true)
    setStage('generating')

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
              content: `初步 PRD 草稿：\n${draftPRD}\n\n猜測點列表：\n${assumptions.map(a => `- ${a.point}`).join('\n')}\n\n澄清回答：\n${questions
                .map((q) => `${q.question}\n答：${formatAnswer(answers[q.id])}`)
                .join('\n\n')}`,
            },
          ],
          mode: 'generatePRD',
          techStack,
        }),
      })

      const prdData = await response.json()
      setFinalPRD(prdData.message)
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

  const handleReset = () => {
    setRequirement('')
    setDraftPRD('')
    setAssumptions([])
    setQuestions([])
    setAnswers({})
    setFinalPRD('')
    setTechStack(undefined)
    setStage('initial')
  }

  const answeredCount = Object.values(answers).filter((a) => {
    if (Array.isArray(a)) {
      return a.length > 0
    }
    return typeof a === 'string' && a.trim()
  }).length
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🧠 AI 需求澄清生成器</h1>
        <p className="text-muted-foreground">先生成 PRD 草稿 → 分析猜測點 → 針對性提問 → 完善最終 PRD</p>
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
                  placeholder="例如：我想做一個幫人管理任務的 app"
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleStartAnalysis()
                    }
                  }}
                  className="text-base"
                />
              </div>
              <Button
                onClick={handleStartAnalysis}
                disabled={isLoading || !requirement.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span>生成 PRD 草稿中...</span>
                  </div>
                ) : '開始生成 PRD 草稿'}
              </Button>
            </div>
          </Card>

          <TechStackTemplateCard template={techStack} onChange={setTechStack} />

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              💡 或試試範例
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { emoji: '🍽️', title: '餐廳訂位網站', prompt: '幫我做一個餐廳訂位網站' },
                { emoji: '📝', title: '待辦事項網站', prompt: '做一個管理待辦事項的網站' },
                { emoji: '🎓', title: '線上課程平台', prompt: '想做線上課程平台' },
                { emoji: '🏋️', title: '健身記錄網站', prompt: '幫我做健身記錄的網站' },
              ].map((example, index) => (
                <Card
                  key={index}
                  className="p-4 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setRequirement(example.prompt)}
                >
                  <h4 className="font-semibold mb-1">
                    {example.emoji} {example.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">{example.prompt}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stage 2: Draft PRD */}
      {stage === 'draftPRD' && (
        <>
          <Card className="flex-1 p-6 overflow-auto mb-4">
            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ 以下是基於你的需求生成的 <strong>初步 PRD 草稿</strong>。這個草稿包含許多「猜測」和「假設」，因為資訊尚不完整。接下來我們會分析這些猜測點，並向你確認。
              </p>
            </div>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {draftPRD}
              </ReactMarkdown>
            </div>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              重新開始
            </Button>
            <Button
              onClick={handleAnalyzeAssumptions}
              disabled={isLoading}
              className="flex-1"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>分析猜測點中...</span>
                </div>
              ) : '分析猜測點'}
            </Button>
          </div>
        </>
      )}

      {/* Stage 3: Assumptions */}
      {stage === 'assumptions' && (
        <>
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
              🔍 發現 {assumptions.length} 個猜測點
            </h2>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              以下是 PRD 草稿中所有的「猜測」和「假設」。接下來我們會針對每個猜測點向你提問，以確保 PRD 的準確性。
            </p>
          </div>

          <ScrollArea className="flex-1 mb-4">
            <div className="space-y-3 pr-4">
              {assumptions.map((assumption, index) => (
                <AssumptionCard
                  key={assumption.id}
                  assumption={assumption}
                  index={index}
                />
              ))}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              重新開始
            </Button>
            <Button
              onClick={handleGenerateQuestions}
              disabled={isLoading}
              className="flex-1"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>生成澄清問題中...</span>
                </div>
              ) : '開始澄清問題'}
            </Button>
          </div>
        </>
      )}

      {/* Stage 4: Questioning */}
      {stage === 'questioning' && (
        <>
          <div className="mb-4 space-y-2">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                已回答 {answeredCount} / {questions.length} 個問題
              </div>
              <div className="text-sm font-medium">{Math.round(progress)}%</div>
            </div>
            <Progress value={progress} />
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-4 pb-4">
              {questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  onAnswerChange={handleAnswerChange}
                  answer={answers[question.id]}
                />
              ))}
            </div>
          </ScrollArea>

          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              重新開始
            </Button>
            <Button
              onClick={handleGenerateFinalPRD}
              disabled={isLoading || answeredCount === 0}
              className="flex-1"
              size="lg"
            >
              生成最終 PRD
            </Button>
          </div>
        </>
      )}

      {/* Stage 5: Generating */}
      {stage === 'generating' && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Spinner size="lg" className="text-primary" />
            </div>
            <h2 className="text-xl font-semibold">正在生成最終 PRD 文件...</h2>
            <p className="text-muted-foreground">根據你的澄清回答，我們正在完善 PRD...</p>
            <Progress value={100} className="w-full" />
          </div>
        </Card>
      )}

      {/* Stage 6: Done */}
      {stage === 'done' && (
        <>
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✅ 最終 PRD 已生成！所有猜測點都已根據你的回答進行修正。
            </p>
          </div>

          <Card className="flex-1 p-6 overflow-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {finalPRD}
              </ReactMarkdown>
            </div>
          </Card>

          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              重新開始
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
