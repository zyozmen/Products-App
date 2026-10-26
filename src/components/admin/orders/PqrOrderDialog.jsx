import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { pqrOrderSchema } from '../../../schemas/pqrOrder';
import { useMarketplaceList } from '../../../hooks/useMarketplaceQueries.ts';
import { Button, Card, ErrorNotice, Input, Field } from '../../ui/shadcn';

const fields = [
    ['username', 'pqr_customer_username', 'text'],
    ['quantity', 'quantity', 'number'],
    ['recipientName', 'other_recipient_name', 'text'],
    ['address', 'address', 'text'],
    ['contactPhone', 'contact_phone', 'tel'],
];

function PqrOrderDialog({ onCancel, onCreate, t, isSubmitting: isCreating = false }) {
    const [submitError, setSubmitError] = useState('');
    const [search, setSearch] = useState('');
    const [productPage, setProductPage] = useState(0);
    const marketplace = useMarketplaceList(search, productPage, 20);
    const { register, handleSubmit, watch, setValue, setError, clearErrors, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(pqrOrderSchema),
        defaultValues: {
            username: '',
            productId: '',
            productName: '',
            quantity: 1,
            recipientName: '',
            address: '',
            contactPhone: '',
            notes: '',
        },
    });
    const productId = watch('productId');
    useEffect(() => setProductPage(0), [search]);
    const options = (marketplace.data?.content ?? []).flatMap((strain) =>
        strain.presentaciones.map((presentation) => ({
            id: presentation.presentacionId,
            name: `${strain.nombre} · ${presentation.nombre} · ${presentation.contenidoUnidad} ${presentation.unidadBase} · ${presentation.sku}`,
            stock: presentation.stockDisponible,
        })),
    );

    const submit = async (values) => {
        setSubmitError('');
        const selected = options.find((option) => option.id === values.productId);
        if (!selected || values.quantity > selected.stock) {
            setError('quantity', { message: 'La cantidad supera la disponibilidad actual de la presentación.' });
            return;
        }
        clearErrors('quantity');
        try {
            await onCreate({
                username: values.username.trim(),
                items: [{ productId: values.productId, name: values.productName.trim(), quantity: values.quantity }],
                delivery: {
                    recipientName: values.recipientName.trim(),
                    address: values.address.trim(),
                    addressComplement: '',
                    contactPhone: values.contactPhone.trim(),
                },
                notes: values.notes.trim(),
            });
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'No se pudo crear la orden PQR.');
        }
    };

    const busy = isSubmitting || isCreating;

    return (
        <div className="hu-fixed hu-inset-0 hu-z-50 hu-grid hu-place-items-center hu-bg-slate-950/60 hu-p-4" role="dialog" aria-modal="true" aria-labelledby="pqr-order-title">
            <form
                className="hu-max-h-[90vh] hu-w-full hu-max-w-lg hu-overflow-y-auto"
                onSubmit={handleSubmit(submit)}
            >
                <Card className="hu-p-6">
                <h2 id="pqr-order-title" className="hu-mb-4 hu-mt-0 hu-text-xl hu-font-bold">{t('pqr_order_title')}</h2>
                <p className="hu-mb-4 hu-mt-0 hu-rounded-lg hu-border hu-border-amber-200 hu-bg-amber-50 hu-p-3 hu-text-sm hu-text-amber-900" role="note">
                    {t('pqr_recognition_info')}
                </p>
                {submitError && <div className="hu-mb-4"><ErrorNotice>{submitError}</ErrorNotice></div>}

                {fields.map(([name, label, type]) => {
                    const fieldError = errors[name]?.message;
                    return (
                        <Field key={name} label={`${t(label)} *`} htmlFor={`pqr-${name}`} error={fieldError}>
                            <Input
                                id={`pqr-${name}`}
                                type={type}
                                min={type === 'number' ? '1' : undefined}
                                aria-invalid={Boolean(fieldError)}
                                {...register(name, type === 'number' ? { valueAsNumber: true } : {})}
                            />
                        </Field>
                    );
                })}
                <Field label={`${t('product')} *`} htmlFor="pqr-product-search" error={errors.productId?.message}>
                    <Input id="pqr-product-search" value={search} maxLength={100} placeholder="Buscar cepa o presentación" onChange={(event) => {
                        setSearch(event.target.value);
                        setValue('productId', '', { shouldValidate: true });
                        setValue('productName', '', { shouldValidate: true });
                    }} />
                </Field>
                {marketplace.isError && (
                    <div className="hu-grid hu-gap-2">
                        <ErrorNotice>No se pudieron cargar presentaciones: {marketplace.error?.message || 'Inténtalo nuevamente.'}</ErrorNotice>
                        <Button type="button" variant="secondary" onClick={() => void marketplace.refetch()}>Reintentar carga de presentaciones</Button>
                    </div>
                )}
                <Field label="Presentación disponible *" htmlFor="pqr-product-id" error={errors.productName?.message}>
                    <select
                        id="pqr-product-id"
                        className="hu-w-full hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-2.5 hu-text-sm"
                        value={productId}
                        disabled={marketplace.isPending || marketplace.isError}
                        onChange={(event) => {
                            const selected = options.find((option) => option.id === event.target.value);
                            setValue('productId', selected?.id ?? '', { shouldValidate: true });
                            setValue('productName', selected?.name ?? '', { shouldValidate: true });
                        }}
                    >
                        <option value="">Selecciona una presentación</option>
                        {options.map((option) => <option key={option.id} value={option.id}>{option.name} · Stock: {option.stock}</option>)}
                    </select>
                </Field>
                {(marketplace.data?.totalPages ?? 0) > 1 && (
                    <div className="hu-mb-3 hu-flex hu-items-center hu-justify-between">
                        <Button type="button" variant="secondary" disabled={productPage === 0 || marketplace.isFetching} onClick={() => setProductPage((value) => value - 1)}>Anterior</Button>
                        <span className="hu-text-xs">Página {productPage + 1} de {marketplace.data.totalPages}</span>
                        <Button type="button" variant="secondary" disabled={productPage + 1 >= marketplace.data.totalPages || marketplace.isFetching} onClick={() => setProductPage((value) => value + 1)}>Siguiente</Button>
                    </div>
                )}
                <Field label={`${t('pqr_notes')} *`} htmlFor="pqr-notes" error={errors.notes?.message}>
                    <textarea
                        id="pqr-notes"
                        className="hu-w-full hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-2.5 hu-text-sm hu-outline-none focus:hu-border-green-600 focus:hu-ring-2 focus:hu-ring-green-100"
                        rows="3"
                        aria-invalid={Boolean(errors.notes)}
                        {...register('notes')}
                    />
                </Field>

                <div className="hu-mt-5 hu-flex hu-justify-end hu-gap-2">
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>{t('cancel')}</Button>
                    <Button type="submit" disabled={busy}>{busy ? t('loading') : t('create_pqr_order')}</Button>
                </div>
                </Card>
            </form>
        </div>
    );
}

export default PqrOrderDialog;
