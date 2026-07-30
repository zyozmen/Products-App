
import React, { Component } from "react";

class PriceFilter extends Component {
    constructor(props) {
        super(props);
        this.handleAllPricesChange = this.handleAllPricesChange.bind(this);
        this.handlePriceRangeChange = this.handlePriceRangeChange.bind(this);
    }

    handleAllPricesChange() {
        const { onPriceRangeChange } = this.props;
        if (onPriceRangeChange) {
            onPriceRangeChange({ minPrice: null, maxPrice: null });
        }
    }

    handlePriceRangeChange(minPrice, maxPrice) {
        const { onPriceRangeChange } = this.props;
        if (onPriceRangeChange) {
            onPriceRangeChange({ minPrice, maxPrice });
        }
    }

    render() {
        const { minPrice, maxPrice } = this.props;
        const priceRanges = [
            { id: "price-1", label: "$0 - $100", minPrice: 0, maxPrice: 100 },
            { id: "price-2", label: "$100 - $200", minPrice: 100, maxPrice: 200 },
            { id: "price-3", label: "$200 - $300", minPrice: 200, maxPrice: 300 },
            { id: "price-4", label: "$300 - $400", minPrice: 300, maxPrice: 400 },
            { id: "price-5", label: "$400 - $500", minPrice: 400, maxPrice: 500 },
        ];
        const isAllSelected = minPrice === null && maxPrice === null;

        return (
            <div className="bg-light p-4 mb-30">
                <form>
                    <div className="custom-control custom-checkbox d-flex align-items-center justify-content-between mb-3">
                        <input
                            type="checkbox"
                            className="custom-control-input"
                            checked={isAllSelected}
                            onChange={this.handleAllPricesChange}
                            id="price-all"
                        />
                        <label className="custom-control-label" htmlFor="price-all">
                            All Price
                        </label>
                        <span className="badge border font-weight-normal">1000</span>
                    </div>
                    {priceRanges.map((range, index) => (
                        <div
                            key={range.id}
                            className={`custom-control custom-checkbox d-flex align-items-center justify-content-between ${index === priceRanges.length - 1 ? "" : "mb-3"}`}
                        >
                            <input
                                type="checkbox"
                                className="custom-control-input"
                                checked={minPrice === range.minPrice && maxPrice === range.maxPrice}
                                onChange={() => this.handlePriceRangeChange(range.minPrice, range.maxPrice)}
                                id={range.id}
                            />
                            <label className="custom-control-label" htmlFor={range.id}>
                                {range.label}
                            </label>
                            <span className="badge border font-weight-normal">-</span>
                        </div>
                    ))}
                </form>
            </div>
        );
    }
}

export default PriceFilter;