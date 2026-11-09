import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import HeaderComponent from '../components/dashboard/HeaderComponent.jsx';
import AuthenticationService from '../services/AuthenticationService.js';
import orderService from '../services/OrderService.js';
import userService from '../services/UserService.js';
import translationService from '../services/TranslationService.js';

const key = (username) => `orderStatusNotifications:${encodeURIComponent(username)}`;

function Header() {
    return <HeaderComponent navigate={useNavigate()} />;
}

function setup(path = '/shop') {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Header /></MemoryRouter></QueryClientProvider>);
    return { client, ...view };
}

function openMenu() {
    fireEvent.click(screen.getByRole('button', { name: /Perfil y ajustes/ }));
}

beforeEach(() => {
    translationService.setLanguage('ES');
    vi.spyOn(AuthenticationService, 'isUserLoggedIn').mockReturnValue(true);
    vi.spyOn(AuthenticationService, 'isUserAdmin').mockReturnValue(false);
    vi.spyOn(AuthenticationService, 'getLoggedInUser').mockReturnValue({ username: 'cliente' });
    vi.spyOn(userService, 'getUsers').mockResolvedValue([]);
    localStorage.removeItem(key('cliente'));
    localStorage.removeItem(key('otro'));
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
    localStorage.removeItem(key('cliente'));
    localStorage.removeItem(key('otro'));
});

describe('order status notifications', () => {
    it('polls for changes, counts affected orders and clears them when entering My Orders', async () => {
        vi.useFakeTimers();
        const get = vi.spyOn(orderService, 'getMyOrders').mockResolvedValue([{ id: 1, status: 'CREADA' }]);
        setup();
        await act(async () => { await vi.advanceTimersByTimeAsync(1); });
        openMenu();
        expect(screen.queryByRole('status', { name: /cambios de estado sin revisar/ })).not.toBeInTheDocument();

        get.mockResolvedValue([{ id: 1, status: 'PAGADA' }, { id: 2, status: 'CREADA' }]);
        await act(async () => { await vi.advanceTimersByTimeAsync(30001); });
        expect(screen.getByRole('status', { name: 'Órdenes con cambios de estado sin revisar: 1' })).toHaveTextContent('1');
        expect(screen.getByRole('button', { name: /Perfil y ajustes/ })).toHaveTextContent('1');

        get.mockResolvedValue([{ id: 1, status: 'EMPACADA' }, { id: 2, status: 'PAGADA' }]);
        await act(async () => { await vi.advanceTimersByTimeAsync(30001); });
        expect(screen.getByRole('status', { name: 'Órdenes con cambios de estado sin revisar: 2' })).toHaveTextContent('2');
        fireEvent.click(screen.getByRole('button', { name: /Mis Órdenes/ }));
        await act(async () => { await vi.advanceTimersByTimeAsync(1); });
        expect(screen.queryByRole('status', { name: /cambios de estado sin revisar/ })).not.toBeInTheDocument();
        expect(JSON.parse(localStorage.getItem(key('cliente'))).unread).toEqual([]);
    });

    it('persists unseen changes across remounts and isolates accounts', async () => {
        const get = vi.spyOn(orderService, 'getMyOrders').mockResolvedValue([{ id: 1, status: 'CREADA' }]);
        const first = setup();
        await waitFor(() => expect(localStorage.getItem(key('cliente'))).not.toBeNull());
        get.mockResolvedValue([{ id: 1, status: 'PAGADA' }]);
        await act(async () => { await first.client.invalidateQueries({ queryKey: ['myOrders'] }); });
        await waitFor(() => expect(JSON.parse(localStorage.getItem(key('cliente'))).unread).toEqual(['1']));
        first.unmount();
        setup();
        openMenu();
        expect(await screen.findByRole('status', { name: 'Órdenes con cambios de estado sin revisar: 1' })).toBeInTheDocument();
        cleanup();

        AuthenticationService.getLoggedInUser.mockReturnValue({ username: 'otro' });
        setup();
        openMenu();
        await waitFor(() => expect(localStorage.getItem(key('otro'))).not.toBeNull());
        expect(screen.queryByRole('status', { name: /cambios de estado sin revisar/ })).not.toBeInTheDocument();
    });

    it('marks fresh changes seen while My Orders is open', async () => {
        const get = vi.spyOn(orderService, 'getMyOrders').mockResolvedValue([{ id: 1, status: 'CREADA' }]);
        const { client } = setup('/orders');
        await waitFor(() => expect(localStorage.getItem(key('cliente'))).not.toBeNull());
        get.mockResolvedValue([{ id: 1, status: 'PAGADA' }]);
        await act(async () => { await client.invalidateQueries({ queryKey: ['myOrders'] }); });
        await waitFor(() => expect(JSON.parse(localStorage.getItem(key('cliente'))).statuses).toEqual([['1', 'PAGADA']]));
        expect(JSON.parse(localStorage.getItem(key('cliente'))).unread).toEqual([]);
    });

    it('synchronizes notifications cleared in another tab', async () => {
        vi.spyOn(orderService, 'getMyOrders').mockResolvedValue([{ id: 1, status: 'PAGADA' }]);
        localStorage.setItem(key('cliente'), JSON.stringify({ statuses: [['1', 'PAGADA']], unread: ['1'], updatedAt: 0 }));
        setup();
        openMenu();
        expect(await screen.findByRole('status', { name: 'Órdenes con cambios de estado sin revisar: 1' })).toBeInTheDocument();
        const snapshot = JSON.parse(localStorage.getItem(key('cliente')));
        snapshot.unread = [];
        localStorage.setItem(key('cliente'), JSON.stringify(snapshot));
        act(() => window.dispatchEvent(new StorageEvent('storage', { key: key('cliente') })));
        expect(screen.queryByRole('status', { name: /cambios de estado sin revisar/ })).not.toBeInTheDocument();
    });

    it('treats the legacy DESPACHADA state as EMPACADA', async () => {
        const get = vi.spyOn(orderService, 'getMyOrders').mockResolvedValue([{ id: 1, status: 'DESPACHADA' }]);
        const { client } = setup();
        await waitFor(() => expect(localStorage.getItem(key('cliente'))).not.toBeNull());
        get.mockResolvedValue([{ id: 1, status: 'EMPACADA' }]);
        await act(async () => { await client.invalidateQueries({ queryKey: ['myOrders'] }); });
        expect(JSON.parse(localStorage.getItem(key('cliente'))).unread).toEqual([]);
    });

    it('reports fetch failures without overwriting the previous snapshot', async () => {
        const get = vi.spyOn(orderService, 'getMyOrders').mockResolvedValue([{ id: 1, status: 'CREADA' }]);
        const { client } = setup();
        await waitFor(() => expect(localStorage.getItem(key('cliente'))).not.toBeNull());
        const saved = localStorage.getItem(key('cliente'));
        get.mockRejectedValue(new Error('Sin conexión'));
        await act(async () => { await client.invalidateQueries({ queryKey: ['myOrders'] }); });
        openMenu();
        expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron consultar las notificaciones de órdenes.');
        expect(localStorage.getItem(key('cliente'))).toBe(saved);
    });

    it('rejects invalid order responses rather than treating them as empty', async () => {
        vi.spyOn(axios, 'get').mockResolvedValue({ data: null });
        vi.spyOn(console, 'error').mockImplementation(() => {});
        await expect(orderService.getMyOrders()).rejects.toThrow();
    });

    it('does not request orders when logged out or for admins', () => {
        const get = vi.spyOn(orderService, 'getMyOrders');
        AuthenticationService.isUserLoggedIn.mockReturnValue(false);
        const first = setup();
        expect(get).not.toHaveBeenCalled();
        first.unmount();
        AuthenticationService.isUserLoggedIn.mockReturnValue(true);
        AuthenticationService.isUserAdmin.mockReturnValue(true);
        setup();
        expect(get).not.toHaveBeenCalled();
    });
});
