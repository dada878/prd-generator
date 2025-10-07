'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TechStackTemplate } from '@/lib/types'
import { X, Plus, Lock, Unlock } from 'lucide-react'

interface TechStackTemplateProps {
  template?: TechStackTemplate
  onChange: (template: TechStackTemplate | undefined) => void
}

const PRESET_TEMPLATES: Omit<TechStackTemplate, 'id' | 'locked'>[] = [
  {
    name: 'Next.js + Firebase Admin',
    description: 'Next.js + Firebase Admin SDK + Auth.js + Google OAuth',
    stack: ['Next.js', 'Firebase Admin SDK', 'Auth.js', 'Google OAuth'],
    excludedTech: ['Firebase Client SDK', 'Firebase Auth', 'Firebase Security Rules'],
  },
  {
    name: 'Next.js Fullstack',
    description: 'Next.js + Prisma + PostgreSQL',
    stack: ['Next.js', 'Prisma', 'PostgreSQL', 'NextAuth.js'],
    excludedTech: [],
  },
  {
    name: 'MERN Stack',
    description: 'MongoDB + Express + React + Node.js',
    stack: ['MongoDB', 'Express.js', 'React', 'Node.js'],
    excludedTech: [],
  },
]

export function TechStackTemplateCard({ template, onChange }: TechStackTemplateProps) {
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customStack, setCustomStack] = useState<string[]>(template?.stack || [])
  const [customExcluded, setCustomExcluded] = useState<string[]>(template?.excludedTech || [])
  const [newTech, setNewTech] = useState('')
  const [newExcluded, setNewExcluded] = useState('')

  const handleSelectPreset = (preset: Omit<TechStackTemplate, 'id' | 'locked'>) => {
    onChange({
      id: `preset-${Date.now()}`,
      ...preset,
      locked: false,
    })
    setIsCustomMode(false)
  }

  const handleToggleLock = () => {
    if (template) {
      onChange({
        ...template,
        locked: !template.locked,
      })
    }
  }

  const handleSaveCustom = () => {
    if (customStack.length > 0) {
      onChange({
        id: `custom-${Date.now()}`,
        name: '自訂 Tech Stack',
        stack: customStack,
        excludedTech: customExcluded,
        locked: false,
      })
      setIsCustomMode(false)
    }
  }

  const handleAddTech = () => {
    if (newTech.trim() && !customStack.includes(newTech.trim())) {
      setCustomStack([...customStack, newTech.trim()])
      setNewTech('')
    }
  }

  const handleAddExcluded = () => {
    if (newExcluded.trim() && !customExcluded.includes(newExcluded.trim())) {
      setCustomExcluded([...customExcluded, newExcluded.trim()])
      setNewExcluded('')
    }
  }

  const handleRemoveTech = (tech: string) => {
    setCustomStack(customStack.filter((t) => t !== tech))
  }

  const handleRemoveExcluded = (tech: string) => {
    setCustomExcluded(customExcluded.filter((t) => t !== tech))
  }

  const handleClear = () => {
    onChange(undefined)
    setIsCustomMode(false)
    setCustomStack([])
    setCustomExcluded([])
  }

  if (template && !isCustomMode) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{template.name}</h3>
                <Button
                  size="sm"
                  variant={template.locked ? 'default' : 'outline'}
                  className="h-6 px-2"
                  onClick={handleToggleLock}
                >
                  {template.locked ? (
                    <>
                      <Lock className="w-3 h-3 mr-1" />
                      已鎖定
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3 mr-1" />
                      未鎖定
                    </>
                  )}
                </Button>
              </div>
              {template.description && (
                <p className="text-sm text-muted-foreground">{template.description}</p>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={handleClear}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">技術堆疊：</p>
            <div className="flex flex-wrap gap-1.5">
              {template.stack.map((tech) => (
                <Badge key={tech} variant="default">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          {template.excludedTech && template.excludedTech.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">排除技術：</p>
              <div className="flex flex-wrap gap-1.5">
                {template.excludedTech.map((tech) => (
                  <Badge key={tech} variant="destructive">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    )
  }

  if (isCustomMode) {
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <h3 className="font-semibold">自訂 Tech Stack</h3>

          <div>
            <label className="text-sm font-medium mb-2 block">技術堆疊</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="輸入技術名稱，例如：Next.js"
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTech()
                  }
                }}
              />
              <Button size="sm" onClick={handleAddTech}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {customStack.map((tech) => (
                <Badge key={tech} variant="default" className="cursor-pointer" onClick={() => handleRemoveTech(tech)}>
                  {tech}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">排除技術（選填）</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="輸入要排除的技術，例如：Firebase Client SDK"
                value={newExcluded}
                onChange={(e) => setNewExcluded(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddExcluded()
                  }
                }}
              />
              <Button size="sm" onClick={handleAddExcluded}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {customExcluded.map((tech) => (
                <Badge key={tech} variant="destructive" className="cursor-pointer" onClick={() => handleRemoveExcluded(tech)}>
                  {tech}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsCustomMode(false)} className="flex-1">
              取消
            </Button>
            <Button size="sm" onClick={handleSaveCustom} disabled={customStack.length === 0} className="flex-1">
              儲存
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Tech Stack 模板（選填）</h3>
          <p className="text-sm text-muted-foreground mb-3">
            選擇或自訂技術堆疊模板，限制 PRD 生成時使用的技術。鎖定後將強制使用指定技術。
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">預設模板</p>
          <div className="space-y-2">
            {PRESET_TEMPLATES.map((preset, index) => (
              <Card
                key={index}
                className="p-3 cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleSelectPreset(preset)}
              >
                <h4 className="font-medium text-sm mb-1">{preset.name}</h4>
                <p className="text-xs text-muted-foreground">{preset.description}</p>
              </Card>
            ))}
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setIsCustomMode(true)
            setCustomStack([])
            setCustomExcluded([])
          }}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-1" />
          自訂 Tech Stack
        </Button>
      </div>
    </Card>
  )
}
