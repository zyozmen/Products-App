import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AxiosError } from 'axios';
import DesgloseContenedorForm from '../../components/admin/suppliers/DesgloseContenedorForm';
import CapacidadBar from '../../components/admin/suppliers/CapacidadBar';
import { supplierService } from '../../services/supplierService';
import { supplierKeys } from '../../hooks/useSupplierQueries';
import type { ContainerResponse, LotResponse, PresentationCreateRequest } from '../../Interfaces/supplier';

const container: ContainerResponse = {
  id: 'container', codigoContenedor: 'CONT-01', tipoCepa: 'Sativa', unidadBase: 'GRAMOS',
  presentacionId: null, capacidadUnidadesBase: 1000, cantidadDisponible: 1000, costoBasePorUnidad: 5000,
  precioBaseUnidad: 5000, subtotal: 5000000, estado: 'RECIBIDO', presentaciones: [],
};
const lot: LotResponse = {
  id: 'lot', proveedorId: 'supplier', codigoLote: 'LOT-01', costoTotalLote: 5000000,
  montoPagadoLote: 5000000, saldoPendienteLote: 0, estadoPago: 'PAGADO_TOTAL',
  estado: 'PROCESADO', contenedores: [container], fechaIngreso: '2026-10-21T00:00:00Z',
};

function setup(current = container) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(supplierKeys.detail('supplier'), { totalDeuda: 5000000, totalPagado: 5000000, saldoPendiente: 0 });
  client.setQueryData(['products', 'list'], []);
  client.setQueryData(supplierKeys.lotList('supplier', '', 0, 10, 'fechaIngreso,desc'), { lots: [], total: 0 });
  render(<QueryClientProvider client={client}><MemoryRouter>
    <DesgloseContenedorForm loteId="lot" codigoLote="LOT-01" contenedor={current} />
  </MemoryRouter></QueryClientProvider>);
  return client;
}

function fillRow(price = '45000') {
  fireEvent.change(screen.getByLabelText('Nombre 1'), { target: { value: 'Bolsa 5g' } });
  fireEvent.change(screen.getByLabelText('SKU 1'), { target: { value: 'SAT-5' } });
  fireEvent.change(screen.getByLabelText('Contenido 1 (GRAMOS)'), { target: { value: '5' } });
  fireEvent.change(screen.getByLabelText('Paquetes 1'), { target: { value: '100' } });
  fireEvent.change(screen.getByLabelText('Precio de venta 1'), { target: { value: price } });
}

function saveResponse(rows: PresentationCreateRequest[]): LotResponse {
  return { ...lot, costoTotalEmpaquetado: 2500000, contenedores: [{ ...container, cantidadDisponible: 500, presentaciones: rows.map((row) => ({
    ...row, contenidoUnidad: Number(row.contenidoUnidad), precioVenta: Number(row.precioVenta),
    presentacionId: 'new-id', stockDisponible: row.unidadesCreadas, costoPresentacionCalculado: 25000, fotografia: row.fotografia ?? null,
  })) }] };
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('HU-03 form and integration', () => {
  it('sends an automatic SKU for a blank field using the latest name', async () => {
    const post = vi.spyOn(supplierService, 'packageContainer').mockImplementation(async (_lot, _container, rows) => saveResponse(rows));
    setup();
    fillRow();
    fireEvent.change(screen.getByLabelText('SKU 1', { exact: false }), { target: { value: '  ' } });
    fireEvent.change(screen.getByLabelText('Nombre 1'), { target: { value: 'Bolsa 10g' } });
    expect(screen.getByPlaceholderText('LOT-01-CONT-01-Bolsa 10g')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y Publicar' }));
    await screen.findByText(/1 presentaciones publicadas/);
    expect(post.mock.calls[0][2][0].sku).toBe('LOT-01-CONT-01-Bolsa 10g');
  });

  it('uses the generated SKU when confirming negative margins', async () => {
    const post = vi.spyOn(supplierService, 'packageContainer').mockImplementation(async (_lot, _container, rows) => saveResponse(rows));
    setup();
    fillRow('20000');
    fireEvent.change(screen.getByLabelText('SKU 1', { exact: false }), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y Publicar' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('LOT-01-CONT-01-Bolsa 5g');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar y publicar' }));
    await screen.findByText(/1 presentaciones publicadas/);
    expect(post.mock.calls[0][2][0]).toEqual(expect.objectContaining({
      sku: 'LOT-01-CONT-01-Bolsa 5g', confirmacionMargenNegativo: true,
    }));
  });

  it('updates capacity live, blocks overcapacity and allows exactly 100%', () => {
    setup();
    fillRow();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    fireEvent.change(screen.getByLabelText('Paquetes 1'), { target: { value: '201' } });
    expect(screen.getByRole('alert')).toHaveTextContent('El total empaquetado (1005GRAMOS) supera la capacidad máxima del contenedor (1000GRAMOS)');
    expect(screen.getByRole('button', { name: 'Guardar y Publicar' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Paquetes 1'), { target: { value: '200' } });
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByRole('button', { name: 'Guardar y Publicar' })).not.toBeDisabled();
  });

  it('uses original created units, not sold stock, for existing usage', () => {
    const existing = saveResponse([{ sku: 'OLD', nombre: 'Old', contenidoUnidad: 5, unidadesCreadas: 100, precioVenta: 45000, activoMarketplace: true, confirmacionMargenNegativo: false }]).contenedores[0];
    setup({ ...existing, cantidadDisponible: 1000, presentaciones: existing.presentaciones?.map((row) => ({ ...row, stockDisponible: 0 })) });
    fillRow();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('supports multiple rows and removing them', () => {
    setup();
    fillRow();
    fireEvent.click(screen.getByRole('button', { name: 'Agregar presentación' }));
    expect(screen.getByLabelText('Nombre 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar presentación 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar presentación 1' }));
    expect(screen.getByRole('button', { name: 'Guardar y Publicar' })).toBeDisabled();
  });

  it('asks for explicit negative margin confirmation; cancel sends no POST and confirmation is per row', async () => {
    const post = vi.spyOn(supplierService, 'packageContainer').mockImplementation(async (_lot, _container, rows) => saveResponse(rows));
    setup();
    fillRow('20000');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y Publicar' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('El precio de venta ($20000) es menor al costo base de la presentación ($25000)');
    expect(post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByLabelText('SKU 1')).toHaveValue('SAT-5');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y Publicar' }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar y publicar' }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][2][0].confirmacionMargenNegativo).toBe(true);
    expect(await screen.findByText(/1 presentaciones publicadas/)).toBeInTheDocument();
  });

  it('publishes at cost without confirmation, updates lot/product caches, and never touches supplier balances', async () => {
    const post = vi.spyOn(supplierService, 'packageContainer').mockImplementation(async (_lot, _container, rows) => saveResponse(rows));
    const client = setup();
    const before = client.getQueryData(supplierKeys.detail('supplier'));
    fillRow('25000');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y Publicar' }));
    await screen.findByText(/1 presentaciones publicadas/);
    expect(post.mock.calls[0][2]).toEqual([expect.objectContaining({
      sku: 'SAT-5', contenidoUnidad: '5', unidadesCreadas: 100, precioVenta: '25000', confirmacionMargenNegativo: false,
    })]);
    expect(client.getQueryData(supplierKeys.detail('supplier'))).toEqual(before);
    expect(client.getQueryData<LotResponse>(supplierKeys.lot('lot'))?.estado).toBe('PROCESADO');
    expect(client.getQueryState(['products', 'list'])?.isInvalidated).toBe(true);
    expect(client.getQueryState(supplierKeys.lotList('supplier', '', 0, 10, 'fechaIngreso,desc'))?.isInvalidated).toBe(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('preserves input on network errors and never retries the POST automatically', async () => {
    const post = vi.spyOn(supplierService, 'packageContainer').mockRejectedValue(new AxiosError('timeout', 'ECONNABORTED'));
    setup();
    fillRow();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y Publicar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Verifica el lote antes de repetir');
    expect(screen.getByLabelText('SKU 1')).toHaveValue('SAT-5');
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('saves inactive rows without announcing publication', async () => {
    const post = vi.spyOn(supplierService, 'packageContainer').mockImplementation(async (_lot, _container, rows) => saveResponse(rows));
    setup();
    fillRow();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Activo en Marketplace' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y Publicar' }));
    expect(await screen.findByText(/0 presentaciones publicadas en Marketplace; 1 inactivas/)).toBeInTheDocument();
    expect(post.mock.calls[0][2][0].activoMarketplace).toBe(false);
  });

  it('sends a validated photo embedded in JSON, not multipart or a URL', async () => {
    const post = vi.spyOn(supplierService, 'packageContainer').mockImplementation(async (_lot, _container, rows) => saveResponse(rows));
    setup();
    fillRow();
    fireEvent.change(screen.getByLabelText('Fotografía 1'), { target: { files: [new File(['abc'], 'photo.jpg', { type: 'image/jpeg' })] } });
    expect(await screen.findByRole('img', { name: 'Vista previa 1' })).toHaveAttribute('src', 'data:image/jpeg;base64,YWJj');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y Publicar' }));
    await screen.findByText(/1 presentaciones publicadas/);
    expect(post.mock.calls[0][2][0].fotografia).toEqual({ nombre: 'photo.jpg', extension: 'jpg', filepart: 'YWJj' });
  });

  it('does not confirm unrelated 422 business errors and keeps entered rows', async () => {
    const post = vi.spyOn(supplierService, 'packageContainer').mockRejectedValue({
      isAxiosError: true, response: { status: 422, data: { message: 'El SKU ya existe en marketplace.' } },
    });
    setup();
    fillRow();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar y Publicar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El SKU ya existe en marketplace.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('SKU 1')).toHaveValue('SAT-5');
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('validates an image before sending and keeps invalid files out of the request', async () => {
    const post = vi.spyOn(supplierService, 'packageContainer');
    setup();
    fillRow();
    fireEvent.change(screen.getByLabelText('Fotografía 1'), { target: { files: [new File([new Uint8Array(204801)], 'photo.jpg')] } });
    expect(await screen.findByText('La imagen debe tener contenido y pesar máximo 200 KiB.', { selector: 'span' })).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Guardar y Publicar' })).toBeDisabled();
  });

  it('renders red when capacity exceeds 100% and green at 100%', () => {
    const { rerender } = render(<CapacidadBar utilizada={1000000n} capacidad={1000000n} unidad="g" />);
    expect(screen.getByRole('progressbar').firstChild).toHaveClass('hu-bg-green-700');
    rerender(<CapacidadBar utilizada={1000001n} capacidad={1000000n} unidad="g" />);
    expect(screen.getByRole('progressbar').firstChild).toHaveClass('hu-bg-red-700');
  });
});
