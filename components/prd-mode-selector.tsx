'use client'

import { Card } from '@/components/ui/card'
import { PRDMode } from '@/lib/types'
import { Check } from 'lucide-react'

interface PRDModeSelectorProps {
  mode: PRDMode
  onChange: (mode: PRDMode) => void
}

const MODES = [
  {
    id: 'normal' as PRDMode,
    icon: '📋',
    name: '一般模式',
    description: '完整的產品需求規劃，涵蓋所有功能與細節',
    features: ['完整功能規劃', '詳細頁面設計', '全面性考量'],
  },
  {
    id: 'mvp' as PRDMode,
    icon: '🚀',
    name: 'MVP 模式',
    description: '最小可行性產品，專注核心功能與快速驗證',
    features: ['核心功能優先', '精簡頁面設計', '快速上線'],
  },
]

export function PRDModeSelector({ mode, onChange }: PRDModeSelectorProps) {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold mb-1">PRD 模式</h3>
          <p className="text-sm text-muted-foreground">選擇產品規劃的詳細程度</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MODES.map((modeOption) => (
            <Card
              key={modeOption.id}
              className={`p-4 cursor-pointer transition-all ${
                mode === modeOption.id
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => onChange(modeOption.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{modeOption.icon}</span>
                  <h4 className="font-semibold">{modeOption.name}</h4>
                </div>
                {mode === modeOption.id && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{modeOption.description}</p>
              <div className="space-y-1">
                {modeOption.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                    {feature}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  )
}
