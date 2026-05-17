import { useQuery } from '@tanstack/react-query'
import {
  fetchAnomalies, fetchForecast, fetchBacktest, fetchDecompose,
  fetchEventStudy, fetchRainCorrelation,
} from '@/lib/api'
import type { ServiceKey } from '@/types/transport'

export const useAnomalies = (service: ServiceKey, method = 'iqr') =>
  useQuery({ queryKey: ['anomalies', service, method], queryFn: () => fetchAnomalies(service, method) })

export const useForecast = (
  service: ServiceKey,
  opts?: { horizon?: number; use_rain?: boolean; training_cutoff?: string },
  enabled = true
) =>
  useQuery({
    queryKey: ['forecast', service, opts],
    queryFn: () => fetchForecast(service, opts),
    enabled,
    staleTime: 30 * 60_000,
  })

export const useBacktest = (service: ServiceKey, training_cutoff?: string, enabled = true) =>
  useQuery({
    queryKey: ['backtest', service, training_cutoff],
    queryFn: () => fetchBacktest(service, training_cutoff),
    enabled,
    staleTime: 60 * 60_000,
  })

export const useDecompose = (service: ServiceKey, period = 365) =>
  useQuery({ queryKey: ['decompose', service, period], queryFn: () => fetchDecompose(service, period) })

export const useEventStudy = (service: ServiceKey, event_date?: string, window_months = 6) =>
  useQuery({
    queryKey: ['event-study', service, event_date, window_months],
    queryFn: () => fetchEventStudy(service, event_date, window_months),
  })

export const useRainCorrelation = (service: ServiceKey) =>
  useQuery({ queryKey: ['rain-correlation', service], queryFn: () => fetchRainCorrelation(service) })
