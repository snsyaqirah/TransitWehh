import { useState, useRef } from 'react'
import { MultiLineChart } from '@/components/charts/MultiLineChart'
import { StackedAreaChart } from '@/components/charts/StackedAreaChart'
import { ChartDownloadButton } from '@/components/charts/ChartDownloadButton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useHeadline, useYoy } from '@/hooks/use-headline'
import { useAnnotations } from '@/hooks/use-misc'
import { SERVICE_PRESETS, DEFAULT_ACTIVE_SERVICES, SERVICE_MAP } from '@/lib/constants'
import { formatNumber } from '@/lib/utils'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import type { ServiceKey } from '@/types/transport'

const YEAR_COLORS = ['#1a8fe0', '#27ae60', '#9b59b6', '#e67e22', '#e74c3c']

function YoyChart({ service }: { service: ServiceKey }) {
  const { data, isLoading } = useYoy(service)

  if (isLoading) return <Skeleton className="w-full h-56" />
  if (!data?.data) return (
    <div className="flex items-center justify-center h-56 text-muted-foreground text-sm">No YoY data</div>
  )

  const years: string[] = data.years ?? []
  const chartData: Record<string, string | number>[] = data.data

  const tickFormatter = (v: string) => {
    const d = new Date(`2000-${v}`)
    return d.toLocaleString('en-MY', { month: 'short' })
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="month"
          tickFormatter={tickFormatter}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={v => formatNumber(v, { compact: true })}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          width={52}
        />
        <Tooltip
          formatter={(v: number) => formatNumber(v, { compact: true })}
          labelFormatter={(l: string) => new Date(`2000-${l}`).toLocaleString('en-MY', { month: 'long' })}
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        {years.map((yr, idx) => (
          <Line
            key={yr}
            type="monotone"
            dataKey={yr}
            stroke={YEAR_COLORS[idx % YEAR_COLORS.length]}
            strokeWidth={2}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function Trends() {
  const [activeTab, setActiveTab] = useState('Top 4')
  const [showRolling, setShowRolling] = useState(false)
  const [showIndex, setShowIndex] = useState(false)
  const [yoyService, setYoyService] = useState<ServiceKey>('rail_mrt_kajang')

  const activeServices: ServiceKey[] = SERVICE_PRESETS[activeTab] ?? DEFAULT_ACTIVE_SERVICES

  const { data: headlineResp, isLoading: headlineLoading } = useHeadline()
  const { data: annotationsResp } = useAnnotations()

  const headlineData = headlineResp?.data ?? []
  const annotations = annotationsResp?.data ?? []

  const mainChartRef = useRef<HTMLDivElement>(null)
  const stackedRef = useRef<HTMLDivElement>(null)
  const yoyRef = useRef<HTMLDivElement>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trends</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Ridership over time with overlays and year comparisons</p>
      </div>

      {/* Main line chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle>Daily Ridership by Service</CardTitle>
            <ChartDownloadButton targetRef={mainChartRef} filename="trends-ridership.png" />
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {/* Preset tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                {Object.keys(SERVICE_PRESETS).map(preset => (
                  <TabsTrigger key={preset} value={preset} className="text-xs px-2">
                    {preset}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Toggle buttons */}
            <div className="flex gap-2 ml-auto">
              <Button
                variant={showRolling ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowRolling(v => !v)}
              >
                7d Rolling avg
              </Button>
              <Button
                variant={showIndex ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowIndex(v => !v)}
              >
                Index view
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={mainChartRef}>
            <MultiLineChart
              data={headlineData}
              activeServices={activeServices}
              annotations={annotations}
              showRollingAvg={showRolling}
              showIndex={showIndex}
              loading={headlineLoading}
            />
          </div>
          {showIndex && (
            <p className="text-xs text-muted-foreground mt-2">
              Index: 100 = base date ridership. MRT Putrajaya base: Apr 2023; others: Jan 2023.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stacked area — Rail vs Bus */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Rail vs Bus Ridership</CardTitle>
            <ChartDownloadButton targetRef={stackedRef} filename="rail-vs-bus.png" />
          </div>
        </CardHeader>
        <CardContent>
          <div ref={stackedRef}>
            <StackedAreaChart data={headlineData} loading={headlineLoading} />
          </div>
        </CardContent>
      </Card>

      {/* YoY comparison */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle>Year-over-Year Comparison</CardTitle>
            <div className="flex items-center gap-2">
              <ChartDownloadButton targetRef={yoyRef} filename="yoy-comparison.png" />
              <select
                value={yoyService}
                onChange={e => setYoyService(e.target.value as ServiceKey)}
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
          <div ref={yoyRef}>
            <YoyChart service={yoyService} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
