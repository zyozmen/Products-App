import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { marketplaceKeys, useMarketplaceDetail } from '../../hooks/useMarketplaceQueries.ts';
import { formatCOP } from '../../Interfaces/ProductInterface.js';
import { Button } from '../ui/shadcn';
import { ProductDetailContent } from './ProductDetail/ProductDetails.jsx';

function imageSource(photo) {
    if (!photo?.filepart) return null;
    const mime = photo.extension === 'jpg' || photo.extension === 'jpeg' ? 'jpeg' : photo.extension;
    return `data:image/${mime};base64,${photo.filepart}`;
}

function MarketplaceProductDetail() {
    const { cepaId = '', presentacionId = '' } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [quantity, setQuantity] = useState(1);
    const { data, isPending, isError, error, refetch } = useMarketplaceDetail(cepaId, presentacionId);

    if (isPending) return <main className="hu-mx-auto hu-max-w-7xl hu-px-4 hu-py-12 hu-text-center" role="status">Cargando producto…</main>;
    if (isError || !data) {
        const unavailable = error?.response?.status === 404;
        return (
            <main className="hu-mx-auto hu-grid hu-max-w-3xl hu-justify-items-center hu-gap-4 hu-px-4 hu-py-12 hu-text-center" role="alert">
                <h1 className="hu-m-0 hu-text-2xl hu-font-bold">{unavailable ? 'Presentación no disponible' : 'No se pudo cargar el producto'}</h1>
                <p className="hu-m-0 hu-text-slate-600">{unavailable ? 'La presentación seleccionada ya no está disponible. Regresa al catálogo para elegir otra.' : (error instanceof Error ? error.message : 'Inténtalo nuevamente.')}</p>
                <div className="hu-flex hu-gap-2">
                    {!unavailable && <Button type="button" variant="secondary" onClick={() => void refetch()}>Reintentar</Button>}
                    <Button type="button" onClick={() => navigate('/shop')}>Volver al catálogo</Button>
                </div>
            </main>
        );
    }

    const selected = data.presentaciones.find((option) => option.presentacionId === presentacionId);
    if (!selected) {
        return <main className="hu-mx-auto hu-max-w-3xl hu-px-4 hu-py-12" role="alert">La presentación seleccionada no está disponible.</main>;
    }
    const photo = imageSource(selected.fotografia) || imageSource(data.fotografia) || '/img/no_image.jpg';
    const product = {
        id: selected.presentacionId,
        cepaId: data.cepaId,
        presentationId: selected.presentacionId,
        name: data.nombre,
        cartName: `${data.nombre} · ${selected.nombre}`,
        presentationName: selected.nombre,
        sku: selected.sku,
        content: selected.contenidoUnidad,
        baseUnit: selected.unidadBase,
        price: { current: selected.precioVenta },
        foto_principal: photo,
        stock: selected.stockDisponible,
    };
    const selectPresentation = (nextId) => {
        queryClient.setQueryData(marketplaceKeys.detail(data.cepaId, nextId), {
            ...data,
            presentacionSeleccionadaId: nextId,
        });
        setQuantity(1);
        navigate(`/producto/${encodeURIComponent(data.cepaId)}/${encodeURIComponent(nextId)}`);
    };

    return (
        <ProductDetailContent product={product} quantity={quantity} onQuantityChange={setQuantity}>
            <fieldset className="hu-m-0 hu-mb-6 hu-min-w-0 hu-border-0 hu-p-0">
                <legend className="hu-mb-2 hu-text-sm hu-font-semibold hu-uppercase hu-tracking-wide hu-text-slate-600">Presentaciones</legend>
                <div className="hu-grid hu-gap-2">
                    {data.presentaciones.map((option) => (
                        <label
                            key={option.presentacionId}
                            className={`hu-flex hu-cursor-pointer hu-items-start hu-gap-3 hu-rounded-lg hu-border hu-p-3 ${option.presentacionId === presentacionId ? 'hu-border-green-700 hu-bg-green-50' : 'hu-border-slate-200 hu-bg-white'}`}
                        >
                            <input
                                type="radio"
                                name="marketplace-presentation"
                                value={option.presentacionId}
                                checked={option.presentacionId === presentacionId}
                                disabled={option.stockDisponible < 1}
                                className="hu-mt-1 hu-h-4 hu-w-4 hu-accent-green-700"
                                onChange={() => selectPresentation(option.presentacionId)}
                            />
                            <span className="hu-grid hu-gap-1 hu-text-sm">
                                <span className="hu-font-semibold hu-text-slate-900">{option.nombre} · {option.contenidoUnidad} {option.unidadBase}</span>
                                <span className="hu-text-slate-600">{formatCOP(option.precioVenta)} · Stock: {option.stockDisponible} · {option.sku}</span>
                            </span>
                        </label>
                    ))}
                </div>
            </fieldset>
        </ProductDetailContent>
    );
}

export default MarketplaceProductDetail;
