import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  BadgeDollarSign,
  Building2,
  Check,
  CircleDollarSign,
  History,
  PackagePlus,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMemo, useRef, useState } from 'react';
import HeaderComponent from '../../dashboard/HeaderComponent.jsx';
import AdminNav from '../AdminNav.jsx';
import FooterComponent from '../../dashboard/FooterComponent.jsx';
import navigationComponent from '../../navigation/NavigationComponent.jsx';
import {
  useCreateLot,
  useCreateSupplier,
  useEvaluateLiquidation,
  useRegisterPayment,
  useSupplier,
  useLot,
} from '../../../hooks/useSupplierQueries';
import { calculateContainerSubtotalCents, calculateLotTotalCents, centsToAmount } from '../../../utils/supplierCalculations';
import {
  containerSchema,
  liquidationSchema,
  lotSchema,
  paymentSchemaForBalance,
  supplierSchema,
  type LiquidationFormValues,
  type LotFormInput,
  type LotFormValues,
  type PaymentFormValues,
  type SupplierFormValues,
} from '../../../schemas/supplier';
import { getApiErrorMessage } from '../../../services/supplierService';
import SupplierSearch from './SupplierSearch';
import type { LiquidationEvaluation, LotResponse, SupplierResponse } from '../../../Interfaces/supplier';
import SupplierPaymentsTable from './SupplierPaymentsTable';
import SupplierLotsList from './SupplierLotsList';
import DesgloseContenedorForm from './DesgloseContenedorForm';
import { Badge, Button, Card, ErrorNotice, Field, Input, Select } from '../../ui/shadcn';

const cop = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const formatCop = (amount: number) => `$${cop.format(amount)} COP`;
const positiveId = /^[a-f\d]{24}$/i;
const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);

function PageShell({ children, detail = false }: { children: React.ReactNode; detail?: boolean }) {
  return (
    <div className="hu-flex hu-min-h-screen hu-flex-col admin-page-bg hu-text-slate-900">
      <HeaderComponentWithNavigation />
      <AdminNav />
      <main className="hu-mx-auto hu-w-full hu-max-w-[1600px] hu-flex-1 hu-px-4 hu-py-8 md:hu-px-8">
        {children}
      </main>
      <FooterComponent />
    </div>
  );
}

function PageTitle({ title, description, eyebrow }: { title: string; description: string; eyebrow?: string }) {
  return (
    <div className="hu-mb-6">
      {eyebrow && <p className="hu-mb-2 hu-text-sm hu-font-semibold hu-uppercase hu-tracking-wide hu-text-green-800">{eyebrow}</p>}
      <h1 className="hu-m-0 hu-text-3xl hu-font-bold hu-tracking-tight">{title}</h1>
      <p className="hu-mb-0 hu-mt-2 hu-max-w-3xl hu-text-sm hu-text-slate-500">{description}</p>
    </div>
  );
}

function SupplierEntryPage() {
  const navigate = useNavigate();
  const createSupplier = useCreateSupplier();
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { nombre: '', nit: '', telefono: '', email: '' },
  });

  const onCreate = form.handleSubmit(async (values) => {
    try {
      const supplier = await createSupplier.mutateAsync({
        nombre: values.nombre.trim(),
        nit: values.nit.trim(),
        telefono: values.telefono?.trim() || undefined,
        email: values.email?.trim() || undefined,
      });
      navigate(`/admin/proveedores/${supplier.id}`);
    } catch {
      // Mutation errors are shown in the form below.
    }
  });

  return (
    <PageShell>
      <PageTitle
        eyebrow="Administración Proveedores"
        title="Proveedores y saldos"
        description="Consulta el estado financiero de tus proveedores, registra ingresos de lotes y controla los abonos."
      />
      <div className="hu-grid hu-items-start hu-gap-6 lg:hu-grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
        <SupplierSearch />

        <Card className="hu-overflow-hidden kanban-board">
          <div className="hu-border-b hu-border-slate-100 hu-p-6 ">
            <span className="hu-mb-4 hu-flex hu-h-11 hu-w-11 hu-items-center hu-justify-center hu-rounded-xl hu-bg-indigo-50 hu-text-indigo-700"><Building2 size={21} /></span>
            <h2 className="hu-mb-1 hu-text-lg hu-font-bold">Registrar proveedor</h2>
            <p className="hu-m-0 hu-text-sm hu-text-slate-500">Crea la ficha para comenzar a administrar sus lotes y pagos.</p>
          </div>
          <form className="hu-grid hu-gap-4 hu-p-6" onSubmit={onCreate} noValidate>
            <Field label="Nombre" error={form.formState.errors.nombre?.message}>
              <Input {...form.register('nombre')} autoComplete="organization" placeholder="Café Colombia" />
            </Field>
            <Field label="NIT" error={form.formState.errors.nit?.message}>
              <Input {...form.register('nit')} placeholder="900123456-1" />
            </Field>
            <div className="hu-grid hu-gap-4 sm:hu-grid-cols-2">
              <Field label="Teléfono" error={form.formState.errors.telefono?.message}>
                <Input {...form.register('telefono')} type="tel" placeholder="+573001234567" />
              </Field>
              <Field label="Correo electrónico" error={form.formState.errors.email?.message}>
                <Input {...form.register('email')} type="email" placeholder="contacto@empresa.com" />
              </Field>
            </div>
            <div className="hu-flex hu-gap-3 hu-rounded-xl hu-border hu-border-blue-100 hu-bg-blue-50 hu-p-4 hu-text-sm hu-text-blue-900">
              <ShieldCheck className="hu-mt-0.5 hu-shrink-0 hu-text-blue-700" size={18} aria-hidden="true" />
              <p className="hu-m-0">El saldo inicial se crea automáticamente en <strong>$0 COP</strong>.</p>
            </div>
            {createSupplier.isError && <ErrorNotice>{getApiErrorMessage(createSupplier.error)}</ErrorNotice>}
            <Button type="submit" disabled={createSupplier.isPending} className="hu-w-full sm:hu-w-fit">
              {createSupplier.isPending ? 'Guardando…' : 'Crear proveedor'}
            </Button>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}

function SummaryCard({ title, amount, icon, emphasis = 'neutral' }: {
  title: string;
  amount: number;
  icon: React.ReactNode;
  emphasis?: 'neutral' | 'blue' | 'orange';
}) {
  const accents = {
    neutral: 'hu-bg-slate-100 hu-text-slate-700',
    blue: 'hu-bg-blue-100 hu-text-blue-800',
    orange: 'hu-bg-orange-100 hu-text-orange-800',
  };
  return (
    <Card className="hu-p-5">
      <div className="hu-flex hu-items-start hu-justify-between hu-gap-3">
        <div>
          <p className="hu-mb-2 hu-text-sm hu-font-medium hu-text-slate-500">{title}</p>
          <p className="hu-m-0 hu-text-2xl hu-font-bold hu-tracking-tight hu-text-slate-900">{formatCop(amount)}</p>
        </div>
        <span className={`hu-flex hu-h-10 hu-w-10 hu-shrink-0 hu-items-center hu-justify-center hu-rounded-xl ${accents[emphasis]}`}>{icon}</span>
      </div>
    </Card>
  );
}

function LotCard({
  lot,
  supplierId,
  supplierPaidOff,
}: {
  lot: LotResponse;
  supplierId: string;
  supplierPaidOff: boolean;
}) {
  const evaluate = useEvaluateLiquidation();
  const [evaluation, setEvaluation] = useState<LiquidationEvaluation | null>(null);
  const [containerId, setContainerId] = useState<string | null>(null);
  const form = useForm<LiquidationFormValues>({
    resolver: zodResolver(liquidationSchema),
    defaultValues: { montoLiquidable: 0 },
  });

  const onEvaluate = form.handleSubmit(async ({ montoLiquidable }) => {
    try {
      setEvaluation(await evaluate.mutateAsync({
        proveedorId: supplierId,
        loteId: lot.id,
        montoLiquidable,
      }));
    } catch {
      setEvaluation(null);
    }
  });
  const lotSettled = lot.saldoPendienteLote === 0;
  const isCapped = lotSettled || supplierPaidOff;

  return (
    <Card className="hu-p-5">
      <div className="hu-flex hu-flex-wrap hu-items-start hu-justify-between hu-gap-3">
        <div>
          <div className="hu-mb-2 hu-flex hu-flex-wrap hu-items-center hu-gap-2">
            <h3 className="hu-m-0 hu-text-base hu-font-bold">{lot.codigoLote}</h3>
            {lot.estado && <Badge tone="blue">{lot.estado}</Badge>}
            <Badge tone={lot.estadoPago === 'PAGADO_TOTAL' ? 'green' : lot.estadoPago === 'PAGO_PARCIAL' ? 'orange' : 'neutral'}>{lot.estadoPago.replaceAll('_', ' ')}</Badge>
          </div>
          <p className="hu-m-0 hu-text-xs hu-text-slate-500">ID: {lot.id} · Recibido {new Date(lot.fechaIngreso).toLocaleDateString('es-CO')}</p>
        </div>
        <div className="hu-text-right">
          <p className="hu-m-0 hu-text-sm hu-text-slate-500">Saldo del lote</p>
          <p className="hu-m-0 hu-text-lg hu-font-bold">{formatCop(lot.saldoPendienteLote)}</p>
        </div>
      </div>
      <div className="hu-my-4 hu-grid hu-gap-3 hu-border-y hu-border-slate-100 hu-py-3 sm:hu-grid-cols-3">
        <p className="hu-m-0 hu-text-sm"><span className="hu-block hu-text-xs hu-text-slate-500">Costo total</span>{formatCop(lot.costoTotalLote)}</p>
        <p className="hu-m-0 hu-text-sm"><span className="hu-block hu-text-xs hu-text-slate-500">Abonado</span>{formatCop(lot.montoPagadoLote)}</p>
        <p className="hu-m-0 hu-text-sm"><span className="hu-block hu-text-xs hu-text-slate-500">Contenedores</span>{lot.contenedores?.length ?? 0}</p>
      </div>
      {lot.costoTotalEmpaquetado !== undefined && <p className="hu-text-sm">Costo total empaquetado: {formatCop(lot.costoTotalEmpaquetado)} · El costo de recepción y la deuda no cambian.</p>}

      {lot.contenedores?.length ? (
        <div className="hu-mb-4 hu-grid hu-gap-2">
          {lot.contenedores.map((container) => (
            <details className="hu-rounded-lg hu-bg-slate-50 hu-p-3 hu-text-sm" key={container.id}>
              <summary className="hu-cursor-pointer hu-rounded hu-font-medium focus-visible:hu-outline-none focus-visible:hu-ring-2 focus-visible:hu-ring-green-500">
                {container.codigoContenedor ?? container.id} · {container.tipoCepa} · {container.capacidadUnidadesBase} {container.unidadBase}
              </summary>
              <div className="hu-mt-3 hu-flex hu-flex-wrap hu-items-center hu-justify-between hu-gap-2">
                <span>{formatCop(container.subtotal)} · Sin empaquetar: {container.cantidadDisponible} {container.unidadBase}</span>
                <Button type="button" variant="secondary" onClick={() => setContainerId(containerId === container.id ? null : container.id)}>
                  {containerId === container.id ? 'Cerrar desglose' : 'Desglosar contenedor'}
                </Button>
              </div>
              {containerId === container.id && <DesgloseContenedorForm loteId={lot.id} codigoLote={lot.codigoLote} contenedor={container} />}
            </details>
          ))}
        </div>
      ) : (
        <p className="hu-mb-4 hu-rounded-lg hu-bg-slate-50 hu-p-3 hu-text-sm hu-text-slate-600">
          Lote histórico sin detalle de contenedores.
        </p>
      )}

      {isCapped ? (
        <div className="hu-flex hu-gap-3 hu-rounded-lg hu-border hu-border-green-200 hu-bg-green-50 hu-p-3 hu-text-sm hu-text-green-900" role="status">
          <Check size={18} className="hu-mt-0.5 hu-shrink-0" aria-hidden="true" />
          <p className="hu-m-0"><strong>{lotSettled ? 'Lote Saldado:' : 'Proveedor en paz y salvo:'}</strong> Las ventas de este lote no generarán montos en la liquidación diaria{supplierPaidOff && lot.saldoPendienteLote > 0 ? ' porque el proveedor no tiene saldo pendiente.' : '.'}</p>
        </div>
      ) : (
        <form className="hu-grid hu-items-end hu-gap-3 sm:hu-grid-cols-[minmax(0,1fr)_auto]" onSubmit={onEvaluate} noValidate>
          <Field label="Monto de venta/PQR a evaluar" error={form.formState.errors.montoLiquidable?.message}>
            <Input type="number" min="0" step="0.01" {...form.register('montoLiquidable', { valueAsNumber: true })} />
          </Field>
          <Button type="submit" variant="secondary" disabled={evaluate.isPending}>
            {evaluate.isPending ? 'Evaluando…' : 'Evaluar liquidación'}
          </Button>
        </form>
      )}
      {evaluate.isError && <div className="hu-mt-3"><ErrorNotice>{getApiErrorMessage(evaluate.error)}</ErrorNotice></div>}
      {evaluation && (
        <div className={`hu-mt-3 hu-rounded-lg hu-p-3 hu-text-sm ${evaluation.acumulaLiquidacion ? 'hu-bg-blue-50 hu-text-blue-900' : 'hu-bg-orange-50 hu-text-orange-900'}`} role="status">
          <p className="hu-m-0"><strong>{evaluation.motivo}</strong></p>
          <p className="hu-mb-0 hu-mt-1">Monto liquidable: {formatCop(evaluation.montoLiquidable)} · Descontar stock: {evaluation.descontarStock ? 'Sí' : 'No'}</p>
        </div>
      )}
    </Card>
  );
}

function ConsultedLot({ lotId, supplierId, supplierPaidOff }: { lotId: string; supplierId: string; supplierPaidOff: boolean }) {
  const { data, isPending, isError, error, refetch, isFetching } = useLot(lotId);
  if (isPending) return <p role="status">Cargando lote…</p>;
  if (isError) return <Card className="hu-grid hu-gap-3 hu-p-4"><ErrorNotice>{getApiErrorMessage(error)}</ErrorNotice><Button variant="secondary" onClick={() => void refetch()}>Reintentar lote</Button></Card>;
  if (data.proveedorId !== supplierId) return <ErrorNotice>El lote no pertenece al proveedor consultado.</ErrorNotice>;
  return <div>
    <Button type="button" variant="ghost" disabled={isFetching} onClick={() => void refetch()}>Actualizar lote</Button>
    <LotCard lot={data} supplierId={supplierId} supplierPaidOff={supplierPaidOff} />
  </div>;
}

function LotForm({ supplier, onCreated }: { supplier: SupplierResponse; onCreated: (lot: LotResponse) => void }) {
  const supplierId = supplier.id;
  const createLot = useCreateLot(supplierId);
  const form = useForm<LotFormInput, unknown, LotFormValues>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      contenedores: [{
        tipoCepa: '',
        unidadBase: 'gramo',
        presentacionId: '',
        capacidadUnidadesBase: 1,
        costoBasePorUnidad: 0.01,
      }],
      abonoInicial: undefined,
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'contenedores' });
  const containerCards = useRef(new Map<string, HTMLDetailsElement>());
  const containers = useWatch({ control: form.control, name: 'contenedores' }) ?? [];
  const initialPayment = useWatch({ control: form.control, name: 'abonoInicial' }) ?? 0;
  const totalCents = calculateLotTotalCents(containers);
  const amountPaid = Number(initialPayment) || 0;
  const amountPaidCents = Math.round(amountPaid * 100);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const lot = await createLot.mutateAsync({
        proveedorId: supplierId,
        contenedores: values.contenedores.map((item) => ({
          tipoCepa: item.tipoCepa.trim(),
          unidadBase: item.unidadBase.trim(),
          presentacionId: item.presentacionId?.trim() || undefined,
          capacidadUnidadesBase: item.capacidadUnidadesBase,
          costoBasePorUnidad: item.costoBasePorUnidad,
        })),
        abonoInicial: values.abonoInicial,
      });
      form.reset({
        contenedores: [{
          tipoCepa: '',
          unidadBase: 'gramo',
          presentacionId: '',
          capacidadUnidadesBase: 1,
          costoBasePorUnidad: 0.01,
        }],
        abonoInicial: undefined,
      });
      onCreated(lot);
    } catch {
      // Mutation errors are shown in the form below.
    }
  }, (errors) => {
    fields.forEach((field, index) => {
      if (errors.contenedores?.[index]) {
        const card = containerCards.current.get(field.id);
        if (card) card.open = true;
      }
    });
  });

  return (
    <Card className="hu-overflow-hidden">
      <div className="hu-border-b hu-border-slate-100 hu-p-5">
        <h2 className="hu-m-0 hu-flex hu-items-center hu-gap-2 hu-text-lg hu-font-bold"><PackagePlus size={19} className="hu-text-blue-700" /> Recibir lote</h2>
        <p className="hu-mb-0 hu-mt-1 hu-text-sm hu-text-slate-500">El servidor genera el código del lote. La capacidad se registra en la unidad base indicada.</p>
      </div>
      <form className="hu-grid hu-gap-5 hu-p-5" onSubmit={onSubmit} noValidate>
        <div className="hu-grid hu-gap-3">
          <div className="hu-flex hu-items-center hu-justify-between">
            <h3 className="hu-m-0 hu-text-sm hu-font-bold">Contenedores</h3>
            <Button type="button" variant="secondary" className="hu-px-3 hu-py-2 hu-text-xs" onClick={() => append({
              tipoCepa: '',
              unidadBase: 'gramo',
              presentacionId: '',
              capacidadUnidadesBase: 1,
              costoBasePorUnidad: 0.01,
            })}>
              <Plus size={14} /> Agregar
            </Button>
          </div>
          {fields.map((field, index) => (
            <details className="hu-rounded-xl hu-border hu-border-slate-200 hu-bg-slate-50 hu-p-3" key={field.id} open
              ref={(node) => {
                if (node) containerCards.current.set(field.id, node);
                else containerCards.current.delete(field.id);
              }}>
              <summary className="hu-cursor-pointer hu-rounded hu-text-sm hu-font-semibold focus-visible:hu-outline-none focus-visible:hu-ring-2 focus-visible:hu-ring-green-500">
                {containers[index]?.tipoCepa?.trim() || `Contenedor ${index + 1}`}
                {containerSchema.safeParse(containers[index]).success && (
                  <span className="hu-ml-2 hu-inline-flex hu-items-center hu-gap-1 hu-text-green-700">
                    <Check size={17} aria-hidden="true" /> Datos completos
                  </span>
                )}
              </summary>
              <div className="hu-mt-3 hu-grid hu-items-start hu-gap-3 sm:hu-grid-cols-2">
              <Field label="Tipo / cepa" error={form.formState.errors.contenedores?.[index]?.tipoCepa?.message}>
                <Input {...form.register(`contenedores.${index}.tipoCepa`)} placeholder="Sativa Premium" />
              </Field>
              <Field label="Unidad base" error={form.formState.errors.contenedores?.[index]?.unidadBase?.message} hint="Ejemplo: gramo">
                <Input {...form.register(`contenedores.${index}.unidadBase`)} placeholder="gramo" />
              </Field>
              <Field label="Capacidad (unidad base)" error={form.formState.errors.contenedores?.[index]?.capacidadUnidadesBase?.message}>
                <Input type="number" min="0.001" step="0.001" {...form.register(`contenedores.${index}.capacidadUnidadesBase`, { valueAsNumber: true })} />
              </Field>
              <Field label="Costo por unidad base" error={form.formState.errors.contenedores?.[index]?.costoBasePorUnidad?.message}>
                <Input type="number" min="0.01" step="0.01" {...form.register(`contenedores.${index}.costoBasePorUnidad`, { valueAsNumber: true })} />
              </Field>
              <Field label="ID de presentación (opcional)" error={form.formState.errors.contenedores?.[index]?.presentacionId?.message}>
                <Input {...form.register(`contenedores.${index}.presentacionId`)} placeholder="ID de presentación" />
              </Field>
              <div className="hu-flex hu-items-end hu-justify-between hu-gap-3">
                <p className="hu-mb-2 hu-text-sm hu-text-slate-600">
                  Subtotal: <strong>{formatCop(centsToAmount(calculateContainerSubtotalCents(containers[index] ?? {
                    capacidadUnidadesBase: 0,
                    costoBasePorUnidad: 0,
                  })))}</strong>
                </p>
                <Button type="button" variant="ghost" aria-label={`Eliminar contenedor ${index + 1}`} disabled={fields.length === 1} className="hu-mb-1 hu-p-2 hu-text-red-700" onClick={() => remove(index)}>
                  <Trash2 size={17} />
                </Button>
                </div>
              </div>
            </details>
          ))}
          {form.formState.errors.contenedores?.message && <p className="hu-m-0 hu-text-xs hu-text-red-700" role="alert">{form.formState.errors.contenedores.message}</p>}
        </div>

        <Field label="Abono inicial (opcional)" error={form.formState.errors.abonoInicial?.message} hint="No puede ser mayor al total del lote.">
          <Input type="number" min="0" step="0.01" placeholder="0" {...form.register('abonoInicial', { valueAsNumber: true })} />
        </Field>

        <div className="hu-grid hu-gap-2 hu-rounded-xl hu-bg-slate-900 hu-p-4 hu-text-white sm:hu-grid-cols-3">
          <p className="hu-m-0 hu-text-sm hu-text-slate-300">Total del lote<span className="hu-mt-1 hu-block hu-text-lg hu-font-bold hu-text-white">{formatCop(centsToAmount(totalCents))}</span></p>
          <p className="hu-m-0 hu-text-sm hu-text-slate-300">Abono inicial<span className="hu-mt-1 hu-block hu-text-lg hu-font-bold hu-text-white">{formatCop(amountPaid)}</span></p>
          <p className="hu-m-0 hu-text-sm hu-text-slate-300">Saldo tras recibirlo<span className="hu-mt-1 hu-block hu-text-lg hu-font-bold hu-text-white">{formatCop(centsToAmount(totalCents - BigInt(amountPaidCents) > 0n ? totalCents - BigInt(amountPaidCents) : 0n))}</span></p>
        </div>
        <div className="hu-grid hu-gap-2 hu-rounded-xl hu-border hu-border-blue-100 hu-bg-blue-50 hu-p-4 sm:hu-grid-cols-3">
          <p className="hu-m-0 hu-text-sm hu-text-blue-900">Nueva deuda<span className="hu-mt-1 hu-block hu-font-bold">{formatCop(supplier.totalDeuda + centsToAmount(totalCents))}</span></p>
          <p className="hu-m-0 hu-text-sm hu-text-blue-900">Nuevo total pagado<span className="hu-mt-1 hu-block hu-font-bold">{formatCop(supplier.totalPagado + amountPaid)}</span></p>
          <p className="hu-m-0 hu-text-sm hu-text-blue-900">Nuevo saldo pendiente<span className="hu-mt-1 hu-block hu-font-bold">{formatCop(supplier.saldoPendiente + centsToAmount(totalCents) - amountPaid)}</span></p>
          <p className="hu-m-0 hu-text-xs hu-text-blue-800 sm:hu-col-span-3">Previsualización; los saldos confirmados por el servidor se mostrarán al guardar.</p>
        </div>
        {createLot.isError && <ErrorNotice>{getApiErrorMessage(createLot.error)}</ErrorNotice>}
        <Button type="submit" disabled={createLot.isPending}>
          <PackagePlus size={17} /> {createLot.isPending ? 'Guardando lote…' : 'Guardar lote'}
        </Button>
      </form>
    </Card>
  );
}

function PaymentForm({ supplier, onPaid }: { supplier: SupplierResponse; onPaid: () => void }) {
  const registerPayment = useRegisterPayment(supplier.id);
  const schema = useMemo(() => paymentSchemaForBalance(supplier.saldoPendiente), [supplier.saldoPendiente]);
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { monto: undefined, loteId: '', tipo: 'ABONO', observaciones: '' },
  });
  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await registerPayment.mutateAsync({
        monto: values.monto,
        loteId: values.loteId?.trim() || undefined,
        tipo: values.tipo,
        observaciones: values.observaciones?.trim() || undefined,
      });
      form.reset({ monto: undefined, loteId: '', tipo: 'ABONO', observaciones: '' });
      onPaid();
    } catch {
      // Mutation errors are shown in the form below.
    }
  });

  return (
    <Card className="hu-overflow-hidden">
      <div className="hu-border-b hu-border-slate-100 hu-p-5">
        <h2 className="hu-m-0 hu-flex hu-items-center hu-gap-2 hu-text-lg hu-font-bold"><Wallet size={19} className="hu-text-blue-700" /> Registrar abono</h2>
        <p className="hu-mb-0 hu-mt-1 hu-text-sm hu-text-slate-500">El saldo pendiente disponible es {formatCop(supplier.saldoPendiente)}.</p>
      </div>
      <form className="hu-grid hu-gap-4 hu-p-5" onSubmit={onSubmit} noValidate>
        <Field label="Monto" error={form.formState.errors.monto?.message}>
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
        {registerPayment.isError && <ErrorNotice>{getApiErrorMessage(registerPayment.error)}</ErrorNotice>}
        <Button type="submit" disabled={registerPayment.isPending || supplier.saldoPendiente <= 0}>
          <CircleDollarSign size={17} /> {registerPayment.isPending ? 'Registrando…' : 'Registrar pago'}
        </Button>
      </form>
    </Card>
  );
}

function SupplierDetailPage({ supplierId }: { supplierId: string }) {
  const { data: supplier, isPending, isError, error, refetch } = useSupplier(supplierId);
  const [lots, setLots] = useState<LotResponse[]>([]);
  const [lotIds, setLotIds] = useState<string[]>([]);
  const [lookupLotId, setLookupLotId] = useState('');
  const [feedback, setFeedback] = useState('');
  const [activeSection, setActiveSection] = useState<'reception' | 'payment' | 'lots' | 'history' | null>(null);
  const navigate = useNavigate();

  if (!positiveId.test(supplierId)) {
    return <PageShell detail><ErrorNotice>El ID del proveedor no tiene un formato válido.</ErrorNotice></PageShell>;
  }
  if (isPending) {
    return <PageShell detail><p className="hu-text-sm hu-text-slate-600" role="status">Cargando información del proveedor…</p></PageShell>;
  }
  if (isError || !supplier) {
    return (
      <PageShell detail>
        <div className="hu-max-w-2xl hu-grid hu-gap-4">
          <ErrorNotice>{getApiErrorMessage(error)}</ErrorNotice>
          <div className="hu-flex hu-gap-3">
            <Button variant="secondary" onClick={() => void refetch()}>Reintentar</Button>
            <Button variant="ghost" onClick={() => navigate('/admin/proveedores')}>Volver</Button>
          </div>
        </div>
      </PageShell>
    );
  }

  const isPaidOff = supplier.saldoPendiente === 0;
  return (
    <PageShell detail>
      <PageTitle
        eyebrow={`Proveedor · ${supplier.nit}`}
        title={supplier.nombre}
        description={`Consulta los saldos, recibe nuevos lotes y registra pagos para ${supplier.nombre}.`}
      />
      <div className="hu-mb-6 hu-flex hu-flex-wrap hu-items-center hu-justify-between hu-gap-3">
        <div className="hu-flex hu-flex-wrap hu-items-center hu-gap-2">
          <Badge tone={supplier.estado === 'ACTIVO' ? 'green' : 'neutral'}>{supplier.estado}</Badge>
          <Badge tone={isPaidOff ? 'green' : 'orange'}>{isPaidOff ? 'En Paz y Salvo' : 'Con Saldo Pendiente'}</Badge>
        </div>
        <div className="hu-text-right hu-text-sm hu-text-slate-500">
          <p className="hu-m-0">{supplier.contacto?.telefono || 'Sin teléfono'}{supplier.contacto?.email ? ` · ${supplier.contacto.email}` : ''}</p>
          <p className="hu-mb-0 hu-mt-1">ID: <code className="hu-select-all hu-rounded hu-bg-slate-100 hu-px-1.5 hu-py-0.5 hu-text-xs hu-text-slate-700">{supplier.id}</code></p>
        </div>
      </div>

      <section className="hu-mb-8 hu-grid hu-gap-4 md:hu-grid-cols-2 xl:hu-grid-cols-4" aria-label="Resumen de saldos">
        <SummaryCard title="Total Deuda" amount={supplier.totalDeuda} icon={<BadgeDollarSign size={20} />} />
        <SummaryCard title="Total Pagado" amount={supplier.totalPagado} icon={<Check size={20} />} emphasis="blue" />
        <SummaryCard title="Saldo Pendiente" amount={supplier.saldoPendiente} icon={<Wallet size={20} />} emphasis={isPaidOff ? 'blue' : 'orange'} />
        <Card className="hu-p-5">
          <div className="hu-flex hu-items-start hu-justify-between hu-gap-3">
            <h2 className="hu-m-0 hu-text-sm hu-font-medium hu-text-slate-500">Estado de pago de lotes</h2>
            <span className="hu-flex hu-h-10 hu-w-10 hu-shrink-0 hu-items-center hu-justify-center hu-rounded-xl hu-bg-slate-100 hu-text-slate-700">
              <PackagePlus size={20} aria-hidden="true" />
            </span>
          </div>
          {typeof supplier.lotesPagados === 'number' && Number.isSafeInteger(supplier.lotesPagados) && supplier.lotesPagados >= 0
            && typeof supplier.lotesPorPagar === 'number' && Number.isSafeInteger(supplier.lotesPorPagar) && supplier.lotesPorPagar >= 0 ? (
            <dl className="hu-mb-0 hu-mt-2 hu-grid hu-grid-cols-2 hu-gap-3">
              <div>
                <dt className="hu-text-xs hu-text-slate-500">Lotes pagados</dt>
                <dd className="hu-m-0 hu-text-2xl hu-font-bold hu-text-green-700">{supplier.lotesPagados}</dd>
              </div>
              <div>
                <dt className="hu-text-xs hu-text-slate-500">Lotes por pagar</dt>
                <dd className="hu-m-0 hu-text-2xl hu-font-bold hu-text-orange-700">{supplier.lotesPorPagar}</dd>
              </div>
            </dl>
          ) : (
            <ErrorNotice>La API no devolvió conteos válidos de lotes pagados y por pagar.</ErrorNotice>
          )}
        </Card>
      </section>

      <nav className="hu-mb-6 hu-grid hu-gap-3 sm:hu-grid-cols-2 xl:hu-grid-cols-4" aria-label="Acciones del proveedor">
        {([
          { id: 'reception', label: 'Recibir lote', icon: PackagePlus },
          { id: 'payment', label: 'Registrar un abono', icon: Wallet },
          { id: 'lots', label: 'Buscar un lote', icon: Search },
          { id: 'history', label: 'Ver histórico de abonos', icon: History },
        ] as const).map(({ id, label, icon: Icon }) => (
          <Button key={id} type="button" id={`supplier-action-${id}`}
            variant={activeSection === id ? 'primary' : 'secondary'}
            aria-expanded={activeSection === id} aria-controls={`supplier-section-${id}`}
            onClick={() => setActiveSection((current) => current === id ? null : id)}>
            <Icon size={19} aria-hidden="true" /> {label}
          </Button>
        ))}
      </nav>

      {feedback && <div className="hu-mb-6 hu-rounded-lg hu-border hu-border-green-200 hu-bg-green-50 hu-p-3 hu-text-sm hu-text-green-900" role="status">{feedback}</div>}
      <section id="supplier-section-reception" aria-labelledby="supplier-action-reception" hidden={activeSection !== 'reception'}>
        {supplier.estado === 'ACTIVO' ? (
          <LotForm supplier={supplier} onCreated={(lot) => {
            setLots((current) => [lot, ...current]);
            setLotIds((current) => [lot.id, ...current.filter((id) => id !== lot.id)]);
            setFeedback(`Lote ${lot.codigoLote} registrado; los saldos se actualizaron con los valores confirmados por el servidor.`);
          }} />
        ) : (
          <Card className="hu-p-5"><ErrorNotice>No se pueden recibir lotes porque este proveedor está inactivo.</ErrorNotice></Card>
        )}
      </section>
      <section id="supplier-section-payment" aria-labelledby="supplier-action-payment" hidden={activeSection !== 'payment'}>
        <PaymentForm supplier={supplier} onPaid={() => {
          setFeedback('Pago registrado y saldos del proveedor actualizados.');
        }} />
      </section>

      <section id="supplier-section-lots" aria-labelledby="supplier-action-lots" hidden={activeSection !== 'lots'}>
        <div className="hu-mb-4 hu-flex hu-flex-wrap hu-items-end hu-justify-between hu-gap-2">
          <div>
            <h2 className="hu-m-0 hu-text-xl hu-font-bold">Lotes y tope de liquidación</h2>
            <p className="hu-mb-0 hu-mt-1 hu-text-sm hu-text-slate-500">Busca los lotes del proveedor por cepa, presentación o SKU y desglosa sus contenedores. Se incluyen lotes saldados e históricos.</p>
          </div>
          <Badge tone="blue">Recepción y empaquetado separados</Badge>
        </div>
        <SupplierLotsList key={supplier.id} supplierId={supplier.id}
          renderLot={(lot) => <LotCard lot={lot} supplierId={supplier.id} supplierPaidOff={isPaidOff} />} />
        <details className="hu-mt-5">
          <summary className="hu-cursor-pointer hu-text-sm hu-font-semibold">Consulta directa por ID del lote</summary>
        <form className="hu-mb-4 hu-flex hu-flex-wrap hu-items-end hu-gap-3" onSubmit={(event) => {
          event.preventDefault();
          const id = lookupLotId.trim();
          if (positiveId.test(id)) setLotIds((current) => [id, ...current.filter((item) => item !== id)]);
        }}>
          <Field label="ID del lote a consultar"><Input value={lookupLotId} onChange={(event) => setLookupLotId(event.target.value)} /></Field>
          <Button type="submit" disabled={!positiveId.test(lookupLotId.trim())}>Consultar lote</Button>
        </form>
        {lotIds.length ? (
          <div className="hu-grid hu-gap-4">
            {lotIds.map((id) => <ConsultedLot key={id} lotId={id} supplierId={supplier.id} supplierPaidOff={isPaidOff} />)}
          </div>
        ) : (
          <Card className="hu-p-8 hu-text-center">
            <PackagePlus className="hu-mx-auto hu-mb-3 hu-text-slate-400" size={28} aria-hidden="true" />
            <p className="hu-m-0 hu-text-sm hu-text-slate-600">Ingresa un ID para consultar un lote directamente.</p>
          </Card>
        )}
        </details>
      </section>

      <section id="supplier-section-history" aria-labelledby="supplier-action-history" hidden={activeSection !== 'history'}>
        <div className="hu-mb-4">
          <h2 className="hu-m-0 hu-text-xl hu-font-bold">Historial de abonos</h2>
          <p className="hu-mb-0 hu-mt-1 hu-text-sm hu-text-slate-500">
            Los movimientos más recientes aparecen primero, con hasta 50 por página. Los abonos FIFO pueden aparecer en varias filas, una por cada lote al que se asignaron.
          </p>
        </div>
        <SupplierPaymentsTable key={supplier.id} supplierId={supplier.id} supplierName={supplier.nombre} lots={lots} />
      </section>
    </PageShell>
  );
}

export default function SupplierManagementPage() {
  const { id } = useParams<{ id: string }>();
  return id ? <SupplierDetailPage key={id} supplierId={id} /> : <SupplierEntryPage />;
}
