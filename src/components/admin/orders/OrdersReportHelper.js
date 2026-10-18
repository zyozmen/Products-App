import { getOrderStatus } from '../../../services/OrderService.js';

export const REPORT_PERIODS = ['day', 'week', 'month'];

const pad = (value) => String(value).padStart(2, '0');

export const toDateInputValue = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDateInput = (value) => {
    const [year, month, day] = String(value ?? '').split('-').map(Number);
    const parsed = new Date(year, (month || 1) - 1, day || 1);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

// Semana ISO (lunes a domingo): "2026-W41"
export const toWeekInputValue = (dateValue) => {
    const base = parseDateInput(dateValue);
    const thursday = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 3 - ((base.getDay() + 6) % 7));
    const firstThursday = new Date(thursday.getFullYear(), 0, 4);
    const week = 1 + Math.round(((thursday - firstThursday) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
    return `${thursday.getFullYear()}-W${pad(week)}`;
};

export const weekInputToDate = (value) => {
    const match = /^(\d{4})-W(\d{2})$/.exec(String(value ?? ''));
    if (!match) {
        return null;
    }
    const year = Number(match[1]);
    const week = Number(match[2]);
    const jan4 = new Date(year, 0, 4);
    const monday = new Date(year, 0, 4 - ((jan4.getDay() + 6) % 7) + (week - 1) * 7);
    return toDateInputValue(monday);
};

export const toMonthInputValue = (dateValue) => toDateInputValue(parseDateInput(dateValue)).slice(0, 7);

export const monthInputToDate = (value) => (/^\d{4}-\d{2}$/.test(String(value ?? '')) ? `${value}-01` : null);

// El rango es [start, end): la semana va de lunes a domingo.
export const getPeriodRange = (dateValue, period) => {
    const base = parseDateInput(dateValue);
    const year = base.getFullYear();
    const month = base.getMonth();
    const day = base.getDate();

    if (period === 'month') {
        return { start: new Date(year, month, 1), end: new Date(year, month + 1, 1) };
    }
    if (period === 'week') {
        const offset = (base.getDay() + 6) % 7;
        return { start: new Date(year, month, day - offset), end: new Date(year, month, day - offset + 7) };
    }
    return { start: new Date(year, month, day), end: new Date(year, month, day + 1) };
};

const normalizeText = (value) =>
    String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Busca por # de orden, cliente, productos y estado (etiqueta traducida o código).
export const filterOrders = (orders, query, getStatusLabel = (s) => s) => {
    const terms = normalizeText(query).split(/\s+/).filter(Boolean);
    const list = Array.isArray(orders) ? orders : [];
    if (terms.length === 0) {
        return list;
    }
    return list.filter((order) => {
        const status = getOrderStatus(order);
        const haystack = normalizeText([
            order.id,
            order.username,
            status,
            getStatusLabel(status),
            order.pqr ? 'pqr' : '',
            order.cashOnDelivery ? 'contra entrega' : '',
            ...(order.items || []).map((item) => item.name),
        ].join(' '));
        return terms.every((term) => haystack.includes(term));
    });
};

const toAmount = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

export const buildOrdersReport = (orders, range) => {
    const report = {
        totalOrders: 0,
        paid: { count: 0, total: 0, cash: 0, card: 0, undetailed: 0 },
        cancelled: 0,
        toPack: 0,
        toDeliver: 0,
        pqr: 0,
    };

    for (const order of Array.isArray(orders) ? orders : []) {
        const createdAt = new Date(order.createdAt);
        if (!(createdAt >= range.start && createdAt < range.end)) {
            continue;
        }

        const status = getOrderStatus(order);
        report.totalOrders += 1;

        if (order.pqr) {
            report.pqr += 1;
        }
        if (status === 'CANCELADA') {
            report.cancelled += 1;
        } else if (status === 'PAGADA') {
            report.toPack += 1;
        } else if (status === 'EMPACADA') {
            report.toDeliver += 1;
        } else if (status === 'ENTREGADA' && !order.pqr) {
            const total = toAmount(order.total);
            const cash = toAmount(order.cashAmount);
            const card = toAmount(order.cardAmount);
            report.paid.count += 1;
            report.paid.total += total;
            report.paid.cash += cash;
            report.paid.card += card;
            report.paid.undetailed += Math.max(0, total - cash - card);
        }
    }

    return report;
};
