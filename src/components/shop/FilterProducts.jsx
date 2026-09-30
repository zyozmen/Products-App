import React, { Component } from 'react';
import DropdownMenu from '../ui/DropdownMenu';
import translationService from '../../services/TranslationService';

class FeaturedProducts extends Component {
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
            selectedPageSize = 15,
            pageSizeOptions = [15, 30, 45],
            onPageSizeChange,
            selectedSortBy = "",
            onSortByChange,
        } = this.props;
        const t = (key) => translationService.t(key);

        const sortOptions = [
            { label: t('default_sort'), value: "" },
            { label: t('price_sort'), value: "price" },
            { label: t('rating_sort'), value: "rating" },
        ];
        const selectedSortLabel = sortOptions.find((option) => option.value === selectedSortBy)?.label || t('sorting');
        const showingLabel = t('showing');
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
                        <DropdownMenu label={`${showingLabel} ${selectedPageSize}`} className="ml-2">
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