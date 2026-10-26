import { useQuery } from '@tanstack/react-query';
import { settlementService } from '../services/settlementService';

export const settlementKeys = {
  all: ['settlements'] as const,
  dailySummary: (page: number, size: number, date: string | null = null) =>
    [...settlementKeys.all, 'daily-summary', date ?? 'today', page, size] as const,
};

export function useDailySettlementSummary(page: number, size: number, date: string | null = null) {
  return useQuery({
    queryKey: settlementKeys.dailySummary(page, size, date),
    queryFn: () => settlementService.getDailySummary(page, size, date),
  });
}
