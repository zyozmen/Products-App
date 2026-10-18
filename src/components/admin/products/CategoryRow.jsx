import React from "react";
import { isExistingCategorySelected } from "./CreateProductHelper.js";

const CategoryRow = ({
    category,
    index,
    availableCategories,
    onNameChange,
    onIdChange,
    onRemove,
    canRemove,
    t,
}) => {
    const hasSelectedExistingCategory = isExistingCategorySelected(category, availableCategories);

    return (
        <div className="hu-mb-3 hu-rounded-xl hu-border hu-border-slate-200 hu-p-4">
            <div className="hu-grid hu-items-end hu-gap-3 md:hu-grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto]">
                <div className="hu-grid hu-gap-1.5">
                    <label className="hu-text-sm hu-font-medium hu-text-slate-700">{t('category_name')}</label>
                    <input
                        type="search"
                        className="hu-w-full hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-2.5 hu-text-sm"
                        list="available-category-names"
                        placeholder={t('search_category_name')}
                        value={category.name}
                        disabled={hasSelectedExistingCategory}
                        onChange={(e) => onNameChange(e.target.value)}
                    />
                </div>
                <div className="hu-grid hu-gap-1.5">
                    <label className="hu-text-sm hu-font-medium hu-text-slate-700">{t('category_id')}</label>
                    <input
                        type="search"
                        className="hu-w-full hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-2.5 hu-text-sm"
                        list="available-category-ids"
                        placeholder={t('search_category_id')}
                        value={category.category_id}
                        onChange={(e) => onIdChange(e.target.value)}
                    />
                </div>
                <div>
                    <button
                        type="button"
                        className="hu-w-full hu-cursor-pointer hu-rounded-lg hu-border-0 hu-bg-red-700 hu-px-3 hu-py-2.5 hu-font-semibold hu-text-white hover:hu-bg-red-800 disabled:hu-cursor-not-allowed disabled:hu-bg-red-300 md:hu-w-auto"
                        aria-label={t('remove_category')}
                        onClick={() => onRemove()}
                        disabled={!canRemove}
                    >
                        &times;
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryRow;
