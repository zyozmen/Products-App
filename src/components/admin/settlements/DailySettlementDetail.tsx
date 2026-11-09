import { useDailySettlementDetail } from '../../../hooks/useSettlementQueries';
import { formatDecimalCOP } from '../../../utils/decimalMoney';
import type { SettlementMovement } from '../../../Interfaces/settlement';
import { Badge, Button, Card, ErrorNotice } from '../../ui/shadcn';

export function SettlementPagination({ page, totalPages, fetching, onPage, label }: {
  page: number; totalPages: number; fetching: boolean; onPage: (page: number) => void; label: string;
}) {
  return (
    <nav className="hu-flex hu-flex-wrap hu-items-center hu-justify-between hu-gap-3" aria-label={label}>
      <Button type="button" variant="secondary" disabled={page === 0 || fetching} onClick={() => onPage(page - 1)}>Anterior</Button>
      <span className="hu-text-sm hu-text-slate-700">{totalPages === 0 ? 'Sin páginas (0 resultados)' : `Página ${page + 1} de ${totalPages}`}</span>
      <Button type="button" variant="secondary" disabled={page + 1 >= totalPages || fetching} onClick={() => onPage(page + 1)}>Siguiente</Button>
    </nav>
  );
}

const movementLabels = { SALE: 'Venta', PQR: 'PQR', PQR_REVERSAL: 'Reversión PQR', PAYMENT: 'Pago' };
const tones = { SALE: 'green', PQR: 'blue', PQR_REVERSAL: 'red', PAYMENT: 'orange' } as const;

function Movement({ item, formatInstant }: { item: SettlementMovement; formatInstant: (value: string) => string }) {
  const payment = item.movementType === 'PAYMENT';
  return (
    <tr className="hu-border-0 hu-border-t hu-border-solid hu-border-slate-200">
      <td className="hu-px-4 hu-py-3 hu-align-top">
        <Badge tone={tones[item.movementType]}>{movementLabels[item.movementType]}</Badge>
        <p className="hu-mb-0 hu-break-all hu-text-xs">Movimiento: {item.id}</p>
        {item.movementType === 'PQR_REVERSAL' && <p className="hu-break-all hu-text-xs">Movimiento original: {item.originalMovementId}</p>}
        {payment && <><p className="hu-break-all hu-text-xs">Correlación: {item.correlationId}</p><p>Tipo de pago: {item.paymentType}</p></>}
        {item.observations && <p>{item.observations}</p>}
      </td>
      <td className="hu-px-4 hu-py-3 hu-align-top">
        <p className="hu-m-0">Evento: <time dateTime={item.timestamp}>{formatInstant(item.timestamp)}</time></p>
        <p className="hu-text-xs hu-break-all">{item.timestamp}</p>
        <p>Jornada afectada: <time dateTime={item.date}>{item.date}</time></p>
      </td>
      <td className="hu-px-4 hu-py-3 hu-align-top hu-break-all">
        {payment ? (
          <ul className="hu-m-0 hu-grid hu-gap-3 hu-pl-4" aria-label="Imputaciones del pago">
            {item.allocations.map((allocation) => (
              <li key={allocation.transactionId}>
                Transacción: {allocation.transactionId}<br />
                Lote: {allocation.lotCode ?? allocation.lotId}<br />
                Imputado: {formatDecimalCOP(allocation.amount)}
              </li>
            ))}
          </ul>
        ) : (
          <>
            <p className="hu-m-0">Orden: {item.orderId ?? 'No aplica'} · Ítem: {item.itemIndex ?? 'No aplica'}</p>
            <p>Lote: {item.lotCode ?? item.lotId ?? 'No aplica'}</p>
            <p>Contenedor: {item.containerCode ?? item.containerId ?? 'No aplica'}</p>
            <p>Producto: {item.productName ?? item.strainId ?? 'No aplica'}</p>
            <p>Presentación: {item.presentationName ?? item.presentationId ?? 'No aplica'}</p>
            {item.contentPerUnit != null && <p>Contenido por unidad: {item.contentPerUnit} {item.baseUnit}</p>}
          </>
        )}
      </td>
      <td className="hu-px-4 hu-py-3 hu-align-top hu-text-right hu-tabular-nums">
        {payment ? 'No aplica' : item.quantity ?? 'No aplica'}
      </td>
      <td className="hu-px-4 hu-py-3 hu-align-top hu-text-right hu-tabular-nums">
        {payment || item.unitCost == null ? 'No aplica' : formatDecimalCOP(item.unitCost)}
        {!payment && item.baseUnitCost != null && <p className="hu-text-xs">Costo base: {formatDecimalCOP(item.baseUnitCost)} / {item.baseUnit ?? 'unidad base'}</p>}
      </td>
      <td className="hu-whitespace-nowrap hu-px-4 hu-py-3 hu-align-top hu-text-right hu-tabular-nums">{formatDecimalCOP(item.amount)}</td>
    </tr>
  );
}

export default function DailySettlementDetail({ date, providerId, page, size, onPage, onBack, errorMessage, formatInstant }: {
  date: string; providerId: string; page: number; size: number;
  onPage: (page: number) => void; onBack: () => void;
  errorMessage: (error: unknown) => string; formatInstant: (value: string) => string;
}) {
  const query = useDailySettlementDetail(date, providerId, page, size);
  const data = query.data;
  const providerName = data?.providerName ?? data?.content.find((item) => item.providerName != null)?.providerName;
  return (
    <section className="hu-grid hu-gap-4" aria-label="Detalle auditable">
      <div className="hu-flex hu-flex-wrap hu-justify-between hu-gap-3">
        <div>
          <h2 className="hu-m-0 hu-text-xl hu-font-bold">Detalle auditable</h2>
          <p className="hu-break-all">Proveedor: {providerName ?? providerId} · Jornada: {date} · Hora de Bogotá</p>
        </div>
        <div className="hu-flex hu-items-start hu-gap-3">
          <Button type="button" variant="secondary" disabled={query.isFetching} onClick={() => void query.refetch()}>Actualizar detalle</Button>
          <Button type="button" variant="secondary" onClick={onBack}>Volver al resumen</Button>
        </div>
      </div>
      {query.isPending && <p role="status">Cargando detalle auditable…</p>}
      {query.isError && <Card className="hu-grid hu-gap-3 hu-p-5">
        <ErrorNotice>{errorMessage(query.error)}</ErrorNotice>
        <Button type="button" variant="secondary" disabled={query.isFetching} onClick={() => void query.refetch()}>Reintentar detalle</Button>
      </Card>}
      {data && !query.isError && <>
        <p className="hu-m-0">{data.totalElements} movimientos · Orden por instante del evento e identificador ascendente.</p>
        <Card className="hu-overflow-hidden">
          {data.content.length === 0 ? (
            <div className="hu-grid hu-gap-3 hu-p-5">
              <p className="hu-m-0">{page > 0 ? 'Esta página no tiene movimientos.' : 'No hay movimientos para este proveedor y jornada.'}</p>
              {page > 0 && <Button type="button" variant="secondary" onClick={() => onPage(0)}>Ir a la primera página del detalle</Button>}
            </div>
          ) : (
            <div className="hu-overflow-x-auto" role="region" aria-label="Movimientos auditables (desplazable)" tabIndex={0}>
              <table className="hu-w-full hu-min-w-[1200px] hu-border-collapse hu-text-sm">
                <caption className="hu-sr-only">Movimientos del proveedor y jornada</caption>
                <thead className="hu-bg-slate-50"><tr>
                  {['Movimiento', 'Evento y jornada', 'Referencias e imputaciones', 'Cantidad', 'Costo unitario reconocido (snapshot)', 'Importe'].map((label) =>
                    <th scope="col" key={label} className="hu-px-4 hu-py-3 hu-text-left">{label}</th>)}
                </tr></thead>
                <tbody>{data.content.map((item) => <Movement key={item.id} item={item} formatInstant={formatInstant} />)}</tbody>
              </table>
            </div>
          )}
        </Card>
        <p className="hu-m-0 hu-text-xs hu-text-slate-600">
          Cada pago se muestra una vez por correlación con sus imputaciones. Las reversiones afectan la jornada original, no la fecha de cancelación.
          Se muestran nombres y códigos cuando están disponibles; si la referencia ya no existe, se conserva su ID.
          No hay rutas autorizadas específicas para abrir esos registros.
        </p>
        <SettlementPagination page={data.page} totalPages={data.totalPages} fetching={query.isFetching} onPage={onPage} label="Paginación del detalle" />
      </>}
    </section>
  );
}
