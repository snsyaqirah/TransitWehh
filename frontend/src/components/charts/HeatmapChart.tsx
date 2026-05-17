import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { DOW_LABELS, MONTH_LABELS } from '@/lib/constants'
import { formatNumber } from '@/lib/utils'
import type { HeatmapData } from '@/types/transport'

interface HeatmapChartProps {
  data: HeatmapData
  loading?: boolean
}

interface TooltipState {
  dow: number
  month: number
  value: number
  x: number
  y: number
}

function interpolateBlue(t: number): string {
  // t in [0,1]: light blue to deep blue
  const r = Math.round(219 - t * 171)
  const g = Math.round(234 - t * 121)
  const b = Math.round(254 - t * 44)
  return `rgb(${r},${g},${b})`
}

export function HeatmapChart({ data, loading = false }: HeatmapChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  if (loading) {
    return <Skeleton className="w-full h-48" />
  }

  if (!data || !data.values || data.values.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No heatmap data available
      </div>
    )
  }

  // Flatten values to find min/max for normalization
  const allValues = data.values.flat().filter(v => v != null && !isNaN(v))
  const minVal = Math.min(...allValues)
  const maxVal = Math.max(...allValues)
  const range = maxVal - minVal || 1

  const CELL_W = 36
  const CELL_H = 28
  const LABEL_W = 36
  const HEADER_H = 24
  const PAD = 4

  const svgWidth = LABEL_W + 12 * CELL_W + PAD
  const svgHeight = HEADER_H + 7 * CELL_H + PAD

  return (
    <div className="relative">
      <svg
        width="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Month headers */}
        {MONTH_LABELS.map((m, mi) => (
          <text
            key={m}
            x={LABEL_W + mi * CELL_W + CELL_W / 2}
            y={HEADER_H - 6}
            textAnchor="middle"
            fontSize={10}
            fill="hsl(var(--muted-foreground))"
          >
            {m}
          </text>
        ))}

        {/* DOW labels */}
        {DOW_LABELS.map((d, di) => (
          <text
            key={d}
            x={LABEL_W - 4}
            y={HEADER_H + di * CELL_H + CELL_H / 2 + 4}
            textAnchor="end"
            fontSize={10}
            fill="hsl(var(--muted-foreground))"
          >
            {d}
          </text>
        ))}

        {/* Cells */}
        {data.dow.map((_dowIdx, di) => (
          data.months.map((_monthIdx, mi) => {
            const val = data.values[di]?.[mi]
            if (val == null || isNaN(val)) return null
            const t = (val - minVal) / range
            const fill = interpolateBlue(t)
            const cx = LABEL_W + mi * CELL_W
            const cy = HEADER_H + di * CELL_H

            return (
              <rect
                key={`${di}-${mi}`}
                x={cx + 1}
                y={cy + 1}
                width={CELL_W - 2}
                height={CELL_H - 2}
                rx={3}
                fill={fill}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onMouseEnter={e => {
                  const rect = (e.target as SVGRectElement).getBoundingClientRect()
                  setTooltip({ dow: di, month: mi, value: val, x: rect.x + rect.width / 2, y: rect.y })
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            )
          })
        ))}
      </svg>

      {tooltip && (
        <div
          className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-xs pointer-events-none -translate-x-1/2 -translate-y-full -mt-2"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="font-medium text-foreground">
            {DOW_LABELS[tooltip.dow]}, {MONTH_LABELS[tooltip.month]}
          </p>
          <p className="text-muted-foreground">Avg: {formatNumber(tooltip.value, { compact: true })}</p>
        </div>
      )}
    </div>
  )
}
