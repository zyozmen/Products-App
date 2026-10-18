export type SupplierState = 'ACTIVO' | 'INACTIVO';
export type LotPaymentState = 'PENDIENTE' | 'PAGO_PARCIAL' | 'PAGADO_TOTAL';
export type PaymentType = 'ABONO' | 'PAGO_CORTESIA' | 'AJUSTE_PQR';

export interface SupplierContact {
  telefono?: string;
  email?: string;
}

export interface SupplierResponse {
  id: string;
  nombre: string;
  nit: string;
  contacto?: SupplierContact;
  totalDeuda: number;
  totalPagado: number;
  saldoPendiente: number;
  estado: SupplierState;
  fechaCreacion: string;
  ultimaActualizacion: string;
}

export interface SupplierCreateRequest {
  nombre: string;
  nit: string;
  telefono?: string;
  email?: string;
}

export interface PresentationRequest {
  presentacionId: string;
  cantidadUnidades: number;
  costoUnitario: number;
}

export interface LotCreateRequest {
  proveedorId: string;
  codigoLote: string;
  presentaciones: PresentationRequest[];
  abonoInicial?: number;
}

export interface LotPresentation extends PresentationRequest {
  subtotal: number;
}

export interface LotResponse {
  id: string;
  proveedorId: string;
  codigoLote: string;
  costoTotalLote: number;
  montoPagadoLote: number;
  saldoPendienteLote: number;
  estadoPago: LotPaymentState;
  presentaciones: LotPresentation[];
  fechaIngreso: string;
}

export interface PaymentRequest {
  monto: number;
  loteId?: string;
  tipo?: PaymentType;
  observaciones?: string;
}

export interface LiquidationRequest {
  proveedorId: string;
  loteId: string;
  montoLiquidable: number;
}

export interface LiquidationEvaluation {
  acumulaLiquidacion: boolean;
  descontarStock: boolean;
  montoLiquidable: number;
  motivo: string;
}

export interface ApiErrorBody {
  message?: string;
  validationErrors?: string[];
}
