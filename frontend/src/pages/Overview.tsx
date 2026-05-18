import { useState, useRef } from 'react'
import { DataFreshnessBanner } from '@/components/dashboard/DataFreshnessBanner'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { ServiceCard } from '@/components/dashboard/ServiceCard'
import { NowcastBadge } from '@/components/dashboard/NowcastBadge'
import { MultiLineChart } from '@/components/charts/MultiLineChart'
import { ChartDownloadButton } from '@/components/charts/ChartDownloadButton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useKpis, useHeadlineLatest, useHeadline } from '@/hooks/use-headline'
import { useAnnotations } from '@/hooks/use-misc'
import { SERVICE_META, SERVICE_PRESETS, DEFAULT_ACTIVE_SERVICES } from '@/lib/constants'
import { formatNumber, formatPct } from '@/lib/utils'
import type { ServiceKey } from '@/types/transport'

export function Overview() {
  const { data: kpis, isLoading: kpisLoading } = useKpis()
  const { data: latestResp, isLoading: latestLoading } = useHeadlineLatest()
  const { data: headlineResp, isLoading: headlineLoading } = useHeadline()
  const { data: annotationsResp } = useAnnotations()

  const latestData = latestResp?.data ?? []
  const headlineData = headlineResp?.data ?? []
  const annotations = annotationsResp?.data ?? []

  const [activeTab, setActiveTab] = useState('Top 4')
  const activeServices: ServiceKey[] = SERVICE_PRESETS[activeTab] ?? DEFAULT_ACTIVE_SERVICES

  const chartRef = useRef<HTMLDivElement>(null)

  const kpiItems = [
    {
      title: 'This Week',
      value: formatNumber(kpis?.total_this_week, { compact: true }),
      subtext: 'Total ridership',
    },
    {
      title: 'This Month',
      value: formatNumber(kpis?.total_this_month, { compact: true }),
      subtext: 'Total ridership',
    },
    {
      title: 'MoM Change',
      value: formatPct(kpis?.mom_pct_change),
      trend: kpis?.mom_pct_change,
      subtext: 'Month-over-month',
    },
    {
      title: 'Rail Share',
      value: formatPct(kpis?.rail_share_pct),
      subtext: `Bus: ${formatPct(kpis?.bus_share_pct)}`,
    },
  ]

  return (
    <div className="space-y-6">
      <DataFreshnessBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">TransitWehh</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Daily ridership data for Malaysia's public transport network — MRT, LRT, KTM, Monorail,
            and Rapid bus services. Data sourced from the official open data portal at <span className="font-medium">data.gov.my</span>.
          </p>
        </div>
        <NowcastBadge service="rail_mrt_kajang" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiItems.map(item => (
          <KpiCard
            key={item.title}
            title={item.title}
            value={item.value}
            subtext={item.subtext}
            trend={item.trend}
            loading={kpisLoading}
          />
        ))}
      </div>

      {/* Main chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Daily Ridership</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Each data point is one day's total boardings for that service. Vertical markers show key events — MCO start, fare changes, new service openings.</p>
            </div>
            <div className="flex items-center gap-2">
              <ChartDownloadButton targetRef={chartRef} filename="transitwehh-ridership.png" />
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  {Object.keys(SERVICE_PRESETS).map(preset => (
                    <TabsTrigger key={preset} value={preset} className="text-xs px-2">
                      {preset}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={chartRef}>
            <MultiLineChart
              data={headlineData}
              activeServices={activeServices}
              annotations={annotations}
              loading={headlineLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Service cards grid */}
      <div>
        <h2 className="text-base font-semibold mb-1">All Services</h2>
        <p className="text-xs text-muted-foreground mb-3">Latest available ridership per service. The sparkline shows the past 30 days — a quick pulse check on each line.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {SERVICE_META.map(svc => (
            <ServiceCard
              key={svc.key}
              serviceKey={svc.key}
              data={latestData}
              loading={latestLoading}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
