import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import type { ContainerResponse, PresentationCreateRequest } from '../../../Interfaces/supplier';
import { createPresentacionesSchema, generatePresentationSku, type PresentacionesFormValues } from '../../../schemas/presentaciones';
import { consumedCapacity, decimalText, decimalUnits, presentationCostCents } from '../../../utils/packagingCalculations';
import { presentationPhotoSrc, readPresentationPhoto } from '../../../utils/presentationPhoto';
import { useDesgloseContenedor } from '../../../hooks/useDesgloseContenedor';
import { getApiErrorMessage } from '../../../services/supplierService';
import { Badge, Button, ErrorNotice, Field, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/shadcn';
import CapacidadBar from './CapacidadBar';
import MargenNegativoModal from './MargenNegativoModal';

const emptyRow = () => ({
  sku: '', nombre: '', contenidoUnidad: '', unidadesCreadas: '', precioVenta: '', activoMarketplace: true,
});

export default function DesgloseContenedorForm({ loteId, codigoLote, contenedor }: {
  loteId: string;
  codigoLote?: string;
  contenedor: ContainerResponse;
}) {
  const lotCode = codigoLote?.trim() || loteId;
  const containerCode = contenedor.codigoContenedor?.trim() || contenedor.id;
  const mutation = useDesgloseContenedor(loteId, contenedor.id);
  const form = useForm<PresentacionesFormValues>({
    resolver: zodResolver(createPresentacionesSchema(lotCode, containerCode)),
    defaultValues: { presentaciones: [emptyRow()] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'presentaciones' });
  const rows = useWatch({ control: form.control, name: 'presentaciones' }) ?? [];
  const [confirmation, setConfirmation] = useState<PresentacionesFormValues | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [readingPhoto, setReadingPhoto] = useState(false);
  const submitting = useRef(false);
  const baseCost = contenedor.precioBaseUnidad ?? contenedor.costoBasePorUnidad;
  const capacity = decimalUnits(contenedor.capacidadUnidadesBase);
  const recordedUsage = capacity - decimalUnits(contenedor.cantidadDisponible);
  const existingUsage = consumedCapacity(contenedor.presentaciones ?? []);
  const previouslyUsed = existingUsage > recordedUsage ? existingUsage : recordedUsage;
  const used = previouslyUsed + consumedCapacity(rows);
  const exceeded = used > capacity;
  const locked = mutation.isPending || readingPhoto || confirmation !== null;

  const negativeRows = (values: PresentacionesFormValues) => values.presentaciones.filter((row) =>
    decimalUnits(row.precioVenta, 2) < presentationCostCents(row.contenidoUnidad, baseCost));

  async function publish(values: PresentacionesFormValues, confirmed: boolean) {
    if (submitting.current || exceeded) return;
    submitting.current = true;
    setConfirmation(null);
    setToast(null);
    const request: PresentationCreateRequest[] = values.presentaciones.map((row) => ({
      ...row,
      contenidoUnidad: row.contenidoUnidad,
      unidadesCreadas: Number(row.unidadesCreadas),
      precioVenta: row.precioVenta,
      confirmacionMargenNegativo: confirmed && decimalUnits(row.precioVenta, 2) < presentationCostCents(row.contenidoUnidad, baseCost),
    }));
    try {
      const lot = await mutation.mutateAsync(request);
      const savedContainer = lot.contenedores.find((item) => item.id === contenedor.id);
      const saved = savedContainer?.presentaciones?.filter((item) => request.some((row) => row.sku === item.sku));
      if (!saved || saved.length !== request.length) {
        throw new Error('El servidor respondió sin el detalle completo de las nuevas presentaciones. Consulta el lote para verificar el resultado.');
      }
      const published = saved.filter((item) => item.activoMarketplace).length;
      form.reset({ presentaciones: [emptyRow()] });
      setToast({ kind: 'success', message: `Desglose guardado. ${published} presentaciones publicadas en Marketplace; ${saved.length - published} inactivas. La deuda y los saldos no cambian.` });
    } catch (error) {
      const uncertain = !axios.isAxiosError(error) || !error.response || error.response.status >= 500;
      setToast({ kind: 'error', message: `${getApiErrorMessage(error)}${uncertain ? ' Verifica el lote antes de repetir: la operación podría haberse guardado.' : ''}` });
    } finally {
      submitting.current = false;
    }
  }

  const onSubmit = form.handleSubmit((values) => {
    if (exceeded) return;
    const existing = contenedor.presentaciones ?? [];
    let duplicates = false;
    values.presentaciones.forEach((row, index) => {
      if (existing.some((item) => item.sku === row.sku)) {
        form.setError(`presentaciones.${index}.sku`, { message: 'Este SKU ya existe en el contenedor.' });
        duplicates = true;
      }
    });
    if (duplicates) return;
    if (negativeRows(values).length) setConfirmation(values);
    else void publish(values, false);
  });

  async function loadPhoto(file: File, index: number) {
    setReadingPhoto(true);
    form.clearErrors(`presentaciones.${index}.fotografia`);
    try {
      form.setValue(`presentaciones.${index}.fotografia`, await readPresentationPhoto(file), { shouldValidate: true });
    } catch (error) {
      form.setError(`presentaciones.${index}.fotografia`, { message: getApiErrorMessage(error) });
      setToast({ kind: 'error', message: getApiErrorMessage(error) });
    } finally {
      setReadingPhoto(false);
    }
  }

  const photoError = fields.some((_, index) => Boolean(form.formState.errors.presentaciones?.[index]?.fotografia));
  return (
    <section className="hu-mt-4 hu-grid hu-gap-4 hu-rounded-xl hu-border hu-border-slate-200 hu-p-4" aria-label="Desglose de contenedor">
      <header>
        <h3 className="hu-m-0 hu-text-lg hu-font-bold">Desglose: {contenedor.codigoContenedor ?? contenedor.id}</h3>
        <p className="hu-mb-0 hu-mt-2 hu-text-sm">{contenedor.tipoCepa} · Capacidad total: {contenedor.capacidadUnidadesBase} {contenedor.unidadBase} · Costo base/unidad: ${baseCost} COP</p>
        <p className="hu-mb-0 hu-mt-2 hu-text-xs hu-text-slate-500">Solo se agregan presentaciones nuevas. El stock vendido no libera capacidad. El mínimo sugerido es el costo sin margen, no una política comercial.</p>
      </header>
      <CapacidadBar utilizada={used} capacidad={capacity} unidad={contenedor.unidadBase} />
      {toast && (
        <div role={toast.kind === 'error' ? 'alert' : 'status'}
          className={`hu-fixed hu-bottom-4 hu-right-4 hu-z-50 hu-max-w-lg hu-rounded-lg hu-border hu-p-4 hu-text-sm hu-shadow-xl ${toast.kind === 'error' ? 'hu-border-red-200 hu-bg-red-50 hu-text-red-800' : 'hu-border-green-200 hu-bg-green-50 hu-text-green-800'}`}>
          {toast.message}
          {toast.kind === 'success' && <Link to="/shop" className="hu-ml-2 hu-font-bold hu-text-green-800">Ir al Marketplace</Link>}
          <Button type="button" variant="ghost" onClick={() => setToast(null)} aria-label="Cerrar notificación">Cerrar</Button>
        </div>
      )}
      {Boolean(contenedor.presentaciones?.length) && (
        <details>
          <summary className="hu-cursor-pointer hu-text-sm hu-font-semibold">Presentaciones existentes (solo lectura)</summary>
          <ul className="hu-pl-5 hu-text-sm">
            {contenedor.presentaciones?.map((item) => (
              <li key={item.presentacionId}>{item.sku} · {item.nombre} · {item.unidadesCreadas} creadas · Stock: {item.stockDisponible} · <Badge tone={item.activoMarketplace ? 'green' : 'neutral'}>{item.activoMarketplace ? 'Publicado' : 'Inactivo'}</Badge>
                {item.fotografia && <img src={presentationPhotoSrc(item.fotografia)} alt={item.nombre} className="hu-m-2 hu-h-16 hu-w-16 hu-object-cover" />}
              </li>
            ))}
          </ul>
        </details>
      )}
      <form onSubmit={onSubmit} noValidate>
        <fieldset disabled={locked} className="hu-m-0 hu-min-w-0 hu-border-0 hu-p-0">
          <div className="hu-overflow-x-auto">
            <Table aria-label="Nuevas presentaciones">
              <TableHeader><TableRow>
                <TableHead>Nombre / SKU</TableHead><TableHead>Contenido / paquetes</TableHead>
                <TableHead>Precio sugerido / ingresado</TableHead><TableHead>Margen / unidades</TableHead><TableHead>Publicación / imagen</TableHead><TableHead>Acciones</TableHead>
              </TableRow></TableHeader>
              <TableBody>{fields.map((field, index) => {
                const row = rows[index];
                const cost = presentationCostCents(row?.contenidoUnidad ?? '', baseCost);
                const price = decimalUnits(row?.precioVenta ?? '', 2);
                const negative = row?.precioVenta !== '' && price < cost;
                const errors = form.formState.errors.presentaciones?.[index];
                return (
                  <TableRow key={field.id} className={negative ? 'hu-bg-red-50' : ''}>
                    <TableCell className="hu-min-w-[180px]">
                      <Field label={`Nombre ${index + 1}`} error={errors?.nombre?.message}><Input {...form.register(`presentaciones.${index}.nombre`)} /></Field>
                      <Field label={`SKU ${index + 1}`} error={errors?.sku?.message}
                        hint={`Opcional. Automático: ${generatePresentationSku(lotCode, containerCode, row?.nombre ?? '')}`}>
                        <Input {...form.register(`presentaciones.${index}.sku`)}
                          aria-label={`SKU ${index + 1}`}
                          placeholder={generatePresentationSku(lotCode, containerCode, row?.nombre ?? '')} />
                      </Field>
                    </TableCell>
                    <TableCell className="hu-min-w-[170px]">
                      <Field label={`Contenido ${index + 1} (${contenedor.unidadBase})`} error={errors?.contenidoUnidad?.message}><Input inputMode="decimal" {...form.register(`presentaciones.${index}.contenidoUnidad`)} /></Field>
                      <Field label={`Paquetes ${index + 1}`} error={errors?.unidadesCreadas?.message}><Input inputMode="numeric" {...form.register(`presentaciones.${index}.unidadesCreadas`)} /></Field>
                    </TableCell>
                    <TableCell className="hu-min-w-[180px]">
                      <p className="hu-text-xs">Costo base calculado / mínimo sugerido: ${decimalText(cost, 2)}</p>
                      <Field label={`Precio de venta ${index + 1}`} error={errors?.precioVenta?.message}><Input inputMode="decimal" {...form.register(`presentaciones.${index}.precioVenta`)} /></Field>
                    </TableCell>
                    <TableCell>
                      <p className="hu-whitespace-nowrap hu-text-sm">Margen: ${decimalText(price - cost, 2)} {price > 0n ? `(${Number((price - cost) * 10000n / price) / 100}%)` : ''}</p>
                      <p className="hu-text-xs">Unidades creadas: {row?.unidadesCreadas || '0'}</p>
                      {negative && <Badge tone="red">Precio menor al costo</Badge>}
                    </TableCell>
                    <TableCell className="hu-min-w-[200px]">
                      <label className="hu-text-sm"><input type="checkbox" {...form.register(`presentaciones.${index}.activoMarketplace`)} /> Activo en Marketplace</label>
                      <Field label={`Fotografía ${index + 1}`} error={errors?.fotografia?.message ?? errors?.fotografia?.filepart?.message}>
                        <Input type="file" accept=".png,.jpg,.jpeg,.webp" onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void loadPhoto(file, index);
                          event.target.value = '';
                        }} />
                      </Field>
                      {row?.fotografia && <>
                        <img src={presentationPhotoSrc(row.fotografia)} alt={`Vista previa ${index + 1}`} className="hu-h-16 hu-w-16 hu-object-cover" />
                        <Button type="button" variant="ghost" onClick={() => {
                          form.setValue(`presentaciones.${index}.fotografia`, undefined);
                          form.clearErrors(`presentaciones.${index}.fotografia`);
                        }}>Quitar imagen</Button>
                      </>}
                      {!row?.fotografia && errors?.fotografia && <Button type="button" variant="ghost" onClick={() => form.clearErrors(`presentaciones.${index}.fotografia`)}>Omitir imagen</Button>}
                    </TableCell>
                    <TableCell><Button type="button" variant="ghost" onClick={() => remove(index)} aria-label={`Eliminar presentación ${index + 1}`}>Eliminar</Button></TableCell>
                  </TableRow>
                );
              })}</TableBody>
            </Table>
          </div>
          {(form.formState.errors.presentaciones?.message || form.formState.errors.presentaciones?.root?.message) && <ErrorNotice>{form.formState.errors.presentaciones.message ?? form.formState.errors.presentaciones.root?.message}</ErrorNotice>}
          <div className="hu-mt-4 hu-flex hu-flex-wrap hu-items-center hu-gap-3">
            <Button type="button" variant="secondary" onClick={() => append(emptyRow())}>Agregar presentación</Button>
            <span className="hu-text-sm">Total unidades creadas: {rows.reduce((sum, row) => sum + (/^\d+$/.test(row.unidadesCreadas) ? BigInt(row.unidadesCreadas) : 0n), 0n).toString()}</span>
            <Button type="submit" disabled={exceeded || fields.length === 0 || Boolean(photoError)}>
              {mutation.isPending ? 'Guardando…' : readingPhoto ? 'Leyendo imagen…' : 'Guardar y Publicar'}
            </Button>
          </div>
        </fieldset>
      </form>
      {confirmation && <MargenNegativoModal
        warnings={negativeRows(confirmation).map((row) => ({ sku: row.sku, precio: row.precioVenta, costo: decimalText(presentationCostCents(row.contenidoUnidad, baseCost), 2) }))}
        onCancel={() => setConfirmation(null)} onConfirm={() => void publish(confirmation, true)} />}
    </section>
  );
}
