
import React, { Component } from "react";
import translationService from "../../services/TranslationService";
import { formatCOP } from "../../Interfaces/ProductInterface";

const PRICE_RANGES = [
    { id: "price-1", minPrice: 0, maxPrice: 50000 },
    { id: "price-2", minPrice: 50000, maxPrice: 100000 },
    { id: "price-3", minPrice: 100000, maxPrice: 150000 },
    { id: "price-4", minPrice: 150000, maxPrice: 200000 },
    { id: "price-5", minPrice: 200000, maxPrice: 250000 },
    { id: "price-6", minPrice: 250000, maxPrice: 300000 },
];

class PriceFilter extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentLanguage: translationService.getLanguage(),
        };
        this.handleAllPricesChange = this.handleAllPricesChange.bind(this);
        this.handlePriceRangeChange = this.handlePriceRangeChange.bind(this);
        this.unsubscribeFromLanguage = null;
    }

    componentDidMount() {
        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });
    }

    componentWillUnmount() {
        if (this.unsubscribeFromLanguage) {
            this.unsubscribeFromLanguage();
        }
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
        const t = (key) => translationService.t(key);
        const priceRanges = PRICE_RANGES;
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
                            {t('all_price')}
                        </label>
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
                                {formatCOP(range.minPrice)} - {formatCOP(range.maxPrice)}
                            </label>
                        </div>
                    ))}
                </form>
            </div>
        );
    }
}

export default PriceFilter;