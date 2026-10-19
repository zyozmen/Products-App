import React from 'react';
import { useCategories } from '../../hooks/useApiQueries.ts';
import useTranslation from '../../hooks/useTranslation.js';

function CategoryFilter({ selectedCategoryIds = [], onCategorySelectionChange }) {
    const t = useTranslation();
    const { data: categories = [], isPending, isError, error } = useCategories();
    const totalProductsInCategories = categories.reduce(
        (total, category) => total + Number(category.products_count ?? 0),
        0,
    );

    const toggleCategory = (categoryId) => {
        const id = String(categoryId);
        const next = selectedCategoryIds.includes(id)
            ? selectedCategoryIds.filter((selectedId) => selectedId !== id)
            : [...selectedCategoryIds, id];
        onCategorySelectionChange?.(next);
    };

    return (
        <section className="hu-rounded-xl hu-border hu-border-slate-200 hu-bg-white hu-p-4 kanban-board">
            <div className="hu-mb-3 hu-flex hu-items-center hu-justify-between hu-gap-3 ">
                <input
                    type="checkbox"
                    className="hu-h-4 hu-w-4 hu-accent-blue-700"
                    checked={selectedCategoryIds.length === 0}
                    onChange={() => onCategorySelectionChange?.([])}
                    id="category-all"
                />
                <label className="hu-flex-1 hu-cursor-pointer hu-text-sm hu-font-medium hu-text-slate-700" htmlFor="category-all">{t('all_categories')}</label>
                <span className="hu-rounded-full hu-border hu-border-slate-200 hu-px-2.5 hu-py-1 hu-text-xs hu-text-slate-600">{totalProductsInCategories}</span>
            </div>
            {isPending && <div className="hu-text-sm hu-text-slate-500" role="status">{t('loading_categories')}</div>}
            {isError && <div className="hu-text-sm hu-text-red-700" role="alert">{error?.message || t('could_not_load_categories')}</div>}
            {!isPending && !isError && categories.map((category) => (
                <div key={category.category_id} className="hu-mb-3 hu-flex hu-items-center hu-justify-between hu-gap-3 last:hu-mb-0">
                    <input
                        type="checkbox"
                        className="hu-h-4 hu-w-4 hu-accent-blue-700"
                        checked={selectedCategoryIds.includes(String(category.category_id))}
                        onChange={() => toggleCategory(category.category_id)}
                        id={`category-${category.category_id}`}
                    />
                    <label className="hu-flex-1 hu-cursor-pointer hu-text-sm hu-text-slate-700" htmlFor={`category-${category.category_id}`}>{category.name}</label>
                    <span className="hu-rounded-full hu-border hu-border-slate-200 hu-px-2.5 hu-py-1 hu-text-xs hu-text-slate-600">{category.products_count}</span>
                </div>
            ))}
        </section>
    );
}

export default CategoryFilter;
