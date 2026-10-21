export type SupplierState = 'ACTIVO' | 'INACTIVO';
export type LotPaymentState = 'PENDIENTE' | 'PAGO_PARCIAL' | 'PAGADO_TOTAL';
export type PaymentType = 'ABONO' | 'PAGO_CORTESIA' | 'AJUSTE_PQR';

export interface SupplierContact {
  telefono?: string | null;
  email?: string | null;
}

export interface SupplierResponse {
  id: string;
  nombre: string;
  nit: string;
  contacto?: SupplierContact | null;
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

export interface SupplierSearchResult {
  suppliers: SupplierResponse[];
  total: number;
}

export interface ContainerCreateRequest {
  tipoCepa: string;
  unidadBase: string;
  presentacionId?: string | null;
  capacidadUnidadesBase: number;
  costoBasePorUnidad: number;
}

export interface LotCreateRequest {
  proveedorId: string;
  contenedores: ContainerCreateRequest[];
  abonoInicial?: number;
}

export interface ContainerResponse extends ContainerCreateRequest {
  id: string;
  presentacionId: string | null;
  cantidadDisponible: number;
  subtotal: number;
  estado: 'RECIBIDO';
}

export interface LotResponse {
  id: string;
  proveedorId: string;
  codigoLote: string;
  costoTotalLote: number;
  montoPagadoLote: number;
  saldoPendienteLote: number;
  estadoPago: LotPaymentState;
  estado: 'RECIBIDO' | null;
  contenedores: ContainerResponse[];
  fechaIngreso: string;
}

export interface SupplierPaymentResponse {
  id: string;
  fecha: string;
  monto: number;
  proveedorId: string;
  loteId: string;
  tipo: PaymentType | 'ABONO_INICIAL';
  observaciones: string | null;
}

export interface SupplierPaymentsPage {
  payments: SupplierPaymentResponse[];
  total: number;
}

export interface PaymentRequest {
  monto: number;
  loteId?: string | null;
  tipo?: PaymentType;
  observaciones?: string | null;
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
