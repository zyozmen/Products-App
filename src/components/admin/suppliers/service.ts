import axios from 'axios';
import { getApiBaseUrl } from '../../../services/apiConfig.js';
import type {
  LiquidationEvaluation,
  LiquidationRequest,
  LotCreateRequest,
  LotResponse,
  PaymentRequest,
  SupplierCreateRequest,
  SupplierResponse,
} from './types';

const endpoint = (path: string) => `${getApiBaseUrl()}${path}`;

export const supplierService = {
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

  async registerPayment(id: string, request: PaymentRequest) {
    const { data } = await axios.post<SupplierResponse>(
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
    if (body?.message) return body.message;
    if (body?.validationErrors?.length) return body.validationErrors.join(' ');
    if (error.response?.status === 409) {
      return 'Los datos cambiaron en el servidor. Recarga el proveedor e inténtalo nuevamente.';
    }
    if (error.response?.status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
    if (error.response?.status === 403) return 'No tienes permisos para administrar proveedores.';
    if (error.response?.status === 404) return 'No se encontró el proveedor o lote solicitado.';
    return 'No se pudo completar la solicitud. Inténtalo nuevamente.';
  }
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}
