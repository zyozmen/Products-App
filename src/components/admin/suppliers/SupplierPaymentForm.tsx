import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { AlertTriangle, CircleDollarSign, Wallet } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRegisterLinkedPayment, useRegisterPayment } from '../../../hooks/useSupplierQueries';
import { paymentSchemaForBalance, type PaymentFormValues } from '../../../schemas/supplier';
import { getPaymentErrorMessage } from '../../../services/supplierService';
import { amountToCents, centsToDecimal, decimalToCents, formatDecimalCOP, isPositiveDecimal, normalizeDecimal } from '../../../utils/decimalMoney';
import type { LinkedPaymentResponse, PaymentType, SupplierResponse } from '../../../Interfaces/supplier';
import { Button, Card, ErrorNotice, Field, Input, Select } from '../../ui/shadcn';

const cop = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const formatCop = (amount: number) => `$${cop.format(amount)} COP`;
const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  ABONO: 'Abono',
  PAGO_CORTESIA: 'Pago de cortesía',
  AJUSTE_PQR: 'Ajuste PQR',
};

/** Jornada de liquidacion a la que se vincula el pago (HU-04/F5). Sin ella el abono es general. */
export interface PaymentSettlementContext {
  date: string;
  suggestedPayableAmount: string;
}

export function formatSettlementDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
}

const emptyValues = (settlement?: PaymentSettlementContext): Partial<PaymentFormValues> => ({
  // El sugerido es solo una referencia editable; nunca un limite.
  monto: settlement && isPositiveDecimal(settlement.suggestedPayableAmount)
    ? Number(normalizeDecimal(settlement.suggestedPayableAmount))
    : undefined,
  loteId: '',
  tipo: 'ABONO',
  observaciones: '',
});

export default function SupplierPaymentForm({ supplier, settlement, onPaid }: {
  supplier: SupplierResponse;
  settlement?: PaymentSettlementContext;
  onPaid: (linked?: LinkedPaymentResponse) => void;
}) {
  const generalPayment = useRegisterPayment(supplier.id);
  const linkedPayment = useRegisterLinkedPayment(supplier.id);
  const mutation = settlement ? linkedPayment : generalPayment;
  const submitting = useRef(false);
  const [pending, setPending] = useState<PaymentFormValues | null>(null);
  const schema = useMemo(() => paymentSchemaForBalance(supplier.saldoPendiente), [supplier.saldoPendiente]);
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues(settlement),
  });

  const review = form.handleSubmit((values) => {
    mutation.reset();
    setPending(values);
  });

  const confirm = async () => {
    if (!pending || submitting.current) return;
    submitting.current = true;
    const request = {
      monto: pending.monto,
      loteId: pending.loteId?.trim() || undefined,
      tipo: pending.tipo,
      observaciones: pending.observaciones?.trim() || undefined,
    };
    try {
      if (settlement) {
        const result = await linkedPayment.mutateAsync({ ...request, fechaLiquidacion: settlement.date });
        onPaid(result);
      } else {
        await generalPayment.mutateAsync(request);
        onPaid();
      }
      setPending(null);
      form.reset(emptyValues(settlement));
    } catch {
      // El error se muestra en el resumen; el pago no se reintenta automaticamente.
    } finally {
      submitting.current = false;
    }
  };

  const suggestedCents = settlement ? decimalToCents(settlement.suggestedPayableAmount) : null;
  const excessCents = pending && suggestedCents !== null ? amountToCents(pending.monto) - suggestedCents : 0n;
  // Sin respuesta no se sabe si el pago quedo registrado: no se permite repetirlo desde aqui.
  const uncertain = axios.isAxiosError(mutation.error) && !mutation.error.response;

  return (
    <Card className="hu-overflow-hidden">
      <div className="hu-border-b hu-border-slate-100 hu-p-5">
        <h2 className="hu-m-0 hu-flex hu-items-center hu-gap-2 hu-text-lg hu-font-bold"><Wallet size={19} className="hu-text-blue-700" /> Registrar abono</h2>
        <p className="hu-mb-0 hu-mt-1 hu-text-sm hu-text-slate-500">El saldo pendiente disponible es {formatCop(supplier.saldoPendiente)}.</p>
        {settlement ? (
          <p className="hu-mb-0 hu-mt-1 hu-text-sm hu-font-semibold hu-text-green-800">
            Vinculado a la jornada del {formatSettlementDate(settlement.date)}. Valor sugerido: {formatDecimalCOP(settlement.suggestedPayableAmount)} (referencia, no es un límite).
          </p>
        ) : (
          <p className="hu-mb-0 hu-mt-1 hu-text-xs hu-text-slate-500">Abono general: no se vincula a ninguna jornada de liquidación.</p>
        )}
      </div>
      <form className="hu-grid hu-gap-4 hu-p-5" onSubmit={review} noValidate>
        <fieldset disabled={Boolean(pending)} className="hu-m-0 hu-grid hu-min-w-0 hu-gap-4 hu-border-0 hu-p-0">
          <Field label="Monto" error={form.formState.errors.monto?.message}
            hint={settlement ? 'Puedes pagar más o menos que el sugerido, sin superar los saldos del proveedor y de los lotes.' : undefined}>
            <Input type="number" min="0.01" max={supplier.saldoPendiente} step="0.01" {...form.register('monto', { valueAsNumber: true })} />
          </Field>
          <Field label="ID del lote (opcional)" hint="Si lo omites, el backend asigna el pago a los lotes pendientes más antiguos.">
            <Input {...form.register('loteId')} placeholder="ID de lote" />
          </Field>
          <Field label="Tipo de pago">
            <Select {...form.register('tipo')}>
              <option value="ABONO">Abono</option>
              <option value="PAGO_CORTESIA">Pago de cortesía</option>
              <option value="AJUSTE_PQR">Ajuste PQR</option>
            </Select>
          </Field>
          <Field label="Observaciones" error={form.formState.errors.observaciones?.message}>
            <Input {...form.register('observaciones')} maxLength={500} placeholder="Detalle del pago (opcional)" />
          </Field>
        </fieldset>
        {!pending && (
          <Button type="submit" disabled={supplier.saldoPendiente <= 0}>
            <CircleDollarSign size={17} /> Registrar pago
          </Button>
        )}
      </form>
      {pending && (
        <section className="hu-grid hu-gap-3 hu-border-0 hu-border-t hu-border-solid hu-border-slate-100 hu-bg-slate-50 hu-p-5" aria-label="Confirmar pago">
          <h3 className="hu-m-0 hu-text-base hu-font-bold">Confirma el pago antes de registrarlo</h3>
          <dl className="hu-m-0 hu-grid hu-gap-2 hu-text-sm sm:hu-grid-cols-[max-content_1fr] sm:hu-gap-x-4">
            <dt className="hu-font-semibold">Proveedor</dt>
            <dd className="hu-m-0">{supplier.nombre} · NIT {supplier.nit}</dd>
            <dt className="hu-font-semibold">Importe</dt>
            <dd className="hu-m-0">{formatCop(pending.monto)} · {PAYMENT_TYPE_LABELS[pending.tipo]}</dd>
            <dt className="hu-font-semibold">Jornada vinculada</dt>
            <dd className="hu-m-0">{settlement ? formatSettlementDate(settlement.date) : 'Ninguna (abono general)'}</dd>
            <dt className="hu-font-semibold">Destino</dt>
            <dd className="hu-m-0">{pending.loteId?.trim() ? `Lote ${pending.loteId.trim()}` : 'Lotes pendientes más antiguos primero (FIFO)'}</dd>
          </dl>
          {excessCents > 0n && settlement && (
            <p className="hu-m-0 hu-flex hu-gap-2 hu-rounded-lg hu-border hu-border-solid hu-border-amber-200 hu-bg-amber-50 hu-p-3 hu-text-sm hu-text-amber-900" role="note">
              <AlertTriangle size={17} className="hu-mt-0.5 hu-shrink-0" aria-hidden="true" />
              El pago supera el sugerido de la jornada ({formatDecimalCOP(settlement.suggestedPayableAmount)}) en {formatDecimalCOP(centsToDecimal(excessCents))}. El exceso se mostrará en la liquidación; no es deuda ni genera reembolso.
            </p>
          )}
          {mutation.isError && <ErrorNotice>{getPaymentErrorMessage(mutation.error)}</ErrorNotice>}
          <div className="hu-flex hu-flex-wrap hu-gap-3">
            <Button type="button" disabled={mutation.isPending || uncertain} onClick={() => void confirm()}>
              <CircleDollarSign size={17} /> {mutation.isPending ? 'Registrando…' : 'Confirmar pago'}
            </Button>
            <Button type="button" variant="secondary" disabled={mutation.isPending} onClick={() => { mutation.reset(); setPending(null); }}>
              Volver a editar
            </Button>
          </div>
        </section>
      )}
    </Card>
  );
}
