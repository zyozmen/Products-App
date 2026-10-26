import axios from 'axios';
import { z } from 'zod';
import { getApiBaseUrl } from './apiConfig.js';
import { normalizeDecimal } from '../utils/decimalMoney';
import type { DailySettlementSummary } from '../Interfaces/settlement';

export const MONEY_FIELDS = [
  'salesRecognizedAmount',
  'pqrRecognizedAmount',
  'reversedAmount',
  'grossAccumulatedAmount',
  'accumulatedAmount',
  'linkedPaymentsAmount',
  'pendingDailyAmount',
  'providerOutstandingBalance',
  'suggestedPayableAmount',
  'overpaidAmount',
] as const;

export class InvalidSettlementResponseError extends Error {
  constructor() {
    super('La respuesta del servidor de liquidación está incompleta o no es válida.');
    this.name = 'InvalidSettlementResponseError';
  }
}

const moneyFieldPattern = new RegExp(
  `"(${MONEY_FIELDS.join('|')})"\\s*:\\s*(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)`,
  'g',
);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const money = z.string().regex(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/).transform(normalizeDecimal);
const count = z.number().int().nonnegative();

const providerSchema = z.object({
  providerId: z.string().min(1),
  providerName: z.string().nullable(),
  date: isoDate,
  totalSalesCount: count,
  totalPqrCount: count,
  ...Object.fromEntries(MONEY_FIELDS.map((field) => [field, money])) as Record<typeof MONEY_FIELDS[number], typeof money>,
});

const summarySchema = z.object({
  date: isoDate,
  timezone: z.string().min(1),
  activationPending: z.boolean(),
  activatedAt: z.string().nullable(),
  content: z.array(providerSchema),
  page: count,
  size: z.number().int().positive(),
  totalElements: count,
  totalPages: count,
});

/** Lee el JSON crudo dejando los importes como texto para no redondearlos con Number. */
export function parseDailySummary(raw: unknown): DailySettlementSummary {
  let data: unknown = raw;
  try {
    if (typeof raw === 'string') data = JSON.parse(raw.replace(moneyFieldPattern, '"$1":"$2"'));
  } catch {
    throw new InvalidSettlementResponseError();
  }
  const parsed = summarySchema.safeParse(data);
  if (!parsed.success) throw new InvalidSettlementResponseError();
  return parsed.data;
}

export const settlementService = {
  async getDailySummary(page = 0, size = 20, date: string | null = null): Promise<DailySettlementSummary> {
    const { data } = await axios.get<DailySettlementSummary>(`${getApiBaseUrl()}/v1/settlements/daily-summary`, {
      params: { page, size, ...(date ? { date } : {}) },
      responseType: 'text',
      transformResponse: [(body: unknown) => body],
    });
    return parseDailySummary(data);
  },
};
