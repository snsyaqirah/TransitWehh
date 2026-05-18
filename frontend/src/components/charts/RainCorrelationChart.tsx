import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber, formatDate } from '@/lib/utils'
import type { RainCorrelationResult } from '@/types/transport'

interface RainCorrelationChartProps {
  result: RainCorrelationResult | undefined
  loading?: boolean
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload || !label) return null
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-medium text-foreground mb-2">{formatDate(label)}</p>
      {payload.map(entry => (
        <div key={entry.name} className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-medium">
            {entry.name === 'Precipitation (mm)'
              ? `${entry.value.toFixed(1)} mm`
              : formatNumber(entry.value, { compact: true })}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RainCorrelationChart({ result, loading = false }: RainCorrelationChartProps) {
  if (loading) {
    return <Skeleton className="w-full h-72" />
  }

  if (!result || !result.data || result.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-72 text-muted-foreground text-sm">
        No rain correlation data available
      </div>
    )
  }

  const pearsonR = result.pearson_r
  const rAbs = Math.abs(pearsonR)
  const rColor = rAbs >= 0.5 ? '#e74c3c' : rAbs >= 0.3 ? '#f39c12' : '#27ae60'
  const rLabel = rAbs >= 0.5 ? 'Strong' : rAbs >= 0.3 ? 'Moderate' : 'Weak'

  const tickFormatter = (v: string) => {
    const d = new Date(v)
    return `${d.toLocaleString('en-MY', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`
  }

  return (
    <div>
      {/* Pearson r header */}
      <div className="flex items-center gap-4 mb-3 text-sm">
        <div>
          <span className="text-muted-foreground">Pearson r: </span>
          <span className="font-bold" style={{ color: rColor }}>
            {pearsonR > 0 ? '+' : ''}{pearsonR.toFixed(3)}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">({rLabel} correlation)</span>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground ml-auto">
          <span>Rainy avg: <strong className="text-foreground">{formatNumber(result.rainy_day_avg, { compact: true })}</strong></span>
          <span>Dry avg: <strong className="text-foreground">{formatNumber(result.dry_day_avg, { compact: true })}</strong></span>
          <span>Diff: <strong className={result.rainy_vs_dry_pct < 0 ? 'text-red-500' : 'text-green-600'}>
            {result.rainy_vs_dry_pct > 0 ? '+' : ''}{result.rainy_vs_dry_pct.toFixed(1)}%
          </strong></span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={result.data} margin={{ top: 8, right: 56, bottom: 4, left: 8 }}>
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
            yAxisId="ridership"
            tickFormatter={v => formatNumber(v, { compact: true })}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <YAxis
            yAxisId="rain"
            orientation="right"
            tickFormatter={v => `${v}mm`}
            tick={{ fontSize: 11, fill: '#1a8fe0' }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />

          <Bar
            yAxisId="rain"
            dataKey="precipitation_mm"
            name="Precipitation (mm)"
            fill="#1a8fe0"
            fillOpacity={0.5}
            isAnimationActive={false}
          />
          <Line
            yAxisId="ridership"
            type="monotone"
            dataKey="ridership"
            name="Ridership"
            stroke="#e74c3c"
            strokeWidth={2}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
