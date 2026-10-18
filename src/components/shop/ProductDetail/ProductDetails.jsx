import { NavLink } from 'react-router-dom';
import AuthenticationService from '../../../services/AuthenticationService.js';
import { useProduct } from '../../../hooks/useApiQueries.ts';
import useTranslation from '../../../hooks/useTranslation.js';
import CartControllsComponent from './CartControllsComponent.jsx';
import ImageCarousel from '../../ui/ImageCarousel.jsx';
import { formatCOP } from '../../../Interfaces/ProductInterface.js';

function ProductDetails({ params }) {
    const t = useTranslation();
    const productId = String(params?.id ?? '');
    const { data: product, isPending, isError, error } = useProduct(productId);

    if (isPending) {
        return <main className="hu-mx-auto hu-max-w-7xl hu-px-4 hu-py-12 hu-text-center hu-text-slate-600" role="status">{t('loading_products')}</main>;
    }
    if (isError || !product) {
        return <main className="hu-mx-auto hu-max-w-7xl hu-px-4 hu-py-12" role="alert">
            <div className="hu-rounded-lg hu-border hu-border-red-200 hu-bg-red-50 hu-p-4 hu-text-red-800">{error?.message || t('could_not_load_products')}</div>
        </main>;
    }

    const categories = Array.isArray(product.categories) ? product.categories : [];
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
                    <p className="hu-mb-6 hu-mt-0 hu-text-2xl hu-font-bold hu-text-green-700">{formatCOP(product.price?.current ?? 0)}</p>
                    <div className="hu-mb-6">
                        <h2 className="hu-mb-2 hu-mt-0 hu-text-sm hu-font-semibold hu-uppercase hu-tracking-wide hu-text-slate-600">{t('categories_title')}</h2>
                        {categories.length > 0 ? (
                            <ul className="hu-m-0 hu-flex hu-list-none hu-flex-wrap hu-gap-2 hu-p-0">
                                {categories.map((category, index) => (
                                    <li key={`${category.name || 'category'}-${index}`} className="hu-rounded-full hu-bg-slate-100 hu-px-3 hu-py-1 hu-text-sm hu-text-slate-700">
                                        {category.name}
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="hu-m-0 hu-text-sm hu-text-slate-500">{t('no_categories_available')}</p>}
                    </div>
                    <CartControllsComponent product={product} />
                    {AuthenticationService.isUserAdmin() && product.id && (
                        <NavLink className="hu-mt-5 hu-inline-flex hu-items-center hu-gap-2 hu-rounded-lg hu-border hu-border-blue-700 hu-px-4 hu-py-2.5 hu-text-sm hu-font-semibold hu-text-blue-700 hover:hu-bg-blue-50" to={`/editProduct/${product.id}`}>
                            <i className="fa fa-edit" aria-hidden="true" />
                            {t('edit_product_title')}
                        </NavLink>
                    )}
                    <div className="hu-mt-8 hu-border-t hu-border-slate-200 hu-pt-6">
                        <h2 className="hu-mb-2 hu-mt-0 hu-text-lg hu-font-bold">{t('product_description')}</h2>
                        <p className="hu-m-0 hu-whitespace-pre-line hu-leading-7 hu-text-slate-700">{product.description}</p>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default ProductDetails;
