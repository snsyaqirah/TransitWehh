import { DataTable } from '@/components/explorer/DataTable'
import { QualityStats } from '@/components/explorer/QualityStats'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useHeadline, useCompleteness } from '@/hooks/use-headline'

export function Explorer() {
  const { data: headlineResp, isLoading: headlineLoading } = useHeadline()
  const { data: completenessData, isLoading: completenessLoading } = useCompleteness()

  const headlineData = headlineResp?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Explorer</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          The raw numbers behind every chart on this dashboard. Filter by date range, inspect individual days,
          and export to CSV for your own analysis. All columns use human-readable names — what you download
          is what you see.
        </p>
      </div>

      {/* Data quality */}
      <section>
        <h2 className="text-base font-semibold mb-1">Data Coverage</h2>
        <p className="text-xs text-muted-foreground mb-3">Coverage percentage and null counts per service. A service showing 100% may still have zeroes on public holidays — those are real readings, not gaps.</p>
        <QualityStats data={completenessData?.data} loading={completenessLoading} />
      </section>

      {/* Data table */}
      <Card>
        <CardHeader className="pb-3">
          <div>
            <CardTitle>Raw Ridership Data</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Daily boardings per service. Dash (–) means no data reported for that day. Use the date filters to narrow the export. Sorted newest first.</p>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable data={headlineData} loading={headlineLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
