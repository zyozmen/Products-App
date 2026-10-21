import DropdownMenu from '../ui/DropdownMenu';
import useTranslation from '../../hooks/useTranslation.js';

function ProductSortBar({
    selectedPageSize = 5,
    pageSizeOptions = [5, 15, 30, 45],
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
    const dropdownItemClass = 'hu-block hu-w-full hu-cursor-pointer hu-rounded-lg hu-border-0 hu-bg-transparent hu-px-3 hu-py-2 hu-text-left hu-text-sm hu-font-semibold hu-text-[#116b30] hover:hu-bg-[#16833b] hover:hu-text-white dark:hu-text-white dark:hover:hu-bg-[#16833b] dark:hover:hu-text-white';

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

export default ProductSortBar;
