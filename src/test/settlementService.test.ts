import { afterEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { InvalidSettlementResponseError, parseDailySummary, settlementService } from '../services/settlementService';
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
        const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: body('') });
        const summary = await settlementService.getDailySummary(2, 20);
        const [url, config] = get.mock.calls[0]!;
        expect(url).toMatch(/\/api\/v1\/settlements\/daily-summary$/);
        expect(config).toMatchObject({ params: { page: 2, size: 20 }, responseType: 'text' });
        expect(config?.params).not.toHaveProperty('date');
        expect(summary.content).toEqual([]);
    });

    it('sends the journey date only when provided', async () => {
        const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: body('') });
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
});
