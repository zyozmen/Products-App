import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SupplierPaymentsTable from '../../components/admin/suppliers/SupplierPaymentsTable';
import { supplierKeys } from '../../hooks/useSupplierQueries';
import { supplierService } from '../../services/supplierService';
import type { SupplierPaymentResponse } from '../../Interfaces/supplier';

function payment(index: number): SupplierPaymentResponse {
  return {
    id: String(index),
    fecha: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
    monto: index,
    proveedorId: 'supplier',
    loteId: 'lot',
    tipo: 'ABONO',
    observaciones: `Movimiento ${index}`,
  };
}

function renderTable() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <SupplierPaymentsTable supplierId="supplier" supplierName="Proveedor" lots={[]} />
    </QueryClientProvider>,
  );
  return client;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const rows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);

describe('server-paginated supplier payments', () => {
  it('requests each page with size 50 and uses the server order and total', async () => {
    const get = vi.spyOn(supplierService, 'getPayments').mockImplementation(async (_id, page) => ({
      payments: page === 0
        ? Array.from({ length: 50 }, (_, index) => payment(51 - index))
        : [payment(1)],
      total: 51,
    }));
    renderTable();
    await screen.findByRole('table');
    expect(get).toHaveBeenCalledWith('supplier', 0, 50);
    expect(rows()).toHaveLength(50);
    expect(rows()[0]).toHaveTextContent('Movimiento 51');
    expect(screen.getByRole('status')).toHaveTextContent('1–50 de 51');
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await screen.findByText('Movimiento 1');
    expect(get).toHaveBeenLastCalledWith('supplier', 1, 50);
    expect(rows()).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('51–51 de 51');
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    await screen.findByText('Movimiento 51');
  });

  it('keeps the real total on an empty out-of-range page and allows going back', async () => {
    vi.spyOn(supplierService, 'getPayments')
      .mockResolvedValueOnce({ payments: [payment(51)], total: 51 })
      .mockResolvedValue({ payments: [], total: 10 });
    renderTable();
    await screen.findByRole('table');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByText(/No hay movimientos en esta página/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('10 movimientos');
    expect(screen.getByRole('button', { name: 'Anterior' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });

  it('shows an empty history', async () => {
    vi.spyOn(supplierService, 'getPayments').mockResolvedValue({ payments: [], total: 0 });
    renderTable();
    expect(await screen.findByText('Este proveedor todavía no tiene movimientos de abono.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });

  it('shows loading and errors and retries the same page', async () => {
    vi.spyOn(supplierService, 'getPayments')
      .mockRejectedValueOnce(new Error('Error del historial'))
      .mockResolvedValue({ payments: [payment(1)], total: 1 });
    renderTable();
    expect(screen.getByRole('status')).toHaveTextContent('Cargando historial');
    expect(await screen.findByRole('alert')).toHaveTextContent('Error del historial');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Movimiento 1')).toBeInTheDocument();
  });

  it('invalidates every cached page using the supplier history prefix', async () => {
    const get = vi.spyOn(supplierService, 'getPayments').mockResolvedValue({ payments: [payment(1)], total: 51 });
    const client = renderTable();
    await screen.findByRole('table');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await waitFor(() => expect(get).toHaveBeenCalledWith('supplier', 1, 50));
    await screen.findByRole('table');
    await client.invalidateQueries({ queryKey: supplierKeys.payments('supplier') });
    expect(client.getQueryState(supplierKeys.paymentsPage('supplier', 0, 50))?.isInvalidated).toBe(true);
    expect(get.mock.calls.filter(([, page]) => page === 1)).toHaveLength(2);
  });
});
