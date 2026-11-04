import { useQuery } from '@tanstack/react-query';
import { settlementService } from '../services/settlementService';

export const settlementKeys = {
  all: ['settlements'] as const,
  dailySummary: (page: number, size: number, date: string | null = null, providerId: string | null = null) =>
    [...settlementKeys.all, 'daily-summary', date ?? 'today', providerId, page, size] as const,
  dailyDetail: (date: string, providerId: string, page: number, size: number) =>
    [...settlementKeys.all, 'daily-detail', date, providerId, page, size] as const,
};

export function useDailySettlementSummary(page: number, size: number, date: string | null = null, providerId: string | null = null, enabled = true) {
  return useQuery({
    queryKey: settlementKeys.dailySummary(page, size, date, providerId),
    queryFn: ({ signal }) => settlementService.getDailySummary(page, size, date, providerId, signal),
    enabled,
  });
}

export function useDailySettlementDetail(date: string, providerId: string, page: number, size: number) {
  return useQuery({
    queryKey: settlementKeys.dailyDetail(date, providerId, page, size),
    queryFn: ({ signal }) => settlementService.getDailyDetail(date, providerId, page, size, signal),
  });
}
