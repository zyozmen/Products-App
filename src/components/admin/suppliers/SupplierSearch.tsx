import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Badge, Button, Card, ErrorNotice, Field, Input } from '../../ui/shadcn';
import { useSupplierSearch } from '../../../hooks/useSupplierQueries';
import { getApiErrorMessage } from '../../../services/supplierService';

const pageSize = 20;
const supplierIdPattern = /^[a-f\d]{24}$/i;

export default function SupplierSearch() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [lookupId, setLookupId] = useState('');
  const { data, isPending, isFetching, isError, error, refetch } = useSupplierSearch(search, page, pageSize);

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextSearch = searchInput.trim();
    if (nextSearch === search && page === 0) {
      void refetch();
    } else {
      setSearch(nextSearch);
      setPage(0);
    }
  };

  const onLookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = lookupId.trim();
    if (supplierIdPattern.test(id)) navigate(`/admin/proveedores/${id}`);
  };

  return (
    <Card className="hu-overflow-hidden kanban-board">
      <div className="hu-border-b hu-border-slate-100 hu-p-6">
        <span className="hu-mb-4 hu-flex hu-h-11 hu-w-11 hu-items-center hu-justify-center hu-rounded-xl hu-bg-green-100 hu-text-green-800">
          <Search size={21} aria-hidden="true" />
        </span>
        <h2 className="hu-mb-1 hu-text-lg hu-font-bold">Buscar proveedor</h2>
        <p className="hu-m-0 hu-text-sm hu-text-slate-500">Busca por nombre o NIT y abre el detalle para consultar saldos, recibir lotes o registrar abonos.</p>
      </div>
      <div className="hu-grid hu-gap-5 hu-p-6">
        <form className="hu-grid hu-gap-3" onSubmit={onSearch}>
          <Field label="Nombre o NIT" hint="Puedes escribir una parte del nombre o NIT. Deja el campo vacío para ver todos.">
            <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Nombre o NIT del proveedor" />
          </Field>
          <Button type="submit" disabled={isFetching} className="hu-w-full sm:hu-w-fit">
            <Search size={16} aria-hidden="true" /> Buscar
          </Button>
        </form>

        <div aria-busy={isFetching}>
          {isPending ? (
            <p className="hu-m-0 hu-text-sm hu-text-slate-600" role="status">Cargando proveedores…</p>
          ) : isError ? (
            <div className="hu-grid hu-gap-3">
              <ErrorNotice>{getApiErrorMessage(error)}</ErrorNotice>
              <Button type="button" variant="secondary" disabled={isFetching} className="hu-w-fit" onClick={() => void refetch()}>Reintentar</Button>
            </div>
          ) : data && (
            <div className="hu-grid hu-gap-3">
              <p className="hu-m-0 hu-text-sm hu-text-slate-500" role="status">
                {data.total} {data.total === 1 ? 'proveedor encontrado' : 'proveedores encontrados'}
              </p>
              {data.suppliers.length ? (
                <ul className="hu-m-0 hu-grid hu-list-none hu-gap-3 hu-p-0" aria-label="Resultados de proveedores">
                  {data.suppliers.map((supplier) => (
                    <li key={supplier.id} className="hu-flex hu-flex-wrap hu-items-center hu-justify-between hu-gap-3 hu-rounded-xl hu-border hu-border-slate-200 hu-p-4">
                      <div className="hu-min-w-0">
                        <h3 className="hu-m-0 hu-break-words hu-text-base hu-font-bold">{supplier.nombre}</h3>
                        <p className="hu-mb-2 hu-mt-1 hu-break-words hu-text-sm hu-text-slate-600">NIT: {supplier.nit}</p>
                        <Badge tone={supplier.estado === 'ACTIVO' ? 'green' : 'neutral'}>{supplier.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}</Badge>
                      </div>
                      <Link to={`/admin/proveedores/${supplier.id}`} aria-label={`Ver detalle de ${supplier.nombre}`}
                        className="hu-inline-flex hu-rounded-lg hu-bg-green-700 hu-px-4 hu-py-2.5 hu-text-sm hu-font-semibold hu-text-white hu-no-underline hover:hu-bg-green-800">
                        Ver detalle
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="hu-m-0 hu-rounded-lg hu-bg-slate-50 hu-p-4 hu-text-sm hu-text-slate-600">
                  {data.total === 0 ? 'No se encontraron proveedores.' : 'No hay proveedores en esta página. Vuelve a la página anterior o realiza otra búsqueda.'}
                </p>
              )}
              <p className="hu-m-0 hu-text-xs hu-text-slate-500">Los proveedores inactivos se pueden consultar, pero no pueden recibir lotes.</p>
              <nav className="hu-flex hu-flex-wrap hu-items-center hu-justify-between hu-gap-3" aria-label="Paginación de proveedores">
                <Button type="button" variant="secondary" disabled={page === 0 || isFetching} onClick={() => setPage((current) => current - 1)}>Anterior</Button>
                <span className="hu-text-sm hu-text-slate-600">Página {page + 1}</span>
                <Button type="button" variant="secondary" disabled={(page + 1) * pageSize >= data.total || isFetching} onClick={() => setPage((current) => current + 1)}>Siguiente</Button>
              </nav>
            </div>
          )}
        </div>

        <details className="hu-border-t hu-border-slate-100 hu-pt-4">
          <summary className="hu-cursor-pointer hu-text-sm hu-font-semibold hu-text-slate-700">Consultar directamente por ID</summary>
          <form className="hu-mt-4 hu-grid hu-gap-3" onSubmit={onLookup}>
            <Field label="ID del proveedor" hint="Identificador de 24 caracteres hexadecimales.">
              <Input value={lookupId} onChange={(event) => setLookupId(event.target.value)} placeholder="60d5ecb8f1d2c2a4c8e9a010" maxLength={24} />
            </Field>
            {lookupId.trim() && !supplierIdPattern.test(lookupId.trim()) && (
              <p className="hu-m-0 hu-text-xs hu-text-red-700" role="alert">El ID debe tener 24 caracteres hexadecimales.</p>
            )}
            <Button type="submit" disabled={!supplierIdPattern.test(lookupId.trim())} className="hu-w-fit">Consultar saldos</Button>
          </form>
        </details>
      </div>
    </Card>
  );
}
