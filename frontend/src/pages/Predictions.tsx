import { useState } from 'react'
import { ForecastChart } from '@/components/charts/ForecastChart'
import { DecompositionChart } from '@/components/charts/DecompositionChart'
import { RainCorrelationChart } from '@/components/charts/RainCorrelationChart'
import { ModelHealthBadge } from '@/components/dashboard/ModelHealthBadge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import { useForecast, useBacktest, useDecompose, useRainCorrelation } from '@/hooks/use-analytics'
import { SERVICE_MAP } from '@/lib/constants'
import { formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ServiceKey } from '@/types/transport'

const HORIZONS = [30, 60, 90] as const
type Horizon = typeof HORIZONS[number]

export function Predictions() {
  const [service, setService] = useState<ServiceKey>('rail_mrt_kajang')
  const [horizon, setHorizon] = useState<Horizon>(30)
  const [useRain, setUseRain] = useState(false)

  const { data: forecastResult, isLoading: forecastLoading } = useForecast(
    service,
    { horizon, use_rain: useRain },
    true
  )
  const { data: backtestResult, isLoading: backtestLoading } = useBacktest(service)
  const { data: decompResp, isLoading: decompLoading } = useDecompose(service)
  const { data: rainResult, isLoading: rainLoading } = useRainCorrelation(service)

  const decompData = decompResp?.data ?? []

  return (
    <div className="space-y-6">
      {/* Header + controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Predictions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ridership forecasts using Facebook Prophet — a model that handles weekly seasonality,
            Malaysian public holidays, and long-term trends. Trained on data from mid-2022 onwards
            to avoid COVID-era distortions. The shaded band shows the 95% confidence interval.
          </p>
        </div>
        <ModelHealthBadge result={backtestResult} loading={backtestLoading} />
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Service selector */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Service</label>
              <select
                value={service}
                onChange={e => setService(e.target.value as ServiceKey)}
                className="h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Object.entries(SERVICE_MAP).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
            </div>

            {/* Horizon */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Forecast horizon</label>
              <div className="flex gap-1">
                {HORIZONS.map(h => (
                  <button
                    key={h}
                    onClick={() => setHorizon(h)}
                    className={cn(
                      'h-9 px-3 text-sm rounded-md border transition-colors',
                      horizon === h
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-input hover:bg-muted'
                    )}
                  >
                    {h}d
                  </button>
                ))}
              </div>
            </div>

            {/* Rain toggle */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Covariates</label>
              <Tooltip content="Include daily precipitation data as a regressor in the forecast model">
                <label className="flex items-center gap-2 cursor-pointer h-9">
                  <input
                    type="checkbox"
                    checked={useRain}
                    onChange={e => setUseRain(e.target.checked)}
                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                  />
                  <span className="text-sm">&gt;10mm precipitation</span>
                </label>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forecast chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ridership Forecast</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {horizon}-day horizon · {SERVICE_MAP[service].label}
                {useRain && ' · Rain regressor enabled'}
              </p>
            </div>
            {forecastResult?.is_stale && (
              <Badge variant="secondary" className="text-[10px]">Cached</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ForecastChart result={forecastResult} loading={forecastLoading} />
        </CardContent>
      </Card>

      {/* Backtest results table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Backtest Windows</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Walk-forward validation: the model is trained up to each window end date, then tested on the next 30 days. Lower MAPE = more accurate. Green &lt;10%, yellow 10–20%, red &gt;20%. MAPE is floored at 1,000 boardings to avoid inflated errors on public holidays.</p>
        </CardHeader>
        <CardContent>
          {backtestLoading ? (
            <Skeleton className="w-full h-48" />
          ) : !backtestResult ? (
            <p className="text-muted-foreground text-sm">No backtest data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Window end</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">MAPE</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">RMSE</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Test days</th>
                  </tr>
                </thead>
                <tbody>
                  {backtestResult.scores.map((w, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono">{w.window_end}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={cn(
                            'font-medium',
                            w.mape < 10 ? 'text-green-600 dark:text-green-400' :
                            w.mape < 20 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-500'
                          )}
                        >
                          {w.mape.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatNumber(w.rmse, { compact: true })}</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{w.n_test_days}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30">
                    <td className="py-2.5 px-3 font-medium">Average</td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      {backtestResult.avg_mape?.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      {formatNumber(backtestResult.avg_rmse, { compact: true })}
                    </td>
                    <td className="py-2.5 px-3 text-right text-muted-foreground">{backtestResult.n_windows} windows</td>
                  </tr>
                </tfoot>
              </table>
              <p className="text-xs text-muted-foreground mt-2">
                Method: {backtestResult.mape_method}{backtestResult.min_actual_floor != null ? ` · floor: ${formatNumber(backtestResult.min_actual_floor)}` : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decomposition */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Time-Series Decomposition</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            STL (Seasonal-Trend decomposition using Loess) separates the ridership signal into four components: the raw data, the long-term trend (is it growing or declining?), the repeating weekly/annual cycle, and the residual (unexplained noise). Use the trend pane to cut through day-to-day noise.
          </p>
        </CardHeader>
        <CardContent>
          <DecompositionChart data={decompData} loading={decompLoading} />
        </CardContent>
      </Card>

      {/* Rain correlation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Rain Correlation</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Does rain affect how many people take public transport? Blue bars show daily precipitation (mm). The red line is ridership. Pearson r measures their linear relationship: strong means rain reliably moves ridership, weak means other factors dominate. Days with &gt;10mm are classified as "rainy days" for the forecast model.
          </p>
        </CardHeader>
        <CardContent>
          <RainCorrelationChart result={rainResult} loading={rainLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
