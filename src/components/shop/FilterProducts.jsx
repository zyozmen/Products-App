import React, { Component } from 'react';
import DropdownMenu from '../ui/DropdownMenu';

class FeaturedProducts extends Component {
    render() {
        const {
            selectedPageSize = 15,
            pageSizeOptions = [15, 30, 45],
            onPageSizeChange,
            selectedSortBy = "",
            onSortByChange,
        } = this.props;

        const sortOptions = [
            { label: "Default", value: "" },
            { label: "Price", value: "price" },
            { label: "Best Rating", value: "rating" },
        ];
        const selectedSortLabel = sortOptions.find((option) => option.value === selectedSortBy)?.label || "Sorting";
        return (

            <div className="col-12 pb-1">
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="ml-2">
                        <DropdownMenu label={selectedSortLabel}>
                            {sortOptions.map((option) => (
                                <button
                                    key={option.value || "default"}
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => onSortByChange?.(option.value)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </DropdownMenu>
                        <DropdownMenu label={`Showing ${selectedPageSize}`} className="ml-2">
                            {pageSizeOptions.map((size) => (
                                <button
                                    key={size}
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => onPageSizeChange?.(size)}
                                >
                                    {size}
                                </button>
                            ))}
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        )
    }
}
export default FeaturedProducts;