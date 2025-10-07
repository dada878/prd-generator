'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { QuestionCard } from '@/components/question-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Question } from '@/lib/types'
import { Card } from '@/components/ui/card'

export default function Home() {
  const [requirement, setRequirement] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [stage, setStage] = useState<'initial' | 'questioning' | 'generating' | 'done'>('initial')
  const [prd, setPrd] = useState('')

  const handleStartAnalysis = async () => {
    if (!requirement.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: `分析以下需求並生成澄清問題：${requirement}` },
          ],
          mode: 'analyze',
        }),
      })

      const data = await response.json()
      const questionsData = JSON.parse(data.message)
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

  const handleGeneratePRD = async () => {
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
              content: `根據以下資訊生成 PRD：\n初始需求：${requirement}\n\n問答記錄：\n${questions
                .map((q) => `${q.question}\n答：${formatAnswer(answers[q.id])}`)
                .join('\n\n')}`,
            },
          ],
          mode: 'generatePRD',
        }),
      })

      const prdData = await response.json()
      setPrd(prdData.message)
      setStage('done')
    } catch (error) {
      console.error('Error:', error)
      alert('發生錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([prd], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'PRD.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setRequirement('')
    setQuestions([])
    setAnswers({})
    setStage('initial')
    setPrd('')
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
        <h1 className="text-3xl font-bold mb-2">🧠 需求澄清生成器</h1>
        <p className="text-muted-foreground">透過 AI 問答自動生成產品需求文件（PRD）</p>
      </div>

      {stage === 'initial' && (
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
              {isLoading ? '分析中...' : '開始分析'}
            </Button>
          </div>
        </Card>
      )}

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
              onClick={handleGeneratePRD}
              disabled={isLoading || answeredCount === 0}
              className="flex-1"
              size="lg"
            >
              生成 PRD
            </Button>
          </div>
        </>
      )}

      {stage === 'generating' && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="text-4xl">✨</div>
            <h2 className="text-xl font-semibold">正在生成你的 PRD 文件...</h2>
            <Progress value={100} className="w-full" />
          </div>
        </Card>
      )}

      {stage === 'done' && (
        <>
          <Card className="flex-1 p-6 overflow-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {prd}
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
