import { AlertTriangle } from 'lucide-react'
import { useKpis } from '@/hooks/use-headline'

export function DataFreshnessBanner() {
  const { data } = useKpis()

  if (!data || data.freshness_days <= 3) return null

  return (
    <div className="flex items-start gap-3 px-4 py-3 mb-5 rounded-lg border border-yellow-400/40 bg-yellow-400/10 text-yellow-700 dark:text-yellow-400">
      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
      <div className="text-sm">
        <span className="font-medium">Data may be outdated.</span>{' '}
        The latest ridership data is {data.freshness_days} days old. The dashboard will update automatically
        when new data is published on{' '}
        <a
          href="https://data.gov.my"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-80"
        >
          data.gov.my
        </a>
        .
      </div>
    </div>
  )
}
