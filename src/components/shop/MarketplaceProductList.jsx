import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { formatCOP } from '../../Interfaces/ProductInterface.js';
import { useMarketplaceList } from '../../hooks/useMarketplaceQueries.ts';
import useTranslation from '../../hooks/useTranslation.js';
import { Button } from '../ui/shadcn';
import './ProductListComponent.css';

function photoSource(photo) {
    if (!photo?.filepart) return '/img/no_image.jpg';
    const mime = photo.extension === 'jpg' || photo.extension === 'jpeg' ? 'jpeg' : photo.extension;
    return `data:image/${mime};base64,${photo.filepart}`;
}

function MarketplaceProductList({ search = '', filters = {} }) {
    const t = useTranslation();
    const [page, setPage] = useState(0);
    const size = 20;
    const { data, isPending, isError, error, refetch, isFetching } = useMarketplaceList(search, page, size, filters);

    const strains = data?.content ?? [];
    return (
        <section className="hu-grid hu-gap-5" aria-label="Catálogo de cepas">
            {isPending && <p className="hu-py-8 hu-text-center hu-text-slate-600" role="status">{t('loading_products')}</p>}
            {isError && (
                <div className="hu-grid hu-justify-items-center hu-gap-3 hu-rounded-lg hu-border hu-border-red-200 hu-bg-red-50 hu-p-4 hu-text-red-800" role="alert">
                    <p className="hu-m-0">{error?.message || t('could_not_load_products')}</p>
                    <Button type="button" variant="secondary" onClick={() => void refetch()}>Reintentar</Button>
                </div>
            )}
            {!isPending && !isError && strains.length === 0 && (
                <p className="hu-py-8 hu-text-center hu-text-slate-600">{t('product_not_found')}</p>
            )}
            {strains.length > 0 && (
                <>
                    <div className="hu-grid hu-grid-cols-1 hu-gap-4 sm:hu-grid-cols-2 lg:hu-grid-cols-3 xl:hu-grid-cols-4">
                        {strains.map((strain) => {
                            const firstPresentation = strain.presentaciones.find((option) => option.precioVenta === strain.precioDesde)
                                ?? strain.presentaciones[0];
                            if (!firstPresentation) return null;
                            const href = `/producto/${encodeURIComponent(strain.cepaId)}/${encodeURIComponent(firstPresentation.presentacionId)}`;
                            return (
                                <NavLink
                                    key={strain.cepaId}
                                    to={href}
                                    className="hu-overflow-hidden hu-rounded-xl hu-border hu-border-slate-200 hu-bg-white hu-text-slate-900 hu-no-underline hu-shadow-sm hover:hu-shadow-panel"
                                >
                                    <img className="hu-aspect-square hu-w-full hu-object-cover" src={photoSource(strain.fotografia)} alt={strain.nombre} />
                                    <div className="hu-p-4">
                                        <h2 className="hu-m-0 hu-truncate hu-text-lg hu-font-bold">{strain.nombre}</h2>
                                        <p className="hu-mb-0 hu-mt-2 hu-text-sm hu-text-slate-600">{strain.presentaciones.length} presentaciones disponibles</p>
                                        <p className="hu-mb-0 hu-mt-2 hu-font-bold hu-text-green-700">Desde {formatCOP(strain.precioDesde)}</p>
                                    </div>
                                </NavLink>
                            );
                        })}
                    </div>
                </>
            )}
            {!isPending && !isError && (strains.length > 0 || page > 0) && (
                    <div className="hu-flex hu-flex-wrap hu-items-center hu-justify-between hu-gap-3">
                        <span className="hu-text-sm hu-text-slate-600">
                            Página {(data?.page ?? page) + 1} de {Math.max(data?.totalPages ?? 0, 1)} · {data?.totalElements ?? 0} cepas
                        </span>
                        <div className="hu-flex hu-gap-2">
                            <Button type="button" variant="secondary" disabled={page === 0 || isFetching} onClick={() => setPage((current) => current - 1)}>Anterior</Button>
                            <Button type="button" variant="secondary" disabled={page + 1 >= (data?.totalPages ?? 0) || isFetching} onClick={() => setPage((current) => current + 1)}>Siguiente</Button>
                        </div>
                    </div>
            )}
        </section>
    );
}

export default MarketplaceProductList;
