import { useState } from 'react'
import { Page } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { PageMockPreview } from '@/components/page-mock-preview'
import { Edit, Save, X, Loader2 } from 'lucide-react'

interface PageCardProps {
  page: Page
  onUpdate: (page: Page) => void
}

export function PageCard({ page, onUpdate }: PageCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(page.notes || '')

  const handleSave = () => {
    onUpdate({
      ...page,
      notes,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setNotes(page.notes || '')
    setIsEditing(false)
  }

  // 判斷頁面是否完全生成
  const isFullyGenerated = page.features.length > 0 && page.layout && page.mockHtml
  const isGenerating = !isFullyGenerated

  return (
    <Card
      className={`w-full min-h-[600px] flex flex-col transition-all ${
        isGenerating ? 'ring-2 ring-blue-400 ring-opacity-50 animate-pulse' : ''
      }`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {page.name}
                {isGenerating && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
              </h3>
              <Badge variant="secondary" className="text-xs mt-1">
                {page.urlPath}
              </Badge>
            </div>
            {!isEditing && isFullyGenerated && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
          {page.layout ? (
            <p className="text-sm text-muted-foreground mt-2">{page.layout}</p>
          ) : (
            <div className="mt-2 h-10 bg-gray-100 animate-pulse rounded"></div>
          )}
        </div>

        {/* Mock Preview */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">UI 預覽</h4>
          {page.mockHtml ? (
            <div className="h-[400px] overflow-hidden rounded-lg border border-gray-200">
              <div className="transform scale-[0.4] origin-top-left w-[250%] h-[250%]">
                <PageMockPreview html={page.mockHtml} />
              </div>
            </div>
          ) : (
            <div className="h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">生成 UI Mock 中...</p>
                <p className="text-xs text-gray-400 mt-1">請稍候</p>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">功能列表</h4>
          {page.features.length > 0 ? (
            <div className="space-y-2">
              {page.features.map((feature) => (
                <div key={feature.id} className="text-sm">
                  <div className="font-medium text-gray-900">{feature.name}</div>
                  <div className="text-gray-600 text-xs">{feature.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-12 bg-gray-100 animate-pulse rounded"></div>
              <div className="h-12 bg-gray-100 animate-pulse rounded"></div>
              <div className="h-12 bg-gray-100 animate-pulse rounded"></div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <h4 className="text-sm font-medium mb-2">補充說明</h4>
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="針對這個頁面，你可以補充任何額外的需求或說明..."
                rows={4}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-3 w-3 mr-1" />
                  儲存
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="h-3 w-3 mr-1" />
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {page.notes || (isFullyGenerated ? '尚無補充說明' : '生成完成後可編輯')}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
