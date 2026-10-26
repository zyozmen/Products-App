import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Info, ReceiptText, RefreshCw } from 'lucide-react';
import HeaderComponent from '../../dashboard/HeaderComponent.jsx';
import FooterComponent from '../../dashboard/FooterComponent.jsx';
import AdminNav from '../AdminNav.jsx';
import navigationComponent from '../../navigation/NavigationComponent.jsx';
import { useDailySettlementSummary } from '../../../hooks/useSettlementQueries';
import { InvalidSettlementResponseError } from '../../../services/settlementService';
import { formatDecimalCOP, isPositiveDecimal } from '../../../utils/decimalMoney';
import { BUSINESS_TIMEZONE, ISO_DATE } from '../../../utils/businessDate';
import type { ProviderDailySummary } from '../../../Interfaces/settlement';
import { Button, Card, ErrorNotice } from '../../ui/shadcn';

const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
const PAGE_SIZE = 20;

export function settlementErrorMessage(error: unknown): string {
  if (error instanceof InvalidSettlementResponseError) return error.message;
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'No se pudo conectar con el servidor de liquidación. Verifica tu conexión e inténtalo de nuevo.';
    const status = error.response.status;
    const body = error.response.data as { message?: string } | string | undefined;
    const message = typeof body === 'object' ? body?.message : undefined;
    if (status === 401) return 'Tu sesión no es válida o expiró. Inicia sesión nuevamente.';
    if (status === 403) return 'No tienes permisos para consultar la liquidación diaria.';
    if (status === 400) return message || 'La consulta de liquidación no es válida.';
    return message || 'No se pudo cargar la liquidación diaria.';
  }
  return 'No se pudo cargar la liquidación diaria.';
}

/** La jornada llega sin hora; se formatea en UTC para que la zona del navegador no cambie el día. */
function formatBusinessDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const text = new Intl.DateTimeFormat('es-CO', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatInstant(instant: string): string {
  const value = new Date(instant);
  if (Number.isNaN(value.getTime())) return instant;
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: BUSINESS_TIMEZONE }).format(value);
}

const MONEY_COLUMNS: { key: keyof ProviderDailySummary; label: string; emphasis?: boolean }[] = [
  { key: 'salesRecognizedAmount', label: 'Costo ventas' },
  { key: 'pqrRecognizedAmount', label: 'Costo PQR' },
  { key: 'reversedAmount', label: 'Revertido' },
  { key: 'grossAccumulatedAmount', label: 'Acumulado bruto' },
  { key: 'accumulatedAmount', label: 'Acumulado neto' },
  { key: 'linkedPaymentsAmount', label: 'Pagos vinculados' },
  { key: 'pendingDailyAmount', label: 'Pendiente del día' },
  { key: 'providerOutstandingBalance', label: 'Saldo del proveedor' },
  { key: 'suggestedPayableAmount', label: 'Sugerido a pagar', emphasis: true },
  { key: 'overpaidAmount', label: 'Exceso pagado' },
];

function SummaryTable({ rows }: { rows: ProviderDailySummary[] }) {
  const head = 'hu-whitespace-nowrap hu-px-4 hu-py-3 hu-text-xs hu-font-bold hu-uppercase hu-tracking-wide hu-text-slate-600 dark:hu-text-slate-300';
  return (
    <div className="hu-overflow-x-auto" tabIndex={0} role="region" aria-label="Resumen por proveedor (desplazable)">
      <table className="hu-w-full hu-min-w-[1400px] hu-border-collapse hu-text-sm">
        <caption className="hu-sr-only">Liquidación diaria por proveedor</caption>
        <thead className="hu-bg-slate-50 dark:hu-bg-white/5">
          <tr>
            <th scope="col" className={`${head} hu-sticky hu-left-0 hu-z-10 hu-bg-slate-50 hu-text-left dark:hu-bg-[#1b2a21]`}>Proveedor</th>
            <th scope="col" className={`${head} hu-text-right`}>Unidades vendidas</th>
            <th scope="col" className={`${head} hu-text-right`}>Unidades PQR</th>
            {MONEY_COLUMNS.map((column) => (
              <th key={column.key} scope="col" className={`${head} hu-text-right`}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.providerId}-${row.date}`} className="hu-border-0 hu-border-t hu-border-solid hu-border-slate-200 dark:hu-border-white/10">
              <th scope="row" className="hu-sticky hu-left-0 hu-z-10 hu-bg-white hu-px-4 hu-py-3 hu-text-left hu-font-semibold hu-text-slate-900 dark:hu-bg-[#18251e] dark:hu-text-white">
                <span className="hu-block hu-max-w-[220px] hu-truncate" title={row.providerName ?? row.providerId}>{row.providerName ?? 'Proveedor sin nombre'}</span>
                <span className="hu-block hu-text-xs hu-font-normal hu-text-slate-500 dark:hu-text-slate-400">{row.providerId}</span>
              </th>
              <td className="hu-px-4 hu-py-3 hu-text-right hu-tabular-nums dark:hu-text-white">{row.totalSalesCount}</td>
              <td className="hu-px-4 hu-py-3 hu-text-right hu-tabular-nums dark:hu-text-white">{row.totalPqrCount}</td>
              {MONEY_COLUMNS.map((column) => {
                const value = row[column.key] as string;
                const overpaid = column.key === 'overpaidAmount' && isPositiveDecimal(value);
                return (
                  <td key={column.key} className={`hu-whitespace-nowrap hu-px-4 hu-py-3 hu-text-right hu-tabular-nums ${
                    column.emphasis ? 'hu-font-bold hu-text-green-800 dark:hu-text-green-300' : overpaid ? 'hu-font-semibold hu-text-amber-700 dark:hu-text-amber-300' : 'hu-text-slate-800 dark:hu-text-white'}`}>
                    {formatDecimalCOP(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DailySettlementPage() {
  const [searchParams] = useSearchParams();
  const rawDate = searchParams.get('date');
  const invalidDate = rawDate !== null && !ISO_DATE.test(rawDate);
  const date = rawDate && !invalidDate ? rawDate : null;
  const [paging, setPaging] = useState({ date, page: 0 });
  const page = paging.date === date ? paging.page : 0;
  const setPage = (next: number | ((value: number) => number)) =>
    setPaging({ date, page: typeof next === 'function' ? next(page) : next });
  const query = useDailySettlementSummary(page, PAGE_SIZE, date);
  const data = query.data;
  const rows = data?.content ?? [];

  return (
    <div className="hu-flex hu-min-h-screen hu-flex-col admin-page-bg hu-text-slate-900">
      <HeaderComponentWithNavigation />
      <AdminNav />
      <main className="hu-mx-auto hu-w-full hu-max-w-[1600px] hu-flex-1 hu-px-4 hu-py-8 md:hu-px-8">
        <div className="hu-mb-6 hu-flex hu-flex-wrap hu-items-end hu-justify-between hu-gap-4">
          <div>
            <h1 className="hu-m-0 hu-font-display hu-text-3xl hu-text-green-800 admin-title">Liquidación diaria</h1>
            <p className="hu-mb-0 hu-mt-1 hu-max-w-3xl hu-text-sm hu-text-[#3f4a41] dark:hu-text-white">
              Costo reconocido a cada proveedor por las ventas y PQR de la jornada, y valor sugerido a pagar. No corresponde al ingreso comercial.
            </p>
          </div>
          <Button type="button" variant="secondary" disabled={query.isFetching} onClick={() => void query.refetch()}>
            <RefreshCw size={16} aria-hidden="true" className={query.isFetching ? 'hu-animate-spin' : ''} />
            {query.isFetching ? 'Actualizando…' : 'Actualizar'}
          </Button>
        </div>

        {invalidDate && (
          <Card className="hu-mb-5 hu-grid hu-gap-3 hu-p-5">
            <ErrorNotice>La fecha de la jornada en el enlace no es válida (usa AAAA-MM-DD). Se muestra la jornada de hoy.</ErrorNotice>
          </Card>
        )}

        {query.isPending && <p role="status" className="hu-text-slate-600 dark:hu-text-white">Cargando liquidación diaria…</p>}

        {query.isError && (
          <Card className="hu-grid hu-gap-3 hu-p-5">
            <ErrorNotice>{settlementErrorMessage(query.error)}</ErrorNotice>
            <Button type="button" variant="secondary" className="hu-w-fit" disabled={query.isFetching} onClick={() => void query.refetch()}>Reintentar</Button>
          </Card>
        )}

        {data && !query.isError && (
          <div className="hu-grid hu-gap-5">
            <Card className="hu-flex hu-flex-wrap hu-items-center hu-gap-4 hu-p-5 kanban-board">
              <span className="hu-flex hu-h-11 hu-w-11 hu-shrink-0 hu-items-center hu-justify-center hu-rounded-xl hu-bg-green-100 hu-text-green-800"><ReceiptText size={21} aria-hidden="true" /></span>
              <div className="hu-min-w-0">
                <p className="hu-m-0 hu-text-xs hu-font-semibold hu-uppercase hu-tracking-wide hu-text-slate-500 dark:hu-text-slate-300">Jornada</p>
                <p className="hu-m-0 hu-text-lg hu-font-bold dark:hu-text-white">{formatBusinessDate(data.date)}</p>
                <p className="hu-m-0 hu-text-xs hu-text-slate-500 dark:hu-text-slate-300">Hora de Bogotá ({data.timezone})</p>
              </div>
              {date && (
                <Link to="/admin/liquidacion" className="hu-ml-auto hu-text-sm hu-font-semibold hu-text-green-800 dark:hu-text-green-300">Ver jornada de hoy</Link>
              )}
            </Card>

            {data.activationPending ? (
              <div className="hu-flex hu-gap-3 hu-rounded-xl hu-border hu-border-solid hu-border-amber-200 hu-bg-amber-50 hu-p-4 hu-text-sm hu-text-amber-900" role="note">
                <Info className="hu-mt-0.5 hu-shrink-0" size={18} aria-hidden="true" />
                <p className="hu-m-0">La acumulación automática aún no está activada. Las ventas y PQR todavía no suman al acumulado de los proveedores.</p>
              </div>
            ) : data.activatedAt && (
              <p className="hu-m-0 hu-text-sm hu-text-slate-600 dark:hu-text-white">Acumulación activa desde {formatInstant(data.activatedAt)} (hora de Bogotá).</p>
            )}

            <Card className="hu-overflow-hidden kanban-board">
              <div className="hu-flex hu-flex-wrap hu-items-baseline hu-justify-between hu-gap-2 hu-border-0 hu-border-b hu-border-solid hu-border-slate-100 hu-p-5 dark:hu-border-white/10">
                <h2 className="hu-m-0 hu-text-lg hu-font-bold dark:hu-text-white">Resumen por proveedor</h2>
                <span className="hu-text-sm hu-text-slate-500 dark:hu-text-slate-300">{data.totalElements} {data.totalElements === 1 ? 'proveedor' : 'proveedores'}</span>
              </div>
              {rows.length === 0 ? (
                <div className="hu-grid hu-gap-3 hu-p-6 hu-text-sm hu-text-slate-600 dark:hu-text-white">
                  <p className="hu-m-0">
                    {page > 0 ? 'Esta página no tiene resultados.' : 'No hay movimientos de liquidación registrados para esta jornada.'}
                  </p>
                  {page > 0 && <Button type="button" variant="secondary" className="hu-w-fit" onClick={() => setPage(0)}>Ir a la primera página</Button>}
                </div>
              ) : (
                <>
                  <SummaryTable rows={rows} />
                  <p className="hu-m-0 hu-border-0 hu-border-t hu-border-solid hu-border-slate-100 hu-px-5 hu-py-3 hu-text-xs hu-text-slate-500 dark:hu-border-white/10 dark:hu-text-slate-300">
                    Las unidades corresponden a presentaciones. El saldo del proveedor es su saldo global actual y limita el valor sugerido.
                    Una PQR cancelada se descuenta de "Unidades PQR" y su costo aparece en "Revertido" de la jornada en que se creó; el costo PQR bruto se conserva.
                  </p>
                </>
              )}
            </Card>

            {data.totalPages > 1 && (
              <nav className="hu-flex hu-flex-wrap hu-items-center hu-justify-between hu-gap-3" aria-label="Paginación de la liquidación">
                <Button type="button" variant="secondary" disabled={page === 0 || query.isFetching} onClick={() => setPage((value) => value - 1)}>Anterior</Button>
                <span className="hu-text-sm hu-text-slate-700 dark:hu-text-white">Página {data.page + 1} de {data.totalPages}</span>
                <Button type="button" variant="secondary" disabled={page + 1 >= data.totalPages || query.isFetching} onClick={() => setPage((value) => value + 1)}>Siguiente</Button>
              </nav>
            )}
          </div>
        )}
      </main>
      <FooterComponent />
    </div>
  );
}
