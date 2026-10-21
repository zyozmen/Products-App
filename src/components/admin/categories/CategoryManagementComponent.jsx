import { useState } from 'react';
import HeaderComponent from '../../dashboard/HeaderComponent.jsx';
import FooterComponent from '../../dashboard/FooterComponent.jsx';
import AdminNav from '../AdminNav.jsx';
import navigationComponent from '../../navigation/NavigationComponent.jsx';
import useTranslation from '../../../hooks/useTranslation.js';
import { useCategories, useCategoryMutations } from '../../../hooks/useApiQueries.ts';
import { getCategoryImageSrc } from '../../../services/categoryService.js';
import { Button, Card, ErrorNotice } from '../../ui/shadcn';
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
        <div className="admin-page-bg">
            <HeaderComponentWithNavigation />
            <AdminNav />
            <main className="hu-mx-auto hu-w-full hu-max-w-[1600px] hu-px-4 hu-py-8 md:hu-px-8">
                <div className="hu-mb-6 hu-flex hu-flex-wrap hu-items-center hu-justify-between hu-gap-3">
                    <h1 className="hu-m-0 hu-text-2xl hu-font-bold">{t('manage_categories')}</h1>
                    <Button type="button" onClick={() => openModal()}>{t('create_category')}</Button>
                </div>
                {isPending && <p role="status" className="hu-text-slate-500">{t('loading_categories')}</p>}
                {isError && <ErrorNotice>{error?.message || t('could_not_load_categories')}</ErrorNotice>}
                {!isPending && !isError && categories.length === 0 && <p className="hu-text-slate-500">{t('no_categories_available')}</p>}
                <div className="hu-grid hu-gap-4 sm:hu-grid-cols-2 lg:hu-grid-cols-4">
                    {categories.map((category) => (
                        <Card key={category.category_id} className="hu-overflow-hidden">
                            <img className="hu-h-40 hu-w-full hu-object-cover" src={getCategoryImageSrc(category)} alt="" />
                            <div className="hu-grid hu-gap-1 hu-p-4">
                                <h2 className="hu-m-0 hu-text-base hu-font-bold">{category.name}</h2>
                                <p className="hu-m-0 hu-text-sm hu-text-slate-600">{category.description || '—'}</p>
                                <p className="hu-m-0 hu-text-xs hu-text-slate-500">{category.products_count} {t('products_label')}</p>
                                <Button type="button" variant="secondary" className="hu-mt-2" onClick={() => openModal(category)}>{t('edit_category')}</Button>
                            </div>
                        </Card>
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
