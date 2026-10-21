import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '../services/supplierService';
import type { SupplierResponse } from '../Interfaces/supplier';

export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: ['suppliers', 'list'] as const,
  list: (search: string, page: number, size: number) => [...supplierKeys.lists, search, page, size] as const,
  detail: (id: string) => [...supplierKeys.all, id] as const,
  payments: (id: string) => [...supplierKeys.detail(id), 'payments'] as const,
  paymentsPage: (id: string, page: number, size: number) => [...supplierKeys.payments(id), page, size] as const,
  lots: ['supplierLots'] as const,
  lot: (id: string) => [...supplierKeys.lots, id] as const,
};

export function useSupplierSearch(search: string, page: number, size: number) {
  return useQuery({
    queryKey: supplierKeys.list(search, page, size),
    queryFn: () => supplierService.searchSuppliers(search, page, size),
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => supplierService.getSupplier(id),
    enabled: Boolean(id),
  });
}

export function useSupplierPayments(id: string, page = 0, size = 20) {
  return useQuery({
    queryKey: supplierKeys.paymentsPage(id, page, size),
    queryFn: () => supplierService.getPayments(id, page, size),
    enabled: Boolean(id),
  });
}

export function useLot(id: string) {
  return useQuery({
    queryKey: supplierKeys.lot(id),
    queryFn: () => supplierService.getLot(id),
    enabled: Boolean(id),
  });
}

export function useCreateSupplier() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: supplierService.createSupplier,
    onSuccess: (supplier) => {
      client.setQueryData(supplierKeys.detail(supplier.id), supplier);
      return client.invalidateQueries({ queryKey: supplierKeys.lists });
    },
  });
}

export function useCreateLot(supplierId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: supplierService.createLot,
    onSuccess: (lot) => {
      client.setQueryData(supplierKeys.lot(lot.id), lot);
      return Promise.all([
        client.invalidateQueries({ queryKey: supplierKeys.detail(supplierId) }),
        client.invalidateQueries({ queryKey: supplierKeys.payments(supplierId) }),
      ]);
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        return Promise.all([
          client.invalidateQueries({ queryKey: supplierKeys.detail(supplierId) }),
          client.invalidateQueries({ queryKey: supplierKeys.payments(supplierId) }),
        ]);
      }
    },
  });
}

export function useRegisterPayment(supplierId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: Parameters<typeof supplierService.registerPayment>[1]) =>
      supplierService.registerPayment(supplierId, request),
    onSuccess: (supplier) => {
      client.setQueryData<SupplierResponse>(supplierKeys.detail(supplierId), supplier);
      return Promise.all([
        client.invalidateQueries({ queryKey: supplierKeys.payments(supplierId) }),
        client.invalidateQueries({ queryKey: supplierKeys.lots }),
      ]);
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        return Promise.all([
          client.invalidateQueries({ queryKey: supplierKeys.detail(supplierId) }),
          client.invalidateQueries({ queryKey: supplierKeys.payments(supplierId) }),
          client.invalidateQueries({ queryKey: supplierKeys.lots }),
        ]);
      }
    },
  });
}

export function useEvaluateLiquidation() {
  return useMutation({ mutationFn: supplierService.evaluateLiquidation });
}
