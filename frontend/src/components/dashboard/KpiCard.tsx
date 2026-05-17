import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string
  subtext?: string
  trend?: number
  loading?: boolean
}

export function KpiCard({ title, value, subtext, trend, loading = false }: KpiCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm text-muted-foreground font-medium truncate">{title}</p>
        <div className="flex items-end gap-2 mt-1.5">
          <span className="text-2xl font-bold tracking-tight">{value}</span>
          {trend != null && (
            <span
              className={cn(
                'text-xs font-medium px-1.5 py-0.5 rounded-full mb-0.5',
                trend > 0
                  ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                  : trend < 0
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
          )}
        </div>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
      </CardContent>
    </Card>
  )
}
