import { useQuery } from '@tanstack/react-query'
import { fetchHeadline, fetchHeadlineLatest, fetchKpis, fetchRolling, fetchYoy, fetchHeatmap, fetchCompleteness } from '@/lib/api'
import type { ServiceKey } from '@/types/transport'

export const useHeadline = (params?: { date_gte?: string; date_lte?: string }) =>
  useQuery({ queryKey: ['headline', params], queryFn: () => fetchHeadline(params), staleTime: 5 * 60_000 })

export const useHeadlineLatest = () =>
  useQuery({ queryKey: ['headline-latest'], queryFn: fetchHeadlineLatest, staleTime: 5 * 60_000 })

export const useKpis = () =>
  useQuery({ queryKey: ['kpis'], queryFn: fetchKpis, staleTime: 5 * 60_000, refetchInterval: 10 * 60_000 })

export const useRolling = (service: ServiceKey, window = 7) =>
  useQuery({ queryKey: ['rolling', service, window], queryFn: () => fetchRolling(service, window) })

export const useYoy = (service: ServiceKey) =>
  useQuery({ queryKey: ['yoy', service], queryFn: () => fetchYoy(service) })

export const useHeatmap = (service: ServiceKey) =>
  useQuery({ queryKey: ['heatmap', service], queryFn: () => fetchHeatmap(service) })

export const useCompleteness = () =>
  useQuery({ queryKey: ['completeness'], queryFn: fetchCompleteness })
