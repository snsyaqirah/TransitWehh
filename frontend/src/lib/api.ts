import axios from 'axios'
import type {
  HeadlineRow, KpiData, ForecastResult, AnomalyPoint, BacktestResult,
  DecompositionPoint, EventStudyResult, NowcastResult, Annotation,
  InsightCard, RollingRow, HeatmapData, KtmbRow, RainCorrelationResult,
  HealthStatus, My50FaresData,
} from '@/types/transport'
import type { ServiceKey } from '@/types/transport'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
})

// === Headline ===
export const fetchHeadline = async (params?: { date_gte?: string; date_lte?: string }) => {
  const { data } = await api.get<{ data: HeadlineRow[]; is_stale: boolean }>('/api/headline', { params })
  return data
}

export const fetchHeadlineLatest = async () => {
  const { data } = await api.get<{ data: HeadlineRow[]; is_stale: boolean }>('/api/headline/latest')
  return data
}

export const fetchKpis = async () => {
  const { data } = await api.get<KpiData>('/api/headline/kpis')
  return data
}

export const fetchRolling = async (service: ServiceKey, window = 7) => {
  const { data } = await api.get<{ data: RollingRow[]; window: number; is_stale: boolean }>(
    '/api/headline/rolling', { params: { service, window } }
  )
  return data
}

export const fetchYoy = async (service: ServiceKey) => {
  const { data } = await api.get('/api/headline/yoy', { params: { service } })
  return data
}

export const fetchHeatmap = async (service: ServiceKey) => {
  const { data } = await api.get<HeatmapData & { is_stale: boolean }>('/api/headline/heatmap', { params: { service } })
  return data
}

export const fetchCompleteness = async () => {
  const { data } = await api.get('/api/headline/completeness')
  return data
}

// === KTMB ===
export const fetchKtmb = async () => {
  const { data } = await api.get<{ data: KtmbRow[]; is_stale: boolean }>('/api/ktmb')
  return data
}

export const fetchKtmbMom = async () => {
  const { data } = await api.get('/api/ktmb/mom')
  return data
}

// === Analytics ===
export const fetchAnomalies = async (service: ServiceKey, method = 'iqr') => {
  const { data } = await api.get<{ data: AnomalyPoint[]; service: string; method: string; is_stale: boolean }>(
    '/api/analytics/anomalies', { params: { service, method } }
  )
  return data
}

export const fetchForecast = async (
  service: ServiceKey,
  opts?: { horizon?: number; use_rain?: boolean; training_cutoff?: string }
) => {
  const { data } = await api.get<ForecastResult>('/api/analytics/forecast', {
    params: { service, ...opts },
  })
  return data
}

export const fetchBacktest = async (service: ServiceKey, training_cutoff?: string) => {
  const { data } = await api.get<BacktestResult>('/api/analytics/backtest', {
    params: { service, training_cutoff },
  })
  return data
}

export const fetchDecompose = async (service: ServiceKey, period = 365) => {
  const { data } = await api.get<{ data: DecompositionPoint[]; service: string; period: number; is_stale: boolean }>(
    '/api/analytics/decompose', { params: { service, period } }
  )
  return data
}

export const fetchEventStudy = async (service: ServiceKey, event_date?: string, window_months = 6) => {
  const { data } = await api.get<EventStudyResult>('/api/analytics/event-study', {
    params: { service, event_date, window_months },
  })
  return data
}

export const fetchRainCorrelation = async (service: ServiceKey) => {
  const { data } = await api.get<RainCorrelationResult>('/api/analytics/rain-correlation', {
    params: { service },
  })
  return data
}

// === Nowcast ===
export const fetchNowcast = async (service: ServiceKey = 'rail_mrt_kajang') => {
  const { data } = await api.get<NowcastResult>('/api/nowcast', { params: { service } })
  return data
}

// === Meta ===
export const fetchInsights = async () => {
  const { data } = await api.get<{ data: InsightCard[]; is_stale: boolean }>('/api/insights')
  return data
}

export const fetchAnnotations = async () => {
  const { data } = await api.get<{ data: Annotation[] }>('/api/annotations')
  return data
}

export const fetchMy50Fares = async () => {
  const { data } = await api.get<My50FaresData>('/api/tools/my50-fares')
  return data
}

export const fetchHealth = async () => {
  const { data } = await api.get<HealthStatus>('/api/health')
  return data
}
