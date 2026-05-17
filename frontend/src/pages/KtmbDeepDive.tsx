import { useMemo } from 'react'
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useKtmb, useKtmbMom } from '@/hooks/use-misc'
import { formatNumber, formatPct } from '@/lib/utils'
import { cn } from '@/lib/utils'

const KTMB_SERVICES = [
  { key: 'rail_komuter', label: 'KTM Komuter', color: '#27ae60' },
  { key: 'rail_komuter_utara', label: 'KTM Komuter Utara', color: '#2ecc71' },
  { key: 'rail_ets', label: 'KTM ETS', color: '#16a085' },
  { key: 'rail_tebrau', label: 'KTM Tebrau Shuttle', color: '#1abc9c' },
  { key: 'rail_intercity', label: 'KTM Intercity', color: '#3498db' },
] as const

export function KtmbDeepDive() {
  const { data: ktmbResp, isLoading: ktmbLoading } = useKtmb()
  const { data: momResp, isLoading: momLoading } = useKtmbMom()

  const rawData = ktmbResp?.data ?? []

  // Aggregate to monthly data
  const monthlyData = useMemo(() => {
    const byMonth: Record<string, Record<string, number>> = {}
    for (const row of rawData) {
      const month = String(row.date).slice(0, 7)
      if (!byMonth[month]) byMonth[month] = {}
      for (const svc of KTMB_SERVICES) {
        const val = row[svc.key]
        byMonth[month][svc.key] = (byMonth[month][svc.key] ?? 0) + (typeof val === 'number' ? val : 0)
      }
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => ({ month, ...vals }))
  }, [rawData])

  const momData: { service: string; mom_pct: number }[] = momResp?.data ?? []

  const tickFormatter = (v: string) => {
    const d = new Date(`${v}-01`)
    return `${d.toLocaleString('en-MY', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">KTMB Deep Dive</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Keretapi Tanah Melayu Berhad — intercity and commuter rail analysis</p>
      </div>

      {/* Monthly bar chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Monthly Ridership by KTMB Service</CardTitle>
        </CardHeader>
        <CardContent>
          {ktmbLoading ? (
            <Skeleton className="w-full h-64" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
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
                    KTMB_SERVICES.find(s => s.key === name)?.label ?? name,
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
                  formatter={(v: string) => KTMB_SERVICES.find(s => s.key === v)?.label ?? v}
                />
                {KTMB_SERVICES.map(svc => (
                  <Bar
                    key={svc.key}
                    dataKey={svc.key}
                    fill={svc.color}
                    fillOpacity={0.85}
                    isAnimationActive={false}
                    maxBarSize={20}
                    stackId="a"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* MoM change table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Month-over-Month Change</CardTitle>
        </CardHeader>
        <CardContent>
          {momLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : momData.length === 0 ? (
            <p className="text-muted-foreground text-sm">No MoM data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Service</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">MoM Change</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {momData.map((row, i) => {
                    const svcMeta = KTMB_SERVICES.find(s => s.key === row.service)
                    const pct = row.mom_pct
                    return (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            {svcMeta && (
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ background: svcMeta.color }}
                              />
                            )}
                            <span>{svcMeta?.label ?? row.service}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={cn(
                              'font-medium',
                              pct > 0 ? 'text-green-600 dark:text-green-400' :
                              pct < 0 ? 'text-red-500' : 'text-muted-foreground'
                            )}
                          >
                            {formatPct(pct)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Badge
                            variant={pct > 5 ? 'success' : pct < -5 ? 'destructive' : 'secondary'}
                            className="text-[10px]"
                          >
                            {pct > 5 ? 'Growing' : pct < -5 ? 'Declining' : 'Stable'}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

