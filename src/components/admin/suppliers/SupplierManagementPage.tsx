import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  BadgeDollarSign,
  Building2,
  Check,
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
import { useRef, useState } from 'react';
import HeaderComponent from '../../dashboard/HeaderComponent.jsx';
import AdminNav from '../AdminNav.jsx';
import FooterComponent from '../../dashboard/FooterComponent.jsx';
import navigationComponent from '../../navigation/NavigationComponent.jsx';
import {
  useCreateLot,
  useCreateSupplier,
  useSupplier,
  useLot,
} from '../../../hooks/useSupplierQueries';
import { calculateContainerSubtotalCents, calculateLotTotalCents, centsToAmount } from '../../../utils/supplierCalculations';
import { containerUsedCapacity, decimalText, decimalUnits } from '../../../utils/packagingCalculations';
import { orderDateFormatter } from '../../../utils/displayDate';
import {
  containerSchema,
  lotSchema,
  supplierSchema,
  type LotFormInput,
  type LotFormValues,
  type SupplierFormValues,
} from '../../../schemas/supplier';
import { getApiErrorMessage } from '../../../services/supplierService';
import { useAllCepas } from '../../../hooks/useMarketplaceQueries';
import SupplierSearch from './SupplierSearch';
import type { LotResponse, SupplierResponse } from '../../../Interfaces/supplier';
import SupplierPaymentsTable from './SupplierPaymentsTable';
import SupplierLotsList from './SupplierLotsList';
import DesgloseContenedorForm from './DesgloseContenedorForm';
import SupplierPaymentForm from './SupplierPaymentForm';
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
  supplierPaidOff,
}: {
  lot: LotResponse;
  supplierPaidOff: boolean;
}) {
  const [containerId, setContainerId] = useState<string | null>(null);
  const lotSettled = lot.saldoPendienteLote === 0;
  const isCapped = lotSettled || supplierPaidOff;
  const containers = (lot.contenedores ?? []).map((container) => {
    const remaining = decimalUnits(container.capacidadUnidadesBase) - containerUsedCapacity(container);
    return { container, remaining: remaining > 0n ? remaining : 0n };
  });
  const pendingByUnit = new Map<string, bigint>();
  for (const { container, remaining } of containers) {
    pendingByUnit.set(container.unidadBase, (pendingByUnit.get(container.unidadBase) ?? 0n) + remaining);
  }

  return (
    <Card className="hu-overflow-hidden hu-p-5">
      <div className="hu-flex hu-flex-wrap hu-items-start hu-justify-between hu-gap-3">
        <div>
          <div className="hu-mb-2 hu-flex hu-flex-wrap hu-items-center hu-gap-2">
            <h3 className="hu-m-0 hu-text-base hu-font-bold">{lot.codigoLote}</h3>
            {lot.estado && <Badge tone="blue">{lot.estado}</Badge>}
            <Badge tone={lot.estadoPago === 'PAGADO_TOTAL' ? 'green' : lot.estadoPago === 'PAGO_PARCIAL' ? 'orange' : 'neutral'}>{lot.estadoPago.replaceAll('_', ' ')}</Badge>
          </div>
          <p className="hu-m-0 hu-text-sm hu-text-slate-500">Recibido {orderDateFormatter.format(new Date(lot.fechaIngreso))}</p>
        </div>
        <div className="hu-text-right">
          <p className="hu-m-0 hu-text-sm hu-text-slate-500">Saldo del lote</p>
          <p className="hu-m-0 hu-text-lg hu-font-bold">{formatCop(lot.saldoPendienteLote)}</p>
        </div>
      </div>
      <div className="hu-mt-5 hu-grid hu-gap-4 md:hu-grid-cols-2">
        <section aria-label="Pendiente por empaquetar" className="hu-rounded-xl hu-border hu-border-orange-200 hu-bg-orange-50 hu-p-5">
          <h4 className="hu-m-0 hu-text-sm hu-font-semibold hu-text-orange-900">Falta empaquetar</h4>
          {pendingByUnit.size ? [...pendingByUnit].map(([unit, remaining]) => (
            <p key={unit} className="hu-mb-0 hu-mt-2 hu-text-2xl hu-font-bold hu-text-orange-900">
              {decimalText(remaining)} <span className="hu-text-base hu-font-medium">{unit}</span>
            </p>
          )) : <p className="hu-mb-0 hu-mt-2 hu-text-sm hu-text-orange-900">Sin detalle de contenedores</p>}
        </section>
        <section aria-label="Costo total empaquetado" className="hu-rounded-xl hu-border hu-border-green-200 hu-bg-green-50 hu-p-5">
          <h4 className="hu-m-0 hu-text-sm hu-font-semibold hu-text-green-900">Costo total empaquetado</h4>
          <p className="hu-mb-0 hu-mt-2 hu-text-2xl hu-font-bold hu-text-green-900">
            {lot.costoTotalEmpaquetado !== undefined ? formatCop(lot.costoTotalEmpaquetado) : 'No informado'}
          </p>
          <p className="hu-mb-0 hu-mt-2 hu-text-xs hu-text-green-800">El costo de recepción y la deuda no cambian.</p>
        </section>
      </div>
      <div className="hu-my-4 hu-grid hu-gap-3 hu-border-y hu-border-slate-100 hu-py-3 sm:hu-grid-cols-3">
        <p className="hu-m-0 hu-text-sm"><span className="hu-block hu-text-xs hu-text-slate-500">Costo total</span>{formatCop(lot.costoTotalLote)}</p>
        <p className="hu-m-0 hu-text-sm"><span className="hu-block hu-text-xs hu-text-slate-500">Abonado</span>{formatCop(lot.montoPagadoLote)}</p>
        <p className="hu-m-0 hu-text-sm"><span className="hu-block hu-text-xs hu-text-slate-500">Contenedores</span>{lot.contenedores?.length ?? 0}</p>
      </div>

      {containers.length ? (
        <div className="hu-mb-4 hu-grid hu-gap-3">
          {containers.map(({ container, remaining }, index) => (
            <details open={index === 0} className="hu-rounded-xl hu-border hu-border-slate-200 hu-bg-slate-50 hu-p-4 hu-text-sm" key={container.id}>
              <summary className="hu-cursor-pointer hu-rounded hu-font-medium focus-visible:hu-outline-none focus-visible:hu-ring-2 focus-visible:hu-ring-green-500">
                <span>{container.codigoContenedor ?? container.id} · {container.tipoCepa} · {container.capacidadUnidadesBase} {container.unidadBase}</span>
                <span className={`hu-mt-2 hu-block hu-text-base hu-font-bold ${remaining > 0n ? 'hu-text-orange-800' : 'hu-text-green-800'}`}>
                  {remaining > 0n ? `Falta empaquetar: ${decimalText(remaining)} ${container.unidadBase}` : 'Empaquetado completo'}
                </span>
              </summary>
              <div className="hu-mt-3 hu-flex hu-flex-wrap hu-items-center hu-justify-between hu-gap-2">
                <span>Costo de recepción: {formatCop(container.subtotal)}</span>
                <Button type="button" variant="secondary" onClick={() => setContainerId(containerId === container.id ? null : container.id)}>
                  {containerId === container.id ? 'Cerrar desglose' : remaining > 0n ? 'Desglosar contenedor' : 'Ver desglose'}
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
      ) : null}
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
    <LotCard lot={data} supplierPaidOff={supplierPaidOff} />
  </div>;
}

function LotForm({ supplier, onCreated }: { supplier: SupplierResponse; onCreated: (lot: LotResponse) => void }) {
  const supplierId = supplier.id;
  const createLot = useCreateLot(supplierId);
  const cepasQuery = useAllCepas();
  const cepas = cepasQuery.data ?? [];
  const form = useForm<LotFormInput, unknown, LotFormValues>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      contenedores: [{
        cepaId: '',
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
  const [pendingRemoval, setPendingRemoval] = useState<number | null>(null);
  const confirmRemoval = () => {
    if (pendingRemoval !== null) remove(pendingRemoval);
    setPendingRemoval(null);
  };
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
          cepaId: item.cepaId,
          unidadBase: item.unidadBase.trim(),
          presentacionId: item.presentacionId?.trim() || undefined,
          capacidadUnidadesBase: item.capacidadUnidadesBase,
          costoBasePorUnidad: item.costoBasePorUnidad,
        })),
        abonoInicial: values.abonoInicial,
      });
      form.reset({
        contenedores: [{
          cepaId: '',
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
              cepaId: '',
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
                {cepas.find((cepa) => cepa.id === containers[index]?.cepaId)?.nombre || `Contenedor ${index + 1}`}
                {containerSchema.safeParse(containers[index]).success && (
                  <span className="hu-ml-2 hu-inline-flex hu-items-center hu-gap-1 hu-text-green-700">
                    <Check size={17} aria-hidden="true" /> Datos completos
                  </span>
                )}
              </summary>
              <div className="hu-mt-3 hu-grid hu-items-start hu-gap-3 sm:hu-grid-cols-2">
              <Field label="Producto" error={form.formState.errors.contenedores?.[index]?.cepaId?.message}>
                <Select {...form.register(`contenedores.${index}.cepaId`)} disabled={cepasQuery.isPending || cepasQuery.isError}>
                  <option value="">Selecciona un producto</option>
                  {cepas.map((cepa) => <option key={cepa.id} value={cepa.id}>{cepa.nombre}</option>)}
                </Select>
                {cepasQuery.isError && <ErrorNotice>No se pudieron cargar los productos: {getApiErrorMessage(cepasQuery.error)}</ErrorNotice>}
                {!cepasQuery.isPending && !cepasQuery.isError && cepas.length === 0 && <p className="hu-m-0 hu-text-xs hu-text-amber-800">Primero registra un producto en Administración de productos.</p>}
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
              <div className="hu-flex hu-items-end hu-justify-between hu-gap-3">
                <p className="hu-mb-2 hu-text-sm hu-text-slate-600">
                  Subtotal: <strong>{formatCop(centsToAmount(calculateContainerSubtotalCents(containers[index] ?? {
                    capacidadUnidadesBase: 0,
                    costoBasePorUnidad: 0,
                  })))}</strong>
                </p>
                <Button type="button" variant="ghost" aria-label={`Eliminar contenedor ${index + 1}`} disabled={fields.length === 1} className="hu-mb-1 hu-p-2 hu-text-red-700" onClick={() => setPendingRemoval(index)}>
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
      {pendingRemoval !== null && (
        <div className="hu-fixed hu-inset-0 hu-z-50 hu-grid hu-place-items-center hu-bg-slate-950/60 hu-p-4">
          <section
            className="hu-w-full hu-max-w-md hu-rounded-2xl hu-bg-white hu-p-6 hu-text-center hu-shadow-2xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-container-title"
            aria-describedby="remove-container-message"
          >
            <h2 id="remove-container-title" className="hu-m-0 hu-text-xl hu-font-bold hu-text-slate-900">Eliminar contenedor</h2>
            <p id="remove-container-message" className="hu-mb-5 hu-mt-3 hu-text-sm hu-leading-6 hu-text-slate-600">
              ¿Seguro que deseas eliminar «{cepas.find((cepa) => cepa.id === containers[pendingRemoval]?.cepaId)?.nombre || `Contenedor ${pendingRemoval + 1}`}»? Los datos ingresados se perderán.
            </p>
            <div className="hu-flex hu-justify-center hu-gap-3">
              <Button type="button" variant="secondary" onClick={() => setPendingRemoval(null)} autoFocus>Cancelar</Button>
              <Button type="button" className="hu-bg-red-700 hover:hu-bg-red-800" onClick={confirmRemoval}>
                <Trash2 size={16} /> Eliminar
              </Button>
            </div>
          </section>
        </div>
      )}
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
        <SupplierPaymentForm supplier={supplier} onPaid={() => {
          setFeedback('Pago registrado y saldos del proveedor actualizados.');
        }} />
      </section>

      <section id="supplier-section-lots" aria-labelledby="supplier-action-lots" hidden={activeSection !== 'lots'}>
        <div className="hu-mb-4 hu-flex hu-flex-wrap hu-items-end hu-justify-between hu-gap-2">
          <div>
            <h2 className="hu-m-0 hu-text-xl hu-font-bold">Lotes y tope de liquidación</h2>
            <p className="hu-mb-0 hu-mt-1 hu-text-sm hu-text-slate-500">Busca los lotes del proveedor por producto, presentación o SKU y desglosa sus contenedores. Se incluyen lotes saldados e históricos.</p>
          </div>
          <Badge tone="blue">Recepción y empaquetado separados</Badge>
        </div>
        <SupplierLotsList key={supplier.id} supplierId={supplier.id}
          renderLot={(lot) => <LotCard lot={lot} supplierPaidOff={isPaidOff} />} />
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
