import { describe, expect, it } from 'vitest';
import { canTransition, getAllowedTransitions, getOrderStatus } from '../services/OrderService.js';
import { buildOrdersReport, getPeriodRange, monthInputToDate, toMonthInputValue, toWeekInputValue, weekInputToDate } from '../components/admin/OrdersReportHelper.js';

describe('week and month pickers', () => {
    it('converts dates to week and month input values and back', () => {
        expect(toWeekInputValue('2026-10-08')).toBe('2026-W41');
        expect(weekInputToDate('2026-W41')).toBe('2026-10-05');
        expect(toWeekInputValue('2027-01-01')).toBe('2026-W53');
        expect(toMonthInputValue('2026-10-08')).toBe('2026-10');
        expect(monthInputToDate('2026-10')).toBe('2026-10-01');
        expect(weekInputToDate('')).toBeNull();
    });
});

describe('order status flow', () => {
    it('follows creada -> pagada -> empacada -> entregada', () => {
        expect(getAllowedTransitions({ status: 'CREADA' })).toEqual(['PAGADA', 'CANCELADA']);
        expect(getAllowedTransitions({ status: 'PAGADA' })).toEqual(['EMPACADA', 'CANCELADA']);
        expect(getAllowedTransitions({ status: 'EMPACADA' })).toEqual(['ENTREGADA', 'CANCELADA']);
        expect(getAllowedTransitions({ status: 'ENTREGADA' })).toEqual([]);
        expect(getAllowedTransitions({ status: 'CANCELADA' })).toEqual([]);
    });

    it('lets PQR orders skip the payment step', () => {
        expect(canTransition({ status: 'CREADA', pqr: true }, 'PAGADA')).toBe(false);
        expect(canTransition({ status: 'CREADA', pqr: true }, 'EMPACADA')).toBe(true);
    });

    it('treats the legacy DESPACHADA status as EMPACADA', () => {
        expect(getOrderStatus({ status: 'DESPACHADA' })).toBe('EMPACADA');
    });
});

describe('orders report', () => {
    const day = (value) => getPeriodRange(value, 'day');

    it('builds day, week (Monday-Sunday) and month ranges', () => {
        expect(day('2026-10-08').start).toEqual(new Date(2026, 9, 8));
        expect(day('2026-10-08').end).toEqual(new Date(2026, 9, 9));
        expect(getPeriodRange('2026-10-08', 'week').start).toEqual(new Date(2026, 9, 5));
        expect(getPeriodRange('2026-10-08', 'week').end).toEqual(new Date(2026, 9, 12));
        expect(getPeriodRange('2026-10-08', 'month').start).toEqual(new Date(2026, 9, 1));
        expect(getPeriodRange('2026-10-08', 'month').end).toEqual(new Date(2026, 10, 1));
    });

    it('counts orders by state and splits delivered totals by payment method', () => {
        const at = '2026-10-08T10:00:00';
        const orders = [
            { id: 1, status: 'ENTREGADA', total: 100, cashAmount: 40, cardAmount: 60, createdAt: at },
            { id: 2, status: 'ENTREGADA', total: 50, createdAt: at },
            { id: 3, status: 'ENTREGADA', total: 0, pqr: true, createdAt: at },
            { id: 4, status: 'PAGADA', total: 10, createdAt: at },
            { id: 5, status: 'EMPACADA', total: 10, createdAt: at },
            { id: 6, status: 'CANCELADA', total: 10, createdAt: at },
            { id: 7, status: 'CREADA', pqr: true, total: 0, createdAt: at },
            { id: 8, status: 'PAGADA', total: 10, createdAt: '2026-10-09T10:00:00' },
        ];

        expect(buildOrdersReport(orders, day('2026-10-08'))).toEqual({
            totalOrders: 7,
            paid: { count: 2, total: 150, cash: 40, card: 60, undetailed: 50 },
            cancelled: 1,
            toPack: 1,
            toDeliver: 1,
            pqr: 2,
        });
        expect(buildOrdersReport(orders, getPeriodRange('2026-10-08', 'week')).totalOrders).toBe(8);
    });
});
