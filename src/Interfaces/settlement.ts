/** Importe del backend como texto decimal plano, para no perder precision en el navegador. */
export type DecimalAmount = string;

export interface ProviderDailySummary {
  providerId: string;
  providerName: string | null;
  date: string;
  totalSalesCount: number;
  totalPqrCount: number;
  salesRecognizedAmount: DecimalAmount;
  pqrRecognizedAmount: DecimalAmount;
  reversedAmount: DecimalAmount;
  grossAccumulatedAmount: DecimalAmount;
  accumulatedAmount: DecimalAmount;
  linkedPaymentsAmount: DecimalAmount;
  pendingDailyAmount: DecimalAmount;
  providerOutstandingBalance: DecimalAmount;
  suggestedPayableAmount: DecimalAmount;
  overpaidAmount: DecimalAmount;
}

export interface DailySettlementSummary {
  date: string;
  timezone: string;
  activationPending: boolean;
  activatedAt: string | null;
  content: ProviderDailySummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
