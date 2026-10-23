import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SupplierManagementPage from '../../components/admin/suppliers/SupplierManagementPage';
import { supplierService } from '../../services/supplierService';
import type { LotResponse, SupplierResponse } from '../../Interfaces/supplier';
import { marketplaceService } from '../../services/marketplaceService';

vi.mock('../../components/dashboard/HeaderComponent.jsx', () => ({ default: () => null }));
vi.mock('../../components/dashboard/FooterComponent.jsx', () => ({ default: () => null }));
vi.mock('../../components/admin/AdminNav.jsx', () => ({ default: () => null }));
vi.mock('../../components/navigation/NavigationComponent.jsx', () => ({ default: (component: unknown) => component }));

const supplierId = 'a'.repeat(24);
const lotId = 'b'.repeat(24);
const lot: LotResponse = {
  id: lotId, proveedorId: supplierId, codigoLote: 'LOT-INTEGRATION',
  costoTotalLote: 5000000, montoPagadoLote: 5000000, saldoPendienteLote: 0,
  estadoPago: 'PAGADO_TOTAL', estado: 'RECIBIDO', fechaIngreso: '2026-10-21T00:00:00Z',
  contenedores: [{
    id: 'container', cepaId: 'strain-1', codigoContenedor: 'CONT-INTEGRATION', tipoCepa: 'Sativa', unidadBase: 'gramo',
    presentacionId: null, capacidadUnidadesBase: 1000, cantidadDisponible: 1000,
    costoBasePorUnidad: 5000, subtotal: 5000000, estado: 'RECIBIDO',
  }],
};

function setup(returnedLot = lot, counts: Pick<SupplierResponse, 'lotesPagados' | 'lotesPorPagar'> = { lotesPagados: 3, lotesPorPagar: 2 }) {
  vi.spyOn(marketplaceService, 'listCepas').mockResolvedValue({
    cepas: [{ id: 'strain-1', nombre: 'Sativa Premium', version: 0 }],
    total: 1,
  });
  vi.spyOn(supplierService, 'getSupplierLots').mockResolvedValue({ lots: [], total: 0 });
  vi.spyOn(supplierService, 'getSupplier').mockResolvedValue({
    id: supplierId, nombre: 'Proveedor Integración', nit: '123', estado: 'ACTIVO', totalDeuda: 5000000,
    totalPagado: 5000000, saldoPendiente: 0, fechaCreacion: '2026-10-21', ultimaActualizacion: '2026-10-21',
    ...counts,
  });
  vi.spyOn(supplierService, 'getPayments').mockResolvedValue({ payments: [], total: 0 });
  vi.spyOn(supplierService, 'getLot').mockResolvedValue(returnedLot);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[`/admin/proveedores/${supplierId}`]}>
    <Routes><Route path="/admin/proveedores/:id" element={<SupplierManagementPage />} /></Routes>
  </MemoryRouter></QueryClientProvider>);
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('supplier lot packaging integration', () => {
  it.each([
    { lotesPagados: 3, lotesPorPagar: 2 },
    { lotesPagados: 0, lotesPorPagar: 0 },
  ])('shows global lot payment counts in one summary card: %j', async (counts) => {
    setup(lot, counts);
    await screen.findByRole('heading', { name: 'Proveedor Integración' });
    const card = screen.getByRole('heading', { name: 'Estado de pago de lotes' }).closest('section')!;
    expect(within(card).getByText('Lotes pagados').nextElementSibling).toHaveTextContent(String(counts.lotesPagados));
    expect(within(card).getByText('Lotes por pagar').nextElementSibling).toHaveTextContent(String(counts.lotesPorPagar));
    expect(supplierService.getSupplier).toHaveBeenCalledWith(supplierId);
  });

  it('does not invent zero counts when the API omits the summary', async () => {
    setup(lot, {});
    expect(await screen.findByRole('alert')).toHaveTextContent('La API no devolvió conteos válidos');
  });

  it('collapses reception containers and marks only valid configurations as complete', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Proveedor Integración' });
    fireEvent.click(screen.getByRole('button', { name: 'Recibir lote' }));
    const summary = screen.getByText('Contenedor 1');
    const card = summary.closest('details')!;
    expect(card).toHaveAttribute('open');
    expect(within(card).queryByText('Datos completos')).not.toBeInTheDocument();
    fireEvent.change(within(card).getByLabelText('Cepa'), { target: { value: 'strain-1' } });
    expect(within(summary).getByText('Datos completos')).toBeVisible();
    expect(within(summary).getByText('Datos completos').querySelector('svg')).not.toBeNull();
    fireEvent.click(summary);
    expect(card).not.toHaveAttribute('open');
    expect(within(summary).getByText('Datos completos')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(card).not.toHaveAttribute('open');
    expect(screen.getByText('Contenedor 2').closest('details')).toHaveAttribute('open');
    fireEvent.click(summary);
    expect(within(card).getByLabelText('Cepa')).toHaveValue('strain-1');
    fireEvent.change(within(card).getByLabelText('Costo por unidad base'), { target: { value: '1.001' } });
    expect(within(summary).queryByText('Datos completos')).not.toBeInTheDocument();
    fireEvent.change(within(card).getByLabelText('Costo por unidad base'), { target: { value: '1.25' } });
    expect(within(summary).getByText('Datos completos')).toBeVisible();
    fireEvent.change(within(card).getByLabelText('Capacidad (unidad base)'), { target: { value: '0' } });
    expect(within(summary).queryByText('Datos completos')).not.toBeInTheDocument();
    fireEvent.click(summary);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar lote' }));
    await waitFor(() => expect(card).toHaveAttribute('open'));
    expect(within(card).getByText('La capacidad debe ser mayor que cero.')).toBeVisible();
  });

  it('retains reception and payments and opens packaging for a known fully paid lot', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Proveedor Integración' });
    fireEvent.click(screen.getByRole('button', { name: 'Recibir lote' }));
    expect(screen.getByRole('heading', { name: 'Recibir lote' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Registrar un abono' }));
    expect(screen.getByRole('heading', { name: 'Registrar abono' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Buscar un lote' }));
    fireEvent.click(screen.getByText('Consulta directa por ID del lote'));
    fireEvent.change(screen.getByLabelText('ID del lote a consultar'), { target: { value: lotId } });
    fireEvent.click(screen.getByRole('button', { name: 'Consultar lote' }));
    await screen.findByText('LOT-INTEGRATION');
    fireEvent.click(screen.getByText('CONT-INTEGRATION · Sativa · 1000 gramo'));
    fireEvent.click(screen.getByRole('button', { name: 'Desglosar contenedor' }));
    expect(await screen.findByRole('heading', { name: 'Desglose: CONT-INTEGRATION' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(supplierService.getLot).toHaveBeenCalledWith(lotId);
  });

  it('starts container cards collapsed and toggles independently without losing packaging inputs', async () => {
    const secondContainer = { ...lot.contenedores[0], id: 'second', codigoContenedor: 'CONT-SECOND', tipoCepa: 'Indica' };
    setup();
    vi.mocked(supplierService.getSupplierLots).mockResolvedValue({
      lots: [{ ...lot, contenedores: [...lot.contenedores, secondContainer] }], total: 1,
    });
    await screen.findByRole('heading', { name: 'Proveedor Integración' });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar un lote' }));
    const first = await screen.findByText('CONT-INTEGRATION · Sativa · 1000 gramo');
    const second = screen.getByText('CONT-SECOND · Indica · 1000 gramo');
    expect(first.closest('details')).not.toHaveAttribute('open');
    expect(second.closest('details')).not.toHaveAttribute('open');
    for (const button of screen.getAllByRole('button', { name: 'Desglosar contenedor' })) {
      expect(button).not.toBeVisible();
    }

    fireEvent.click(first);
    expect(first.closest('details')).toHaveAttribute('open');
    expect(second.closest('details')).not.toHaveAttribute('open');
    fireEvent.click(within(first.closest('details')!).getByRole('button', { name: 'Desglosar contenedor' }));
    fireEvent.change(screen.getByLabelText('Nombre 1'), { target: { value: 'Bolsa 5g' } });
    fireEvent.click(second);
    fireEvent.click(first);
    expect(first.closest('details')).not.toHaveAttribute('open');
    expect(second.closest('details')).toHaveAttribute('open');
    expect(screen.getByRole('heading', { name: 'Desglose: CONT-INTEGRATION' })).not.toBeVisible();

    fireEvent.click(first);
    expect(screen.getByLabelText('Nombre 1')).toHaveValue('Bolsa 5g');
    expect(screen.getByRole('heading', { name: 'Desglose: CONT-INTEGRATION' })).toBeVisible();
  });

  it('does not expose packaging for a lot belonging to a different supplier', async () => {
    setup({ ...lot, proveedorId: 'other' });
    await screen.findByRole('heading', { name: 'Proveedor Integración' });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar un lote' }));
    fireEvent.click(screen.getByText('Consulta directa por ID del lote'));
    fireEvent.change(screen.getByLabelText('ID del lote a consultar'), { target: { value: lotId } });
    fireEvent.click(screen.getByRole('button', { name: 'Consultar lote' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El lote no pertenece');
    expect(screen.queryByRole('button', { name: 'Desglosar contenedor' })).not.toBeInTheDocument();
  });

  it('initially shows four actions and only displays the selected section, retaining entered values', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Proveedor Integración' });
    const actions = ['Recibir lote', 'Registrar un abono', 'Buscar un lote', 'Ver histórico de abonos'];
    for (const name of actions) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-expanded', 'false');
    }
    expect(screen.queryByRole('heading', { name: 'Recibir lote' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Registrar abono' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Lotes y tope de liquidación' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Historial de abonos' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Registrar un abono' }));
    const observations = screen.getByLabelText('Observaciones');
    fireEvent.change(observations, { target: { value: 'Abono pendiente de revisar' } });
    expect(screen.getByRole('button', { name: 'Registrar pago' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Ver histórico de abonos' }));
    expect(screen.getByRole('heading', { name: 'Historial de abonos' })).toBeVisible();
    expect(observations).not.toBeVisible();
    expect(screen.getByRole('button', { name: 'Registrar un abono' })).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Registrar un abono' }));
    expect(screen.getByLabelText('Observaciones')).toHaveValue('Abono pendiente de revisar');
    expect(screen.queryByRole('heading', { name: 'Historial de abonos' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Registrar un abono' }));
    expect(screen.queryByRole('heading', { name: 'Registrar abono' })).not.toBeInTheDocument();
  });
});
