import { useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber, formatDate } from '@/lib/utils'
import type { ForecastResult } from '@/types/transport'

interface ForecastChartProps {
  result: ForecastResult | undefined
  loading?: boolean
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number | [number, number]; fill?: string; stroke?: string }[]
  label?: string
}) {
  if (!active || !payload || !label) return null

  const actual = payload.find(p => p.name === 'Actual')
  const forecast = payload.find(p => p.name === 'Forecast')
  const ci = payload.find(p => p.name === 'CI Band')

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-medium text-foreground mb-2">{formatDate(label)}</p>
      {actual && actual.value != null && (
        <div className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: '#27ae60' }}>Actual</span>
          <span className="font-medium">{formatNumber(actual.value as number, { compact: true })}</span>
        </div>
      )}
      {forecast && forecast.value != null && (
        <div className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: '#1a8fe0' }}>Forecast</span>
          <span className="font-medium">{formatNumber(forecast.value as number, { compact: true })}</span>
        </div>
      )}
      {ci && Array.isArray(ci.value) && (
        <div className="flex justify-between gap-4 mb-0.5">
          <span className="text-muted-foreground">CI</span>
          <span className="font-medium text-muted-foreground">
            {formatNumber(ci.value[0], { compact: true })} – {formatNumber(ci.value[1], { compact: true })}
          </span>
        </div>
      )}
    </div>
  )
}

export function ForecastChart({ result, loading = false }: ForecastChartProps) {
  const chartData = useMemo(() => {
    if (!result) return []
    return result.data.map(pt => ({
      date: pt.date,
      actual: pt.actual,
      yhat: pt.yhat,
      ci: [pt.yhat_lower, pt.yhat_upper] as [number, number],
    }))
  }, [result])

  if (loading) {
    return <Skeleton className="w-full h-72" />
  }

  if (!result || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-72 text-muted-foreground text-sm">
        No forecast data available
      </div>
    )
  }

  const tickFormatter = (v: string) => {
    const d = new Date(v)
    return `${d.toLocaleString('en-MY', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
        <defs>
          <linearGradient id="ciBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1a8fe0" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#1a8fe0" stopOpacity={0.05} />
          </linearGradient>
        </defs>
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
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />

        <ReferenceLine
          x={result.training_cutoff}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="6 3"
          label={{
            value: 'Cutoff',
            position: 'insideTopLeft',
            fontSize: 10,
            fill: 'hsl(var(--muted-foreground))',
          }}
        />

        <Area
          type="monotone"
          dataKey="ci"
          name="CI Band"
          stroke="none"
          fill="url(#ciBand)"
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="actual"
          name="Actual"
          stroke="#27ae60"
          strokeWidth={2}
          dot={false}
          connectNulls
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="yhat"
          name="Forecast"
          stroke="#1a8fe0"
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={false}
          connectNulls
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
