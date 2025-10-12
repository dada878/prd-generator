'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TechStackTemplate } from '@/lib/types'
import { Check } from 'lucide-react'

interface TechStackTemplateProps {
  template?: TechStackTemplate
  onChange: (template: TechStackTemplate | undefined) => void
}

const PRESET_TEMPLATES: (Omit<TechStackTemplate, 'id' | 'locked'> & { icon: string })[] = [
  {
    icon: '🔥',
    name: 'Next.js + Firebase Admin',
    description: '使用 Firebase Admin SDK 的全端方案',
    stack: ['Next.js', 'Firebase Admin SDK', 'Auth.js', 'Google OAuth'],
    excludedTech: ['Firebase Client SDK', 'Firebase Auth', 'Firebase Security Rules'],
  },
  {
    icon: '🎯',
    name: '不限制',
    description: '不限制任何技術堆疊，由 AI 自由推薦',
    stack: [],
    excludedTech: [],
  },
]

export const DEFAULT_TECH_STACK: TechStackTemplate = {
  id: 'default-firebase',
  name: 'Next.js + Firebase Admin',
  description: '使用 Firebase Admin SDK 的全端方案',
  stack: ['Next.js', 'Firebase Admin SDK', 'Auth.js', 'Google OAuth'],
  excludedTech: ['Firebase Client SDK', 'Firebase Auth', 'Firebase Security Rules'],
  locked: true,
}

export function TechStackTemplateCard({ template, onChange }: TechStackTemplateProps) {
  const handleSelectPreset = (preset: Omit<TechStackTemplate, 'id' | 'locked'> & { icon?: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { icon: _icon, ...templateData } = preset
    if (preset.name === '不限制') {
      onChange(undefined)
    } else {
      onChange({
        id: `preset-${Date.now()}`,
        ...templateData,
        locked: true,
      })
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold mb-1">Tech Stack 模板（選填）</h3>
          <p className="text-sm text-muted-foreground">
            選擇技術堆疊模板來限制 PRD 生成時使用的技術
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRESET_TEMPLATES.map((preset, index) => {
            const isSelected = preset.name === '不限制'
              ? !template
              : template?.name === preset.name
            return (
              <Card
                key={index}
                className={`p-4 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'hover:border-primary/50 cursor-pointer'
                }`}
                onClick={() => !isSelected && handleSelectPreset(preset)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{preset.icon}</span>
                    <h4 className="font-semibold">{preset.name}</h4>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{preset.description}</p>
                {preset.stack.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {preset.stack.slice(0, 3).map((tech) => (
                      <Badge
                        key={tech}
                        variant={isSelected ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {tech}
                      </Badge>
                    ))}
                    {preset.stack.length > 3 && (
                      <Badge
                        variant={isSelected ? "default" : "secondary"}
                        className="text-xs"
                      >
                        +{preset.stack.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
