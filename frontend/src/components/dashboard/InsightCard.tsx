import { TrendingUp, BarChart2, AlertTriangle, PieChart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { SERVICE_MAP } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { InsightCard as InsightCardType } from '@/types/transport'

interface InsightCardProps {
  insight: InsightCardType
}

const TYPE_CONFIG = {
  growth: {
    Icon: TrendingUp,
    iconClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/20',
  },
  pattern: {
    Icon: BarChart2,
    iconClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/20',
  },
  alert: {
    Icon: AlertTriangle,
    iconClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/20',
  },
  composition: {
    Icon: PieChart,
    iconClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/20',
  },
}

export function InsightCard({ insight }: InsightCardProps) {
  const config = TYPE_CONFIG[insight.type]
  const { Icon } = config
  const serviceMeta = insight.service ? SERVICE_MAP[insight.service] : null

  return (
    <Card className={cn('border', config.borderClass)}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg shrink-0', config.bgClass)}>
            <Icon size={16} className={config.iconClass} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold leading-snug mb-1">{insight.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{insight.body}</p>
            {serviceMeta && (
              <span className="inline-block mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {serviceMeta.shortLabel}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
