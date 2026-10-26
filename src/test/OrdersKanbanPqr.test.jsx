import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import OrdersKanbanComponent from '../components/admin/orders/OrdersKanbanComponent.jsx';
import orderService from '../services/OrderService.js';
import AuthenticationService from '../services/AuthenticationService.js';
import translationService from '../services/TranslationService.js';
import { settlementKeys } from '../hooks/useSettlementQueries';
import { marketplaceKeys } from '../hooks/useMarketplaceQueries';
import { businessDateOf } from '../utils/businessDate';

vi.mock('../components/dashboard/HeaderComponent.jsx', () => ({ default: () => null }));
vi.mock('../components/dashboard/FooterComponent.jsx', () => ({ default: () => null }));
vi.mock('../components/admin/AdminNav.jsx', () => ({ default: () => null }));
vi.mock('../components/navigation/NavigationComponent.jsx', () => ({ default: (Component) => Component }));
vi.mock('../components/admin/orders/PqrOrderDialog.jsx', () => ({
    default: ({ onCreate, onCancel, isSubmitting }) => (
        <div role="dialog" aria-label="pqr-stub">
            <button type="button" disabled={isSubmitting} onClick={() => { void onCreate({ username: 'cliente', items: [{ productId: 'p', quantity: 2 }] }).catch(() => {}); }}>crear-stub</button>
            <button type="button" onClick={onCancel}>cerrar-stub</button>
        </div>
    ),
}));

const now = new Date().toISOString();
const today = businessDateOf(now);
const item = { productId: 'p', name: 'Tangerine 10 g', quantity: 2, unitPrice: 0 };
const pqrCreated = { id: 50, username: 'cliente', status: 'CREADA', pqr: true, total: 0, items: [item], createdAt: now };
const pqrPacked = { ...pqrCreated, id: 51, status: 'EMPACADA' };
const pqrDelivered = { ...pqrCreated, id: 52, status: 'ENTREGADA' };

function renderKanban() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    render(<QueryClientProvider client={client}><MemoryRouter><OrdersKanbanComponent navigate={vi.fn()} /></MemoryRouter></QueryClientProvider>);
    return invalidate;
}

const statusSelect = (id) => screen.getByLabelText(new RegExp(`Estado ${id}$`));
const options = (id) => within(statusSelect(id)).getAllByRole('option').map((option) => option.value);

beforeEach(() => {
    translationService.setLanguage('ES');
    vi.spyOn(AuthenticationService, 'isUserAdmin').mockReturnValue(true);
    vi.spyOn(orderService, 'getAllOrders').mockResolvedValue([pqrCreated, pqrPacked, pqrDelivered]);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('PQR recognition and reversal on the orders board (HU-04/F4)', () => {
    it('allows cancelling PQR only in CREADA or EMPACADA and explains the recognized cost', async () => {
        renderKanban();
        await screen.findByText('#50');
        expect(options(50)).toContain('CANCELADA');
        expect(options(51)).toContain('CANCELADA');
        expect(options(52)).toEqual(['ENTREGADA']);
        expect(screen.getAllByText(`PQR: costo reconocido al proveedor en la jornada de creación (${today}).`)).toHaveLength(3);
    });

    it('confirms the cancellation, then refreshes orders, stock and the creation-day settlement', async () => {
        const update = vi.spyOn(orderService, 'updateOrderStatus').mockResolvedValue({ ...pqrCreated, status: 'CANCELADA' });
        const invalidate = renderKanban();
        await screen.findByText('#50');
        fireEvent.change(statusSelect(50), { target: { value: 'CANCELADA' } });
        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByRole('note')).toHaveTextContent('Se devolverán 2 unidad(es) al inventario.');
        expect(within(dialog).getByRole('note')).toHaveTextContent(`se revierte en la liquidación del ${today} (jornada de creación)`);
        expect(update).not.toHaveBeenCalled();

        fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar PQR' }));
        await waitFor(() => expect(update).toHaveBeenCalledWith(50, 'CANCELADA', {}));
        expect(await screen.findByText(/PQR #50 cancelada\. Se restituyó el stock/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: `Ver liquidación del ${today}` })).toHaveAttribute('href', `/admin/liquidacion?date=${today}`);
        expect(invalidate).toHaveBeenCalledWith({ queryKey: settlementKeys.all });
        expect(invalidate).toHaveBeenCalledWith({ queryKey: marketplaceKeys.all });
        expect(update).toHaveBeenCalledTimes(1);
    });

    it('does not cancel when the confirmation is dismissed', async () => {
        const update = vi.spyOn(orderService, 'updateOrderStatus');
        renderKanban();
        await screen.findByText('#51');
        fireEvent.change(statusSelect(51), { target: { value: 'CANCELADA' } });
        fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Volver' }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(update).not.toHaveBeenCalled();
    });

    it('shows a 409 from an inconsistent original accumulation without announcing success', async () => {
        vi.spyOn(orderService, 'updateOrderStatus').mockRejectedValue(
            Object.assign(new Error('El acumulado original de la PQR no es consistente'), { status: 409 }));
        renderKanban();
        await screen.findByText('#50');
        fireEvent.change(statusSelect(50), { target: { value: 'CANCELADA' } });
        fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancelar PQR' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('El acumulado original de la PQR no es consistente');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.queryByText(/PQR #50 cancelada/)).not.toBeInTheDocument();
    });

    it('announces a created PQR with a link to its creation-day settlement', async () => {
        const create = vi.spyOn(orderService, 'createPqrOrder').mockResolvedValue({ ...pqrCreated, id: 60 });
        const invalidate = renderKanban();
        await screen.findByText('#50');
        fireEvent.click(screen.getByRole('button', { name: 'Crear orden PQR' }));
        fireEvent.click(await screen.findByRole('button', { name: 'crear-stub' }));
        expect(await screen.findByText(`PQR #60 creada con 2 unidad(es). Su costo se reconoce al proveedor en la liquidación del ${today} si la orden es posterior al inicio de la acumulación.`)).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(invalidate).toHaveBeenCalledWith({ queryKey: settlementKeys.all });
        expect(invalidate).toHaveBeenCalledWith({ queryKey: marketplaceKeys.all });
        expect(create).toHaveBeenCalledTimes(1);
    });

    it('never resends a PQR after an uncertain response and asks to verify it first', async () => {
        const create = vi.spyOn(orderService, 'createPqrOrder').mockRejectedValue(Object.assign(new Error('timeout'), { status: null }));
        renderKanban();
        await screen.findByText('#50');
        fireEvent.click(screen.getByRole('button', { name: 'Crear orden PQR' }));
        fireEvent.click(await screen.findByRole('button', { name: 'crear-stub' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('la PQR pudo haberse creado');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        await waitFor(() => expect(orderService.getAllOrders.mock.calls.length).toBeGreaterThan(1));
        expect(create).toHaveBeenCalledTimes(1);
    });

    it('keeps the dialog open on a validation error so it can be corrected', async () => {
        vi.spyOn(orderService, 'createPqrOrder').mockRejectedValue(Object.assign(new Error('Stock insuficiente'), { status: 422 }));
        renderKanban();
        await screen.findByText('#50');
        fireEvent.click(screen.getByRole('button', { name: 'Crear orden PQR' }));
        fireEvent.click(await screen.findByRole('button', { name: 'crear-stub' }));
        await waitFor(() => expect(orderService.createPqrOrder).toHaveBeenCalled());
        expect(screen.getByRole('dialog', { name: 'pqr-stub' })).toBeInTheDocument();
        expect(screen.queryByText(/PQR #/)).not.toBeInTheDocument();
    });
});
