import { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber, formatDate } from '@/lib/utils'
import { SERVICE_META } from '@/lib/constants'
import type { HeadlineRow } from '@/types/transport'

interface StackedAreaChartProps {
  data: HeadlineRow[]
  loading?: boolean
}

const RAIL_KEYS = SERVICE_META.filter(s => s.type === 'rail').map(s => s.key)
const BUS_KEYS = SERVICE_META.filter(s => s.type === 'bus').map(s => s.key)

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; fill: string }[]
  label?: string
}) {
  if (!active || !payload || !label) return null
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-medium text-foreground mb-2">{formatDate(label)}</p>
      {payload.map(entry => (
        <div key={entry.name} className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: entry.fill }}>{entry.name}</span>
          <span className="font-medium">{formatNumber(entry.value, { compact: true })}</span>
        </div>
      ))}
    </div>
  )
}

export function StackedAreaChart({ data, loading = false }: StackedAreaChartProps) {
  const chartData = useMemo(() => {
    return data.map(row => {
      const rail = RAIL_KEYS.reduce((acc, k) => acc + (row[k] ?? 0), 0)
      const bus = BUS_KEYS.reduce((acc, k) => acc + (row[k] ?? 0), 0)
      return { date: row.date, rail, bus }
    })
  }, [data])

  if (loading) {
    return <Skeleton className="w-full h-64" />
  }

  const tickFormatter = (v: string) => {
    const d = new Date(v)
    return `${d.toLocaleString('en-MY', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
        <defs>
          <linearGradient id="railGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1a8fe0" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#1a8fe0" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="busGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#e91e63" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#e91e63" stopOpacity={0.05} />
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
        <Area
          type="monotone"
          dataKey="rail"
          name="Rail"
          stroke="#1a8fe0"
          strokeWidth={2}
          fill="url(#railGrad)"
          stackId="1"
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="bus"
          name="Bus"
          stroke="#e91e63"
          strokeWidth={2}
          fill="url(#busGrad)"
          stackId="1"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
