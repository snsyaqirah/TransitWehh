import type { ServiceKey, ServiceMeta } from '@/types/transport'

export const SERVICE_META: ServiceMeta[] = [
  { key: 'rail_lrt_kj',        label: 'LRT Kelana Jaya',     shortLabel: 'LRT KJ',      type: 'rail', operator: 'Prasarana', color: '#e74c3c' },
  { key: 'rail_lrt_ampang',    label: 'LRT Ampang',          shortLabel: 'LRT Ampang',  type: 'rail', operator: 'Prasarana', color: '#e67e22' },
  { key: 'rail_mrt_kajang',    label: 'MRT Kajang',          shortLabel: 'MRT Kajang',  type: 'rail', operator: 'Prasarana', color: '#1a8fe0' },
  { key: 'rail_mrt_pjy',       label: 'MRT Putrajaya',       shortLabel: 'MRT PJY',     type: 'rail', operator: 'Prasarana', color: '#9b59b6' },
  { key: 'rail_monorail',      label: 'KL Monorail',         shortLabel: 'Monorail',    type: 'rail', operator: 'Prasarana', color: '#f39c12' },
  { key: 'rail_komuter',       label: 'KTM Komuter',         shortLabel: 'KTM Komuter', type: 'rail', operator: 'KTMB',      color: '#27ae60' },
  { key: 'rail_komuter_utara', label: 'KTM Komuter Utara',   shortLabel: 'KTM Utara',   type: 'rail', operator: 'KTMB',      color: '#2ecc71' },
  { key: 'rail_ets',           label: 'KTM ETS',             shortLabel: 'KTM ETS',     type: 'rail', operator: 'KTMB',      color: '#16a085' },
  { key: 'rail_tebrau',        label: 'KTM Tebrau Shuttle',  shortLabel: 'Tebrau',      type: 'rail', operator: 'KTMB',      color: '#1abc9c' },
  { key: 'rail_intercity',     label: 'KTM Intercity',       shortLabel: 'Intercity',   type: 'rail', operator: 'KTMB',      color: '#3498db' },
  { key: 'bus_rkl',            label: 'Rapid KL Bus',        shortLabel: 'RKL Bus',     type: 'bus',  operator: 'Prasarana', color: '#e91e63' },
  { key: 'bus_rkn',            label: 'Rapid Kuantan Bus',   shortLabel: 'R.Kuantan',   type: 'bus',  operator: 'Prasarana', color: '#ff5722' },
  { key: 'bus_rpn',            label: 'Rapid Penang Bus',    shortLabel: 'R.Penang',    type: 'bus',  operator: 'Prasarana', color: '#795548' },
]

export const SERVICE_MAP = Object.fromEntries(
  SERVICE_META.map(s => [s.key, s])
) as Record<ServiceKey, ServiceMeta>

export const DEFAULT_ACTIVE_SERVICES: ServiceKey[] = [
  'rail_mrt_kajang',
  'rail_lrt_kj',
  'rail_komuter',
  'rail_mrt_pjy',
]

export const SERVICE_PRESETS: Record<string, ServiceKey[]> = {
  'Top 4':    DEFAULT_ACTIVE_SERVICES,
  'All Rail': SERVICE_META.filter(s => s.type === 'rail').map(s => s.key),
  'KTMB':     ['rail_komuter', 'rail_komuter_utara', 'rail_ets', 'rail_tebrau', 'rail_intercity'],
  'Bus':      ['bus_rkl', 'bus_rkn', 'bus_rpn'],
  'All':      SERVICE_META.map(s => s.key),
}

// Per-service base dates for ridership index normalization.
// MRT PJY opened 2023-03-16; first full month is April — cannot use Jan 2023.
export const INDEX_BASE_DATES: Partial<Record<ServiceKey, string>> & { default: string } = {
  rail_mrt_pjy: '2023-04-01',
  default:      '2023-01-01',
}

export const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const ANNOTATION_COLORS: Record<string, string> = {
  policy:    '#f39c12',
  opening:   '#27ae60',
  closure:   '#e74c3c',
  emergency: '#c0392b',
}
