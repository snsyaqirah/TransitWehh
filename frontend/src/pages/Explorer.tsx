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
        <p className="text-sm text-muted-foreground mt-0.5">Browse and export raw ridership data</p>
      </div>

      {/* Data quality */}
      <section>
        <h2 className="text-base font-semibold mb-3">Data Coverage</h2>
        <QualityStats data={completenessData?.data} loading={completenessLoading} />
      </section>

      {/* Data table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Raw Ridership Data</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={headlineData} loading={headlineLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
