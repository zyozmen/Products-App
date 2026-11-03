import axios from 'axios';
import { getApiBaseUrl } from './apiConfig.js';
import { serializePresentations } from '../utils/serializePresentations';
import type {
  LinkedPaymentRequest,
  LinkedPaymentResponse,
  LiquidationEvaluation,
  LiquidationRequest,
  LotCreateRequest,
  LotResponse,
  PaymentRequest,
  PresentationCreateRequest,
  SupplierCreateRequest,
  SupplierPaymentResponse,
  SupplierPaymentsPage,
  SupplierResponse,
  SupplierSearchResult,
  SupplierLotSort,
  SupplierLotsPage,
} from '../Interfaces/supplier';

const endpoint = (path: string) => `${getApiBaseUrl()}${path}`;

function readTotalCount(header: unknown): number {
  const total = Number(header);
  if (header === undefined || header === null || String(header).trim() === '' ||
    !Number.isSafeInteger(total) || total < 0) {
    throw new Error('No se pudo leer el total de resultados. El servidor debe exponer el encabezado X-Total-Count.');
  }
  return total;
}

export const supplierService = {
  async getSupplierLots(id: string, search = '', page = 0, size = 10, sort: SupplierLotSort = 'fechaIngreso,desc'): Promise<SupplierLotsPage> {
    const params = new URLSearchParams({
      buscar: search.trim(),
      page: String(page),
      size: String(size),
      sort,
    });
    const { data, headers } = await axios.get<LotResponse[]>(
      `${endpoint(`/proveedores/${encodeURIComponent(id)}/lotes`)}?${params}`,
    );
    return { lots: data, total: readTotalCount(headers['x-total-count']) };
  },

  async packageContainer(lotId: string, containerId: string, presentations: PresentationCreateRequest[]) {
    const { data } = await axios.post<LotResponse>(
      endpoint(`/v1/lotes/${encodeURIComponent(lotId)}/contenedores/${encodeURIComponent(containerId)}/presentaciones`),
      presentations,
      {
        headers: { 'Content-Type': 'application/json' },
        transformRequest: [(rows: PresentationCreateRequest[]) => serializePresentations(rows)],
      },
    );
    return data;
  },

  async searchSuppliers(search: string, page = 0, size = 20): Promise<SupplierSearchResult> {
    const { data, headers } = await axios.get<SupplierResponse[]>(endpoint('/proveedores'), {
      params: { buscar: search.trim(), page, size },
    });
    return { suppliers: data, total: readTotalCount(headers['x-total-count']) };
  },

  async getSupplier(id: string) {
    const { data } = await axios.get<SupplierResponse>(endpoint(`/proveedores/${encodeURIComponent(id)}`));
    return data;
  },

  async createSupplier(request: SupplierCreateRequest) {
    const { data } = await axios.post<SupplierResponse>(endpoint('/proveedores'), request);
    return data;
  },

  async createLot(request: LotCreateRequest) {
    const { data } = await axios.post<LotResponse>(endpoint('/lotes'), request);
    return data;
  },

  async getLot(id: string) {
    const { data } = await axios.get<LotResponse>(endpoint(`/lotes/${encodeURIComponent(id)}`));
    return data;
  },

  async getPayments(id: string, page = 0, size = 20): Promise<SupplierPaymentsPage> {
    const { data, headers } = await axios.get<SupplierPaymentResponse[]>(
      endpoint(`/proveedores/${encodeURIComponent(id)}/abonos`),
      { params: { page, size } },
    );
    return { payments: data, total: readTotalCount(headers['x-total-count']) };
  },

  async registerPayment(id: string, request: PaymentRequest) {
    const { data } = await axios.post<SupplierResponse>(
      endpoint(`/proveedores/${encodeURIComponent(id)}/pagos`),
      request,
    );
    return data;
  },

  /** Mismo endpoint con `fechaLiquidacion`: el backend responde el pago con su imputacion por lote. */
  async registerLinkedPayment(id: string, request: LinkedPaymentRequest) {
    const { data } = await axios.post<LinkedPaymentResponse>(
      endpoint(`/proveedores/${encodeURIComponent(id)}/pagos`),
      request,
    );
    return data;
  },

  async evaluateLiquidation(request: LiquidationRequest) {
    const { data } = await axios.post<LiquidationEvaluation>(
      endpoint('/liquidaciones/procesar-evento'),
      request,
    );
    return data;
  },
};

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { message?: string; validationErrors?: string[] } | undefined;
    if (body?.validationErrors?.length) return body.validationErrors.join(' ');
    if (error.response?.status === 409) {
      return `${body?.message ?? 'Los datos cambiaron en el servidor.'} Recarga el proveedor e inténtalo nuevamente.`;
    }
    if (body?.message) return body.message;
    if (error.response?.status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
    if (error.response?.status === 403) return 'No tienes permisos para administrar proveedores.';
    if (error.response?.status === 404) return 'No se encontró el proveedor o lote solicitado.';
    return 'No se pudo completar la solicitud. Inténtalo nuevamente.';
  }
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

/**
 * Sin respuesta (timeout o red) el pago pudo registrarse en el servidor: no se invita a repetirlo
 * sin verificar antes el historial de abonos o la liquidacion.
 */
export function getPaymentErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && !error.response) {
    return 'No se recibió respuesta del servidor y el pago pudo haberse registrado. Verifica el histórico de abonos y la liquidación antes de repetirlo.';
  }
  return getApiErrorMessage(error);
}
