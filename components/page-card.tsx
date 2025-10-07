import { useState } from 'react'
import { Page, PageFeature } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Trash2 } from 'lucide-react'

interface PageCardProps {
  page: Page
  onUpdate: (page: Page) => void
}

export function PageCard({ page, onUpdate }: PageCardProps) {
  const handleAddFeature = () => {
    const newFeature: PageFeature = {
      id: `f${Date.now()}`,
      name: '',
      description: '',
    }
    onUpdate({
      ...page,
      features: [...page.features, newFeature],
    })
  }

  const handleRemoveFeature = (id: string) => {
    onUpdate({
      ...page,
      features: page.features.filter(f => f.id !== id),
    })
  }

  const handleUpdateFeature = (id: string, field: 'name' | 'description', value: string) => {
    onUpdate({
      ...page,
      features: page.features.map(f =>
        f.id === id ? { ...f, [field]: value } : f
      ),
    })
  }

  const handleNotesChange = (value: string) => {
    onUpdate({
      ...page,
      notes: value,
    })
  }

  // 判斷頁面是否完全生成
  const isFullyGenerated = page.features.length > 0 && page.layout
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
          </div>
          {page.layout ? (
            <p className="text-sm text-muted-foreground mt-2">{page.layout}</p>
          ) : (
            <div className="mt-2 h-10 bg-gray-100 animate-pulse rounded"></div>
          )}
        </div>

        {/* Features */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">功能列表</h4>
          {page.features.length > 0 ? (
            <div className="space-y-3">
              {page.features.map((feature) => (
                <Card key={feature.id} className="p-3 bg-gray-50">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Input
                        value={feature.name}
                        onChange={(e) => handleUpdateFeature(feature.id, 'name', e.target.value)}
                        placeholder="功能名稱（例如：搜尋餐廳）"
                        className="text-sm font-medium"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFeature(feature.id)}
                        className="h-9 w-9 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <Textarea
                      value={feature.description}
                      onChange={(e) => handleUpdateFeature(feature.id, 'description', e.target.value)}
                      placeholder="功能描述"
                      rows={2}
                      className="text-xs"
                    />
                  </div>
                </Card>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddFeature}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                新增功能
              </Button>
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
          <Textarea
            value={page.notes || ''}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="針對這個頁面，你可以補充任何額外的需求或說明..."
            rows={4}
            className="text-sm"
          />
        </div>
      </div>
    </Card>
  )
}
