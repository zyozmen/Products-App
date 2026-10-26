import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import OrdersKanbanComponent from '../components/admin/orders/OrdersKanbanComponent.jsx';
import orderService from '../services/OrderService.js';
import AuthenticationService from '../services/AuthenticationService.js';
import translationService from '../services/TranslationService.js';
import { settlementKeys } from '../hooks/useSettlementQueries';

vi.mock('../components/dashboard/HeaderComponent.jsx', () => ({ default: () => null }));
vi.mock('../components/dashboard/FooterComponent.jsx', () => ({ default: () => null }));
vi.mock('../components/admin/AdminNav.jsx', () => ({ default: () => null }));
vi.mock('../components/navigation/NavigationComponent.jsx', () => ({ default: (Component) => Component }));

const now = new Date().toISOString();
const base = { username: 'cliente', total: 11600, items: [{ productId: 'p', name: 'Tangerine 10 g', quantity: 1, unitPrice: 10000 }], createdAt: now };
const created = { ...base, id: 41, status: 'CREADA' };
const paid = { ...base, id: 42, status: 'PAGADA', paidAt: now };
const packedCod = { ...base, id: 43, status: 'EMPACADA', cashOnDelivery: true, paidAt: now };
const pqr = { ...base, id: 44, status: 'CREADA', pqr: true, total: 0 };
const packedCodToDeliver = { ...base, id: 45, status: 'EMPACADA', cashOnDelivery: true, paidAt: now, total: 34800 };

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
    vi.spyOn(orderService, 'getAllOrders').mockResolvedValue([created, paid, packedCod, pqr]);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('orders kanban with daily settlement (HU-04/F2)', () => {
    it('does not offer cancelling sales that went through PAGADA but keeps it for CREADA and PQR', async () => {
        renderKanban();
        await screen.findByText('#42');
        expect(options(41)).toContain('CANCELADA');
        expect(options(42)).toEqual(['PAGADA', 'EMPACADA']);
        expect(options(43)).toEqual(['EMPACADA', 'ENTREGADA']);
        expect(options(44)).toContain('CANCELADA');
        expect(screen.getAllByText('Venta pagada: no se puede cancelar.')).toHaveLength(2);
    });

    it('pays a normal sale, refreshes orders and settlement from the server and links to the summary', async () => {
        const update = vi.spyOn(orderService, 'updateOrderStatus').mockResolvedValue({ ...created, status: 'PAGADA', cashOnDelivery: false });
        const invalidate = renderKanban();
        await screen.findByText('#41');
        fireEvent.change(statusSelect(41), { target: { value: 'PAGADA' } });
        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByRole('note')).toHaveTextContent('Una venta pagada ya no se puede cancelar.');
        fireEvent.click(within(dialog).getByRole('button', { name: 'Aceptar' }));

        await waitFor(() => expect(update).toHaveBeenCalledWith(41, 'PAGADA', { cashOnDelivery: false }));
        expect(await screen.findByText(/Pago de la orden #41 confirmado/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Ver liquidación diaria' })).toHaveAttribute('href', '/admin/liquidacion');
        expect(invalidate).toHaveBeenCalledWith({ queryKey: settlementKeys.all });
        expect(update).toHaveBeenCalledTimes(1);
    });

    it('shows a 409 conflict and refreshes the affected order without retrying', async () => {
        const update = vi.spyOn(orderService, 'updateOrderStatus')
            .mockRejectedValue(Object.assign(new Error('No se permite cambiar el estado de PAGADA a PAGADA'), { status: 409 }));
        const invalidate = renderKanban();
        await screen.findByText('#41');
        fireEvent.change(statusSelect(41), { target: { value: 'PAGADA' } });
        fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Aceptar' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'No se permite cambiar el estado de PAGADA a PAGADA Se actualizó el tablero con el estado vigente de la orden.');
        expect(invalidate).toHaveBeenCalledWith({ queryKey: settlementKeys.all });
        await waitFor(() => expect(orderService.getAllOrders.mock.calls.length).toBeGreaterThan(1));
        expect(update).toHaveBeenCalledTimes(1);
        expect(screen.queryByText(/Pago de la orden/)).not.toBeInTheDocument();
    });

    it('treats a missing response as uncertain instead of failure or success', async () => {
        vi.spyOn(orderService, 'updateOrderStatus').mockRejectedValue(Object.assign(new Error('x'), { status: null }));
        renderKanban();
        await screen.findByText('#41');
        fireEvent.change(statusSelect(41), { target: { value: 'PAGADA' } });
        fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Aceptar' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('el cambio pudo haberse aplicado');
    });

    it('confirms cash on delivery without announcing a recognized cost', async () => {
        vi.spyOn(orderService, 'updateOrderStatus').mockResolvedValue({ ...created, status: 'PAGADA', cashOnDelivery: true });
        renderKanban();
        await screen.findByText('#41');
        fireEvent.change(statusSelect(41), { target: { value: 'PAGADA' } });
        const dialog = await screen.findByRole('dialog');
        fireEvent.click(within(dialog).getByRole('checkbox'));
        fireEvent.click(within(dialog).getByRole('button', { name: 'Aceptar' }));
        expect(await screen.findByText(/confirmado como contra entrega/)).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Ver liquidación diaria' })).not.toBeInTheDocument();
    });
});

describe('cash on delivery recognition at delivery (HU-04/F3)', () => {
    const deliver = async () => {
        await screen.findByText('#45');
        fireEvent.change(statusSelect(45), { target: { value: 'ENTREGADA' } });
        const dialog = await screen.findByRole('dialog');
        fireEvent.change(within(dialog).getByLabelText('Efectivo'), { target: { value: '30000' } });
        fireEvent.change(within(dialog).getByLabelText('Tarjeta'), { target: { value: '4800' } });
        fireEvent.click(within(dialog).getByRole('button', { name: 'Aceptar' }));
        return dialog;
    };

    beforeEach(() => {
        orderService.getAllOrders.mockResolvedValue([packedCodToDeliver, paid]);
    });

    it('marks paid or packed cash-on-delivery sales as pending cost recognition', async () => {
        renderKanban();
        await screen.findByText('#45');
        expect(screen.getByText('Contra entrega: stock descontado; el costo se reconoce al proveedor al entregar.')).toBeInTheDocument();
    });

    it('delivers with the real collected amounts and refreshes orders and settlement from the server', async () => {
        const update = vi.spyOn(orderService, 'updateOrderStatus').mockResolvedValue({ ...packedCodToDeliver, status: 'ENTREGADA' });
        const invalidate = renderKanban();
        const dialog = await deliver();
        expect(within(dialog).getByRole('note')).toHaveTextContent('Al confirmar la entrega se reconoce al proveedor el costo de la venta');
        await waitFor(() => expect(update).toHaveBeenCalledWith(45, 'ENTREGADA', { cashAmount: 30000, cardAmount: 4800 }));
        expect(await screen.findByText(/Entrega de la orden #45 confirmada/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Ver liquidación diaria' })).toHaveAttribute('href', '/admin/liquidacion');
        expect(invalidate).toHaveBeenCalledWith({ queryKey: settlementKeys.all });
        expect(update).toHaveBeenCalledTimes(1);
    });

    it('keeps the dialog open with the server validation error and shows no success', async () => {
        vi.spyOn(orderService, 'updateOrderStatus').mockRejectedValue(
            Object.assign(new Error('La suma de efectivo y tarjeta debe ser igual al total de la orden'), { status: 422 }));
        renderKanban();
        const dialog = await deliver();
        expect(await within(dialog).findByText('La suma de efectivo y tarjeta debe ser igual al total de la orden')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.queryByText(/Entrega de la orden/)).not.toBeInTheDocument();
    });

    it('closes the dialog and refreshes the board on a delivery conflict', async () => {
        vi.spyOn(orderService, 'updateOrderStatus').mockRejectedValue(
            Object.assign(new Error('No se permite cambiar el estado de ENTREGADA a ENTREGADA'), { status: 409 }));
        renderKanban();
        await deliver();
        expect(await screen.findByRole('alert')).toHaveTextContent('Se actualizó el tablero con el estado vigente de la orden.');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
});
