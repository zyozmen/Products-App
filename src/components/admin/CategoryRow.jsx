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
        <div className="border rounded p-3 mb-2">
            <div className="form-row align-items-end">
                <div className="form-group col-md-6">
                    <label>{t('category_name')}</label>
                    <input
                        type="search"
                        className="form-control"
                        list="available-category-names"
                        placeholder={t('search_category_name')}
                        value={category.name}
                        disabled={hasSelectedExistingCategory}
                        onChange={(e) => onNameChange(e.target.value)}
                    />
                </div>
                <div className="form-group col-md-5">
                    <label>{t('category_id')}</label>
                    <input
                        type="search"
                        className="form-control"
                        list="available-category-ids"
                        placeholder={t('search_category_id')}
                        value={category.category_id}
                        onChange={(e) => onIdChange(e.target.value)}
                    />
                </div>
                <div className="form-group col-md-1">
                    <button
                        type="button"
                        className="btn btn-danger btn-sm w-100"
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
