import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SupplierLotsList from '../../components/admin/suppliers/SupplierLotsList';
import { supplierService } from '../../services/supplierService';
import { supplierKeys } from '../../hooks/useSupplierQueries';
import type { LotResponse } from '../../Interfaces/supplier';

const lot: LotResponse = {
  id: 'lot', proveedorId: 'supplier', codigoLote: 'LOT-HISTORICO', estado: null, estadoPago: 'PAGADO_TOTAL',
  costoTotalLote: 100, montoPagadoLote: 100, saldoPendienteLote: 0, contenedores: [], fechaIngreso: '2026-10-21T00:00:00Z',
};

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(<QueryClientProvider client={client}>
    <SupplierLotsList key="supplier" supplierId="supplier" renderLot={(item) => <h3>{item.codigoLote}</h3>} />
  </QueryClientProvider>);
  return { client, ...view };
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('supplier lot listing', () => {
  it('loads paid historical lots by default with newest-first ordering', async () => {
    const get = vi.spyOn(supplierService, 'getSupplierLots').mockResolvedValue({ lots: [lot], total: 1 });
    setup();
    expect(screen.getByRole('status')).toHaveTextContent('Cargando lotes');
    expect(await screen.findByText('LOT-HISTORICO')).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith('supplier', '', 0, 10, 'fechaIngreso,desc');
    const pagination = within(screen.getByRole('navigation', { name: 'Paginación de lotes' }));
    expect(pagination.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });

  it('uses the server total, and resets page for search and sort changes', async () => {
    const get = vi.spyOn(supplierService, 'getSupplierLots').mockResolvedValue({ lots: [lot], total: 21 });
    setup();
    await screen.findByText('LOT-HISTORICO');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByText('Página 2 de 3');
    expect(get).toHaveBeenLastCalledWith('supplier', '', 1, 10, 'fechaIngreso,desc');
    fireEvent.change(screen.getByLabelText('Buscar lotes', { exact: false }), { target: { value: '  SAT.*  A-5G  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar lotes' }));
    await waitFor(() => expect(get).toHaveBeenLastCalledWith('supplier', 'SAT.*  A-5G', 0, 10, 'fechaIngreso,desc'));
    await screen.findByText('Página 1 de 3');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByText('Página 2 de 3');
    fireEvent.change(screen.getByLabelText('Orden de los lotes'), { target: { value: 'costoTotalLote,asc' } });
    await waitFor(() => expect(get).toHaveBeenLastCalledWith('supplier', 'SAT.*  A-5G', 0, 10, 'costoTotalLote,asc'));
  });

  it('handles empty and out-of-range pages, keeping the actual total', async () => {
    vi.spyOn(supplierService, 'getSupplierLots').mockResolvedValueOnce({ lots: [lot], total: 11 })
      .mockResolvedValue({ lots: [], total: 2 });
    setup();
    await screen.findByText('LOT-HISTORICO');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByText(/No hay lotes en esta página/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2 lotes encontrados');
    expect(screen.getByRole('button', { name: 'Anterior' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });

  it('shows errors and retries the query', async () => {
    vi.spyOn(supplierService, 'getSupplierLots').mockRejectedValueOnce(new Error('Error de lotes'))
      .mockResolvedValue({ lots: [], total: 0 });
    setup();
    expect(await screen.findByRole('alert')).toHaveTextContent('Error de lotes');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar listado' }));
    expect(await screen.findByText('No se encontraron lotes para esta búsqueda.')).toBeInTheDocument();
  });

  it('resets filters/page for another supplier and isolates cached results', async () => {
    const get = vi.spyOn(supplierService, 'getSupplierLots').mockResolvedValue({ lots: [lot], total: 21 });
    const { client, rerender } = setup();
    await screen.findByText('LOT-HISTORICO');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByText('Página 2 de 3');
    rerender(<QueryClientProvider client={client}>
      <SupplierLotsList key="other" supplierId="other" renderLot={(item) => <h3>{item.codigoLote}</h3>} />
    </QueryClientProvider>);
    await screen.findByText('Página 1 de 3');
    expect(get).toHaveBeenLastCalledWith('other', '', 0, 10, 'fechaIngreso,desc');
    expect(supplierKeys.lotLists('other')).not.toEqual(supplierKeys.lotLists('supplier'));
  });
});
