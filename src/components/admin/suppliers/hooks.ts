import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supplierService } from './service';
import type { SupplierResponse } from './types';

export const supplierKeys = {
  all: ['suppliers'] as const,
  detail: (id: string) => [...supplierKeys.all, id] as const,
};

export function useSupplier(id: string) {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => supplierService.getSupplier(id),
    enabled: Boolean(id),
  });
}

export function useCreateSupplier() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: supplierService.createSupplier,
    onSuccess: (supplier) => client.setQueryData(supplierKeys.detail(supplier.id), supplier),
  });
}

export function useCreateLot(supplierId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: supplierService.createLot,
    onSuccess: (lot) => {
      client.setQueryData<SupplierResponse>(supplierKeys.detail(supplierId), (current) =>
        current ? {
          ...current,
          totalDeuda: current.totalDeuda + lot.costoTotalLote,
          totalPagado: current.totalPagado + lot.montoPagadoLote,
          saldoPendiente: Math.max(0, current.saldoPendiente + lot.saldoPendienteLote),
        } : current,
      );
      void client.invalidateQueries({ queryKey: supplierKeys.detail(supplierId) });
    },
  });
}

export function useRegisterPayment(supplierId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: Parameters<typeof supplierService.registerPayment>[1]) =>
      supplierService.registerPayment(supplierId, request),
    onSuccess: (supplier) => client.setQueryData(supplierKeys.detail(supplierId), supplier),
  });
}

export function useEvaluateLiquidation() {
  return useMutation({ mutationFn: supplierService.evaluateLiquidation });
}
