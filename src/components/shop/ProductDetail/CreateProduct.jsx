import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useProductMutations } from '../../../hooks/useApiQueries';
import useTranslation from '../../../hooks/useTranslation.js';
import { Button, Card, ErrorNotice, Field, Input, Select } from '../../ui/shadcn';
import { quickCreateProductSchema } from './createProductSchema';

const initialValues = {
    name: '',
    description: '',
    sku: '',
    slug: '',
    status: 'ACTIVE',
    price: '',
    originalPrice: '',
    currency: 'USD',
    taxInclusive: false,
};

function createSlug(name) {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function CreateProduct({ navigate }) {
    const t = useTranslation();
    const { createProduct } = useProductMutations();
    const [serverError, setServerError] = useState('');
    const form = useForm({
        resolver: zodResolver(quickCreateProductSchema),
        defaultValues: initialValues,
    });
    const fieldError = (name) => {
        const message = form.formState.errors[name]?.message;
        return message ? t(message) : undefined;
    };

    const onSubmit = form.handleSubmit(async (values) => {
        setServerError('');
        const currentPrice = Number(values.price);
        const product = {
            name: values.name,
            nombre: values.name,
            description: values.description,
            descripcion: values.description,
            sku: values.sku.trim(),
            slug: values.slug.trim() || createSlug(values.name),
            status: values.status,
            price: {
                current: currentPrice,
                original: values.originalPrice ? Number(values.originalPrice) : currentPrice,
                currency: values.currency,
                tax_inclusive: values.taxInclusive,
            },
            precio: currentPrice,
        };

        try {
            const createdProduct = await createProduct.mutateAsync(product);
            const productId = createdProduct.id || createdProduct.product_id;
            navigate(productId ? `/product/${productId}` : '/shop');
        } catch (error) {
            setServerError(
                error.response?.data?.message
                || error.message
                || t('error_product_creation'),
            );
        }
    });

    return (
        <main className="hu-mx-auto hu-w-full hu-max-w-4xl hu-px-4 hu-py-10 sm:hu-px-6">
            <Card className="hu-p-6 sm:hu-p-8">
                <h1 className="hu-mb-2 hu-mt-0 hu-text-2xl hu-font-bold">{t('create_product_title')}</h1>
                <p className="hu-mb-6 hu-mt-0 hu-text-sm hu-text-slate-600">{t('create_product_subtitle')}</p>
                {serverError && <div className="hu-mb-5"><ErrorNotice>{serverError}</ErrorNotice></div>}

                <form className="hu-grid hu-gap-5" onSubmit={onSubmit} noValidate>
                    <div className="hu-grid hu-gap-5 sm:hu-grid-cols-2">
                        <Field label={t('name_label')} htmlFor="name" error={fieldError('name')}>
                            <Input id="name" {...form.register('name')} aria-invalid={Boolean(form.formState.errors.name)} />
                        </Field>
                        <Field label={t('sku_label')} htmlFor="sku">
                            <Input id="sku" {...form.register('sku')} />
                        </Field>
                    </div>
                    <Field label={t('description_label')} htmlFor="description" error={fieldError('description')}>
                        <textarea
                            id="description"
                            rows={4}
                            className="hu-w-full hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-2.5 hu-text-sm hu-outline-none focus:hu-border-blue-600 focus:hu-ring-2 focus:hu-ring-blue-100"
                            aria-invalid={Boolean(form.formState.errors.description)}
                            {...form.register('description')}
                        />
                    </Field>
                    <div className="hu-grid hu-gap-5 sm:hu-grid-cols-2">
                        <Field label={t('slug_label')} htmlFor="slug" hint={t('generated_slug_placeholder')}>
                            <Input id="slug" placeholder={t('generated_slug_placeholder')} {...form.register('slug')} />
                        </Field>
                        <Field label={t('status_label')} htmlFor="status">
                            <Select id="status" {...form.register('status')}>
                                <option value="ACTIVE">{t('status_active')}</option>
                                <option value="DRAFT">{t('status_draft')}</option>
                                <option value="INACTIVE">{t('status_inactive')}</option>
                            </Select>
                        </Field>
                    </div>
                    <div className="hu-grid hu-gap-5 sm:hu-grid-cols-3">
                        <Field label={t('current_price_label')} htmlFor="price" error={fieldError('price')}>
                            <Input id="price" type="number" min="0" step="0.01" {...form.register('price')} aria-invalid={Boolean(form.formState.errors.price)} />
                        </Field>
                        <Field label={t('original_price')} htmlFor="originalPrice" error={fieldError('originalPrice')}>
                            <Input id="originalPrice" type="number" min="0" step="0.01" {...form.register('originalPrice')} aria-invalid={Boolean(form.formState.errors.originalPrice)} />
                        </Field>
                        <Field label={t('currency_label')} htmlFor="currency" error={fieldError('currency')}>
                            <Input id="currency" {...form.register('currency')} aria-invalid={Boolean(form.formState.errors.currency)} />
                        </Field>
                    </div>
                    <label className="hu-flex hu-items-center hu-gap-2 hu-text-sm hu-text-slate-700">
                        <input type="checkbox" className="hu-h-4 hu-w-4 hu-rounded hu-border-slate-300" {...form.register('taxInclusive')} />
                        {t('tax_inclusive_label')}
                    </label>
                    <div>
                        <Button type="submit" disabled={createProduct.isPending}>
                            {createProduct.isPending ? t('saving_btn') : t('create_product_btn')}
                        </Button>
                    </div>
                </form>
            </Card>
        </main>
    );
}

export default CreateProduct;
