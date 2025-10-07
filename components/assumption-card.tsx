import { Assumption } from '@/lib/types'
import { Card } from '@/components/ui/card'

interface AssumptionCardProps {
  assumption: Assumption
  index: number
}

export function AssumptionCard({ assumption, index }: AssumptionCardProps) {
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

  return (
    <Card className="p-5 border-l-4 border-l-amber-500">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-amber-600">猜測 #{index + 1}</span>
          <span className="text-xs text-muted-foreground">
            {getCategoryLabel(assumption.category)}
          </span>
        </div>
        <p className="text-base font-medium">{assumption.point}</p>
        <p className="text-sm text-muted-foreground">
          💡 {assumption.reasoning}
        </p>
      </div>
    </Card>
  )
}
