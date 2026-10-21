import React from 'react';
import { useCategories } from '../../hooks/useApiQueries.ts';
import useTranslation from '../../hooks/useTranslation.js';

// Filtra por category_id pero muestra el nombre de la categoría.
function ActiveCategoryFilter({ selectedCategoryIds = [], onCategorySelectionChange }) {
    const t = useTranslation();
    const { data: categories = [] } = useCategories();

    if (selectedCategoryIds.length === 0) return null;

    const nameFor = (id) => categories.find((category) => String(category.category_id) === String(id))?.name || id;

    return (
        <div className="hu-mb-4 hu-flex hu-flex-wrap hu-items-center hu-gap-2" aria-label={t('active_category_filter')}>
            <span className="hu-text-sm hu-font-semibold hu-text-slate-600">{t('active_category_filter')}:</span>
            {selectedCategoryIds.map((id) => (
                <span key={id} className="hu-inline-flex hu-items-center hu-gap-2 hu-rounded-full hu-bg-green-100 hu-px-3 hu-py-1 hu-text-sm hu-font-semibold hu-text-green-800">
                    {nameFor(id)}
                    <button
                        type="button"
                        className="hu-cursor-pointer hu-border-0 hu-bg-transparent hu-p-0 hu-text-green-800"
                        aria-label={`${t('clear_category_filter')}: ${nameFor(id)}`}
                        onClick={() => onCategorySelectionChange?.(selectedCategoryIds.filter((selectedId) => selectedId !== id))}
                    >
                        &times;
                    </button>
                </span>
            ))}
        </div>
    );
}

export default ActiveCategoryFilter;
