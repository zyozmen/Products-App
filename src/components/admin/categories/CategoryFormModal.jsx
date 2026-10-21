import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ErrorNotice, Field, Input } from '../../ui/shadcn';
import { categorySchema, validateCategoryImage } from '../../../schemas/category';
import { getCategoryImageSrc } from '../../../services/categoryService.js';
import './CategoryFormModal.css';

function CategoryFormModal({ category, onCancel, onSubmit, isSaving, serverError, t }) {
    const isEditing = Boolean(category);
    const [imageFile, setImageFile] = useState(null);
    const [imageError, setImageError] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const form = useForm({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: category?.name ?? '', description: category?.description ?? '' },
    });

    useEffect(() => {
        if (!imageFile) {
            setPreviewUrl('');
            return undefined;
        }
        const url = URL.createObjectURL(imageFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [imageFile]);

    const handleImageChange = (event) => {
        const file = event.target.files?.[0] ?? null;
        const errorKey = validateCategoryImage(file);
        setImageError(errorKey ? t(errorKey) : '');
        setImageFile(errorKey ? null : file);
        if (errorKey) event.target.value = '';
    };

    const submit = form.handleSubmit((values) => {
        if (!isEditing && !imageFile) {
            setImageError(t('category_image_required'));
            return;
        }
        onSubmit({ ...values, image: imageFile });
    });

    const fieldError = (name) => {
        const message = form.formState.errors[name]?.message;
        return message ? t(message) : undefined;
    };
    const currentImage = previewUrl || (isEditing ? getCategoryImageSrc(category) : '');

    return (
        <div className="category-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
            <div className="category-modal">
                <header className="category-modal-header">
                    <h2 id="category-modal-title" className="category-modal-title">
                        {isEditing ? t('edit_category') : t('create_category')}
                    </h2>
                </header>
                <form className="category-modal-form" onSubmit={submit} noValidate>
                    {serverError && <ErrorNotice>{serverError}</ErrorNotice>}
                    <Field label={`${t('category_name')} *`} htmlFor="category-name" error={fieldError('name')}>
                        <Input id="category-name" maxLength={100} aria-invalid={Boolean(form.formState.errors.name)} {...form.register('name')} />
                    </Field>
                    <Field label={t('category_description')} htmlFor="category-description" error={fieldError('description')}>
                        <textarea
                            id="category-description"
                            rows={3}
                            className="hu-w-full hu-px-3 hu-py-2.5 hu-text-sm"
                            {...form.register('description')}
                        />
                    </Field>
                    <Field label={`${t('category_image')}${isEditing ? '' : ' *'}`} htmlFor="category-image" error={imageError} hint={t('category_image_hint')}>
                        <input
                            id="category-image"
                            type="file"
                            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                            aria-invalid={Boolean(imageError)}
                            className="hu-text-sm"
                            onChange={handleImageChange}
                        />
                    </Field>
                    {currentImage && (
                        <img className="category-modal-preview" src={currentImage} alt={t('category_image_preview')} />
                    )}
                    <div className="category-modal-actions">
                        <button type="button" className="category-modal-button category-modal-button-secondary" onClick={onCancel} disabled={isSaving}>{t('cancel')}</button>
                        <button type="submit" className="category-modal-button category-modal-button-primary" disabled={isSaving}>{isSaving ? t('saving_btn') : t('save_category')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default CategoryFormModal;
