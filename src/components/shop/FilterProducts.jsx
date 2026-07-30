import React, { Component } from 'react';

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
                        <div className="btn-group">
                            <button
                                type="button"
                                className="btn btn-sm btn-light dropdown-toggle"
                                data-toggle="dropdown"
                            >
                                {selectedSortLabel}
                            </button>
                            <div className="dropdown-menu dropdown-menu-right">
                                {sortOptions.map((option) => (
                                    <button
                                        key={option.value || "default"}
                                        type="button"
                                        className="dropdown-item"
                                        onClick={() => onSortByChange && onSortByChange(option.value)}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="btn-group ml-2">
                            <button
                                type="button"
                                className="btn btn-sm btn-light dropdown-toggle"
                                data-toggle="dropdown"
                            >
                                Showing {selectedPageSize}
                            </button>
                            <div className="dropdown-menu dropdown-menu-right">
                                {pageSizeOptions.map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        className="dropdown-item"
                                        onClick={() => onPageSizeChange && onPageSizeChange(size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
export default FeaturedProducts;