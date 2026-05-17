import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber, formatDate } from '@/lib/utils'
import type { DecompositionPoint } from '@/types/transport'

interface DecompositionChartProps {
  data: DecompositionPoint[]
  loading?: boolean
}

interface PanelProps {
  data: DecompositionPoint[]
  dataKey: keyof Omit<DecompositionPoint, 'date'>
  label: string
  color: string
}

function PanelTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload || !payload[0] || !label) return null
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-2.5 py-1.5 text-xs">
      <p className="text-muted-foreground mb-0.5">{formatDate(label)}</p>
      <p className="font-medium">{formatNumber(payload[0].value, { compact: true })}</p>
    </div>
  )
}

function DecompPanel({ data, dataKey, label, color }: PanelProps) {
  const tickFormatter = (v: string) => {
    const d = new Date(v)
    return `${d.toLocaleString('en-MY', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`
  }

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 pl-1">{label}</p>
      <ResponsiveContainer width="100%" height={110}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tickFormatter={tickFormatter}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            minTickGap={80}
          />
          <YAxis
            tickFormatter={v => formatNumber(v, { compact: true })}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<PanelTooltip />} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DecompositionChart({ data, loading = false }: DecompositionChartProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2, 3].map(i => (
          <Skeleton key={i} className="w-full h-28" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-60 text-muted-foreground text-sm">
        No decomposition data available
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DecompPanel data={data} dataKey="observed" label="Observed" color="#1a8fe0" />
      <DecompPanel data={data} dataKey="trend" label="Trend" color="#27ae60" />
      <DecompPanel data={data} dataKey="seasonal" label="Seasonal" color="#9b59b6" />
      <DecompPanel data={data} dataKey="residual" label="Residual" color="#e74c3c" />
    </div>
  )
}
