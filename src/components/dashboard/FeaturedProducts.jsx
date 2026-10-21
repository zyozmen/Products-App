import { NavLink } from 'react-router-dom';
import useTranslation from '../../hooks/useTranslation.js';
import { formatCOP } from '../../Interfaces/ProductInterface.js';
import { MOCK_FEATURED_PRODUCTS } from '../../mocks/featuredProducts.js';

function FeaturedProducts() {
    const t = useTranslation();
    const products = MOCK_FEATURED_PRODUCTS;

    return (
        <section className="hu-bg-[#f4f5ef] hu-px-4 hu-py-12 dark:hu-bg-[#101b14]" aria-labelledby="featured-products-title">
            <h2 id="featured-products-title" className="hu-mb-8 hu-mt-0 hu-flex hu-items-center hu-justify-center hu-gap-3 hu-text-center hu-text-2xl hu-font-extrabold hu-uppercase hu-tracking-[0.2em] hu-text-[#1b2a1f] dark:hu-text-white">
                <i className="fas fa-star hu-text-[#f5c518]" aria-hidden="true" />
                {t('featured_of_the_month')}
            </h2>
            <div className="hu-mx-auto hu-grid hu-max-w-7xl hu-gap-6 sm:hu-grid-cols-2 lg:hu-grid-cols-4">
                {products.map((product) => (
                    <NavLink
                        key={product.id}
                        to="/shop"
                        className="hu-block hu-overflow-hidden hu-rounded-2xl hu-bg-white hu-text-white hu-no-underline hu-shadow-md hu-transition hu-duration-200 hover:-hu-translate-y-1 hover:hu-shadow-lg"
                    >
                        <img className="hu-block hu-aspect-square hu-w-full hu-bg-white hu-object-cover" src={product.image} alt={product.name} loading="lazy" />
                        <div className="hu-bg-[#1a5e33] hu-px-4 hu-py-3 hu-text-center">
                            <span className="hu-block hu-truncate hu-text-base hu-font-semibold hu-text-white">{product.name}</span>
                            <span className="hu-mt-1 hu-block hu-text-base hu-font-bold hu-text-white">{formatCOP(product.price)}</span>
                        </div>
                    </NavLink>
                ))}
            </div>
        </section>
    );
}

export default FeaturedProducts;
