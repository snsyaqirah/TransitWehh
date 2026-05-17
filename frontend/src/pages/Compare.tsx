import { useState, useRef, useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { HeatmapChart } from '@/components/charts/HeatmapChart'
import { ChartDownloadButton } from '@/components/charts/ChartDownloadButton'
import { My50Calculator } from '@/components/tools/My50Calculator'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useHeadline, useHeatmap } from '@/hooks/use-headline'
import { useMy50Fares } from '@/hooks/use-misc'
import { DEFAULT_ACTIVE_SERVICES, SERVICE_MAP } from '@/lib/constants'
import { formatNumber } from '@/lib/utils'
import type { ServiceKey } from '@/types/transport'

type DayFilter = 'all' | 'weekday' | 'weekend'

function GroupedBarChart({
  data,
  services,
  loading,
}: {
  data: { month: string; [key: string]: string | number | null }[]
  services: ServiceKey[]
  loading: boolean
}) {
  if (loading) return <Skeleton className="w-full h-64" />

  const tickFormatter = (v: string) => {
    const d = new Date(`${v}-01`)
    return `${d.toLocaleString('en-MY', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="month"
          tickFormatter={tickFormatter}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          minTickGap={50}
        />
        <YAxis
          tickFormatter={v => formatNumber(v, { compact: true })}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          formatter={(v: number, name: string) => [
            formatNumber(v, { compact: true }),
            SERVICE_MAP[name as ServiceKey]?.shortLabel ?? name,
          ]}
          labelFormatter={tickFormatter}
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(v: string) => SERVICE_MAP[v as ServiceKey]?.shortLabel ?? v}
        />
        {services.map(svc => (
          <Bar
            key={svc}
            dataKey={svc}
            fill={SERVICE_MAP[svc].color}
            fillOpacity={0.85}
            isAnimationActive={false}
            maxBarSize={18}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

export function Compare() {
  const [dayFilter, setDayFilter] = useState<DayFilter>('all')
  const [heatmapService, setHeatmapService] = useState<ServiceKey>('rail_mrt_kajang')

  const { data: headlineResp, isLoading: headlineLoading } = useHeadline()
  const { data: heatmapData, isLoading: heatmapLoading } = useHeatmap(heatmapService)
  const { data: faresData } = useMy50Fares()

  const rawData = headlineResp?.data ?? []

  const filteredData = useMemo(() => {
    if (dayFilter === 'all') return rawData
    return rawData.filter(row => {
      const dow = new Date(row.date).getDay()
      const isWeekend = dow === 0 || dow === 6
      return dayFilter === 'weekend' ? isWeekend : !isWeekend
    })
  }, [rawData, dayFilter])

  // Aggregate to monthly totals for top 4 services
  const monthlyData = useMemo(() => {
    const byMonth: Record<string, Record<string, number>> = {}
    for (const row of filteredData) {
      const month = row.date.slice(0, 7) // YYYY-MM
      if (!byMonth[month]) byMonth[month] = {}
      for (const svc of DEFAULT_ACTIVE_SERVICES) {
        byMonth[month][svc] = (byMonth[month][svc] ?? 0) + (row[svc] ?? 0)
      }
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => ({ month, ...vals }))
  }, [filteredData])

  const barRef = useRef<HTMLDivElement>(null)
  const heatmapRef = useRef<HTMLDivElement>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compare</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Service comparisons, patterns, and My50 pass analysis</p>
      </div>

      {/* Day filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Show:</span>
        {(['all', 'weekday', 'weekend'] as DayFilter[]).map(f => (
          <Button
            key={f}
            variant={dayFilter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDayFilter(f)}
            className="capitalize"
          >
            {f === 'all' ? 'All days' : f === 'weekday' ? 'Weekdays' : 'Weekends'}
          </Button>
        ))}
      </div>

      {/* Grouped bar chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Monthly Ridership (Top 4 Services)</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {dayFilter === 'all' ? 'All days' : dayFilter === 'weekday' ? 'Weekdays only' : 'Weekends only'}
              </p>
            </div>
            <ChartDownloadButton targetRef={barRef} filename="monthly-comparison.png" />
          </div>
        </CardHeader>
        <CardContent>
          <div ref={barRef}>
            <GroupedBarChart
              data={monthlyData}
              services={DEFAULT_ACTIVE_SERVICES}
              loading={headlineLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Heatmap */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle>DOW × Month Ridership Heatmap</CardTitle>
            <div className="flex items-center gap-2">
              <ChartDownloadButton targetRef={heatmapRef} filename="heatmap.png" />
              <select
                value={heatmapService}
                onChange={e => setHeatmapService(e.target.value as ServiceKey)}
                className="h-8 px-2 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Object.entries(SERVICE_MAP).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={heatmapRef}>
            {heatmapLoading ? (
              <Skeleton className="w-full h-48" />
            ) : heatmapData ? (
              <HeatmapChart data={heatmapData} loading={false} />
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No data</div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Average daily ridership by day of week (rows) and calendar month (columns). Darker = higher.
          </p>
        </CardContent>
      </Card>

      {/* My50 calculator */}
      {faresData ? (
        <My50Calculator fares={faresData} />
      ) : (
        <Skeleton className="h-64 w-full" />
      )}
    </div>
  )
}
