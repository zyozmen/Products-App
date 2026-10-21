import { useState } from 'react';
import type { LotResponse, SupplierPaymentResponse } from '../../../Interfaces/supplier';
import { useSupplierPayments } from '../../../hooks/useSupplierQueries';
import { getApiErrorMessage } from '../../../services/supplierService';
import { Button, Card, ErrorNotice, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/shadcn';

const pageSize = 50;
const currency = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const paymentTypeLabels: Record<SupplierPaymentResponse['tipo'], string> = {
  ABONO_INICIAL: 'Abono inicial',
  ABONO: 'Abono',
  PAGO_CORTESIA: 'Pago de cortesía',
  AJUSTE_PQR: 'Ajuste PQR',
};

export default function SupplierPaymentsTable({ supplierId, supplierName, lots }: {
  supplierId: string;
  supplierName: string;
  lots: LotResponse[];
}) {
  const [page, setPage] = useState(0);
  const { data, isPending, isFetching, isError, error, refetch } = useSupplierPayments(supplierId, page, pageSize);
  if (isPending) {
    return <Card className="hu-p-5"><p className="hu-m-0 hu-text-sm hu-text-slate-600" role="status">Cargando historial de abonos…</p></Card>;
  }
  if (isError) {
    return (
      <Card className="hu-grid hu-gap-3 hu-p-5">
        <ErrorNotice>{getApiErrorMessage(error)}</ErrorNotice>
        <Button type="button" variant="secondary" disabled={isFetching} className="hu-w-fit" onClick={() => void refetch()}>Reintentar</Button>
        {page > 0 && <Button type="button" variant="secondary" onClick={() => setPage(page - 1)}>Anterior</Button>}
      </Card>
    );
  }
  const { payments, total } = data;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstIndex = page * pageSize;

  return (
    <Card className="hu-overflow-hidden">
      {payments.length === 0 ? (
        <p className="hu-m-0 hu-p-5 hu-text-sm hu-text-slate-600">
          {total === 0 ? 'Este proveedor todavía no tiene movimientos de abono.' : 'No hay movimientos en esta página. Vuelve a la página anterior.'}
        </p>
      ) : (
      <div className="hu-overflow-x-auto">
        <Table aria-label="Movimientos de abonos">
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y hora</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Lote impactado</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Observaciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => {
              const lot = lots.find((item) => item.id === payment.loteId);
              return (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.fecha).toLocaleString('es-CO')}</TableCell>
                  <TableCell className="hu-font-semibold">${currency.format(payment.monto)} COP</TableCell>
                  <TableCell>{supplierName}</TableCell>
                  <TableCell>
                    <span className="hu-block">{lot?.codigoLote ?? 'Lote'}</span>
                    <code className="hu-text-xs hu-text-slate-500">{payment.loteId}</code>
                  </TableCell>
                  <TableCell>{paymentTypeLabels[payment.tipo]}</TableCell>
                  <TableCell>{payment.observaciones || 'Sin observaciones'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      )}
      <nav className="hu-flex hu-flex-wrap hu-items-center hu-justify-between hu-gap-3 hu-border-t hu-border-slate-100 hu-p-4" aria-label="Paginación de movimientos">
        <p className="hu-m-0 hu-text-sm hu-text-slate-600" role="status">
          {payments.length ? `${firstIndex + 1}–${firstIndex + payments.length} de ${total}` : `${total}`} movimientos · Página {page + 1} de {Math.max(page + 1, pageCount)}
        </p>
        <div className="hu-flex hu-gap-2">
          <Button type="button" variant="secondary" disabled={page === 0 || isFetching} onClick={() => setPage(page - 1)}>Anterior</Button>
          <Button type="button" variant="secondary" disabled={(page + 1) * pageSize >= total || isFetching} onClick={() => setPage(page + 1)}>Siguiente</Button>
        </div>
      </nav>
    </Card>
  );
}
