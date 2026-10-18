import NameFilter from './NameFilter.jsx';
import PriceFilter from './PriceFilter.jsx';
import CategoryFilter from './CategoryFilter.jsx';
import useTranslation from '../../hooks/useTranslation.js';

function FiltersComponent(props) {
    const t = useTranslation();
    const sectionTitle = 'hu-mb-3 hu-mt-0 hu-border-b hu-border-slate-200 hu-pb-2 hu-text-sm hu-font-bold hu-uppercase hu-tracking-wide hu-text-slate-700';

    return (
        <aside className="hu-grid hu-content-start hu-gap-5">
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
    );
}

export default FiltersComponent;
