import { afterEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { InvalidSettlementResponseError, parseDailyDetail, parseDailySummary, settlementService } from '../services/settlementService';
import { formatDecimalCOP, normalizeDecimal } from '../utils/decimalMoney';
import { businessDateOf, settlementLink } from '../utils/businessDate';

const row = (amount: string) => `{"providerId":"6500000000000000000000ab","providerName":"Distribuidora Cannabis SAS","date":"2026-10-23",
"totalSalesCount":10,"totalPqrCount":1,"salesRecognizedAmount":${amount},"pqrRecognizedAmount":10000.00,"reversedAmount":0.00,
"grossAccumulatedAmount":110000.00,"accumulatedAmount":110000.00,"linkedPaymentsAmount":0.00,"pendingDailyAmount":110000.00,
"providerOutstandingBalance":500000.00,"suggestedPayableAmount":110000.00,"overpaidAmount":0.00}`;
const body = (content: string) => `{"date":"2026-10-23","timezone":"America/Bogota","activationPending":false,
"activatedAt":"2026-10-23T05:00:00Z","content":[${content}],"page":0,"size":20,"totalElements":1,"totalPages":1}`;

afterEach(() => vi.restoreAllMocks());

describe('decimal money', () => {
    it('normalizes JSON decimals without floating point', () => {
        expect(normalizeDecimal('12345678901234567.89')).toBe('12345678901234567.89');
        expect(normalizeDecimal('1E+4')).toBe('10000');
        expect(normalizeDecimal('1.5E-1')).toBe('0.15');
        expect(normalizeDecimal('-0.00')).toBe('0.00');
    });

    it('formats COP keeping cents only when present', () => {
        expect(formatDecimalCOP('100000.00')).toBe('$100.000');
        expect(formatDecimalCOP('10000.5')).toBe('$10.000,50');
        expect(formatDecimalCOP('12345678901234567.89')).toBe('$12.345.678.901.234.567,89');
    });
});

describe('settlement service', () => {
    it('keeps amounts beyond Number precision as exact strings', () => {
        const summary = parseDailySummary(body(row('12345678901234567.89')));
        expect(summary.content[0].salesRecognizedAmount).toBe('12345678901234567.89');
        expect(summary.content[0].suggestedPayableAmount).toBe('110000.00');
        expect(summary.content[0].totalSalesCount).toBe(10);
    });

    it('rejects incomplete financial data instead of showing zeros', () => {
        expect(() => parseDailySummary(body(row('null')))).toThrow(InvalidSettlementResponseError);
        expect(() => parseDailySummary('{"content":[]}')).toThrow(InvalidSettlementResponseError);
        expect(() => parseDailySummary('<html>')).toThrow(InvalidSettlementResponseError);
    });

    it('requests the authenticated endpoint as raw text with paging only', async () => {
        const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: body('').replace('"page":0', '"page":2') });
        const summary = await settlementService.getDailySummary(2, 20);
        const [url, config] = get.mock.calls[0]!;
        expect(url).toMatch(/\/api\/v1\/settlements\/daily-summary$/);
        expect(config).toMatchObject({ params: { page: 2, size: 20 }, responseType: 'text' });
        expect(config?.params).not.toHaveProperty('date');
        expect(summary.content).toEqual([]);
    });

    it('sends the journey date only when provided', async () => {
        const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: body('').replace('"date":"2026-10-23"', '"date":"2026-10-20"') });
        await settlementService.getDailySummary(0, 20, '2026-10-20');
        expect(get.mock.calls[0]![1]).toMatchObject({ params: { page: 0, size: 20, date: '2026-10-20' } });
    });
});

describe('business date', () => {
    it('uses the Bogota journey regardless of the browser time zone', () => {
        expect(businessDateOf('2026-10-24T03:30:00Z')).toBe('2026-10-23');
        expect(businessDateOf('2026-10-24T05:00:00Z')).toBe('2026-10-24');
        expect(businessDateOf(null)).toBeNull();
        expect(businessDateOf('no-date')).toBeNull();
        expect(settlementLink('2026-10-23')).toBe('/admin/liquidacion?date=2026-10-23');
        expect(settlementLink(null)).toBe('/admin/liquidacion');
    });

    describe('daily detail contract', () => {
        const event = {
            id: 'movement-1', movementType: 'SALE', providerId: '6500000000000000000000ab',
            date: '2026-10-23', timestamp: '2026-10-23T10:00:00Z',
            orderId: 'order-1', itemIndex: 0, lotId: 'lot-1', containerId: 'container-1',
            strainId: 'strain-1', presentationId: 'presentation-1', quantity: 2,
            contentPerUnit: 5, baseUnit: 'gramo', baseUnitCost: '2000.00',
            unitCost: '10000.00', amount: '20000.00',
        };
        const payment = {
            id: 'payment-1', movementType: 'PAYMENT', providerId: event.providerId,
            date: event.date, timestamp: '2026-10-24T01:00:00Z', amount: '110000.00',
            correlationId: 'correlation-1', paymentType: 'TRANSFERENCIA',
            allocations: [
                { transactionId: 'transaction-1', lotId: 'lot-1', amount: '60000.00' },
                { transactionId: 'transaction-2', lotId: 'lot-2', amount: '50000.00' },
            ],
        };
        const detail = (content: unknown[]) => ({ content, page: 0, size: 20, totalElements: content.length, totalPages: 1 });

        it.each([null, 'Referencia visible'])('preserves nullable reference names and codes: %s', (value) => {
            const recognition = { ...event, providerName: value, lotCode: value, containerCode: value, productName: value, presentationName: value };
            const namedPayment = {
                ...payment, providerName: value,
                allocations: payment.allocations.map((allocation) => ({ ...allocation, lotCode: value })),
            };
            const result = parseDailyDetail(JSON.stringify({
                ...detail([recognition, namedPayment]), providerName: value,
            }));
            expect(result.providerName).toBe(value);
            expect(result.content).toEqual([recognition, namedPayment]);
        });

        it.each(['providerName', 'lotCode', 'containerCode', 'productName', 'presentationName'])('rejects invalid reference text: %s', (field) => {
            expect(() => parseDailyDetail(detail([{ ...event, [field]: 123 }]))).toThrow(InvalidSettlementResponseError);
        });

        it.each(['SALE', 'PQR', 'PQR_REVERSAL'])('preserves productName for %s movements', (movementType) => {
            const recognition = {
                ...event, movementType, productName: 'Producto ejemplo',
                ...(movementType === 'PQR_REVERSAL' ? { originalMovementId: 'original-1' } : {}),
            };
            expect(parseDailyDetail(detail([recognition])).content[0]).toMatchObject({ productName: 'Producto ejemplo' });
        });

        it('rejects invalid allocation lot codes', () => {
            expect(() => parseDailyDetail(detail([{
                ...payment, allocations: [{ ...payment.allocations[0], lotCode: 123 }],
            }]))).toThrow(InvalidSettlementResponseError);
        });

        it('preserves snapshots, reversal dates and exact raw monetary amounts', () => {
            const raw = JSON.stringify(detail([
                event,
                { ...event, id: 'pqr-1', movementType: 'PQR', presentationId: 'presentation-2', unitCost: '9000.25' },
                { ...event, id: 'reversal-1', movementType: 'PQR_REVERSAL', originalMovementId: 'pqr-1', timestamp: '2026-10-26T15:00:00Z' },
                payment,
            ])).replace('"amount":"20000.00"', '"amount":12345678901234567.89')
                .replace('"unitCost":"10000.00"', '"unitCost":10000.00')
                .replace('"amount":"60000.00"', '"amount":60000.00');
            const result = parseDailyDetail(raw);
            expect(result.content).toHaveLength(4);
            expect(result.content[0]).toMatchObject({ itemIndex: 0, amount: '12345678901234567.89', unitCost: '10000.00' });
            expect(result.content[1]).toHaveProperty('unitCost', '9000.25');
            expect(result.content[2]).toMatchObject({ originalMovementId: 'pqr-1', date: event.date, timestamp: '2026-10-26T15:00:00Z' });
            expect(result.content[3]).toMatchObject({ allocations: payment.allocations });
        });

        it('accepts null or absent recognition fields for payments without manufacturing costs', () => {
            const item = parseDailyDetail(detail([{ ...payment, quantity: null, unitCost: null }])).content[0];
            expect(item).not.toHaveProperty('unitCost');
            expect(item).not.toHaveProperty('quantity');
        });

        it('reads the backend numeric order ID alongside a payment with null recognition fields', async () => {
            const raw = `{
                "providerId":"6500000000000000000000ab","date":"2026-10-23",
                "content":[
                    {"id":"sale-12","movementType":"SALE","providerId":"6500000000000000000000ab",
                    "orderId":12,"itemIndex":0,"lotId":"lot-1","containerId":"container-1",
                    "strainId":"strain-1","presentationId":"presentation-20g","quantity":1,
                    "contentPerUnit":20,"baseUnit":"GRAMOS","baseUnitCost":1000.00,
                    "unitCost":20000.00,"amount":20000.00,"timestamp":"2026-10-23T05:23:52.348Z",
                    "date":"2026-10-23","originalMovementId":null,"correlationId":null,
                    "paymentType":null,"observations":null,"allocations":[]},
                    {"id":"payment:correlation-1","movementType":"PAYMENT","providerId":"6500000000000000000000ab",
                    "orderId":null,"itemIndex":null,"lotId":null,"containerId":null,"strainId":null,
                    "presentationId":null,"quantity":null,"contentPerUnit":null,"baseUnit":null,
                    "baseUnitCost":null,"unitCost":null,"amount":20000.00,
                    "timestamp":"2026-10-23T05:24:10.684Z","date":"2026-10-23",
                    "originalMovementId":null,"correlationId":"correlation-1","paymentType":"ABONO",
                    "observations":null,"allocations":[{"transactionId":"transaction-1","lotId":"lot-1","amount":20000.00}]}
                ],"page":0,"size":20,"totalElements":2,"totalPages":1
            }`;
            vi.spyOn(axios, 'get').mockResolvedValue({ data: raw });
            const result = await settlementService.getDailyDetail(event.date, event.providerId);
            expect(result.totalElements).toBe(2);
            expect(result.content[0]).toMatchObject({ orderId: 12, itemIndex: 0, unitCost: '20000.00', amount: '20000.00' });
            expect(result.content[1]).toMatchObject({
                movementType: 'PAYMENT', paymentType: 'ABONO', amount: '20000.00',
                allocations: [{ transactionId: 'transaction-1', lotId: 'lot-1', amount: '20000.00' }],
            });
            expect(result.content[1]).not.toHaveProperty('unitCost');
        });

        it.each([null, undefined, 'order-1', 12])('accepts supported order identifiers: %s', (orderId) => {
            expect(parseDailyDetail(detail([{ ...event, orderId }])).content[0]).toHaveProperty('orderId', orderId);
        });

        it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1, true, {}, ''])('rejects malformed order identifiers: %s', (orderId) => {
            expect(() => parseDailyDetail(detail([{ ...event, orderId }]))).toThrow(InvalidSettlementResponseError);
        });

        it.each([
            { content: [{ ...event, movementType: 'UNKNOWN' }] },
            { content: [{ ...event, amount: null }] },
            { content: [{ ...event, movementType: 'PQR_REVERSAL' }] },
            { content: [{ ...payment, allocations: [{ lotId: 'lot-1', amount: '10' }] }] },
            { content: [payment, { ...payment, id: 'duplicate' }] },
        ])('rejects invalid or duplicate audit data: %s', ({ content }) => {
            expect(() => parseDailyDetail(detail(content))).toThrow(InvalidSettlementResponseError);
        });

        it('passes required filters, server paging and cancellation to the ADMIN endpoint', async () => {
            const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: JSON.stringify({ ...detail([]), page: 3, size: 100, totalElements: 0, totalPages: 0 }) });
            const signal = new AbortController().signal;
            const result = await settlementService.getDailyDetail(event.date, event.providerId.toUpperCase(), 3, 100, signal);
            expect(result.content).toEqual([]);
            expect(get).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/settlements\/daily-detail$/), expect.objectContaining({
                params: { date: event.date, providerId: event.providerId.toUpperCase(), page: 3, size: 100 }, signal, responseType: 'text',
            }));
        });

        it('rejects a response belonging to another provider or journey', async () => {
            vi.spyOn(axios, 'get').mockResolvedValue({ data: JSON.stringify(detail([event])) });
            await expect(settlementService.getDailyDetail('2026-10-22', event.providerId)).rejects.toThrow(InvalidSettlementResponseError);
            await expect(settlementService.getDailyDetail(event.date, '6500000000000000000000ac')).rejects.toThrow(InvalidSettlementResponseError);
        });

        it('sends the optional summary provider filter without client-side filtering', async () => {
            const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: body('') });
            await settlementService.getDailySummary(0, 20, event.date, event.providerId);
            expect(get.mock.calls[0]![1]?.params).toEqual({ page: 0, size: 20, date: event.date, providerId: event.providerId });
        });

        it('rejects summary metadata or rows inconsistent with the requested filters', async () => {
            vi.spyOn(axios, 'get').mockResolvedValue({ data: body(row('10000.00')) });
            await expect(settlementService.getDailySummary(1, 20, event.date)).rejects.toThrow(InvalidSettlementResponseError);
            await expect(settlementService.getDailySummary(0, 20, '2026-10-22')).rejects.toThrow(InvalidSettlementResponseError);
            await expect(settlementService.getDailySummary(0, 20, event.date, '6500000000000000000000ac')).rejects.toThrow(InvalidSettlementResponseError);
        });
    });
});
