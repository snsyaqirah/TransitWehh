import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber, formatDate } from '@/lib/utils'
import type { EventStudyResult } from '@/types/transport'
import { cn } from '@/lib/utils'

interface EventStudyChartProps {
  result: EventStudyResult | undefined
  loading?: boolean
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload || !payload[0] || !label) return null
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-medium text-foreground mb-1">{formatDate(label)}</p>
      <p className="text-muted-foreground">
        Ridership: <span className="font-medium text-foreground">{formatNumber(payload[0].value, { compact: true })}</span>
      </p>
    </div>
  )
}

export function EventStudyChart({ result, loading = false }: EventStudyChartProps) {
  if (loading) {
    return <Skeleton className="w-full h-80" />
  }

  if (!result || result.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground text-sm">
        No event study data available
      </div>
    )
  }

  const dates = result.data.map(d => d.date).sort()
  const eventDate = result.event_date
  const preEnd = dates.filter(d => d < eventDate).at(-1) ?? eventDate
  const postStart = dates.filter(d => d >= eventDate)[0] ?? eventDate

  const tickFormatter = (v: string) => {
    const d = new Date(v)
    return `${d.toLocaleString('en-MY', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={result.data} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
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
            tickFormatter={v => formatNumber(v, { compact: true })}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Pre-event shaded area */}
          <ReferenceArea
            x1={dates[0]}
            x2={preEnd}
            fill="#1a8fe0"
            fillOpacity={0.06}
            ifOverflow="visible"
          />
          {/* Post-event shaded area */}
          <ReferenceArea
            x1={postStart}
            x2={dates[dates.length - 1]}
            fill="#9b59b6"
            fillOpacity={0.06}
            ifOverflow="visible"
          />

          <ReferenceLine
            x={eventDate}
            stroke="#e74c3c"
            strokeWidth={2}
            strokeDasharray="6 3"
            label={{
              value: 'Event',
              position: 'insideTopRight',
              fontSize: 11,
              fill: '#e74c3c',
            }}
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#1a8fe0"
            strokeWidth={2}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Verdict callout */}
      <div
        className={cn(
          'mt-4 p-4 rounded-lg border text-sm',
          result.significant
            ? 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400'
            : 'bg-muted border-border text-muted-foreground'
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="font-medium mb-1">{result.significant ? 'Statistically significant effect' : 'No significant effect detected'}</p>
            <p className="text-xs leading-relaxed opacity-90">{result.verdict}</p>
          </div>
          <div className="text-right shrink-0 text-xs space-y-1">
            <div>
              <span className="text-muted-foreground">Change: </span>
              <span className={cn('font-medium', result.pct_change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
                {result.pct_change > 0 ? '+' : ''}{result.pct_change.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">p-value: </span>
              <span className="font-medium">{result.p_value.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
