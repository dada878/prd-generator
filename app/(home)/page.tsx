'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowRight } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [requirement, setRequirement] = useState('')

  const handleStartCreating = () => {
    if (requirement.trim()) {
      // 使用 sessionStorage 來傳遞需求，避免 URL 長度限制問題
      sessionStorage.setItem('prd_requirement', requirement)
      router.push('/create')
    } else {
      router.push('/create')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-2xl space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold">📄 PRD Generator</h1>
          <p className="text-xl text-muted-foreground">
            透過 AI 對話，快速生成專業的產品需求文件
          </p>
        </div>

        <Card className="p-8">
          <div className="space-y-4">
            <Textarea
              placeholder="寫下你的產品 idea...&#10;（支援換行，可輸入詳細需求）"
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              onKeyDown={(e) => {
                // Ctrl/Cmd + Enter 送出
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing) {
                  handleStartCreating()
                }
              }}
              className="text-lg min-h-[120px] resize-none"
              autoFocus
            />
            <div className="text-xs text-muted-foreground text-left">
              💡 提示：按 Ctrl/Cmd + Enter 快速送出
            </div>
            <Button
              onClick={handleStartCreating}
              size="lg"
              className="w-full h-12 text-lg"
            >
              開始生成 PRD
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </Card>

        <div className="flex flex-wrap justify-center gap-2">
          {[
            { emoji: '🍽️', text: '餐廳訂位網站' },
            { emoji: '📝', text: '待辦事項應用' },
            { emoji: '🎓', text: '線上課程平台' },
            { emoji: '🛒', text: '電商購物網站' },
          ].map((example, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => setRequirement(`幫我做一個${example.text}`)}
            >
              {example.emoji} {example.text}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
