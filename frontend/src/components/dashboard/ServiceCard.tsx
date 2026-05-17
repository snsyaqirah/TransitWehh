import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SparklineChart } from '@/components/charts/SparklineChart'
import { SERVICE_MAP } from '@/lib/constants'
import { formatNumber } from '@/lib/utils'
import type { ServiceKey, HeadlineRow } from '@/types/transport'

interface ServiceCardProps {
  serviceKey: ServiceKey
  data: HeadlineRow[]
  loading?: boolean
}

export function ServiceCard({ serviceKey, data, loading = false }: ServiceCardProps) {
  const meta = SERVICE_MAP[serviceKey]

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-4 pb-3">
          <Skeleton className="h-4 w-28 mb-2" />
          <Skeleton className="h-3 w-16 mb-3" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    )
  }

  const values = data
    .map(r => r[serviceKey])
    .filter((v): v is number => v != null)
    .slice(-30)

  const latest = values[values.length - 1]

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-medium leading-tight line-clamp-2">{meta.label}</p>
          <Badge
            variant={meta.type === 'rail' ? 'default' : 'secondary'}
            className="shrink-0 text-[10px]"
          >
            {meta.type}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{meta.operator}</p>
        {latest != null && (
          <p className="text-lg font-bold mb-1" style={{ color: meta.color }}>
            {formatNumber(latest, { compact: true })}
          </p>
        )}
        <SparklineChart data={values} color={meta.color} height={40} />
      </CardContent>
    </Card>
  )
}
