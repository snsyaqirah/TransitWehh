import { useMemo, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useKtmb, useKtmbMom } from '@/hooks/use-misc'
import { formatNumber, formatPct } from '@/lib/utils'
import { cn } from '@/lib/utils'

const MOM_PAGE_SIZE = 20

const KTMB_SERVICES = [
  { key: 'komuter', label: 'KTM Komuter', color: '#27ae60' },
  { key: 'komuter_utara', label: 'KTM Komuter Utara', color: '#2ecc71' },
  { key: 'ets', label: 'KTM ETS', color: '#16a085' },
  { key: 'tebrau', label: 'KTM Tebrau Shuttle', color: '#1abc9c' },
  { key: 'intercity', label: 'KTM Intercity', color: '#3498db' },
] as const

export function KtmbDeepDive() {
  const { data: ktmbResp, isLoading: ktmbLoading } = useKtmb()
  const { data: momResp, isLoading: momLoading } = useKtmbMom()
  const [momPage, setMomPage] = useState(0)

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

  const momDataRaw: { date: string; service: string; value: number; mom_pct: number }[] = momResp?.data ?? []
  // Sort by date descending so most recent months appear first
  const momData = useMemo(
    () => [...momDataRaw].sort((a, b) => b.date.localeCompare(a.date)),
    [momDataRaw]
  )
  const momTotalPages = Math.ceil(momData.length / MOM_PAGE_SIZE)
  const momPageData = momData.slice(momPage * MOM_PAGE_SIZE, (momPage + 1) * MOM_PAGE_SIZE)

  const tickFormatter = (v: string) => {
    const d = new Date(`${v}-01`)
    return `${d.toLocaleString('en-MY', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">KTMB Deep Dive</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Keretapi Tanah Melayu Berhad (KTMB) operates Malaysia's intercity and commuter rail network —
          from KTM Komuter (Klang Valley), ETS (high-speed intercity), Tebrau Shuttle (JB–Singapore),
          to Intercity trains. Unlike Prasarana services, KTMB data is reported monthly rather than daily.
        </p>
      </div>

      {/* Monthly bar chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Monthly Ridership by KTMB Service</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Stacked monthly boardings across all KTMB services. KTM Komuter dominates — it's the commuter backbone for Klang Valley. ETS and Intercity volumes reflect intercity travel demand, sensitive to holidays and school breaks.</p>
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
          <p className="text-xs text-muted-foreground mt-0.5">Percentage change in ridership compared to the previous month, broken down by service. Large swings are normal during Hari Raya and major holidays — look for sustained multi-month trends to see structural changes.</p>
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
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Month</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Service</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Ridership</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">MoM Change</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {momPageData.map((row, i) => {
                      const svcMeta = KTMB_SERVICES.find(s => s.key === row.service)
                      const pct = row.mom_pct
                      return (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{row.date}</td>
                          <td className="py-2 px-3">
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
                          <td className="py-2 px-3 text-right font-mono text-xs">
                            {row.value != null ? formatNumber(row.value, { compact: false }) : '–'}
                          </td>
                          <td className="py-2 px-3 text-right">
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
                          <td className="py-2 px-3 text-right">
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
              {momTotalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{momData.length} records · Page {momPage + 1} of {momTotalPages}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMomPage(p => Math.max(0, p - 1))}
                      disabled={momPage === 0}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronLeft size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMomPage(p => Math.min(momTotalPages - 1, p + 1))}
                      disabled={momPage >= momTotalPages - 1}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

