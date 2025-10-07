import { Page } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import Editor from '@monaco-editor/react'

interface PageCardProps {
  page: Page
  onUpdate: (page: Page) => void
}

export function PageCard({ page, onUpdate }: PageCardProps) {
  const handleFeaturesMarkdownChange = (value: string) => {
    onUpdate({
      ...page,
      featuresMarkdown: value,
    })
  }

  const handleNotesChange = (value: string) => {
    onUpdate({
      ...page,
      notes: value,
    })
  }

  // 判斷頁面是否完全生成
  const isFullyGenerated = page.featuresMarkdown !== undefined && page.layout
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
          <h4 className="text-sm font-medium mb-2">功能列表（Markdown）</h4>
          {page.featuresMarkdown !== undefined ? (
            <div className="border rounded-lg overflow-hidden">
              <Editor
                height="400px"
                defaultLanguage="markdown"
                value={page.featuresMarkdown}
                onChange={(value) => handleFeaturesMarkdownChange(value || '')}
                theme="light"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  wrappingIndent: 'indent',
                  padding: { top: 16, bottom: 16 },
                  suggest: { showWords: false },
                  quickSuggestions: false,
                  scrollbar: {
                    alwaysConsumeMouseWheel: false,
                  },
                }}
              />
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
