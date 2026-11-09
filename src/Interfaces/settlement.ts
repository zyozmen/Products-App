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

export interface SettlementAllocation {
  transactionId: string;
  lotId: string;
  lotCode?: string | null;
  amount: DecimalAmount;
}

interface SettlementEvent {
  id: string;
  providerId: string;
  providerName?: string | null;
  date: string;
  timestamp: string;
  amount: DecimalAmount;
  observations?: string | null;
}

export interface SettlementRecognition extends SettlementEvent {
  movementType: 'SALE' | 'PQR' | 'PQR_REVERSAL';
  orderId?: string | number | null;
  itemIndex?: number | null;
  lotId?: string | null;
  lotCode?: string | null;
  containerId?: string | null;
  containerCode?: string | null;
  strainId?: string | null;
  productName?: string | null;
  presentationId?: string | null;
  presentationName?: string | null;
  quantity?: number | null;
  contentPerUnit?: number | null;
  baseUnit?: string | null;
  baseUnitCost?: DecimalAmount | null;
  unitCost?: DecimalAmount | null;
  originalMovementId?: string | null;
}

export interface SettlementPayment extends SettlementEvent {
  movementType: 'PAYMENT';
  correlationId: string;
  paymentType: string;
  allocations: SettlementAllocation[];
}

export type SettlementMovement = SettlementRecognition | SettlementPayment;

export interface DailySettlementDetail {
  providerName?: string | null;
  content: SettlementMovement[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
