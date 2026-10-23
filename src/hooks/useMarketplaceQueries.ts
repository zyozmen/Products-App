import { useQuery } from '@tanstack/react-query';
import { marketplaceService } from '../services/marketplaceService';
import type { MarketplaceListFilters } from '../Interfaces/marketplace';

export const marketplaceKeys = {
  all: ['marketplace'] as const,
  list: (search: string, page: number, size: number, filters: MarketplaceListFilters = {}) =>
    [...marketplaceKeys.all, search, page, size, filters] as const,
  detail: (cepaId: string, presentacionId: string) =>
    [...marketplaceKeys.all, 'detail', cepaId, presentacionId] as const,
  cepas: (page: number, size: number) => ['cepas', page, size] as const,
};

export function useMarketplaceList(search: string, page: number, size: number, filters: MarketplaceListFilters = {}) {
  return useQuery({
    queryKey: marketplaceKeys.list(search, page, size, filters),
    queryFn: () => marketplaceService.list(search, page, size, filters),
  });
}

export function useMarketplaceDetail(cepaId: string, presentacionId: string) {
  return useQuery({
    queryKey: marketplaceKeys.detail(cepaId, presentacionId),
    queryFn: () => marketplaceService.detail(cepaId, presentacionId),
    enabled: Boolean(cepaId && presentacionId),
  });
}

export function useCepas(page = 0, size = 100) {
  return useQuery({
    queryKey: marketplaceKeys.cepas(page, size),
    queryFn: () => marketplaceService.listCepas(page, size),
    staleTime: 60_000,
  });
}

export function useAllCepas() {
  return useQuery({
    queryKey: ['cepas', 'all'],
    queryFn: async () => {
      const pageSize = 20;
      const firstPage = await marketplaceService.listCepas(0, pageSize);
      const pages = Math.ceil(firstPage.total / pageSize);
      if (pages <= 1) return firstPage.cepas;
      const remainingPages = await Promise.all(
        Array.from({ length: pages - 1 }, (_, index) => marketplaceService.listCepas(index + 1, pageSize)),
      );
      return [...firstPage.cepas, ...remainingPages.flatMap((result) => result.cepas)];
    },
    staleTime: 60_000,
  });
}
