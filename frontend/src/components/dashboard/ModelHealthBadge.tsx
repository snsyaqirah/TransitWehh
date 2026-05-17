import { Info } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { BacktestResult } from '@/types/transport'

interface ModelHealthBadgeProps {
  result: BacktestResult | undefined
  loading?: boolean
}

const MAPE_TOOLTIP = `MAPE measures forecast accuracy. Lower = better.
Method: floored — denominator clamped to 1,000 to avoid division by near-zero on holidays/new services.`

function getMapeConfig(mape: number) {
  if (mape < 10) {
    return {
      label: `${mape.toFixed(1)}% MAPE`,
      quality: 'Good',
      className: 'bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-400',
    }
  }
  if (mape < 20) {
    return {
      label: `${mape.toFixed(1)}% MAPE`,
      quality: 'Fair',
      className: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30 dark:text-yellow-400',
    }
  }
  return {
    label: `${mape.toFixed(1)}% MAPE`,
    quality: 'Poor',
    className: 'bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-400',
  }
}

export function ModelHealthBadge({ result, loading = false }: ModelHealthBadgeProps) {
  if (loading) {
    return <Skeleton className="h-7 w-28 rounded-full" />
  }

  if (!result || result.avg_mape == null) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border bg-muted text-muted-foreground text-xs font-medium">
        <span>No backtest data</span>
      </div>
    )
  }

  const config = getMapeConfig(result.avg_mape)

  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium',
          config.className
        )}
      >
        <span>{config.quality}</span>
        <span className="opacity-70">·</span>
        <span>{config.label}</span>
      </div>
      <Tooltip content={<span className="whitespace-pre-line max-w-xs text-xs">{MAPE_TOOLTIP}</span>}>
        <button className="text-muted-foreground hover:text-foreground transition-colors" type="button">
          <Info size={14} />
        </button>
      </Tooltip>
    </div>
  )
}
