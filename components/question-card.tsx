import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Question } from '@/lib/types'

interface QuestionCardProps {
  question: Question
  onAnswerChange: (questionId: string, answer: string | string[]) => void
  answer?: string | string[]
}

export function QuestionCard({ question, onAnswerChange, answer }: QuestionCardProps) {
  const [textInput, setTextInput] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [customInput, setCustomInput] = useState('')

  useEffect(() => {
    if (question.type === 'open' && typeof answer === 'string') {
      setTextInput(answer)
    } else if (question.type === 'single' && typeof answer === 'string') {
      // 檢查答案是否在選項中
      const isInOptions = question.options?.includes(answer)
      if (isInOptions) {
        setSelectedOptions([answer])
        setCustomInput('')
      } else {
        setSelectedOptions([])
        setCustomInput(answer)
      }
    } else if (question.type === 'multiple' && Array.isArray(answer)) {
      const standardOptions = answer.filter(a => question.options?.includes(a))
      const customOptions = answer.filter(a => !question.options?.includes(a))
      setSelectedOptions(standardOptions)
      setCustomInput(customOptions.join('、'))
    }
  }, [answer, question.type, question.options])

  const handleSingleSelect = (option: string) => {
    setSelectedOptions([option])
    setCustomInput('')
    onAnswerChange(question.id, option)
  }

  const handleMultipleSelect = (option: string) => {
    const newSelection = selectedOptions.includes(option)
      ? selectedOptions.filter((o) => o !== option)
      : [...selectedOptions, option]

    setSelectedOptions(newSelection)
    updateMultipleAnswer(newSelection, customInput)
  }

  const handleCustomInputChange = (value: string) => {
    setCustomInput(value)

    if (question.type === 'single') {
      setSelectedOptions([])
      onAnswerChange(question.id, value)
    } else if (question.type === 'multiple') {
      updateMultipleAnswer(selectedOptions, value)
    }
  }

  const updateMultipleAnswer = (options: string[], custom: string) => {
    const customItems = custom.trim() ? custom.split('、').filter(item => item.trim()) : []
    const allAnswers = [...options, ...customItems]
    onAnswerChange(question.id, allAnswers)
  }

  const handleTextChange = (value: string) => {
    setTextInput(value)
    onAnswerChange(question.id, value)
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      background: '📋 背景層',
      feature: '⚙️ 功能層',
      interaction: '🎨 互動層',
      output: '📦 輸出層',
      tech: '⚡ 技術層',
    }
    return labels[category as keyof typeof labels] || category
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      single: '單選',
      multiple: '多選',
      open: '開放式',
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground">
            {getCategoryLabel(question.category)}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {getTypeLabel(question.type)}
          </span>
        </div>
        <h3 className="text-lg font-semibold">{question.question}</h3>
      </div>

      {question.type === 'open' ? (
        <Textarea
          placeholder="請輸入你的答案..."
          value={textInput}
          onChange={(e) => handleTextChange(e.target.value)}
          className="w-full min-h-[100px]"
          rows={4}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {question.options?.map((option, index) => {
              const isSelected = selectedOptions.includes(option)
              return (
                <Button
                  key={index}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (question.type === 'single') {
                      handleSingleSelect(option)
                    } else {
                      handleMultipleSelect(option)
                    }
                  }}
                  className="text-sm"
                >
                  {question.type === 'multiple' && (
                    <span className="mr-1">
                      {isSelected ? '✓' : '○'}
                    </span>
                  )}
                  {option}
                </Button>
              )
            })}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {question.type === 'single' ? '或輸入其他答案：' : '或補充其他選項（用「、」分隔）：'}
            </label>
            <Input
              placeholder={
                question.type === 'single'
                  ? "輸入自訂答案..."
                  : "例如：選項A、選項B"
              }
              value={customInput}
              onChange={(e) => handleCustomInputChange(e.target.value)}
              className="w-full"
            />
          </div>

          {question.type === 'multiple' && (selectedOptions.length > 0 || customInput.trim()) && (
            <div className="text-xs text-muted-foreground">
              已選擇 {selectedOptions.length} 個預設選項
              {customInput.trim() && ` + ${customInput.split('、').filter(item => item.trim()).length} 個自訂選項`}
            </div>
          )}
        </>
      )}
    </Card>
  )
}
