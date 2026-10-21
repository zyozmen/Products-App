import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CreatedOrdersBadge from '../components/admin/orders/CreatedOrdersBadge.jsx';
import AuthenticationService from '../services/AuthenticationService.js';
import orderService from '../services/OrderService.js';
import { apiQueryKeys, useOrderMutations } from '../hooks/useApiQueries.ts';

function setup(admin = true) {
    vi.spyOn(AuthenticationService, 'isUserAdmin').mockReturnValue(admin);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><CreatedOrdersBadge /></QueryClientProvider>);
    return client;
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('created orders counter', () => {
    it('counts only created orders across all dates, including PQR', async () => {
        vi.spyOn(orderService, 'getAllOrders').mockResolvedValue([
            { id: 'old', status: 'CREADA', createdAt: '2020-01-01' },
            { id: 'pqr', status: 'creada', pqr: true },
            ...['PAGADA', 'EMPACADA', 'ENTREGADA', 'CANCELADA', 'DESPACHADA'].map((status) => ({ status })),
        ]);
        setup();
        expect(await screen.findByRole('status', { name: 'Órdenes creadas: 2' })).toHaveTextContent('2');
    });

    it('updates after query invalidation and hides when no created orders remain', async () => {
        const get = vi.spyOn(orderService, 'getAllOrders').mockResolvedValueOnce([{ status: 'CREADA' }])
            .mockResolvedValue([{ status: 'PAGADA' }]);
        const client = setup();
        await screen.findByRole('status', { name: 'Órdenes creadas: 1' });
        await act(async () => { await client.invalidateQueries({ queryKey: apiQueryKeys.adminOrders }); });
        expect(get).toHaveBeenCalledTimes(2);
        await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
    });

    it('polls for orders created in another session', async () => {
        vi.useFakeTimers();
        const get = vi.spyOn(orderService, 'getAllOrders').mockResolvedValue([]);
        setup();
        await act(async () => { await vi.advanceTimersByTimeAsync(1); });
        expect(get).toHaveBeenCalledTimes(1);
        get.mockResolvedValue([{ status: 'CREADA' }]);
        await act(async () => { await vi.advanceTimersByTimeAsync(30001); });
        expect(get).toHaveBeenCalledTimes(2);
        expect(screen.getByRole('status', { name: 'Órdenes creadas: 1' })).toHaveTextContent('1');
    });

    it.each([
        ['create', 'createOrder', {}],
        ['createPqr', 'createPqrOrder', {}],
        ['updateStatus', 'updateOrderStatus', { id: 'order', status: 'PAGADA' }],
    ])('refreshes the counter after %s succeeds', async (mutation, method, payload) => {
        const get = vi.spyOn(orderService, 'getAllOrders').mockResolvedValue([{ status: 'CREADA' }]);
        vi.spyOn(orderService, method).mockResolvedValue({ id: 'order' });
        const client = setup();
        await screen.findByRole('status', { name: 'Órdenes creadas: 1' });
        get.mockResolvedValue([{ status: 'CREADA' }, { status: 'CREADA' }]);
        const { result } = renderHook(() => useOrderMutations(), {
            wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
        });
        await act(async () => { await result.current[mutation].mutateAsync(payload); });
        expect(await screen.findByRole('status', { name: 'Órdenes creadas: 2' })).toBeInTheDocument();
    });

    it('does not fetch protected orders for a non-admin', () => {
        const get = vi.spyOn(orderService, 'getAllOrders');
        setup(false);
        expect(get).not.toHaveBeenCalled();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('surfaces query errors instead of displaying a zero count', async () => {
        vi.spyOn(orderService, 'getAllOrders').mockRejectedValue(new Error('Orders unavailable'));
        setup();
        expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo consultar el contador');
        expect(screen.getByRole('alert')).toHaveAttribute('title', 'Orders unavailable');
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
});
