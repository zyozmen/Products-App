import axios from 'axios';

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

export const ORDER_STATUSES = ['CREADA', 'PAGADA', 'DESPACHADA', 'ENTREGADA', 'CANCELADA'];

export const ORDER_STATUS_LABELS = {
    CREADA: 'Creada',
    PAGADA: 'Pagada',
    DESPACHADA: 'Despachada',
    ENTREGADA: 'Entregada',
    CANCELADA: 'Cancelada',
};

export const ORDER_STATUS_BADGES = {
    CREADA: 'badge-info',
    PAGADA: 'badge-primary',
    DESPACHADA: 'badge-warning',
    ENTREGADA: 'badge-success',
    CANCELADA: 'badge-danger',
};

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
            throw toError(error, 'Ocurrió un error al registrar la orden.');
        }
    }

    async getMyOrders() {
        try {
            const response = await axios.get(`${apiBaseUrl}/orders/mine`, { headers: authHeaders() });
            return response.data || [];
        } catch (error) {
            throw toError(error, 'Ocurrió un error al consultar sus órdenes.');
        }
    }

    async getAllOrders() {
        try {
            const response = await axios.get(`${apiBaseUrl}/admin/orders`, { headers: authHeaders() });
            return response.data || [];
        } catch (error) {
            throw toError(error, 'Ocurrió un error al consultar las órdenes.');
        }
    }

    async updateOrderStatus(orderId, status) {
        try {
            const response = await axios.put(
                `${apiBaseUrl}/admin/orders/${orderId}/status`,
                { status },
                { headers: authHeaders() }
            );
            return response.data;
        } catch (error) {
            throw toError(error, 'Ocurrió un error al actualizar el estado de la orden.');
        }
    }
}

export default new OrderService();
