import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber, formatDate } from '@/lib/utils'
import type { AnomalyPoint } from '@/types/transport'

interface AnomalyFlagProps {
  anomalies: AnomalyPoint[]
  serviceData: { date: string; value: number }[]
  loading?: boolean
}

interface CustomDotProps {
  cx?: number
  cy?: number
  payload?: AnomalyPoint & { value?: number }
}

function AnomalyDot({ cx, cy, payload }: CustomDotProps) {
  if (!cx || !cy || !payload) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="#e74c3c"
      stroke="#fff"
      strokeWidth={1.5}
      opacity={0.9}
    />
  )
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; payload?: AnomalyPoint & { value?: number } }[]
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null

  const anomalyEntry = payload.find(p => p.name === 'Anomaly')
  const seriesEntry = payload.find(p => p.name === 'Ridership')

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-xs max-w-[220px]">
      <p className="font-medium text-foreground mb-1">{label ? formatDate(label) : ''}</p>
      {seriesEntry && (
        <p className="text-muted-foreground">
          Ridership: <span className="font-medium text-foreground">{formatNumber(seriesEntry.value, { compact: true })}</span>
        </p>
      )}
      {anomalyEntry?.payload?.incident && (
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-red-500 font-medium mb-0.5">Incident</p>
          <p className="text-muted-foreground leading-relaxed">{anomalyEntry.payload.incident.description}</p>
          {anomalyEntry.payload.incident.source && (
            <p className="text-[10px] text-muted-foreground/70 mt-1">Source: {anomalyEntry.payload.incident.source}</p>
          )}
        </div>
      )}
      {anomalyEntry && !anomalyEntry.payload?.incident && (
        <p className="mt-1 text-red-500 text-[10px]">Statistical anomaly — no incident on record</p>
      )}
    </div>
  )
}

export function AnomalyFlag({ anomalies, serviceData, loading = false }: AnomalyFlagProps) {
  if (loading) {
    return <Skeleton className="w-full h-72" />
  }

  const anomalyDates = new Set(anomalies.map(a => a.date))

  const combined = serviceData.map(row => ({
    ...row,
    anomaly: anomalyDates.has(row.date)
      ? anomalies.find(a => a.date === row.date)
      : undefined,
  }))

  const anomalyScatter = combined
    .filter(r => r.anomaly)
    .map(r => ({ date: r.date, value: r.value, ...r.anomaly }))

  const tickFormatter = (v: string) => {
    const d = new Date(v)
    return `${d.toLocaleString('en-MY', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={combined} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
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

        <Line
          type="monotone"
          dataKey="value"
          name="Ridership"
          stroke="#1a8fe0"
          strokeWidth={1.5}
          dot={false}
          connectNulls
          isAnimationActive={false}
        />
        <Scatter
          data={anomalyScatter}
          name="Anomaly"
          fill="#e74c3c"
          shape={<AnomalyDot />}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
