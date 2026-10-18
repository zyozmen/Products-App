import useTranslation from '../../hooks/useTranslation.js';
import { formatCOP } from '../../Interfaces/ProductInterface.js';

const PRICE_RANGES = [
    { id: 'price-1', minPrice: 0, maxPrice: 50000 },
    { id: 'price-2', minPrice: 50000, maxPrice: 100000 },
    { id: 'price-3', minPrice: 100000, maxPrice: 150000 },
    { id: 'price-4', minPrice: 150000, maxPrice: 200000 },
    { id: 'price-5', minPrice: 200000, maxPrice: 250000 },
    { id: 'price-6', minPrice: 250000, maxPrice: 300000 },
];

function PriceFilter({ minPrice, maxPrice, onPriceRangeChange }) {
    const t = useTranslation();
    const isAllSelected = minPrice === null && maxPrice === null;

    return (
        <div className="hu-rounded-xl hu-border hu-border-slate-200 hu-bg-white hu-p-4">
            <div className="hu-grid hu-gap-3">
                <label className="hu-flex hu-items-center hu-gap-3 hu-text-sm hu-text-slate-700">
                    <input
                        type="checkbox"
                        className="hu-h-4 hu-w-4 hu-accent-blue-700"
                        checked={isAllSelected}
                        onChange={() => onPriceRangeChange?.({ minPrice: null, maxPrice: null })}
                        id="price-all"
                    />
                    {t('all_price')}
                </label>
                {PRICE_RANGES.map((range) => (
                    <label key={range.id} className="hu-flex hu-items-center hu-gap-3 hu-text-sm hu-text-slate-700" htmlFor={range.id}>
                        <input
                            id={range.id}
                            type="checkbox"
                            className="hu-h-4 hu-w-4 hu-accent-blue-700"
                            checked={minPrice === range.minPrice && maxPrice === range.maxPrice}
                            onChange={() => onPriceRangeChange?.({ minPrice: range.minPrice, maxPrice: range.maxPrice })}
                        />
                        {formatCOP(range.minPrice)} - {formatCOP(range.maxPrice)}
                    </label>
                ))}
            </div>
        </div>
    );
}

export default PriceFilter;
