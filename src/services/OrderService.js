import axios from 'axios';
import translationService from './TranslationService.js';

const rawProductsApiUrl = String(import.meta.env.VITE_APP_PRODUCTS_API_URL ?? '').trim();
const nodeEnv = String(import.meta.env.NODE_ENV ?? import.meta.env.PROD ?? '').toLowerCase();
const isProduction = nodeEnv === 'true' || nodeEnv === 'production';

const resolveApiBaseUrl = () => {
    if (rawProductsApiUrl) {
        return rawProductsApiUrl.replace(/\/productos\/?$/, '');
    }

    if (!isProduction) {
        return 'http://localhost:8080/api';
    }

    return '/api';
};

const apiBaseUrl = resolveApiBaseUrl();

export const ORDER_STATUSES = ['CREADA', 'PAGADA', 'EMPACADA', 'ENTREGADA', 'CANCELADA'];

export const ORDER_STATUS_LABELS = {
    CREADA: 'Creada',
    PAGADA: 'Pagada',
    EMPACADA: 'Empacada',
    ENTREGADA: 'Entregada',
    CANCELADA: 'Cancelada',
};

export const ORDER_STATUS_BADGES = {
    CREADA: 'badge-info',
    PAGADA: 'badge-primary',
    EMPACADA: 'badge-warning',
    ENTREGADA: 'badge-success',
    CANCELADA: 'badge-danger',
};

// Las órdenes anteriores al cambio de flujo usaban DESPACHADA, equivalente a EMPACADA.
export const getOrderStatus = (order) => {
    const status = String(order?.status ?? '').toUpperCase();
    return status === 'DESPACHADA' ? 'EMPACADA' : status;
};

/**
 * Flujos permitidos:
 *  CREADA -> PAGADA (opcional marca contra entrega) -> EMPACADA -> ENTREGADA
 *  CREADA con marca PQR (valor 0) -> EMPACADA -> ENTREGADA
 * Cualquier orden no finalizada puede cancelarse.
 */
export const getAllowedTransitions = (order) => {
    switch (getOrderStatus(order)) {
        case 'CREADA':
            return order?.pqr ? ['EMPACADA', 'CANCELADA'] : ['PAGADA', 'CANCELADA'];
        case 'PAGADA':
            return ['EMPACADA', 'CANCELADA'];
        case 'EMPACADA':
            return ['ENTREGADA', 'CANCELADA'];
        default:
            return [];
    }
};

export const canTransition = (order, status) => getAllowedTransitions(order).includes(status);

const authHeaders = () => {
    const token = sessionStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const toError = (error, fallbackMessage) => {
    console.error(fallbackMessage, error);
    if (error.response && error.response.data && error.response.data.message) {
        return new Error(error.response.data.message);
    }
    return new Error(fallbackMessage);
};

class OrderService {
    async createOrder({ items, delivery, subtotal, taxAmount, total }) {
        try {
            const payload = {
                items: items.map((item) => ({
                    productId: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    lineTotal: item.price * item.quantity,
                })),
                delivery,
                subtotal,
                taxAmount,
                total,
            };
            const response = await axios.post(`${apiBaseUrl}/orders`, payload, { headers: authHeaders() });
            return response.data;
        } catch (error) {
            throw toError(error, translationService.t('order_create_failed'));
        }
    }

    async getMyOrders() {
        try {
            const response = await axios.get(`${apiBaseUrl}/orders/mine`, { headers: authHeaders() });
            return response.data || [];
        } catch (error) {
            throw toError(error, translationService.t('my_orders_load_failed'));
        }
    }

    async getAllOrders() {
        try {
            const response = await axios.get(`${apiBaseUrl}/admin/orders`, { headers: authHeaders() });
            return response.data || [];
        } catch (error) {
            throw toError(error, translationService.t('orders_load_failed'));
        }
    }

    async createPqrOrder({ username, items, delivery, notes }) {
        try {
            const payload = {
                username,
                items: items.map((item) => ({
                    productId: item.productId,
                    name: item.name,
                    quantity: item.quantity,
                })),
                delivery,
                notes,
            };
            const response = await axios.post(`${apiBaseUrl}/admin/orders/pqr`, payload, { headers: authHeaders() });
            return response.data;
        } catch (error) {
            throw toError(error, translationService.t('pqr_create_failed'));
        }
    }

    // extra: { cashOnDelivery } al pasar a PAGADA; { cashAmount, cardAmount } al pasar a ENTREGADA.
    async updateOrderStatus(orderId, status, extra = {}) {
        try {
            const response = await axios.put(
                `${apiBaseUrl}/admin/orders/${orderId}/status`,
                { status, ...extra },
                { headers: authHeaders() }
            );
            return response.data;
        } catch (error) {
            throw toError(error, translationService.t('order_status_update_failed'));
        }
    }
}

export default new OrderService();
