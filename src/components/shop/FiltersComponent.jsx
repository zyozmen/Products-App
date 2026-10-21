import { useState } from 'react';
import NameFilter from './NameFilter.jsx';
import PriceFilter from './PriceFilter.jsx';
import CategoryFilter from './CategoryFilter.jsx';
import useTranslation from '../../hooks/useTranslation.js';

function FiltersComponent(props) {
    const t = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const sectionTitle = 'hu-mb-3 hu-mt-0 hu-border-b hu-border-slate-200 hu-pb-2 hu-text-sm hu-font-bold hu-uppercase hu-tracking-wide hu-text-slate-700';

    return (
        <div className="hu-min-w-0">
            <button
                type="button"
                className="hu-flex hu-w-full hu-cursor-pointer hu-items-center hu-justify-between hu-min-h-10 hu-rounded-full hu-border-2 hu-border-solid hu-border-[#74a782] hu-bg-white hu-px-4 hu-py-2 hu-text-sm hu-font-bold hu-text-[#116b30] hover:hu-border-[#16833b] hover:hu-bg-[#16833b] hover:hu-text-white dark:hu-border-[#3d6b4c] dark:hu-bg-[#18251e] dark:hu-text-white lg:hu-hidden"
                aria-expanded={isOpen}
                aria-controls="shop-filters-panel"
                onClick={() => setIsOpen((open) => !open)}
            >
                <span>{t('filters_button')}</span>
                <span aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
            </button>
            <aside id="shop-filters-panel" className={`hu-mt-3 hu-content-start hu-gap-5 lg:hu-mt-0 lg:hu-grid ${isOpen ? 'hu-grid' : 'hu-hidden'}`}>
            <section>
                <h2 className={sectionTitle}>{t('filter_by_name')}</h2>
                <NameFilter nameFilter={props.nameFilter} onNameFilterChange={props.onNameFilterChange} />
            </section>
            <section>
                <h2 className={sectionTitle}>{t('filter_by_price')}</h2>
                <PriceFilter minPrice={props.minPrice} maxPrice={props.maxPrice} onPriceRangeChange={props.onPriceRangeChange} />
            </section>
            <section>
                <h2 className={sectionTitle}>{t('filter_by_category')}</h2>
                <CategoryFilter selectedCategoryIds={props.selectedCategoryIds} onCategorySelectionChange={props.onCategorySelectionChange} />
            </section>
        </aside>
        </div>
    );
}

export default FiltersComponent;
