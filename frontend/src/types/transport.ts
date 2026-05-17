export interface HeadlineRow {
  date: string
  bus_rkl: number | null
  bus_rkn: number | null
  bus_rpn: number | null
  rail_lrt_kj: number | null
  rail_lrt_ampang: number | null
  rail_mrt_kajang: number | null
  rail_mrt_pjy: number | null
  rail_monorail: number | null
  rail_komuter: number | null
  rail_komuter_utara: number | null
  rail_ets: number | null
  rail_tebrau: number | null
  rail_intercity: number | null
}

export type ServiceKey = keyof Omit<HeadlineRow, 'date'>

export interface ServiceMeta {
  key: ServiceKey
  label: string
  shortLabel: string
  type: 'rail' | 'bus'
  operator: string
  color: string
}

export interface KpiData {
  total_this_week: number
  total_this_month: number
  mom_pct_change: number
  peak_service: ServiceKey
  latest_date: string
  freshness_days: number
  is_stale: boolean
  rail_share_pct: number
  bus_share_pct: number
}

export interface ForecastPoint {
  date: string
  yhat: number
  yhat_lower: number
  yhat_upper: number
  actual: number | null
}

export interface ForecastResult {
  data: ForecastPoint[]
  training_cutoff: string
  horizon: number
  service: string
  use_rain: boolean
  is_stale: boolean
}

export interface AnomalyPoint {
  date: string
  value: number
  is_weekend: boolean
  incident: IncidentRecord | null
}

export interface IncidentRecord {
  date: string
  service: string
  description: string
  source: string
}

export interface BacktestWindow {
  window_end: string
  mape: number
  rmse: number
  n_test_days: number
}

export interface BacktestResult {
  scores: BacktestWindow[]
  avg_mape: number | null
  avg_rmse: number | null
  service: string
  mape_method: 'floored' | 'smape'
  min_actual_floor: number | null
  n_windows: number
  is_stale: boolean
}

export interface DecompositionPoint {
  date: string
  observed: number
  trend: number
  seasonal: number
  residual: number
}

export interface EventStudyResult {
  data: { date: string; value: number }[]
  pre_mean: number
  post_mean: number
  pct_change: number
  p_value: number
  t_stat: number
  significant: boolean
  verdict: string
  event_date: string
  service: string
  window_months: number
  is_stale: boolean
}

export interface NowcastResult {
  is_holiday: boolean
  holiday_name?: string
  warning?: string
  service?: string
  density_level?: 'low' | 'medium' | 'high'
  density_label?: string
  density_normalized?: number
  estimated_hourly_ridership?: number
  is_stale?: boolean
}

export interface Annotation {
  date: string
  label: string
  type: 'policy' | 'opening' | 'closure' | 'emergency'
  description: string
}

export interface InsightCard {
  type: 'growth' | 'pattern' | 'alert' | 'composition'
  title: string
  body: string
  service: ServiceKey | null
  value: number
}

export interface RollingRow {
  date: string
  rolling_avg: number
  raw: number
}

export interface HeatmapData {
  dow: number[]
  months: number[]
  values: number[][]
}

export interface KtmbRow {
  date: string
  [key: string]: string | number | null
}

export interface RainCorrelationPoint {
  date: string
  ridership: number
  precipitation_mm: number
  is_rainy_day: boolean
}

export interface RainCorrelationResult {
  data: RainCorrelationPoint[]
  pearson_r: number
  rainy_day_avg: number
  dry_day_avg: number
  rainy_vs_dry_pct: number
  service: string
  is_stale: boolean
}

export interface HealthStatus {
  status: string
  schema_valid: boolean
  schema_error: string | null
  data_freshness_days: number | null
  data_fresh: boolean
  is_stale: boolean
  weather_provider: string
  backtest_cache: 'warm' | 'cold'
}

export interface My50FaresData {
  pass: {
    name: string
    price_myr: number
    valid_days: number
    description: string
    launched: string
    covered_services: string[]
    not_covered: string[]
    source: string
  }
  average_fares: {
    service: string
    service_key: string
    min_fare_myr: number
    max_fare_myr: number
    typical_commute_myr: number
    note: string
  }[]
  calculator_note: string
}
