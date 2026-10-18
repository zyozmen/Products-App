import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import FilterProducts from './FilterProducts.jsx';
import cartService from '../../services/CartService.js';
import AuthenticationService from '../../services/AuthenticationService.js';
import { formatCOP } from '../../Interfaces/ProductInterface.js';
import ConfirmationModal from '../ui/ConfirmationModal.jsx';
import { useProductList } from '../../hooks/useApiQueries.ts';
import useTranslation from '../../hooks/useTranslation.js';
import { Button } from '../ui/shadcn';

function ProductListComponent({ selectedCategoryIds = [], filters = {}, selectedSortBy, onSortByChange, location }) {
    const t = useTranslation();
    const [pageNumber, setPageNumber] = useState(0);
    const [pageSize, setPageSize] = useState(15);
    const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);
    const queryParams = useMemo(() => new URLSearchParams(location?.search || ''), [location?.search]);
    const searchTerm = queryParams.get('name') || queryParams.get('search') || '';
    const categoryKey = selectedCategoryIds.join(',');
    const filterKey = JSON.stringify(filters);

    useEffect(() => {
        setPageNumber(0);
    }, [searchTerm, categoryKey, filterKey]);

    const normalizedFilters = useMemo(() => ({
        searchTerm,
        categoryIds: selectedCategoryIds,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minRating: filters.minRating,
        maxRating: filters.maxRating,
    }), [searchTerm, categoryKey, filterKey]);
    const { data, isPending, isError, error } = useProductList(pageNumber, pageSize, normalizedFilters);
    const products = data?.products ?? [];
    const pagination = data?.pagination;
    const totalPages = pagination?.totalPages ?? 0;
    const first = pagination?.first ?? true;
    const last = pagination?.last ?? true;

    const visiblePages = useMemo(() => {
        if (!totalPages) return [];
        const maxVisiblePages = 10;
        const halfWindow = Math.floor(maxVisiblePages / 2);
        const start = Math.max(0, pageNumber - halfWindow);
        const end = Math.min(totalPages - 1, start + maxVisiblePages - 1);
        const adjustedStart = Math.max(0, end - maxVisiblePages + 1);
        return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
    }, [pageNumber, totalPages]);

    const handleAddToCart = (event, product) => {
        event.preventDefault();
        cartService.addToCart({
            id: product.id,
            name: product.name,
            price: product.current_price,
            image: product.image,
        });
        setIsOrderConfirmed(true);
    };

    const renderPaginationControls = () => (
        <div className="hu-col-span-full hu-mt-3">
            <div className="hu-flex hu-flex-wrap hu-items-center hu-justify-between hu-gap-3">
                {!first ? (
                    <Button type="button" variant="secondary" onClick={() => setPageNumber((page) => Math.max(0, page - 1))}>
                        {t('previous')}
                    </Button>
                ) : <div />}
                <ul className="hu-m-0 hu-flex hu-list-none hu-flex-wrap hu-items-center hu-gap-1 hu-p-0">
                    {visiblePages.map((page) => (
                        <li key={page}>
                            <button type="button" aria-current={page === pageNumber ? 'page' : undefined} className={`hu-h-9 hu-min-w-9 hu-cursor-pointer hu-rounded-lg hu-border hu-px-3 hu-text-sm ${page === pageNumber ? 'hu-border-green-700 hu-bg-green-700 hu-text-white' : 'hu-border-slate-300 hu-bg-white hu-text-slate-700 hover:hu-bg-slate-50'}`} onClick={() => setPageNumber(page)}>
                                {page + 1}
                            </button>
                        </li>
                    ))}
                </ul>
                {!last ? (
                    <Button type="button" variant="secondary" onClick={() => setPageNumber((page) => page + 1)}>
                        {t('next')}
                    </Button>
                ) : <div />}
            </div>
            <div className="hu-mt-3 hu-text-center hu-text-xs hu-text-slate-500">
                {pagination?.numberOfElements ?? 0} {t('of')} {pagination?.totalElements ?? 0} | {t('page')} {totalPages ? pageNumber + 1 : 0} {t('of')} {totalPages}
            </div>
        </div>
    );

    const isUserAdmin = AuthenticationService.isUserLoggedIn() && AuthenticationService.isUserAdmin();
    return (
        <div className="hu-min-w-0">
            <div className="hu-grid hu-gap-4 sm:hu-grid-cols-2 xl:hu-grid-cols-3">
                <FilterProducts
                    selectedPageSize={pageSize}
                    pageSizeOptions={[15, 30, 45]}
                    onPageSizeChange={(nextPageSize) => {
                        setPageSize(Number(nextPageSize));
                        setPageNumber(0);
                    }}
                    selectedSortBy={selectedSortBy}
                    onSortByChange={onSortByChange}
                />
                {isPending && <div className="hu-col-span-full hu-py-8 hu-text-center hu-text-slate-500" role="status">{t('loading_products')}</div>}
                {isError && <div className="hu-col-span-full hu-rounded-lg hu-border hu-border-red-200 hu-bg-red-50 hu-p-4 hu-text-red-800" role="alert">{error?.message || t('could_not_load_products')}</div>}
                {data && products.length > 0 && renderPaginationControls()}
                {!isPending && !isError && products.length === 0 && (
                    <div className="hu-col-span-full hu-py-8 hu-text-center"><h1 className="hu-text-xl hu-font-semibold">{t('product_not_found')}</h1></div>
                )}
                {products.map((product) => {
                    const status = String(product.status ?? '').toUpperCase();
                    const isInactive = status === 'INACTIVE';
                    const isDraft = status === 'DRAFT';
                    const productImage = (
                        <div className="hu-group hu-relative hu-overflow-hidden hu-bg-slate-100">
                            {isInactive ? (
                                <img
                                    className="hu-h-[280px] hu-w-full hu-object-cover hu-transition hu-duration-300 group-hover:hu-scale-105"
                                    src={product.foto_principal || '/img/no_image.jpg'}
                                    alt={product.name}
                                />
                            ) : (
                                <NavLink to={`/product/${product.id}`} aria-label={`${t('view_details')}: ${product.name}`}>
                                    <img
                                        className="hu-h-[280px] hu-w-full hu-object-cover hu-transition hu-duration-300 group-hover:hu-scale-105"
                                        src={product.foto_principal || '/img/no_image.jpg'}
                                        alt={product.name}
                                    />
                                </NavLink>
                            )}
                            <div className="hu-absolute hu-inset-x-0 hu-bottom-3 hu-flex hu-translate-y-2 hu-justify-center hu-gap-2 hu-opacity-0 hu-transition group-hover:hu-translate-y-0 group-hover:hu-opacity-100 focus-within:hu-translate-y-0 focus-within:hu-opacity-100">
                                {!isInactive && !isDraft && (
                                    <button type="button" className="hu-grid hu-h-10 hu-w-10 hu-cursor-pointer hu-place-items-center hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-text-slate-800 hover:hu-bg-green-700 hover:hu-text-white" onClick={(event) => handleAddToCart(event, product)} aria-label={t('add_to_cart')}>
                                        <i className="fa fa-shopping-cart" aria-hidden="true" />
                                    </button>
                                )}
                                {!isInactive && (
                                    <NavLink className="hu-grid hu-h-10 hu-w-10 hu-place-items-center hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-text-center hu-text-slate-800 hover:hu-bg-green-700 hover:hu-text-white" to={`/product/${product.id}`} aria-label={t('view_details')}>
                                        <i className="fa fa-search" aria-hidden="true" />
                                    </NavLink>
                                )}
                                {isUserAdmin && (
                                    <NavLink className="hu-grid hu-h-10 hu-w-10 hu-place-items-center hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-text-center hu-text-slate-800 hover:hu-bg-green-700 hover:hu-text-white" to={`/editProduct/${product.id}`} aria-label={t('edit_product_title')}>
                                        <i className="fa fa-edit" aria-hidden="true" />
                                    </NavLink>
                                )}
                            </div>
                        </div>
                    );
                    return (
                        <div key={product.id} className="hu-overflow-hidden hu-rounded-xl hu-border hu-border-slate-200 hu-bg-white hu-shadow-sm">
                            <div className={`${isInactive ? 'hu-opacity-50' : ''}${isDraft ? ' hu-border-t-4 hu-border-amber-400' : ''}`}>
                                {productImage}
                                <div className="hu-p-4 hu-text-center">
                                    {isInactive ? (
                                        <span className="hu-block hu-truncate hu-font-semibold">{product.name}</span>
                                    ) : (
                                        <NavLink className="hu-block hu-truncate hu-font-semibold hu-text-slate-900 hu-no-underline hover:hu-text-green-700" to={`/product/${product.id}`}>
                                            {product.name}
                                        </NavLink>
                                    )}
                                    <div className="hu-mt-2 hu-flex hu-items-center hu-justify-center hu-gap-2">
                                        <h3 className="hu-m-0 hu-text-base hu-font-bold hu-text-slate-900">{formatCOP(product.current_price)}</h3>
                                        {product.original_price && Number(product.original_price) !== Number(product.current_price) && (
                                            <span className="hu-text-sm hu-text-slate-500"><del>{formatCOP(product.original_price)}</del></span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {data && products.length > 0 && renderPaginationControls()}
            </div>
            {isOrderConfirmed && (
                <ConfirmationModal
                    title={t('product_added_to_cart')}
                    acceptLabel={t('accept')}
                    onAccept={(event) => {
                        event.preventDefault();
                        setIsOrderConfirmed(false);
                    }}
                />
            )}
        </div>
    );
}

export default ProductListComponent;
