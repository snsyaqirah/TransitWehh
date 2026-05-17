import { Skeleton } from '@/components/ui/skeleton'
import { SERVICE_MAP } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ServiceKey } from '@/types/transport'

interface CoverageRecord {
  total_rows: number
  null_count: number
  coverage_pct: number
  first_valid_date: string | null
}

interface QualityStatsProps {
  data: Record<string, CoverageRecord> | undefined
  loading?: boolean
}

function CoverageBar({ pct }: { pct: number }) {
  const color =
    pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mt-1.5">
      <div
        className={cn('h-full rounded-full transition-all', color)}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  )
}

export function QualityStats({ data, loading = false }: QualityStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 13 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No quality data available
      </div>
    )
  }

  const entries = Object.entries(data) as [string, CoverageRecord][]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {entries.map(([key, stats]) => {
        const meta = SERVICE_MAP[key as ServiceKey]
        const label = meta?.shortLabel ?? key
        const { coverage_pct, total_rows, null_count, first_valid_date } = stats

        return (
          <div
            key={key}
            className="p-3 rounded-lg border border-border bg-card"
          >
            <div className="flex items-start justify-between gap-1 mb-1">
              <p className="text-xs font-medium leading-tight line-clamp-2">{label}</p>
              <span
                className={cn(
                  'text-xs font-bold shrink-0',
                  coverage_pct >= 90 ? 'text-green-600 dark:text-green-400' :
                  coverage_pct >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-500'
                )}
              >
                {coverage_pct.toFixed(0)}%
              </span>
            </div>
            <CoverageBar pct={coverage_pct} />
            <div className="mt-2 text-[10px] text-muted-foreground space-y-0.5">
              <p>{total_rows.toLocaleString()} total rows</p>
              {null_count > 0 && (
                <p className="text-yellow-600 dark:text-yellow-500">{null_count} missing</p>
              )}
              {first_valid_date && (
                <p>From {first_valid_date}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
