import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError } from 'axios';
import DailySettlementPage from '../components/admin/settlements/DailySettlementPage.tsx';
import { InvalidSettlementResponseError, settlementService } from '../services/settlementService.ts';

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

describe('daily settlement page', () => {
    it('shows the backend business date and a real empty state while activation is pending', async () => {
        vi.spyOn(settlementService, 'getDailySummary').mockResolvedValue(empty);
        renderPage();
        expect(screen.getByRole('status')).toHaveTextContent('Cargando liquidación diaria');
        expect(await screen.findByText('No hay movimientos de liquidación registrados para esta jornada.')).toBeInTheDocument();
        expect(screen.getByText(/23 de octubre de 2026/)).toBeInTheDocument();
        expect(screen.getByText('Hora de Bogotá (America/Bogota)')).toBeInTheDocument();
        expect(screen.getByRole('note')).toHaveTextContent('aún no está activada');
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /pagar|detalle/i })).not.toBeInTheDocument();
        expect(settlementService.getDailySummary).toHaveBeenCalledWith(0, 20, null);
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
        fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
        await waitFor(() => expect(get).toHaveBeenLastCalledWith(1, 20, null));
    });

    it('queries the journey given in the link and offers going back to today (HU-04/F4)', async () => {
        const get = vi.spyOn(settlementService, 'getDailySummary').mockResolvedValue({
            ...empty, date: '2026-10-20', activationPending: false, activatedAt: '2026-10-19T05:00:00Z',
            content: [{ ...provider, date: '2026-10-20', totalPqrCount: 1, reversedAmount: '20000.00' }], totalElements: 1, totalPages: 1,
        });
        renderPage('/admin/liquidacion?date=2026-10-20');
        expect(await screen.findByText(/20 de octubre de 2026/)).toBeInTheDocument();
        expect(get).toHaveBeenCalledWith(0, 20, '2026-10-20');
        expect(screen.getByRole('link', { name: 'Ver jornada de hoy' })).toHaveAttribute('href', '/admin/liquidacion');
        expect(screen.getByText(/su costo aparece en "Revertido" de la jornada en que se creó/)).toBeInTheDocument();
        expect(within(screen.getByRole('table')).getAllByRole('row')[1]).toHaveTextContent('$20.000');
    });

    it('rejects a malformed date in the link and shows today instead', async () => {
        const get = vi.spyOn(settlementService, 'getDailySummary').mockResolvedValue(empty);
        renderPage('/admin/liquidacion?date=20-10-2026');
        expect(await screen.findByText(/La fecha de la jornada en el enlace no es válida/)).toBeInTheDocument();
        expect(get).toHaveBeenCalledWith(0, 20, null);
    });
});
