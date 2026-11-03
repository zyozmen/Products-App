import useTranslation from '../../../hooks/useTranslation.js';
import CartControllsComponent from './CartControllsComponent.jsx';
import ImageCarousel from '../../ui/ImageCarousel.jsx';
import { formatCOP } from '../../../Interfaces/ProductInterface.js';

export function ProductDetailContent({ product, quantity, onQuantityChange, children }) {
    const t = useTranslation();
    const selectedQuantity = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;
    const itemImages = [
        ...(product.foto_principal ? [{ id: 'p', src: product.foto_principal }] : []),
        ...(Array.isArray(product.fotos_secundarias)
            ? product.fotos_secundarias.filter(Boolean).map((src, index) => ({ id: `s-${index}`, src }))
            : []),
    ];
    if (itemImages.length === 0) itemImages.push({ id: 'f1', src: '/img/no_image.jpg' });

    return (
        <main className="hu-mx-auto hu-w-full hu-max-w-7xl hu-px-4 hu-py-8 sm:hu-px-6 lg:hu-px-8">
            <div className="hu-grid hu-items-start hu-gap-8 lg:hu-grid-cols-2">
                <div className="hu-overflow-hidden hu-rounded-2xl hu-border hu-border-slate-200 hu-bg-white">
                    <ImageCarousel
                        items={itemImages}
                        altPrefix={t('product_image')}
                        previousLabel={t('image_navigation_previous')}
                        nextLabel={t('image_navigation_next')}
                    />
                </div>
                <section className="hu-rounded-2xl hu-border hu-border-slate-200 hu-bg-white hu-p-6 sm:hu-p-8">
                    <h1 className="hu-mb-3 hu-mt-0 hu-text-3xl hu-font-bold hu-text-slate-900">{product.name}</h1>
                    <p className="hu-mb-6 hu-mt-0 hu-text-2xl hu-font-bold hu-text-green-700" aria-live="polite">{formatCOP((product.price?.current ?? 0) * selectedQuantity)}</p>
                    {children}
                    <CartControllsComponent product={product} quantity={quantity} onQuantityChange={onQuantityChange} />
                    {product.description && <div className="hu-mt-8 hu-border-t hu-border-slate-200 hu-pt-6">
                        <h2 className="hu-mb-2 hu-mt-0 hu-text-lg hu-font-bold">{t('product_description')}</h2>
                        <p className="hu-m-0 hu-whitespace-pre-line hu-leading-7 hu-text-slate-700">{product.description}</p>
                    </div>}
                </section>
            </div>
        </main>
    );
}
