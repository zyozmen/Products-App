import React from 'react';
import navigationComponent from '../navigation/NavigationComponent.jsx';
import { useCategories } from '../../hooks/useApiQueries.ts';
import useTranslation from '../../hooks/useTranslation.js';
import { getCategoryImageSrc } from '../../services/categoryService.js';
import './CategoryComponent.css';

const SKELETON_COUNT = 4;

function CategoryComponent({ navigate }) {
    const t = useTranslation();
    const { data: categories = [], isPending, isError, error, refetch } = useCategories();
    const isEmpty = !isPending && !isError && categories.length === 0;

    return (
        <section className="category-section" aria-labelledby="category-heading">
            <h2 id="category-heading" className="category-heading">
                {t('explore_universe_prefix')} <span>{t('explore_universe_highlight')}</span>
            </h2>
            <div className="category-grid" aria-busy={isPending}>
                {isPending && Array.from({ length: SKELETON_COUNT }, (_, index) => (
                    <div key={index} className="category-skeleton" aria-hidden="true" />
                ))}
                {isPending && <span className="hu-sr-only" role="status">{t('loading_categories')}</span>}
                {categories.map((category) => (
                    <button
                        key={category.category_id}
                        type="button"
                        className="category-card"
                        onClick={() => navigate(`/shop?category=${encodeURIComponent(category.category_id)}`)}
                    >
                        <span className="category-card-media">
                            <img src={getCategoryImageSrc(category)} alt="" loading="lazy" />
                            <span className="category-card-label">{category.name}</span>
                        </span>
                    </button>
                ))}
                {isError && (
                    <div className="category-message category-message-error" role="alert">
                        <p>{error?.message || t('could_not_load_categories')}</p>
                        <button type="button" className="hu-cursor-pointer hu-underline" onClick={() => refetch()}>{t('retry')}</button>
                    </div>
                )}
                {isEmpty && <div className="category-message"><p>{t('no_categories_available')}</p></div>}
            </div>
        </section>
    );
}

export default navigationComponent(CategoryComponent);
