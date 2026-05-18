import { useState, useMemo } from 'react'
import { Download, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { downloadCsv, toExportRow, formatNumber } from '@/lib/utils'
import type { HeadlineRow } from '@/types/transport'

interface DataTableProps {
  data: HeadlineRow[]
  loading?: boolean
}

const PAGE_SIZE = 20

const COLUMNS: { key: keyof ReturnType<typeof toExportRow>; header: string }[] = [
  { key: 'Date', header: 'Date' },
  { key: 'MRT Kajang', header: 'MRT Kajang' },
  { key: 'LRT Kelana Jaya', header: 'LRT KJ' },
  { key: 'LRT Ampang', header: 'LRT Ampang' },
  { key: 'MRT Putrajaya', header: 'MRT PJY' },
  { key: 'KL Monorail', header: 'Monorail' },
  { key: 'KTM Komuter', header: 'KTM Komuter' },
  { key: 'KTM Komuter Utara', header: 'KTM Utara' },
  { key: 'KTM ETS', header: 'KTM ETS' },
  { key: 'KTM Tebrau Shuttle', header: 'Tebrau' },
  { key: 'KTM Intercity', header: 'Intercity' },
  { key: 'Rapid KL Bus', header: 'RKL Bus' },
  { key: 'Rapid Penang Bus', header: 'R.Penang' },
  { key: 'Rapid Kuantan Bus', header: 'R.Kuantan' },
]

export function DataTable({ data, loading = false }: DataTableProps) {
  const [page, setPage] = useState(0)
  const [dateGte, setDateGte] = useState('')
  const [dateLte, setDateLte] = useState('')

  const filtered = useMemo(() => {
    return data.filter(row => {
      if (dateGte && row.date < dateGte) return false
      if (dateLte && row.date > dateLte) return false
      return true
    })
  }, [data, dateGte, dateLte])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleExport = () => {
    downloadCsv(filtered.map(toExportRow), `transitwehh_ridership_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const clearFilters = () => {
    setDateGte('')
    setDateLte('')
    setPage(0)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filters + export */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">From date</label>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              value={dateGte}
              onChange={e => { setDateGte(e.target.value); setPage(0) }}
              className="h-8 pl-8 pr-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">To date</label>
          <input
            type="date"
            value={dateLte}
            onChange={e => { setDateLte(e.target.value); setPage(0) }}
            className="h-8 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {(dateGte || dateLte) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
            <X size={13} /> Clear
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{filtered.length} rows</span>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download size={13} />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-3 py-8 text-center text-muted-foreground">
                  No data matches the current filters
                </td>
              </tr>
            ) : (
              pageData.map(row => {
                const exported = toExportRow(row)
                return (
                  <tr key={row.date} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    {COLUMNS.map(col => {
                      const val = exported[col.key]
                      const isNum = typeof val === 'number'
                      return (
                        <td key={col.key} className="px-3 py-2 whitespace-nowrap font-mono">
                          {isNum ? (
                            <span className="text-foreground">{formatNumber(val, { compact: false })}</span>
                          ) : val === '' ? (
                            <span className="text-muted-foreground/50">–</span>
                          ) : (
                            <span className="text-foreground">{val}</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const windowStart = Math.max(0, Math.min(page - 2, totalPages - 5))
              const pageIdx = windowStart + i
              return (
                <button
                  key={pageIdx}
                  onClick={() => setPage(pageIdx)}
                  className={`h-7 w-7 rounded text-xs font-medium transition-colors ${
                    pageIdx === page
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {pageIdx + 1}
                </button>
              )
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="h-7 w-7 p-0"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
