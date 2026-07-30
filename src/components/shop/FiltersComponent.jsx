
import React, { Component } from "react";
import NameFilter from "./NameFilter";
import PriceFilter from "./PriceFilter";
import CategoryFilter from "./CategoryFilter";

class FiltersComponent extends Component {

    render() {
        const {
            selectedCategoryIds,
            onCategorySelectionChange,
            minPrice,
            maxPrice,
            onPriceRangeChange,
            nameFilter,
            onNameFilterChange,
        } = this.props;

        return (
            <div className="col-lg-3 col-md-4">
                <h5 className="section-title position-relative text-uppercase mb-3">
                    <span className="bg-secondary pr-3">Filtrar por Nombre</span>
                </h5>
                <NameFilter
                    nameFilter={nameFilter}
                    onNameFilterChange={onNameFilterChange}
                />

                <h5 className="section-title position-relative text-uppercase mb-3">
                    <span className="bg-secondary pr-3">Filtrar por Precio</span>
                </h5>
                <PriceFilter
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    onPriceRangeChange={onPriceRangeChange}
                />

                <h5 className="section-title position-relative text-uppercase mb-3">
                    <span className="bg-secondary pr-3">Filtrar por Categoría</span>
                </h5>
                <CategoryFilter
                    selectedCategoryIds={selectedCategoryIds}
                    onCategorySelectionChange={onCategorySelectionChange}
                />
            </div>
        );
    }
}
export default FiltersComponent;