import DropdownMenu from '../ui/DropdownMenu';
import useTranslation from '../../hooks/useTranslation.js';

function FeaturedProducts({
    selectedPageSize = 15,
    pageSizeOptions = [15, 30, 45],
    onPageSizeChange,
    selectedSortBy = '',
    onSortByChange,
}) {
    const t = useTranslation();
    const sortOptions = [
        { label: t('default_sort'), value: '' },
        { label: t('price_sort'), value: 'price' },
        { label: t('rating_sort'), value: 'rating' },
    ];
    const selectedSortLabel = sortOptions.find((option) => option.value === selectedSortBy)?.label || t('sorting');
    const dropdownItemClass = 'hu-block hu-w-full hu-rounded-md hu-px-3 hu-py-2 hu-text-left hu-text-sm hu-text-slate-700 hover:hu-bg-slate-100';

    return (
        <div className="hu-col-span-full hu-mb-4 hu-flex hu-flex-wrap hu-items-center hu-justify-end hu-gap-2">
            <DropdownMenu label={selectedSortLabel}>
                {sortOptions.map((option) => (
                    <button
                        key={option.value || 'default'}
                        type="button"
                        className={dropdownItemClass}
                        onClick={() => onSortByChange?.(option.value)}
                    >
                        {option.label}
                    </button>
                ))}
            </DropdownMenu>
            <DropdownMenu label={`${t('showing')} ${selectedPageSize}`}>
                {pageSizeOptions.map((size) => (
                    <button
                        key={size}
                        type="button"
                        className={dropdownItemClass}
                        onClick={() => onPageSizeChange?.(size)}
                    >
                        {size}
                    </button>
                ))}
            </DropdownMenu>
        </div>
    );
}

export default FeaturedProducts;
