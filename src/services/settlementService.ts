import axios from 'axios';
import { z } from 'zod';
import { getApiBaseUrl } from './apiConfig.js';
import { normalizeDecimal } from '../utils/decimalMoney';
import type { DailySettlementSummary, DailySettlementDetail } from '../Interfaces/settlement';
import { isBusinessDate } from '../utils/businessDate';

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
  `"(${[...MONEY_FIELDS, 'amount', 'unitCost', 'baseUnitCost'].join('|')})"\\s*:\\s*(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)`,
  'g',
);
const isoDate = z.string().refine(isBusinessDate);
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
  size: z.number().int().min(1).max(100),
  totalElements: count,
  totalPages: count,
});

const eventFields = {
  id: z.string().min(1),
  providerId: z.string().regex(/^[a-f\d]{24}$/i),
  date: isoDate,
  timestamp: z.iso.datetime({ offset: true }),
  amount: money,
  observations: z.string().nullish(),
};
const recognitionFields = {
  ...eventFields,
  orderId: z.string().nullish(),
  itemIndex: count.nullish(),
  lotId: z.string().nullish(),
  containerId: z.string().nullish(),
  strainId: z.string().nullish(),
  presentationId: z.string().nullish(),
  quantity: z.number().nonnegative().nullish(),
  contentPerUnit: z.number().nonnegative().nullish(),
  baseUnit: z.string().nullish(),
  baseUnitCost: money.nullish(),
  unitCost: money.nullish(),
};
const movementSchema = z.discriminatedUnion('movementType', [
  z.object({ ...recognitionFields, movementType: z.literal('SALE') }),
  z.object({ ...recognitionFields, movementType: z.literal('PQR') }),
  z.object({ ...recognitionFields, movementType: z.literal('PQR_REVERSAL'), originalMovementId: z.string().min(1) }),
  z.object({
    ...eventFields,
    movementType: z.literal('PAYMENT'),
    correlationId: z.string().min(1),
    paymentType: z.string().min(1),
    allocations: z.array(z.object({ transactionId: z.string().min(1), lotId: z.string().min(1), amount: money })),
  }),
]);
const detailSchema = z.object({
  content: z.array(movementSchema),
  page: count,
  size: z.number().int().min(1).max(100),
  totalElements: count,
  totalPages: count,
});

/** Lee el JSON crudo dejando los importes como texto para no redondearlos con Number. */
function parseSettlementJson(raw: unknown): unknown {
  try {
    return typeof raw === 'string' ? JSON.parse(raw.replace(moneyFieldPattern, '"$1":"$2"')) : raw;
  } catch {
    throw new InvalidSettlementResponseError();
  }
}

export function parseDailySummary(raw: unknown): DailySettlementSummary {
  const parsed = summarySchema.safeParse(parseSettlementJson(raw));
  if (!parsed.success) throw new InvalidSettlementResponseError();
  return parsed.data;
}

export function parseDailyDetail(raw: unknown): DailySettlementDetail {
  const parsed = detailSchema.safeParse(parseSettlementJson(raw));
  if (!parsed.success) throw new InvalidSettlementResponseError();
  const correlations = parsed.data.content.filter((item) => item.movementType === 'PAYMENT').map((item) => item.correlationId);
  if (new Set(correlations).size !== correlations.length) throw new InvalidSettlementResponseError();
  return parsed.data;
}

export const settlementService = {
  async getDailySummary(page = 0, size = 20, date: string | null = null, providerId: string | null = null, signal?: AbortSignal): Promise<DailySettlementSummary> {
    const { data } = await axios.get<string>(`${getApiBaseUrl()}/v1/settlements/daily-summary`, {
      params: { page, size, ...(date ? { date } : {}), ...(providerId ? { providerId } : {}) },
      signal,
      responseType: 'text',
      transformResponse: [(body: unknown) => body],
    });
    const summary = parseDailySummary(data);
    if (summary.page !== page || summary.size !== size || (date !== null && summary.date !== date) ||
      summary.content.some((item) => item.date !== summary.date || (providerId !== null && item.providerId.toLowerCase() !== providerId.toLowerCase()))) {
      throw new InvalidSettlementResponseError();
    }
    return summary;
  },
  async getDailyDetail(date: string, providerId: string, page = 0, size = 20, signal?: AbortSignal): Promise<DailySettlementDetail> {
    const { data } = await axios.get(`${getApiBaseUrl()}/v1/settlements/daily-detail`, {
      params: { date, providerId, page, size },
      signal,
      responseType: 'text',
      transformResponse: [(body: unknown) => body],
    });
    const detail = parseDailyDetail(data);
    if (detail.page !== page || detail.size !== size ||
      detail.content.some((item) => item.date !== date || item.providerId.toLowerCase() !== providerId.toLowerCase())) {
      throw new InvalidSettlementResponseError();
    }
    return detail;
  },
};
