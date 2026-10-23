import MarketplaceProductList from './MarketplaceProductList.jsx';
import FiltersComponent from './FiltersComponent.jsx';
import ActiveCategoryFilter from './ActiveCategoryFilter.jsx';

function MarketplaceShopList({ location, navigate }) {
    const params = new URLSearchParams(location?.search || '');
    const search = params.get('buscar') || params.get('name') || '';
    const legacyCategory = params.get('category') || params.get('category_id');
    const selectedCategoryIds = [...new Set(params.has('categoryIds')
        ? params.getAll('categoryIds').flatMap((ids) => ids.split(','))
        : legacyCategory ? [legacyCategory] : [])];
    const minPrice = params.has('minPrice') ? Number(params.get('minPrice')) : null;
    const maxPrice = params.has('maxPrice') ? Number(params.get('maxPrice')) : null;

    const updateParams = (update) => {
        const next = new URLSearchParams(location?.search || '');
        next.delete('page');
        update(next);
        navigate(next.size ? `/shop?${next.toString()}` : '/shop');
    };
    const changeCategories = (ids) => updateParams((next) => {
        ['categoryIds', 'category', 'category_id'].forEach((key) => next.delete(key));
        ids.forEach((id) => next.append('categoryIds', id));
    });
    const changePrice = (range) => updateParams((next) => {
        ['minPrice', 'maxPrice'].forEach((key) => {
            if (range[key] === null) next.delete(key);
            else next.set(key, String(range[key]));
        });
    });
    const changeSearch = (name) => updateParams((next) => {
        next.delete('name');
        if (name.trim()) next.set('buscar', name.trim());
        else next.delete('buscar');
    });

    return (
        <main className="hu-mx-auto hu-grid hu-max-w-7xl hu-items-start hu-gap-6 hu-px-4 hu-py-8 sm:hu-px-6 lg:hu-grid-cols-[280px_minmax(0,1fr)] lg:hu-px-8">
            <FiltersComponent
                selectedCategoryIds={selectedCategoryIds}
                onCategorySelectionChange={changeCategories}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onPriceRangeChange={changePrice}
                nameFilter={search}
                onNameFilterChange={changeSearch}
            />
            <div className="hu-min-w-0">
                <ActiveCategoryFilter selectedCategoryIds={selectedCategoryIds} onCategorySelectionChange={changeCategories} />
                <MarketplaceProductList
                    key={location?.search || ''}
                    search={search}
                    filters={{ categoryIds: selectedCategoryIds, minPrice, maxPrice }}
                />
            </div>
        </main>
    );
}

export default MarketplaceShopList;
