import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { LotResponse, SupplierResponse } from '../../Interfaces/supplier';
import { supplierKeys, useCreateLot, useRegisterPayment } from '../../hooks/useSupplierQueries';
import { supplierService } from '../../services/supplierService';

const supplier: SupplierResponse = {
  id: 'supplier', nombre: 'Proveedor', nit: '123', estado: 'ACTIVO',
  totalDeuda: 100, totalPagado: 10, saldoPendiente: 90,
  fechaCreacion: '2026-10-21', ultimaActualizacion: '2026-10-21',
};
const lot: LotResponse = {
  id: 'lot', proveedorId: supplier.id, codigoLote: 'LOT', costoTotalLote: 100,
  montoPagadoLote: 10, saldoPendienteLote: 90, estado: 'RECIBIDO', estadoPago: 'PAGO_PARCIAL',
  contenedores: [], fechaIngreso: '2026-10-21',
};

function setup() {
  const client = new QueryClient();
  const pages = [
    supplierKeys.lotList('supplier', '', 0, 10, 'fechaIngreso,desc'),
    supplierKeys.lotList('supplier', 'Sativa', 1, 10, 'costoTotalLote,asc'),
  ];
  pages.forEach((key) => client.setQueryData(key, { lots: [lot], total: 20 }));
  client.setQueryData(supplierKeys.lotList('other', '', 0, 10, 'fechaIngreso,desc'), { lots: [], total: 0 });
  const wrapper = ({ children }: { children: ReactNode }) =>
    <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, pages, wrapper };
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('supplier lot list refresh after mutations', () => {
  it('invalidates every page/search/order after receiving a lot, without invalidating another supplier', async () => {
    vi.spyOn(supplierService, 'createLot').mockResolvedValue(lot);
    const { client, pages, wrapper } = setup();
    const { result } = renderHook(() => useCreateLot('supplier'), { wrapper });
    await act(async () => { await result.current.mutateAsync({ proveedorId: 'supplier', contenedores: [] }); });
    expect(pages.every((key) => client.getQueryState(key)?.isInvalidated)).toBe(true);
    expect(client.getQueryState(supplierKeys.lotList('other', '', 0, 10, 'fechaIngreso,desc'))?.isInvalidated).toBe(false);
  });

  it('invalidates lot lists after a FIFO payment changes balances', async () => {
    vi.spyOn(supplierService, 'registerPayment').mockResolvedValue(supplier);
    const { client, pages, wrapper } = setup();
    const { result } = renderHook(() => useRegisterPayment('supplier'), { wrapper });
    await act(async () => { await result.current.mutateAsync({ monto: 10 }); });
    expect(pages.every((key) => client.getQueryState(key)?.isInvalidated)).toBe(true);
    expect(client.getQueryData(supplierKeys.detail('supplier'))).toEqual(supplier);
    expect(client.getQueryState(supplierKeys.detail('supplier'))?.isInvalidated).toBe(true);
  });
});
