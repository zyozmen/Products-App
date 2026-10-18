import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  BadgeDollarSign,
  Building2,
  Check,
  CircleDollarSign,
  PackagePlus,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
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
} from './hooks';
import {
  liquidationSchema,
  lotSchema,
  paymentSchemaForBalance,
  supplierSchema,
  type LiquidationFormValues,
  type LotFormInput,
  type LotFormValues,
  type PaymentFormValues,
  type SupplierFormValues,
} from './schemas';
import { getApiErrorMessage } from './service';
import type { LiquidationEvaluation, LotResponse, SupplierResponse } from './types';
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

function PageTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="hu-mb-6">
      <h1 className="hu-m-0 hu-text-3xl hu-font-bold hu-tracking-tight">{title}</h1>
      <p className="hu-mb-0 hu-mt-2 hu-max-w-3xl hu-text-sm hu-text-slate-500">{description}</p>
    </div>
  );
}

function SupplierEntryPage() {
  const navigate = useNavigate();
  const createSupplier = useCreateSupplier();
  const [lookupId, setLookupId] = useState('');
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

  const onLookup = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = lookupId.trim();
    if (positiveId.test(id)) navigate(`/admin/proveedores/${id}`);
  };

  return (
    <PageShell>
      <PageTitle
        eyebrow="Administración Proveedores"
        title="Proveedores y saldos"
        description="Consulta el estado financiero de tus proveedores, registra ingresos de lotes y controla los abonos."
      />
      <div className="hu-grid hu-items-start hu-gap-6 lg:hu-grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
        <Card className="hu-overflow-hidden kanban-board">
          <div className="hu-border-b hu-border-slate-100 hu-p-6">
            <span className="hu-mb-4 hu-flex hu-h-11 hu-w-11 hu-items-center hu-justify-center hu-rounded-xl hu-bg-blue-50 hu-text-blue-700"><Search size={21} /></span>
            <h2 className="hu-mb-1 hu-text-lg hu-font-bold">Consultar proveedor</h2>
            <p className="hu-m-0 hu-text-sm hu-text-slate-500">Ingresa el ID de 24 caracteres del proveedor para ver sus saldos.</p>
          </div>
          <form className="hu-grid hu-gap-4 hu-p-6" onSubmit={onLookup}>
            <Field label="ID del proveedor" hint="El identificador se muestra al crear el proveedor.">
              <Input
                value={lookupId}
                onChange={(event) => setLookupId(event.target.value)}
                placeholder="60d5ecb8f1d2c2a4c8e9a010"
                maxLength={24}
                aria-label="ID del proveedor"
              />
            </Field>
            {lookupId.trim() && !positiveId.test(lookupId.trim()) && (
              <p className="hu-m-0 hu-text-xs hu-text-red-700" role="alert">El ID debe tener 24 caracteres hexadecimales.</p>
            )}
            <Button type="submit" disabled={!positiveId.test(lookupId.trim())} className="hu-w-full sm:hu-w-fit">
              Consultar saldos
            </Button>
          </form>
        </Card>

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
        <p className="hu-m-0 hu-text-sm"><span className="hu-block hu-text-xs hu-text-slate-500">Presentaciones</span>{lot.presentaciones.length}</p>
      </div>

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

function LotForm({ supplierId, onCreated }: { supplierId: string; onCreated: (lot: LotResponse) => void }) {
  const createLot = useCreateLot(supplierId);
  const form = useForm<LotFormInput, unknown, LotFormValues>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      codigoLote: '',
      presentaciones: [{ presentacionId: '', cantidadUnidades: 1, costoUnitario: 0.01 }],
      abonoInicial: undefined,
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'presentaciones' });
  const presentations = useWatch({ control: form.control, name: 'presentaciones' }) ?? [];
  const initialPayment = useWatch({ control: form.control, name: 'abonoInicial' }) ?? 0;
  const total = presentations.reduce((sum, item) =>
    sum + Math.round((Number(item?.costoUnitario) || 0) * 100) * (Number(item?.cantidadUnidades) || 0), 0,
  ) / 100;
  const amountPaid = Number(initialPayment) || 0;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const lot = await createLot.mutateAsync({
        proveedorId: supplierId,
        codigoLote: values.codigoLote.trim(),
        presentaciones: values.presentaciones.map((item) => ({
          ...item,
          presentacionId: item.presentacionId.trim(),
        })),
        abonoInicial: values.abonoInicial,
      });
      form.reset({
        codigoLote: '',
        presentaciones: [{ presentacionId: '', cantidadUnidades: 1, costoUnitario: 0.01 }],
        abonoInicial: undefined,
      });
      onCreated(lot);
    } catch {
      // Mutation errors are shown in the form below.
    }
  });

  return (
    <Card className="hu-overflow-hidden">
      <div className="hu-border-b hu-border-slate-100 hu-p-5">
        <h2 className="hu-m-0 hu-flex hu-items-center hu-gap-2 hu-text-lg hu-font-bold"><PackagePlus size={19} className="hu-text-blue-700" /> Recibir lote</h2>
        <p className="hu-mb-0 hu-mt-1 hu-text-sm hu-text-slate-500">El costo y el abono se aplicarán al saldo del proveedor al guardar.</p>
      </div>
      <form className="hu-grid hu-gap-5 hu-p-5" onSubmit={onSubmit} noValidate>
        <Field label="Código del lote" error={form.formState.errors.codigoLote?.message}>
          <Input {...form.register('codigoLote')} placeholder="LOT-2026-001" />
        </Field>

        <div className="hu-grid hu-gap-3">
          <div className="hu-flex hu-items-center hu-justify-between">
            <h3 className="hu-m-0 hu-text-sm hu-font-bold">Presentaciones</h3>
            <Button type="button" variant="secondary" className="hu-px-3 hu-py-2 hu-text-xs" onClick={() => append({ presentacionId: '', cantidadUnidades: 1, costoUnitario: 0.01 })}>
              <Plus size={14} /> Agregar
            </Button>
          </div>
          {fields.map((field, index) => (
            <div className="hu-grid hu-items-start hu-gap-3 hu-rounded-xl hu-border hu-border-slate-200 hu-bg-slate-50 hu-p-3 sm:hu-grid-cols-[minmax(120px,1.2fr)_minmax(90px,0.7fr)_minmax(110px,1fr)_auto]" key={field.id}>
              <Field label="Presentación" error={form.formState.errors.presentaciones?.[index]?.presentacionId?.message}>
                <Input {...form.register(`presentaciones.${index}.presentacionId`)} placeholder="PRES-01" />
              </Field>
              <Field label="Cantidad" error={form.formState.errors.presentaciones?.[index]?.cantidadUnidades?.message}>
                <Input type="number" min="1" step="1" {...form.register(`presentaciones.${index}.cantidadUnidades`, { valueAsNumber: true })} />
              </Field>
              <Field label="Costo unitario" error={form.formState.errors.presentaciones?.[index]?.costoUnitario?.message}>
                <Input type="number" min="0.01" step="0.01" {...form.register(`presentaciones.${index}.costoUnitario`, { valueAsNumber: true })} />
              </Field>
              <Button type="button" variant="ghost" aria-label={`Eliminar presentación ${index + 1}`} disabled={fields.length === 1} className="hu-mt-6 hu-p-2 hu-text-red-700" onClick={() => remove(index)}>
                <Trash2 size={17} />
              </Button>
            </div>
          ))}
          {form.formState.errors.presentaciones?.message && <p className="hu-m-0 hu-text-xs hu-text-red-700" role="alert">{form.formState.errors.presentaciones.message}</p>}
        </div>

        <Field label="Abono inicial (opcional)" error={form.formState.errors.abonoInicial?.message} hint="No puede ser mayor al total del lote.">
          <Input type="number" min="0" step="0.01" placeholder="0" {...form.register('abonoInicial', { valueAsNumber: true })} />
        </Field>

        <div className="hu-grid hu-gap-2 hu-rounded-xl hu-bg-slate-900 hu-p-4 hu-text-white sm:hu-grid-cols-3">
          <p className="hu-m-0 hu-text-sm hu-text-slate-300">Total del lote<span className="hu-mt-1 hu-block hu-text-lg hu-font-bold hu-text-white">{formatCop(total)}</span></p>
          <p className="hu-m-0 hu-text-sm hu-text-slate-300">Abono inicial<span className="hu-mt-1 hu-block hu-text-lg hu-font-bold hu-text-white">{formatCop(amountPaid)}</span></p>
          <p className="hu-m-0 hu-text-sm hu-text-slate-300">Saldo tras recibirlo<span className="hu-mt-1 hu-block hu-text-lg hu-font-bold hu-text-white">{formatCop(Math.max(0, total - amountPaid))}</span></p>
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
  const [lotsStale, setLotsStale] = useState(false);
  const [feedback, setFeedback] = useState('');
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

      <section className="hu-mb-8 hu-grid hu-gap-4 md:hu-grid-cols-3" aria-label="Resumen de saldos">
        <SummaryCard title="Total Deuda" amount={supplier.totalDeuda} icon={<BadgeDollarSign size={20} />} />
        <SummaryCard title="Total Pagado" amount={supplier.totalPagado} icon={<Check size={20} />} emphasis="blue" />
        <SummaryCard title="Saldo Pendiente" amount={supplier.saldoPendiente} icon={<Wallet size={20} />} emphasis={isPaidOff ? 'blue' : 'orange'} />
      </section>

      {feedback && <div className="hu-mb-6 hu-rounded-lg hu-border hu-border-green-200 hu-bg-green-50 hu-p-3 hu-text-sm hu-text-green-900" role="status">{feedback}</div>}
      <div className="hu-grid hu-items-start hu-gap-6 xl:hu-grid-cols-2">
        {supplier.estado === 'ACTIVO' ? (
          <LotForm supplierId={supplier.id} onCreated={(lot) => {
            setLots((current) => [lot, ...current]);
            setLotsStale(false);
            setFeedback('Lote registrado; el resumen de saldos se actualizó con los valores confirmados por el servidor.');
          }} />
        ) : (
          <Card className="hu-p-5"><ErrorNotice>No se pueden recibir lotes porque este proveedor está inactivo.</ErrorNotice></Card>
        )}
        <PaymentForm supplier={supplier} onPaid={() => {
          setLots([]);
          setLotsStale(true);
          setFeedback('Pago registrado y saldos del proveedor actualizados.');
        }} />
      </div>

      <section className="hu-mt-9">
        <div className="hu-mb-4 hu-flex hu-flex-wrap hu-items-end hu-justify-between hu-gap-2">
          <div>
            <h2 className="hu-m-0 hu-text-xl hu-font-bold">Lotes y tope de liquidación</h2>
            <p className="hu-mb-0 hu-mt-1 hu-text-sm hu-text-slate-500">Los lotes recibidos durante esta sesión se muestran aquí; la API aún no documenta un endpoint para consultar el historial.</p>
          </div>
          <Badge tone="blue">Inventario: no se modifica desde este módulo</Badge>
        </div>
        {lotsStale ? (
          <Card className="hu-p-5">
            <p className="hu-m-0 hu-text-sm hu-text-orange-900">Se ocultó el saldo por lote después del pago para evitar mostrar datos desactualizados. La API no ofrece una consulta para recuperar esos saldos.</p>
          </Card>
        ) : lots.length ? (
          <div className="hu-grid hu-gap-4">
            {lots.map((lot) => <LotCard key={lot.id} lot={lot} supplierId={supplier.id} supplierPaidOff={isPaidOff} />)}
          </div>
        ) : (
          <Card className="hu-p-8 hu-text-center">
            <PackagePlus className="hu-mx-auto hu-mb-3 hu-text-slate-400" size={28} aria-hidden="true" />
            <p className="hu-m-0 hu-text-sm hu-text-slate-600">Todavía no has recibido lotes en esta sesión.</p>
          </Card>
        )}
      </section>
    </PageShell>
  );
}

export default function SupplierManagementPage() {
  const { id } = useParams<{ id: string }>();
  return id ? <SupplierDetailPage supplierId={id} /> : <SupplierEntryPage />;
}
