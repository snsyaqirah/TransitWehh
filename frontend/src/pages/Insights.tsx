import { useState } from 'react'
import { DataFreshnessBanner } from '@/components/dashboard/DataFreshnessBanner'
import { InsightCard } from '@/components/dashboard/InsightCard'
import { AnomalyFlag } from '@/components/charts/AnomalyFlag'
import { EventStudyChart } from '@/components/charts/EventStudyChart'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { QualityStats } from '@/components/explorer/QualityStats'
import { useCompleteness } from '@/hooks/use-headline'
import { useInsights } from '@/hooks/use-misc'
import { useAnomalies, useEventStudy } from '@/hooks/use-analytics'
import { SERVICE_MAP } from '@/lib/constants'
import type { ServiceKey } from '@/types/transport'

const EVENT_STUDY_SERVICES: ServiceKey[] = [
  'rail_mrt_pjy',
  'rail_mrt_kajang',
  'rail_lrt_kj',
  'rail_lrt_ampang',
  'rail_komuter',
]

export function Insights() {
  const [anomalyService, setAnomalyService] = useState<ServiceKey>('rail_mrt_kajang')
  const [anomalyMethod, setAnomalyMethod] = useState<'iqr' | 'zscore'>('iqr')
  const [eventService, setEventService] = useState<ServiceKey>('rail_mrt_pjy')

  const { data: insightsResp, isLoading: insightsLoading } = useInsights()
  const { data: anomalyResp, isLoading: anomalyLoading } = useAnomalies(anomalyService, anomalyMethod)
  const { data: eventResp, isLoading: eventLoading } = useEventStudy(eventService)
  const { data: completenessData, isLoading: completenessLoading } = useCompleteness()

  const insights = insightsResp?.data ?? []
  const anomalies = anomalyResp?.data ?? []

  const serviceData = anomalies.map(a => ({ date: a.date, value: a.value }))

  return (
    <div className="space-y-6">
      <DataFreshnessBanner />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Automated analysis, anomalies, and event impact studies</p>
      </div>

      {/* Insight cards grid */}
      <section>
        <h2 className="text-base font-semibold mb-3">Key Insights</h2>
        {insightsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <p className="text-muted-foreground text-sm">No insights available</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        )}
      </section>

      {/* Anomaly detection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Anomaly Detection</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Statistical outliers flagged in ridership data</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Method toggle */}
              <div className="flex gap-1">
                <Button
                  variant={anomalyMethod === 'iqr' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAnomalyMethod('iqr')}
                >
                  IQR
                </Button>
                <Button
                  variant={anomalyMethod === 'zscore' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAnomalyMethod('zscore')}
                >
                  Z-score
                </Button>
              </div>
              {/* Service select */}
              <select
                value={anomalyService}
                onChange={e => setAnomalyService(e.target.value as ServiceKey)}
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
          {anomalyLoading ? (
            <Skeleton className="w-full h-72" />
          ) : (
            <>
              <AnomalyFlag
                anomalies={anomalies}
                serviceData={serviceData}
                loading={false}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {anomalies.length} anomalies detected using {anomalyMethod === 'iqr' ? 'IQR (interquartile range)' : 'Z-score'} method.
                Red dots indicate statistically unusual ridership. Hover for incident details.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Event study */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Event Impact Study</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Statistical test of ridership change around a service opening or policy event
              </p>
            </div>
            <select
              value={eventService}
              onChange={e => setEventService(e.target.value as ServiceKey)}
              className="h-8 px-2 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {EVENT_STUDY_SERVICES.map(key => (
                <option key={key} value={key}>{SERVICE_MAP[key].label}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <EventStudyChart result={eventResp} loading={eventLoading} />
        </CardContent>
      </Card>

      {/* Data quality */}
      <section>
        <h2 className="text-base font-semibold mb-3">Data Coverage</h2>
        <QualityStats data={completenessData?.data} loading={completenessLoading} />
      </section>
    </div>
  )
}
