import { useQuery } from '@tanstack/react-query'
import { fetchKtmb, fetchKtmbMom, fetchNowcast, fetchInsights, fetchAnnotations, fetchMy50Fares, fetchHealth } from '@/lib/api'
import type { ServiceKey } from '@/types/transport'

export const useKtmb = () =>
  useQuery({ queryKey: ['ktmb'], queryFn: fetchKtmb, staleTime: 5 * 60_000 })

export const useKtmbMom = () =>
  useQuery({ queryKey: ['ktmb-mom'], queryFn: fetchKtmbMom })

export const useNowcast = (service: ServiceKey = 'rail_mrt_kajang') =>
  useQuery({
    queryKey: ['nowcast', service],
    queryFn: () => fetchNowcast(service),
    refetchInterval: 15 * 60_000,
  })

export const useInsights = () =>
  useQuery({ queryKey: ['insights'], queryFn: fetchInsights, staleTime: 10 * 60_000 })

export const useAnnotations = () =>
  useQuery({ queryKey: ['annotations'], queryFn: fetchAnnotations, staleTime: Infinity })

export const useMy50Fares = () =>
  useQuery({ queryKey: ['my50-fares'], queryFn: fetchMy50Fares, staleTime: Infinity })

export const useHealth = () =>
  useQuery({ queryKey: ['health'], queryFn: fetchHealth, refetchInterval: 5 * 60_000 })
