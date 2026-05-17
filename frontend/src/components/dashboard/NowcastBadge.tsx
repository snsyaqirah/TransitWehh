import { useNowcast } from '@/hooks/use-misc'
import { Skeleton } from '@/components/ui/skeleton'
import type { ServiceKey } from '@/types/transport'
import { cn } from '@/lib/utils'

interface NowcastBadgeProps {
  service?: ServiceKey
}

const DENSITY_CONFIG = {
  low: {
    dotClass: 'bg-green-500',
    label: 'Off-peak',
    textClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-500/10',
  },
  medium: {
    dotClass: 'bg-yellow-500',
    label: 'Moderate',
    textClass: 'text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-500/10',
  },
  high: {
    dotClass: 'bg-red-500',
    label: 'Peak',
    textClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-500/10',
  },
}

export function NowcastBadge({ service }: NowcastBadgeProps) {
  const { data, isLoading } = useNowcast(service)

  if (isLoading) {
    return <Skeleton className="h-7 w-28 rounded-full" />
  }

  if (!data) return null

  if (data.is_holiday) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-muted-foreground/60 shrink-0" />
        <span>{data.holiday_name ?? 'Public Holiday'}</span>
        {data.warning && (
          <span className="ml-1 text-[10px] opacity-70">({data.warning})</span>
        )}
      </div>
    )
  }

  const level = data.density_level ?? 'low'
  const config = DENSITY_CONFIG[level]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
        config.bgClass,
        config.textClass
      )}
    >
      <span className={cn('w-2 h-2 rounded-full shrink-0 animate-pulse', config.dotClass)} />
      <span>{data.density_label ?? config.label}</span>
    </div>
  )
}
