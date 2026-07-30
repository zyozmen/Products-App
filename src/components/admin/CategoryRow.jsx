import React from "react";
import { isExistingCategorySelected } from "./CreateProductHelper.js";

const CategoryRow = ({
    category,
    index,
    availableCategories,
    onNameChange,
    onIdChange,
    onSlugChange,
    onRemove,
    canRemove,
}) => {
    const hasSelectedExistingCategory = isExistingCategorySelected(category, availableCategories);

    return (
        <div className="border rounded p-3 mb-2">
            <div className="form-row align-items-end">
                <div className="form-group col-md-4">
                    <label>Name</label>
                    <input
                        type="search"
                        className="form-control"
                        list="available-category-names"
                        placeholder="Search by category name"
                        value={category.name}
                        disabled={hasSelectedExistingCategory}
                        onChange={(e) => onNameChange(e.target.value)}
                    />
                </div>
                <div className="form-group col-md-4">
                    <label>Slug</label>
                    <input
                        type="text"
                        className="form-control"
                        value={category.slug}
                        disabled={hasSelectedExistingCategory}
                        onChange={(e) => onSlugChange(e.target.value)}
                    />
                </div>
                <div className="form-group col-md-3">
                    <label>Category ID</label>
                    <input
                        type="search"
                        className="form-control"
                        list="available-category-ids"
                        placeholder="Search by category id"
                        value={category.category_id}
                        onChange={(e) => onIdChange(e.target.value)}
                    />
                </div>
                <div className="form-group col-md-1">
                    <button
                        type="button"
                        className="btn btn-danger btn-sm w-100"
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
