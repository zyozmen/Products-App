import { useEffect, useState } from 'react';
import { useMyOrders } from './useApiQueries.ts';
import { getOrderStatus } from '../services/OrderService.js';

const storageKey = (username) => `orderStatusNotifications:${encodeURIComponent(username)}`;

function readSnapshot(username) {
    const raw = localStorage.getItem(storageKey(username));
    if (raw === null) return null;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.statuses) || !Array.isArray(data.unread) ||
        !Number.isFinite(data.updatedAt) ||
        !data.statuses.every((entry) => Array.isArray(entry) && entry.length === 2 && entry.every((part) => typeof part === 'string')) ||
        !data.unread.every((id) => typeof id === 'string')) {
        throw new Error('Los datos de notificaciones de órdenes no son válidos.');
    }
    return data;
}

export default function useOrderNotifications(username, viewingOrders) {
    const query = useMyOrders(username, true);
    const [state, setState] = useState({ username: null, count: 0, error: false });

    useEffect(() => {
        if (!username || !query.data || query.isError) return;
        try {
            if (!Array.isArray(query.data) || query.data.some((order) =>
                order?.id == null || typeof order.status !== 'string' || !order.status.trim())) {
                throw new Error('La respuesta de órdenes no contiene identificadores y estados válidos.');
            }
            const previous = readSnapshot(username);
            if (previous && previous.updatedAt > query.dataUpdatedAt) {
                setState({ username, count: previous.unread.length, error: false });
                return;
            }
            const statuses = query.data.map((order) => [String(order.id), getOrderStatus(order)]);
            const previousStatuses = new Map(previous?.statuses ?? []);
            const unread = new Set(previous?.unread ?? []);
            if (previous && !viewingOrders) {
                statuses.forEach(([id, status]) => {
                    if (previousStatuses.has(id) && previousStatuses.get(id) !== status) unread.add(id);
                });
            }
            if (viewingOrders) unread.clear();
            const next = { statuses, unread: [...unread], updatedAt: query.dataUpdatedAt };
            localStorage.setItem(storageKey(username), JSON.stringify(next));
            setState({ username, count: next.unread.length, error: false });
        } catch (error) {
            console.error('Error al actualizar las notificaciones de órdenes:', error);
            setState({ username, count: 0, error: true });
        }
    }, [username, viewingOrders, query.data, query.dataUpdatedAt, query.isError]);

    useEffect(() => {
        if (!username) return undefined;
        const sync = (event) => {
            if (event.key !== storageKey(username) && event.key !== null) return;
            try {
                const snapshot = readSnapshot(username);
                setState({ username, count: snapshot?.unread.length ?? 0, error: false });
            } catch (error) {
                console.error('Error al leer las notificaciones de órdenes:', error);
                setState({ username, count: 0, error: true });
            }
        };
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, [username]);

    return { count: state.username === username ? state.count : 0, isError: query.isError || (state.username === username && state.error) };
}
