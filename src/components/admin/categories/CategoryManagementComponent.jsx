import { useState } from 'react';
import HeaderComponent from '../../dashboard/HeaderComponent.jsx';
import FooterComponent from '../../dashboard/FooterComponent.jsx';
import AdminNav from '../AdminNav.jsx';
import navigationComponent from '../../navigation/NavigationComponent.jsx';
import useTranslation from '../../../hooks/useTranslation.js';
import { useCategories, useCategoryMutations } from '../../../hooks/useApiQueries.ts';
import { getCategoryImageSrc } from '../../../services/categoryService.js';
import { Button, ErrorNotice } from '../../ui/shadcn';
import CategoryFormModal from './CategoryFormModal.jsx';

const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);

function CategoryManagementComponent() {
    const t = useTranslation();
    const { data: categories = [], isPending, isError, error } = useCategories();
    const { saveCategory } = useCategoryMutations();
    const [editing, setEditing] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [serverError, setServerError] = useState('');
    const [modalKey, setModalKey] = useState(0);
    const isSaving = saveCategory.isPending;

    const openModal = (category = null) => {
        setServerError('');
        setEditing(category);
        setIsModalOpen(true);
    };

    const errorMessage = (error) => {
        const status = error?.response?.status;
        const body = error?.response?.data;
        if (status === 409) return t('category_name_duplicate');
        if (status === 413) return t('category_image_too_large');
        if (status === 403) return t('category_forbidden');
        if (body?.validationErrors?.length) return body.validationErrors.join(' ');
        return body?.message || t('category_save_error');
    };

    const handleSubmit = async (values) => {
        setServerError('');
        try {
            const result = await saveCategory.mutateAsync({ ...values, id: editing?.category_id });
            if (result.imageFailed) {
                // La categoría ya existe: pasa a modo edición para reintentar solo la carga.
                setEditing(result.category);
                setServerError(`${t('category_created_image_pending')} ${errorMessage(result.imageError)}`);
                return;
            }
            setIsModalOpen(false);
        } catch (submitError) {
            setServerError(errorMessage(submitError));
        }
    };
    return (
        <div className="hu-flex hu-min-h-screen hu-flex-col admin-page-bg hu-text-slate-900">
            <HeaderComponentWithNavigation />
            <AdminNav />
            <main className="hu-mx-auto hu-w-full hu-max-w-[1600px] hu-flex-1 hu-px-4 hu-py-8 md:hu-px-8">
                <div className="hu-mb-6 hu-flex hu-flex-wrap hu-items-end hu-justify-between hu-gap-4">
                    <div>
                        <h1 className="hu-m-0 hu-font-display hu-text-3xl hu-text-green-800 admin-title">{t('manage_categories')}</h1>
                        <p className="hu-mb-0 hu-mt-1 hu-text-sm hu-text-[#3f4a41] dark:hu-text-green-200">{t('admin_categories_description')}</p>
                    </div>
                    <Button type="button" onClick={() => openModal()}>{t('create_category')}</Button>
                </div>
                {isPending && <p role="status" className="hu-text-slate-600 dark:hu-text-green-200">{t('loading_categories')}</p>}
                {isError && <ErrorNotice>{error?.message || t('could_not_load_categories')}</ErrorNotice>}
                {!isPending && !isError && categories.length === 0 && <p className="hu-text-slate-600 dark:hu-text-green-200">{t('no_categories_available')}</p>}
                <div className="hu-grid hu-gap-5 sm:hu-grid-cols-2 lg:hu-grid-cols-4">
                    {categories.map((category) => (
                        <article key={category.category_id} className="hu-flex hu-flex-col hu-overflow-hidden hu-rounded-2xl hu-bg-[#12301e] hu-text-white hu-shadow-md hu-transition hu-duration-200 hover:-hu-translate-y-0.5 hover:hu-shadow-lg dark:hu-border dark:hu-border-solid dark:hu-border-[#2f4a38] dark:hu-bg-[#18251e]">
                            <img className="hu-block hu-aspect-[5/4] hu-w-full hu-bg-[#dfe5dc] hu-object-cover" src={getCategoryImageSrc(category)} alt="" loading="lazy" />
                            <div className="hu-grid hu-flex-1 hu-content-start hu-gap-1 hu-px-4 hu-pb-4 hu-pt-3.5">
                                <h2 className="hu-m-0 hu-text-base hu-font-extrabold hu-text-white">{category.name}</h2>
                                <p className="hu-m-0 hu-text-sm hu-text-[#dce9d9]">{category.description || '—'}</p>
                                {category.products_count !== undefined && (
                                    <p className="hu-m-0 hu-text-xs hu-text-green-300">{category.products_count} {t('products_label')}</p>
                                )}
                                <button type="button" className="hu-mt-2.5 hu-min-h-10 hu-cursor-pointer hu-rounded-full hu-border-2 hu-border-solid hu-border-[#5c9b6d] hu-bg-transparent hu-px-4 hu-py-2 hu-text-sm hu-font-bold hu-text-white hu-transition-colors hover:hu-border-[#16833b] hover:hu-bg-[#16833b] focus-visible:hu-outline focus-visible:hu-outline-[3px] focus-visible:hu-outline-offset-2 focus-visible:hu-outline-green-300" onClick={() => openModal(category)}>{t('edit_category')}</button>
                            </div>
                        </article>
                    ))}
                </div>
            </main>
            <FooterComponent />
            {isModalOpen && (
                <CategoryFormModal
                    key={modalKey}
                    category={editing}
                    onCancel={() => setIsModalOpen(false)}
                    onSubmit={handleSubmit}
                    isSaving={isSaving}
                    serverError={serverError}
                    t={t}
                />
            )}
        </div>
    );
}

export default CategoryManagementComponent;
