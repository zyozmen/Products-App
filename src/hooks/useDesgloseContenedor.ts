import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '../services/supplierService';
import { supplierKeys } from './useSupplierQueries';
import type { PresentationCreateRequest } from '../Interfaces/supplier';
import axios from 'axios';

export function useDesgloseContenedor(loteId: string, contenedorId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (presentaciones: PresentationCreateRequest[]) =>
      supplierService.packageContainer(loteId, contenedorId, presentaciones),
    retry: false,
    onSuccess: (lot) => {
      client.setQueryData(supplierKeys.lot(lot.id), lot);
      void client.invalidateQueries({ queryKey: ['products'] });
      void client.invalidateQueries({ queryKey: supplierKeys.lotLists(lot.proveedorId) });
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        void client.invalidateQueries({ queryKey: supplierKeys.lot(loteId) });
        void client.invalidateQueries({ queryKey: ['supplierLotLists'] });
      }
    },
  });
}
