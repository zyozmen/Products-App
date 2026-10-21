import { useState, type ReactNode } from 'react';
import type { LotResponse, SupplierLotSort } from '../../../Interfaces/supplier';
import { useSupplierLots } from '../../../hooks/useSupplierQueries';
import { getApiErrorMessage } from '../../../services/supplierService';
import { Button, Card, ErrorNotice, Field, Input, Select } from '../../ui/shadcn';

const sortOptions: { value: SupplierLotSort; label: string }[] = [
  { value: 'fechaIngreso,desc', label: 'Más recientes primero' },
  { value: 'fechaIngreso,asc', label: 'Más antiguos primero' },
  { value: 'codigoLote,asc', label: 'Código: ascendente' },
  { value: 'codigoLote,desc', label: 'Código: descendente' },
  { value: 'costoTotalLote,asc', label: 'Costo total: menor a mayor' },
  { value: 'costoTotalLote,desc', label: 'Costo total: mayor a menor' },
  { value: 'saldoPendienteLote,asc', label: 'Saldo: menor a mayor' },
  { value: 'saldoPendienteLote,desc', label: 'Saldo: mayor a menor' },
];

export default function SupplierLotsList({ supplierId, renderLot }: {
  supplierId: string;
  renderLot: (lot: LotResponse) => ReactNode;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SupplierLotSort>('fechaIngreso,desc');
  const [page, setPage] = useState(0);
  const size = 10;
  const { data, isPending, isFetching, isError, error, refetch } = useSupplierLots(supplierId, search, page, size, sort);
  const totalPages = Math.ceil((data?.total ?? 0) / size);

  return (
    <div className="hu-grid hu-gap-4">
      <Card className="hu-p-4">
        <form className="hu-flex hu-flex-wrap hu-items-end hu-gap-3" onSubmit={(event) => {
          event.preventDefault();
          const next = searchInput.trim();
          if (next === search && page === 0) void refetch();
          setSearch(next);
          setPage(0);
        }}>
          <div className="hu-min-w-0 hu-flex-1">
            <Field label="Buscar lotes" hint="Por cepa, nombre de presentación o SKU. Vacío muestra todos.">
              <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Sativa, Bolsa o SAT-PREM-5G" />
            </Field>
          </div>
          <Field label="Orden de los lotes">
            <Select value={sort} onChange={(event) => {
              const option = sortOptions.find((item) => item.value === event.target.value);
              if (option) { setSort(option.value); setPage(0); }
            }}>
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </Field>
          <Button type="submit" disabled={isFetching}>Buscar lotes</Button>
          <Button type="button" variant="secondary" disabled={isFetching} onClick={() => void refetch()}>Actualizar listado</Button>
        </form>
      </Card>
      {isPending ? <p role="status" className="hu-text-sm hu-text-slate-600">Cargando lotes…</p>
        : isError ? <Card className="hu-grid hu-gap-3 hu-p-4">
          <ErrorNotice>{getApiErrorMessage(error)}</ErrorNotice>
          <Button type="button" variant="secondary" disabled={isFetching} onClick={() => void refetch()}>Reintentar listado</Button>
          {page > 0 && <Button type="button" variant="secondary" onClick={() => setPage(page - 1)}>Anterior</Button>}
        </Card> : data && <>
          <p role="status" className="hu-m-0 hu-text-sm hu-text-slate-600">{data.total} lotes encontrados{isFetching ? ' · Actualizando…' : ''}</p>
          {data.lots.length ? data.lots.map((lot) => <div key={lot.id}>{renderLot(lot)}</div>)
            : <Card className="hu-p-5"><p className="hu-m-0 hu-text-sm hu-text-slate-600">
              {data.total === 0 ? 'No se encontraron lotes para esta búsqueda.' : 'No hay lotes en esta página. Vuelve a la página anterior.'}
            </p></Card>}
          <nav aria-label="Paginación de lotes" className="hu-flex hu-flex-wrap hu-items-center hu-justify-between hu-gap-3">
            <Button type="button" variant="secondary" disabled={page === 0 || isFetching} onClick={() => setPage(page - 1)}>Anterior</Button>
            <span className="hu-text-sm hu-text-slate-600">Página {page + 1} de {Math.max(1, page + 1, totalPages)}</span>
            <Button type="button" variant="secondary" disabled={page + 1 >= totalPages || isFetching} onClick={() => setPage(page + 1)}>Siguiente</Button>
          </nav>
        </>}
    </div>
  );
}
