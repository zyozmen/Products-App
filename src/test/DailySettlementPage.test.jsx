import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError } from 'axios';
import DailySettlementPage from '../components/admin/settlements/DailySettlementPage.tsx';
import { InvalidSettlementResponseError, settlementService } from '../services/settlementService.ts';
import { supplierService } from '../services/supplierService.ts';

vi.mock('../components/dashboard/HeaderComponent.jsx', () => ({ default: () => null }));
vi.mock('../components/dashboard/FooterComponent.jsx', () => ({ default: () => null }));
vi.mock('../components/admin/AdminNav.jsx', () => ({ default: () => null }));
vi.mock('../components/navigation/NavigationComponent.jsx', () => ({ default: (Component) => Component }));

const empty = {
    date: '2026-10-23', timezone: 'America/Bogota', activationPending: true, activatedAt: null,
    content: [], page: 0, size: 20, totalElements: 0, totalPages: 0,
};
const provider = {
    providerId: '6500000000000000000000ab', providerName: 'Distribuidora Cannabis SAS', date: '2026-10-23',
    totalSalesCount: 10, totalPqrCount: 1, salesRecognizedAmount: '100000.00', pqrRecognizedAmount: '10000.00',
    reversedAmount: '0.00', grossAccumulatedAmount: '110000.00', accumulatedAmount: '110000.00',
    linkedPaymentsAmount: '0.00', pendingDailyAmount: '110000.00', providerOutstandingBalance: '500000.00',
    suggestedPayableAmount: '110000.00', overpaidAmount: '0.00',
};

function renderPage(entry = '/admin/liquidacion') {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[entry]}><DailySettlementPage /></MemoryRouter></QueryClientProvider>);
}

function httpError(status, data) {
    return new AxiosError('fail', 'ERR', {}, {}, { status, data, statusText: '', headers: {}, config: {} });
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
beforeEach(() => vi.spyOn(supplierService, 'searchSuppliers').mockResolvedValue({ suppliers: [], total: 0 }));

describe('daily settlement page', () => {
    it('shows the backend business date and a real empty state while activation is pending', async () => {
        vi.spyOn(settlementService, 'getDailySummary').mockResolvedValue(empty);
        renderPage();
        expect(screen.getByText('Cargando liquidación diaria…')).toBeInTheDocument();
        expect(await screen.findByText('No hay movimientos de liquidación registrados para esta jornada.')).toBeInTheDocument();
        expect(screen.getByText(/23 de octubre de 2026/)).toBeInTheDocument();
        expect(screen.getByText('Hora de Bogotá (America/Bogota)')).toBeInTheDocument();
        expect(screen.getByRole('note')).toHaveTextContent('aún no está activada');
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /pagar|detalle/i })).not.toBeInTheDocument();
        expect(settlementService.getDailySummary).toHaveBeenCalledWith(0, 20, null, null, expect.any(AbortSignal));
    });

    it('renders backend amounts per supplier without recalculating them', async () => {
        vi.spyOn(settlementService, 'getDailySummary').mockResolvedValue({
            ...empty, activationPending: false, activatedAt: '2026-10-23T05:00:00Z',
            content: [{ ...provider, suggestedPayableAmount: '99999.99' }], totalElements: 1, totalPages: 1,
        });
        renderPage();
        const table = await screen.findByRole('table');
        const cells = within(table).getAllByRole('row')[1];
        expect(within(cells).getByRole('rowheader')).toHaveTextContent('Distribuidora Cannabis SAS');
        expect(cells).toHaveTextContent('10');
        expect(cells).toHaveTextContent('$100.000');
        expect(cells).toHaveTextContent('$500.000');
        expect(cells).toHaveTextContent('$99.999,99');
        expect(screen.getByText(/Acumulación activa desde/)).toBeInTheDocument();
        expect(screen.queryByRole('note')).not.toBeInTheDocument();
    });

    it.each([
        [httpError(403, { message: 'Acceso denegado' }), 'No tienes permisos para consultar la liquidación diaria.'],
        [httpError(401, { message: 'Autenticación requerida' }), 'Tu sesión no es válida o expiró. Inicia sesión nuevamente.'],
        [new AxiosError('Network Error', 'ERR_NETWORK'), 'No se pudo conectar con el servidor de liquidación'],
        [new InvalidSettlementResponseError(), 'La respuesta del servidor de liquidación está incompleta'],
    ])('shows an error instead of zeros: %s', async (error, message) => {
        vi.spyOn(settlementService, 'getDailySummary').mockRejectedValue(error);
        renderPage();
        expect(await screen.findByRole('alert')).toHaveTextContent(message);
        expect(screen.queryByText(/No hay movimientos/)).not.toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('retries after a failure and pages with server totals', async () => {
        const get = vi.spyOn(settlementService, 'getDailySummary')
            .mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
            .mockResolvedValue({ ...empty, content: [provider], totalElements: 21, totalPages: 2 });
        renderPage();
        fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
        expect(await screen.findByText('Página 1 de 2')).toBeInTheDocument();
        fireEvent.click(within(screen.getByRole('navigation', { name: 'Paginación de la liquidación' })).getByRole('button', { name: 'Siguiente' }));
        await waitFor(() => expect(get).toHaveBeenLastCalledWith(1, 20, null, null, expect.any(AbortSignal)));
    });

    it('queries the journey given in the link and offers going back to today (HU-04/F4)', async () => {
        const get = vi.spyOn(settlementService, 'getDailySummary').mockResolvedValue({
            ...empty, date: '2026-10-20', activationPending: false, activatedAt: '2026-10-19T05:00:00Z',
            content: [{ ...provider, date: '2026-10-20', totalPqrCount: 1, reversedAmount: '20000.00' }], totalElements: 1, totalPages: 1,
        });
        renderPage('/admin/liquidacion?date=2026-10-20');
        expect(await screen.findByText(/20 de octubre de 2026/)).toBeInTheDocument();
        expect(get).toHaveBeenCalledWith(0, 20, '2026-10-20', null, expect.any(AbortSignal));
        expect(screen.getByRole('link', { name: 'Ver jornada de hoy' })).toHaveAttribute('href', '/admin/liquidacion');
        expect(screen.getByText(/su costo aparece en "Revertido" de la jornada en que se creó/)).toBeInTheDocument();
        expect(within(screen.getByRole('table')).getAllByRole('row')[1]).toHaveTextContent('$20.000');
    });

    it.each(['20-10-2026', '2026-02-30'])('rejects an invalid date without silently querying today: %s', async (date) => {
        const get = vi.spyOn(settlementService, 'getDailySummary').mockResolvedValue(empty);
        renderPage(`/admin/liquidacion?date=${date}`);
        expect(await screen.findByRole('alert')).toHaveTextContent('La fecha de la jornada no es válida');
        expect(get).not.toHaveBeenCalled();
    });

    it('registers a payment linked to the displayed journey and reloads the summary (HU-04/F5)', async () => {
        const get = vi.spyOn(settlementService, 'getDailySummary').mockResolvedValue({
            ...empty, date: '2026-10-17', activationPending: false, activatedAt: '2026-10-01T05:00:00Z',
            content: [{ ...provider, date: '2026-10-17', suggestedPayableAmount: '110000.00' }], totalElements: 1, totalPages: 1,
        });
        vi.spyOn(supplierService, 'getSupplier').mockResolvedValue({
            id: provider.providerId, nombre: 'Distribuidora Cannabis SAS', nit: '900', estado: 'ACTIVO',
            totalDeuda: 900000, totalPagado: 400000, saldoPendiente: 500000, fechaCreacion: '', ultimaActualizacion: '',
        });
        const pay = vi.spyOn(supplierService, 'registerLinkedPayment').mockResolvedValue({
            proveedor: {}, correlationId: 'c', fechaLiquidacion: '2026-10-17', monto: 110000,
            asignaciones: [{ loteId: 'lote-a', monto: 60000 }, { loteId: 'lote-b', monto: 50000 }],
        });
        renderPage('/admin/liquidacion?date=2026-10-17');

        fireEvent.click(await screen.findByRole('button', { name: 'Registrar pago a Distribuidora Cannabis SAS' }));
        expect(await screen.findByLabelText(/^Monto/)).toHaveValue(110000);
        fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Confirmar pago' }));

        await waitFor(() => expect(pay).toHaveBeenCalledWith(provider.providerId, expect.objectContaining({ monto: 110000, fechaLiquidacion: '2026-10-17' })));
        expect(await screen.findByText(/vinculado a la jornada del 17 de octubre de 2026/)).toHaveTextContent('lote lote-a: $60.000; lote lote-b: $50.000');
        await waitFor(() => expect(get.mock.calls.length).toBeGreaterThan(1));
    });

    it('preserves summary filters and page while independently paging the audit detail', async () => {
        const get = vi.spyOn(settlementService, 'getDailySummary').mockResolvedValue({
            ...empty, page: 2, size: 10, content: [provider], totalElements: 31, totalPages: 4,
        });
        const detail = vi.spyOn(settlementService, 'getDailyDetail').mockImplementation(async (_date, _id, page, size) => ({
            content: [], page, size, totalElements: 11, totalPages: 2,
        }));
        renderPage(`/admin/liquidacion?date=2026-10-23&providerId=${provider.providerId.toUpperCase()}&page=2&size=10`);
        fireEvent.click(await screen.findByRole('button', { name: 'Ver movimientos de Distribuidora Cannabis SAS' }));
        expect(await screen.findByText('No hay movimientos para este proveedor y jornada.')).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
        expect(detail).toHaveBeenLastCalledWith('2026-10-23', provider.providerId, 0, 10, expect.any(AbortSignal));
        fireEvent.click(within(screen.getByRole('navigation', { name: 'Paginación del detalle' })).getByRole('button', { name: 'Siguiente' }));
        expect(await screen.findByText('Esta página no tiene movimientos.')).toBeInTheDocument();
        expect(detail).toHaveBeenLastCalledWith('2026-10-23', provider.providerId, 1, 10, expect.any(AbortSignal));
        fireEvent.click(screen.getByRole('button', { name: 'Volver al resumen' }));
        expect(await screen.findByText('Página 3 de 4')).toBeInTheDocument();
        expect(screen.getByLabelText('Fecha de jornada')).toHaveValue('2026-10-23');
        expect(screen.getByLabelText(/Proveedor seleccionado/)).toHaveValue(provider.providerId.toUpperCase());
        expect(screen.getByLabelText('Resultados por página')).toHaveValue('10');
        expect(get).toHaveBeenLastCalledWith(2, 10, '2026-10-23', provider.providerId, expect.any(AbortSignal));
        fireEvent.change(screen.getByLabelText('Fecha de jornada'), { target: { value: '2026-10-22' } });
        await waitFor(() => expect(get).toHaveBeenLastCalledWith(0, 10, '2026-10-22', provider.providerId, expect.any(AbortSignal)));
        fireEvent.change(screen.getByLabelText('Resultados por página'), { target: { value: '100' } });
        await waitFor(() => expect(get).toHaveBeenLastCalledWith(0, 100, '2026-10-22', provider.providerId, expect.any(AbortSignal)));
    });

    it('distinguishes presentation snapshots, reversals and a single allocated payment', async () => {
        vi.spyOn(settlementService, 'getDailySummary').mockResolvedValue({
            ...empty, content: [{ ...provider, salesRecognizedAmount: '25000.00' }], totalElements: 1, totalPages: 1,
        });
        const sale = {
            id: 'sale-a', providerId: provider.providerId, date: '2026-10-23', timestamp: '2026-10-23T10:00:00Z',
            movementType: 'SALE', orderId: 12, itemIndex: 0, lotId: 'lot-a', containerId: 'container-a',
            presentationId: 'presentation-5g', quantity: 2, contentPerUnit: 5, baseUnit: 'gramo', unitCost: '10000.00', amount: '20000.00',
        };
        vi.spyOn(settlementService, 'getDailyDetail').mockResolvedValue({
            page: 0, size: 20, totalElements: 5, totalPages: 1,
            content: [
                sale,
                { ...sale, id: 'sale-b', presentationId: 'presentation-1g', quantity: 1, contentPerUnit: 1, unitCost: '5000.00', amount: '5000.00' },
                { ...sale, id: 'pqr-a', movementType: 'PQR', quantity: 1, amount: '10000.00' },
                { ...sale, id: 'reversal-a', movementType: 'PQR_REVERSAL', originalMovementId: 'pqr-a', timestamp: '2026-10-26T15:00:00Z', amount: '10000.00' },
                { id: 'payment-a', providerId: provider.providerId, movementType: 'PAYMENT', date: sale.date, timestamp: '2026-10-26T16:00:00Z',
                    correlationId: 'correlation-a', paymentType: 'TRANSFERENCIA', amount: '15000.00',
                    allocations: [{ transactionId: 'transaction-a', lotId: 'lot-a', amount: '10000.00' }, { transactionId: 'transaction-b', lotId: 'lot-b', amount: '5000.00' }] },
            ],
        });
        renderPage();
        const summary = await screen.findByRole('table');
        expect(summary).toHaveTextContent('$25.000');
        fireEvent.click(screen.getByRole('button', { name: 'Ver movimientos de Distribuidora Cannabis SAS' }));
        const table = await screen.findByRole('table', { name: 'Movimientos del proveedor y jornada' });
        const rows = within(table).getAllByRole('row').slice(1);
        expect(rows).toHaveLength(5);
        expect(rows[0]).toHaveTextContent('presentation-5g');
        expect(rows[0]).toHaveTextContent('$20.000');
        expect(rows[0]).toHaveTextContent('$10.000');
        expect(rows[0]).toHaveTextContent('Ítem: 0');
        expect(rows[0]).toHaveTextContent('Orden: 12');
        expect(rows[1]).toHaveTextContent('presentation-1g');
        expect(rows[1]).toHaveTextContent('$5.000');
        expect(rows[3]).toHaveTextContent('Reversión PQR');
        expect(rows[3]).toHaveTextContent('Movimiento original: pqr-a');
        expect(rows[3]).toHaveTextContent('2026-10-26T15:00:00Z');
        expect(rows[3]).toHaveTextContent('Jornada afectada: 2026-10-23');
        expect(rows[4]).toHaveTextContent('Correlación: correlation-a');
        expect(within(rows[4]).getAllByRole('listitem')).toHaveLength(2);
        const paymentCells = within(rows[4]).getAllByRole('cell');
        expect(paymentCells[3]).toHaveTextContent('No aplica');
        expect(paymentCells[4]).toHaveTextContent('No aplica');
        expect(paymentCells[5]).toHaveTextContent('$15.000');
        expect(within(table).queryByRole('link')).not.toBeInTheDocument();
    });

    it('cancels obsolete queries and does not mix late providers or dates', async () => {
        let resolveOld;
        const old = new Promise((resolve) => { resolveOld = resolve; });
        const get = vi.spyOn(settlementService, 'getDailySummary').mockImplementation((_page, _size, date, id) =>
            date === '2026-10-23' && id === provider.providerId ? old : Promise.resolve({
                ...empty, date: date ?? empty.date, content: [{ ...provider, providerId: id, providerName: 'Proveedor actual', date }],
                totalElements: 1, totalPages: 1,
            }));
        renderPage(`/admin/liquidacion?date=2026-10-23&providerId=${provider.providerId}&page=3`);
        await waitFor(() => expect(get).toHaveBeenCalled());
        const obsoleteSignal = get.mock.calls[0][4];
        fireEvent.change(screen.getByLabelText('Fecha de jornada'), { target: { value: '2026-10-22' } });
        fireEvent.change(screen.getByLabelText(/Proveedor seleccionado/), { target: { value: '6500000000000000000000ac' } });
        expect(await screen.findByRole('rowheader')).toHaveTextContent('Proveedor actual');
        expect(screen.getByRole('rowheader')).toHaveTextContent('6500000000000000000000ac');
        await act(async () => resolveOld({ ...empty, content: [provider], totalElements: 1, totalPages: 1 }));
        expect(obsoleteSignal.aborted).toBe(true);
        expect(screen.getByRole('rowheader')).not.toHaveTextContent('Distribuidora Cannabis SAS');
        expect(get).toHaveBeenLastCalledWith(0, 20, '2026-10-22', '6500000000000000000000ac', expect.any(AbortSignal));
    });

    it('selects a supplier using paginated search without downloading all providers', async () => {
        const search = supplierService.searchSuppliers.mockResolvedValue({
            suppliers: [{ id: provider.providerId, nombre: provider.providerName, nit: '900', estado: 'ACTIVO' }], total: 21,
        });
        const get = vi.spyOn(settlementService, 'getDailySummary').mockResolvedValue(empty);
        renderPage();
        fireEvent.click(screen.getByText('Buscar y seleccionar proveedor'));
        fireEvent.change(screen.getByLabelText(/Nombre o NIT/), { target: { value: 'Cannabis' } });
        await waitFor(() => expect(screen.getByRole('button', { name: 'Buscar', exact: true })).toBeEnabled());
        fireEvent.click(screen.getByRole('button', { name: 'Buscar', exact: true }));
        await waitFor(() => expect(search).toHaveBeenCalledWith('Cannabis', 0, 20));
        fireEvent.click(within(await screen.findByRole('navigation', { name: 'Paginación de proveedores' })).getByRole('button', { name: 'Siguiente' }));
        await waitFor(() => expect(search).toHaveBeenLastCalledWith('Cannabis', 1, 20));
        fireEvent.click(await screen.findByRole('button', { name: `Seleccionar ${provider.providerName}` }));
        await waitFor(() => expect(get).toHaveBeenLastCalledWith(0, 20, null, provider.providerId, expect.any(AbortSignal)));
    });

    it('does not display a late detail from a previous provider or journey', async () => {
        let resolveOld;
        const old = new Promise((resolve) => { resolveOld = resolve; });
        vi.spyOn(settlementService, 'getDailySummary').mockImplementation(async (_page, _size, date, id) => ({
            ...empty, date, content: [{ ...provider, date, providerId: id, providerName: 'Proveedor nuevo' }],
            totalElements: 1, totalPages: 1,
        }));
        const get = vi.spyOn(settlementService, 'getDailyDetail').mockImplementation((date) =>
            date === '2026-10-23' ? old : Promise.resolve({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }));
        renderPage(`/admin/liquidacion?date=2026-10-23&providerId=${provider.providerId}&detailProviderId=${provider.providerId}&detailDate=2026-10-23`);
        await waitFor(() => expect(get).toHaveBeenCalled());
        const obsoleteSignal = get.mock.calls[0][4];
        fireEvent.click(screen.getByRole('button', { name: 'Volver al resumen' }));
        fireEvent.change(screen.getByLabelText('Fecha de jornada'), { target: { value: '2026-10-22' } });
        fireEvent.change(screen.getByLabelText(/Proveedor seleccionado/), { target: { value: '6500000000000000000000ac' } });
        fireEvent.click(await screen.findByRole('button', { name: 'Ver movimientos de Proveedor nuevo' }));
        expect(await screen.findByText('No hay movimientos para este proveedor y jornada.')).toBeInTheDocument();
        await act(async () => resolveOld({
            content: [{ id: 'old-payment', movementType: 'PAYMENT', correlationId: 'old-correlation', amount: '10', paymentType: 'EFECTIVO',
                date: '2026-10-23', timestamp: '2026-10-23T10:00:00Z', allocations: [] }],
            page: 0, size: 20, totalElements: 1, totalPages: 1,
        }));
        expect(obsoleteSignal.aborted).toBe(true);
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
        expect(screen.queryByText(/old-correlation/)).not.toBeInTheDocument();
        expect(get).toHaveBeenLastCalledWith('2026-10-22', '6500000000000000000000ac', 0, 20, expect.any(AbortSignal));
    });

    it.each(['page=-1', 'page=1.5', 'size=0', 'size=101', 'providerId=no-id', 'detailProviderId=bad&detailDate=2026-10-23'])('rejects invalid query parameters: %s', async (params) => {
        const get = vi.spyOn(settlementService, 'getDailySummary').mockResolvedValue(empty);
        const detail = vi.spyOn(settlementService, 'getDailyDetail').mockResolvedValue({});
        renderPage(`/admin/liquidacion?${params}`);
        expect(await screen.findByRole('alert')).toHaveTextContent('Proveedor o paginación no válidos');
        expect(get).not.toHaveBeenCalled();
        expect(detail).not.toHaveBeenCalled();
    });

    it.each([1, 100])('accepts the page-size boundary %s and shows server zero counts', async (size) => {
        const get = vi.spyOn(settlementService, 'getDailySummary').mockResolvedValue({ ...empty, size });
        renderPage(`/admin/liquidacion?size=${size}&page=0`);
        expect(await screen.findByText('Sin páginas (0 resultados)')).toBeInTheDocument();
        expect(screen.getByLabelText('Resultados por página')).toHaveValue(String(size));
        expect(get).toHaveBeenCalledWith(0, size, null, null, expect.any(AbortSignal));
        const pagination = screen.getByRole('navigation', { name: 'Paginación de la liquidación' });
        expect(within(pagination).getByRole('button', { name: 'Anterior' })).toBeDisabled();
        expect(within(pagination).getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    });

    it('surfaces detail HTTP 400/403 errors and retries without showing fake audit rows', async () => {
        const get = vi.spyOn(settlementService, 'getDailyDetail')
            .mockRejectedValueOnce(httpError(400, { message: 'Proveedor inválido' }))
            .mockRejectedValueOnce(httpError(403, {}))
            .mockResolvedValue({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
        renderPage(`/admin/liquidacion?detailProviderId=${provider.providerId}&detailDate=2026-10-23`);
        expect(await screen.findByRole('alert')).toHaveTextContent('Proveedor inválido');
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Reintentar detalle' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permisos');
        fireEvent.click(screen.getByRole('button', { name: 'Reintentar detalle' }));
        expect(await screen.findByText('No hay movimientos para este proveedor y jornada.')).toBeInTheDocument();
        expect(get).toHaveBeenCalledTimes(3);
    });
});
