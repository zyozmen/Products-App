import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import SupplierPaymentForm from '../../components/admin/suppliers/SupplierPaymentForm';
import { supplierKeys, useRegisterLinkedPayment } from '../../hooks/useSupplierQueries';
import { settlementKeys } from '../../hooks/useSettlementQueries';
import { getPaymentErrorMessage, supplierService } from '../../services/supplierService';
import type { LinkedPaymentResponse, SupplierResponse } from '../../Interfaces/supplier';

const supplier: SupplierResponse = {
  id: '6500000000000000000000ab', nombre: 'Distribuidora', nit: '900123', estado: 'ACTIVO',
  totalDeuda: 1_000_000, totalPagado: 200_000, saldoPendiente: 800_000,
  fechaCreacion: '2026-10-01', ultimaActualizacion: '2026-10-01',
};
const linked: LinkedPaymentResponse = {
  proveedor: supplier, correlationId: 'corr', fechaLiquidacion: '2026-10-17', monto: 250_000,
  asignaciones: [{ loteId: 'lote-1', monto: 150_000 }, { loteId: 'lote-2', monto: 100_000 }],
};

function renderForm(props: Partial<Parameters<typeof SupplierPaymentForm>[0]> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const onPaid = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <SupplierPaymentForm supplier={supplier} onPaid={onPaid} {...props} />
    </QueryClientProvider>,
  );
  return { onPaid, client };
}

const amount = () => screen.getByLabelText(/^Monto/);

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('supplier payment form (HU-04/F5)', () => {
  it('keeps the general payment without a settlement date and confirms FIFO destination first', async () => {
    const general = vi.spyOn(supplierService, 'registerPayment').mockResolvedValue(supplier);
    const linkedSpy = vi.spyOn(supplierService, 'registerLinkedPayment');
    const { onPaid } = renderForm();

    expect(screen.getByText(/Abono general: no se vincula/)).toBeInTheDocument();
    fireEvent.change(amount(), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));

    const summary = await screen.findByRole('region', { name: 'Confirmar pago' });
    expect(summary).toHaveTextContent('Distribuidora · NIT 900123');
    expect(summary).toHaveTextContent('Ninguna (abono general)');
    expect(summary).toHaveTextContent('Lotes pendientes más antiguos primero (FIFO)');
    expect(general).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }));
    await waitFor(() => expect(onPaid).toHaveBeenCalledWith());
    expect(general).toHaveBeenCalledWith(supplier.id, { monto: 1000, loteId: undefined, tipo: 'ABONO', observaciones: undefined });
    expect(general.mock.calls[0][1]).not.toHaveProperty('fechaLiquidacion');
    expect(linkedSpy).not.toHaveBeenCalled();
  });

  it('prefills the suggested amount as an editable reference and warns when paying more', async () => {
    const linkedSpy = vi.spyOn(supplierService, 'registerLinkedPayment').mockResolvedValue(linked);
    const { onPaid } = renderForm({ settlement: { date: '2026-10-17', suggestedPayableAmount: '200000.00' } });

    expect(amount()).toHaveValue(200000);
    expect(screen.getByText(/referencia, no es un límite/)).toBeInTheDocument();
    fireEvent.change(amount(), { target: { value: '250000' } });
    fireEvent.change(screen.getByLabelText(/^ID del lote/), { target: { value: '6500000000000000000000cd' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));

    const summary = await screen.findByRole('region', { name: 'Confirmar pago' });
    expect(summary).toHaveTextContent('17 de octubre de 2026');
    expect(summary).toHaveTextContent('Lote 6500000000000000000000cd');
    expect(screen.getByRole('note')).toHaveTextContent('supera el sugerido de la jornada ($200.000) en $50.000');

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago' }));
    await waitFor(() => expect(onPaid).toHaveBeenCalledWith(linked));
    expect(linkedSpy).toHaveBeenCalledWith(supplier.id, {
      monto: 250000, loteId: '6500000000000000000000cd', tipo: 'ABONO', observaciones: undefined, fechaLiquidacion: '2026-10-17',
    });
  });

  it('allows partial payments below the suggested amount without a warning', async () => {
    vi.spyOn(supplierService, 'registerLinkedPayment').mockResolvedValue(linked);
    renderForm({ settlement: { date: '2026-10-17', suggestedPayableAmount: '200000.00' } });
    fireEvent.change(amount(), { target: { value: '50000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));
    await screen.findByRole('region', { name: 'Confirmar pago' });
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('sends a single request on repeated clicks', async () => {
    let resolve!: (value: LinkedPaymentResponse) => void;
    const linkedSpy = vi.spyOn(supplierService, 'registerLinkedPayment')
      .mockReturnValue(new Promise((done) => { resolve = done; }));
    renderForm({ settlement: { date: '2026-10-17', suggestedPayableAmount: '1000.00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));
    const confirm = await screen.findByRole('button', { name: 'Confirmar pago' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(linkedSpy).toHaveBeenCalled());
    fireEvent.click(confirm);
    expect(linkedSpy).toHaveBeenCalledTimes(1);
    await act(async () => resolve(linked));
  });

  it('asks to verify the payment after a timeout instead of allowing a blind retry', async () => {
    vi.spyOn(supplierService, 'registerLinkedPayment').mockRejectedValue(new AxiosError('timeout', 'ECONNABORTED'));
    const { onPaid } = renderForm({ settlement: { date: '2026-10-17', suggestedPayableAmount: '1000.00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar pago' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Verifica el histórico de abonos y la liquidación antes de repetirlo');
    expect(screen.getByRole('button', { name: 'Confirmar pago' })).toBeDisabled();
    expect(onPaid).not.toHaveBeenCalled();
  });

  it('shows balance errors from the server without apparent success', async () => {
    vi.spyOn(supplierService, 'registerLinkedPayment').mockRejectedValue(new AxiosError('fail', 'ERR', {} as never, {}, {
      status: 422, data: { message: 'El pago no puede superar el saldo pendiente del lote' }, statusText: '', headers: {}, config: {} as never,
    }));
    const { onPaid } = renderForm({ settlement: { date: '2026-10-17', suggestedPayableAmount: '1000.00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar pago' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El pago no puede superar el saldo pendiente del lote');
    expect(onPaid).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Confirmar pago' })).toBeEnabled();
  });
});

describe('linked payment service and refresh', () => {
  it('posts fechaLiquidacion to the existing payments endpoint', async () => {
    const post = vi.spyOn((await import('axios')).default, 'post').mockResolvedValue({ data: linked });
    await supplierService.registerLinkedPayment('prov/1', { monto: 10, fechaLiquidacion: '2026-10-17' });
    expect(post).toHaveBeenCalledWith(expect.stringMatching(/\/api\/proveedores\/prov%2F1\/pagos$/), { monto: 10, fechaLiquidacion: '2026-10-17' });
  });

  it('refreshes supplier balances and the daily settlement from the server after success', async () => {
    vi.spyOn(supplierService, 'registerLinkedPayment').mockResolvedValue(linked);
    const client = new QueryClient();
    const summaryKey = settlementKeys.dailySummary(0, 20, '2026-10-17');
    client.setQueryData(summaryKey, { content: [] });
    client.setQueryData(supplierKeys.detail(supplier.id), supplier);
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useRegisterLinkedPayment(supplier.id), { wrapper });
    await act(async () => { await result.current.mutateAsync({ monto: 10, fechaLiquidacion: '2026-10-17' }); });
    expect(client.getQueryState(summaryKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(supplierKeys.detail(supplier.id))?.isInvalidated).toBe(true);
  });

  it('distinguishes an uncertain result from a rejected payment', () => {
    expect(getPaymentErrorMessage(new AxiosError('Network Error', 'ERR_NETWORK'))).toMatch(/pudo haberse registrado/);
  });
});
