import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { HeadlineRow } from '@/types/transport'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number | null | undefined, opts?: { compact?: boolean }): string {
  if (n == null) return '–'
  if (opts?.compact) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('en-MY').format(Math.round(n))
}

export function formatPct(n: number | null | undefined): string {
  if (n == null) return '–'
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-MY', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

/** Human-readable column names for CSV export. Never export raw column keys. */
export function toExportRow(row: HeadlineRow): Record<string, string | number> {
  return {
    'Date':                row.date,
    'MRT Kajang':          row.rail_mrt_kajang ?? '',
    'LRT Kelana Jaya':     row.rail_lrt_kj ?? '',
    'LRT Ampang':          row.rail_lrt_ampang ?? '',
    'MRT Putrajaya':       row.rail_mrt_pjy ?? '',
    'KL Monorail':         row.rail_monorail ?? '',
    'KTM Komuter':         row.rail_komuter ?? '',
    'KTM Komuter Utara':   row.rail_komuter_utara ?? '',
    'KTM ETS':             row.rail_ets ?? '',
    'KTM Tebrau Shuttle':  row.rail_tebrau ?? '',
    'KTM Intercity':       row.rail_intercity ?? '',
    'Rapid KL Bus':        row.bus_rkl ?? '',
    'Rapid Penang Bus':    row.bus_rpn ?? '',
    'Rapid Kuantan Bus':   row.bus_rkn ?? '',
  }
}

export function downloadCsv(rows: Record<string, string | number>[], filename: string) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
