
import React, { Component } from "react";
import NameFilter from "./NameFilter";
import PriceFilter from "./PriceFilter";
import CategoryFilter from "./CategoryFilter";
import translationService from "../../services/TranslationService";

class FiltersComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            currentLanguage: translationService.getLanguage(),
        };
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
        const t = (key) => translationService.t(key);

        return (
            <div className="col-lg-3 col-md-4">
                <h5 className="section-title position-relative text-uppercase mb-3">
                    <span className="bg-secondary pr-3">{t('filter_by_name')}</span>
                </h5>
                <NameFilter
                    nameFilter={nameFilter}
                    onNameFilterChange={onNameFilterChange}
                />

                <h5 className="section-title position-relative text-uppercase mb-3">
                    <span className="bg-secondary pr-3">{t('filter_by_price')}</span>
                </h5>
                <PriceFilter
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    onPriceRangeChange={onPriceRangeChange}
                />

                <h5 className="section-title position-relative text-uppercase mb-3">
                    <span className="bg-secondary pr-3">{t('filter_by_category')}</span>
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