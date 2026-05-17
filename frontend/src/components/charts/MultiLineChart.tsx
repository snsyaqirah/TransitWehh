import { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { SERVICE_MAP, INDEX_BASE_DATES, ANNOTATION_COLORS } from '@/lib/constants'
import { formatNumber, formatDate } from '@/lib/utils'
import type { HeadlineRow, ServiceKey, Annotation } from '@/types/transport'

interface MultiLineChartProps {
  data: HeadlineRow[]
  activeServices: ServiceKey[]
  annotations?: Annotation[]
  showRollingAvg?: boolean
  showIndex?: boolean
  loading?: boolean
}

function computeRolling(values: (number | null)[], window = 7): (number | null)[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1).filter((v): v is number => v != null)
    if (slice.length === 0) return null
    return slice.reduce((a, b) => a + b, 0) / slice.length
  })
}

function getBaseValue(service: ServiceKey, data: HeadlineRow[]): number | null {
  const baseDate = INDEX_BASE_DATES[service] ?? INDEX_BASE_DATES.default
  const baseRow = data.find(r => r.date === baseDate) ?? data[0]
  if (!baseRow) return null
  return baseRow[service]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: { dataKey: string; value: number; color: string; name: string }[]
  label?: string
  activeServices: ServiceKey[]
  showIndex: boolean
}

function CustomTooltip({ active, payload, label, showIndex }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0 || !label) return null

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-xs min-w-[160px]">
      <p className="font-medium text-foreground mb-2">{formatDate(label)}</p>
      {payload.map(entry => (
        <div key={entry.dataKey} className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: entry.color }} className="truncate max-w-[120px]">{entry.name}</span>
          <span className="font-medium text-foreground">
            {showIndex
              ? `${(entry.value * 100).toFixed(0)} idx`
              : formatNumber(entry.value, { compact: true })}
          </span>
        </div>
      ))}
    </div>
  )
}

export function MultiLineChart({
  data,
  activeServices,
  annotations = [],
  showRollingAvg = false,
  showIndex = false,
  loading = false,
}: MultiLineChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return []

    const baseValues: Partial<Record<ServiceKey, number>> = {}
    if (showIndex) {
      for (const svc of activeServices) {
        const base = getBaseValue(svc, data)
        if (base != null && base > 0) baseValues[svc] = base
      }
    }

    const rollingMap: Partial<Record<ServiceKey, (number | null)[]>> = {}
    if (showRollingAvg) {
      for (const svc of activeServices) {
        rollingMap[svc] = computeRolling(data.map(r => r[svc]))
      }
    }

    return data.map((row, i) => {
      const out: Record<string, string | number | null> = { date: row.date }

      for (const svc of activeServices) {
        const raw = row[svc]
        if (showIndex) {
          const base = baseValues[svc]
          out[svc] = raw != null && base != null && base > 0 ? raw / base : null
        } else {
          out[svc] = raw
        }

        if (showRollingAvg) {
          const rollingVal = rollingMap[svc]?.[i] ?? null
          if (showIndex) {
            const base = baseValues[svc]
            out[`${svc}_rolling`] = rollingVal != null && base != null && base > 0 ? rollingVal / base : null
          } else {
            out[`${svc}_rolling`] = rollingVal
          }
        }
      }

      return out
    })
  }, [data, activeServices, showRollingAvg, showIndex])

  if (loading) {
    return <Skeleton className="w-full h-80" />
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground text-sm">
        No data available
      </div>
    )
  }

  const tickFormatter = (v: string) => {
    const d = new Date(v)
    return `${d.toLocaleString('en-MY', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`
  }

  const yFormatter = (v: number) =>
    showIndex ? `${(v * 100).toFixed(0)}` : formatNumber(v, { compact: true })

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tickFormatter={tickFormatter}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          minTickGap={60}
        />
        <YAxis
          tickFormatter={yFormatter}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          content={
            <CustomTooltip
              activeServices={activeServices}
              showIndex={showIndex}
            />
          }
        />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(value: string) => {
            if (value.endsWith('_rolling')) {
              const key = value.replace('_rolling', '') as ServiceKey
              return `${SERVICE_MAP[key]?.shortLabel ?? key} (7d avg)`
            }
            return SERVICE_MAP[value as ServiceKey]?.shortLabel ?? value
          }}
        />

        {annotations.map(ann => (
          <ReferenceLine
            key={ann.date}
            x={ann.date}
            stroke={ANNOTATION_COLORS[ann.type] ?? '#888'}
            strokeDasharray="4 2"
            label={{
              value: ann.label,
              position: 'insideTopRight',
              fontSize: 10,
              fill: ANNOTATION_COLORS[ann.type] ?? '#888',
            }}
          />
        ))}

        {activeServices.map(svc => {
          const meta = SERVICE_MAP[svc]
          return (
            <Line
              key={svc}
              type="monotone"
              dataKey={svc}
              stroke={meta.color}
              strokeWidth={2}
              dot={false}
              connectNulls
              name={svc}
              isAnimationActive={false}
            />
          )
        })}

        {showRollingAvg &&
          activeServices.map(svc => {
            const meta = SERVICE_MAP[svc]
            return (
              <Line
                key={`${svc}_rolling`}
                type="monotone"
                dataKey={`${svc}_rolling`}
                stroke={meta.color}
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={false}
                connectNulls
                name={`${svc}_rolling`}
                isAnimationActive={false}
              />
            )
          })}
      </LineChart>
    </ResponsiveContainer>
  )
}
