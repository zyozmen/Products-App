import React from 'react';
import navigationComponent from '../navigation/NavigationComponent.jsx';
import { useCategories } from '../../hooks/useApiQueries.ts';
import useTranslation from '../../hooks/useTranslation.js';

function CategoryComponent({ navigate }) {
    const t = useTranslation();
    const { data: categories = [], isPending, isError, error } = useCategories();

    return (
        <section className="hu-mx-auto hu-max-w-7xl hu-px-4 hu-py-8 sm:hu-px-6 lg:hu-px-8">
            <h2 className="hu-mb-5 hu-border-b hu-border-slate-200 hu-pb-3 hu-text-xl hu-font-bold hu-uppercase hu-tracking-wide">{t('categories')}</h2>
            <div className="hu-grid hu-gap-4 sm:hu-grid-cols-2 lg:hu-grid-cols-4">
                {categories.map((category) => (
                    <div key={category.category_id}>
                        <button
                            type="button"
                            className="hu-flex hu-w-full hu-cursor-pointer hu-items-center hu-gap-4 hu-rounded-xl hu-border hu-border-slate-200 hu-bg-white hu-p-3 hu-text-left hu-transition hover:hu-border-green-600 hover:hu-shadow-md"
                            onClick={() => navigate(`/shop?category=${encodeURIComponent(category.category_id)}`)}
                        >
                            <img className="hu-h-24 hu-w-24 hu-shrink-0 hu-rounded-lg hu-object-cover" src={`/img/cat-${category.category_id}.jpg`} alt="" />
                            <span className="hu-min-w-0">
                                <span className="hu-block hu-truncate hu-font-bold hu-text-slate-900">{category.name}</span>
                                <span className="hu-text-sm hu-text-slate-600">{category.products_count} {t('products_label')}</span>
                            </span>
                        </button>
                    </div>
                ))}
                {isPending && <div className="hu-col-span-full hu-py-8 hu-text-center hu-text-slate-500" role="status">{t('loading_categories')}</div>}
                {isError && <div className="hu-col-span-full hu-py-8 hu-text-center hu-text-red-700" role="alert">{error.message}</div>}
                {!isPending && !isError && categories.length === 0 && (
                    <div className="hu-col-span-full hu-py-8 hu-text-center hu-text-slate-500"><p>{t('no_categories_available')}</p></div>
                )}
            </div>
        </section>
    );
}

export default navigationComponent(CategoryComponent);