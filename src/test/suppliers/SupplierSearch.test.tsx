import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SupplierSearch from '../../components/admin/suppliers/SupplierSearch';
import { supplierService } from '../../services/supplierService';
import type { SupplierResponse } from '../../Interfaces/supplier';

const supplier: SupplierResponse = {
  id: '6ad4603d7483e13d464e5162',
  nombre: 'Proveedor Verde',
  nit: '900123456-1',
  estado: 'ACTIVO',
  totalDeuda: 0,
  totalPagado: 0,
  saldoPendiente: 0,
  fechaCreacion: '2026-10-21T00:00:00Z',
  ultimaActualizacion: '2026-10-21T00:00:00Z',
};

function renderSearch() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/admin/proveedores']}>
        <Routes>
          <Route path="/admin/proveedores" element={<SupplierSearch />} />
          <Route path="/admin/proveedores/:id" element={<h1>Detalle del proveedor</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('supplier search', () => {
  it('lists suppliers on entry, shows their NIT and status, and opens the detail', async () => {
    const search = vi.spyOn(supplierService, 'searchSuppliers').mockResolvedValue({
      suppliers: [supplier, { ...supplier, id: '6ad4603d7483e13d464e5163', nombre: 'Proveedor Inactivo', estado: 'INACTIVO' }],
      total: 2,
    });
    renderSearch();

    expect(await screen.findByText('Proveedor Verde')).toBeInTheDocument();
    expect(search).toHaveBeenCalledWith('', 0, 20);
    expect(screen.getAllByText('NIT: 900123456-1')).toHaveLength(2);
    expect(screen.getByText('Activo', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Inactivo', { exact: true })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver detalle de Proveedor Verde' })).toHaveAttribute('href', `/admin/proveedores/${supplier.id}`);
    fireEvent.click(screen.getByRole('link', { name: 'Ver detalle de Proveedor Verde' }));
    expect(await screen.findByRole('heading', { name: 'Detalle del proveedor' })).toBeInTheDocument();
  });

  it('paginates and resets to page zero for a trimmed literal name or NIT search', async () => {
    const search = vi.spyOn(supplierService, 'searchSuppliers').mockResolvedValue({ suppliers: [supplier], total: 41 });
    renderSearch();
    await screen.findByText('Proveedor Verde');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await waitFor(() => expect(search).toHaveBeenLastCalledWith('', 1, 20));
    await screen.findByText('Página 2');

    fireEvent.change(screen.getByLabelText('Nombre o NIT', { exact: false }), { target: { value: '  Verde.*  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await waitFor(() => expect(search).toHaveBeenLastCalledWith('Verde.*', 0, 20));
    await screen.findByText('Página 1');

    fireEvent.change(screen.getByLabelText('Nombre o NIT', { exact: false }), { target: { value: '  900123456-1 ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await waitFor(() => expect(search).toHaveBeenLastCalledWith('900123456-1', 0, 20));
    await screen.findByText('Página 1');

    fireEvent.change(screen.getByLabelText('Nombre o NIT', { exact: false }), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await waitFor(() => expect(search).toHaveBeenLastCalledWith('', 0, 20));
  });

  it('shows a loading state while a search is pending', () => {
    vi.spyOn(supplierService, 'searchSuppliers').mockImplementation(() => new Promise(() => {}));
    const client = renderSearch();
    expect(screen.getByRole('status')).toHaveTextContent('Cargando proveedores');
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    client.clear();
  });

  it('shows empty results and disables paging when there are no matches', async () => {
    vi.spyOn(supplierService, 'searchSuppliers').mockResolvedValue({ suppliers: [], total: 0 });
    renderSearch();
    expect(await screen.findByText('No se encontraron proveedores.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });

  it('stops at the last page using the server total rather than the page length', async () => {
    const search = vi.spyOn(supplierService, 'searchSuppliers').mockResolvedValue({ suppliers: [supplier], total: 21 });
    renderSearch();
    await screen.findByText('Proveedor Verde');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await waitFor(() => expect(search).toHaveBeenLastCalledWith('', 1, 20));
    await screen.findByText('Página 2');
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    await screen.findByText('Página 1');
  });

  it('shows request failures and allows a retry', async () => {
    vi.spyOn(supplierService, 'searchSuppliers')
      .mockRejectedValueOnce(new Error('Error de búsqueda'))
      .mockResolvedValue({ suppliers: [supplier], total: 1 });
    renderSearch();
    expect(await screen.findByRole('alert')).toHaveTextContent('Error de búsqueda');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Proveedor Verde')).toBeInTheDocument();
  });

  it('keeps the real total and lets the user go back from an empty out-of-range page', async () => {
    vi.spyOn(supplierService, 'searchSuppliers')
      .mockResolvedValueOnce({ suppliers: [supplier], total: 21 })
      .mockResolvedValue({ suppliers: [], total: 10 });
    renderSearch();
    await screen.findByText('Proveedor Verde');
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByText(/No hay proveedores en esta página/)).toBeInTheDocument();
    expect(screen.getByText('10 proveedores encontrados')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });

  it('keeps direct lookup by ID available', async () => {
    vi.spyOn(supplierService, 'searchSuppliers').mockResolvedValue({ suppliers: [], total: 0 });
    renderSearch();
    const details = screen.getByText('Consultar directamente por ID').closest('details')!;
    fireEvent.click(screen.getByText('Consultar directamente por ID'));
    fireEvent.change(within(details).getByLabelText('ID del proveedor', { exact: false }), { target: { value: supplier.id } });
    fireEvent.click(screen.getByRole('button', { name: 'Consultar saldos' }));
    expect(await screen.findByRole('heading', { name: 'Detalle del proveedor' })).toBeInTheDocument();
  });
});
