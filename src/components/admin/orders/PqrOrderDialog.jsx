import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { pqrOrderSchema } from '../../../schemas/pqrOrder';
import { Button, Card, ErrorNotice, Input, Field } from '../../ui/shadcn';

const fields = [
    ['username', 'pqr_customer_username', 'text'],
    ['productName', 'product', 'text'],
    ['quantity', 'quantity', 'number'],
    ['recipientName', 'other_recipient_name', 'text'],
    ['address', 'address', 'text'],
    ['contactPhone', 'contact_phone', 'tel'],
];

function PqrOrderDialog({ onCancel, onCreate, t }) {
    const [submitError, setSubmitError] = useState('');
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(pqrOrderSchema),
        defaultValues: {
            username: '',
            productName: '',
            quantity: 1,
            recipientName: '',
            address: '',
            contactPhone: '',
            notes: '',
        },
    });

    const submit = async (values) => {
        setSubmitError('');
        try {
            await onCreate({
                username: values.username.trim(),
                productName: values.productName.trim(),
                quantity: values.quantity,
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

    return (
        <div className="hu-fixed hu-inset-0 hu-z-50 hu-grid hu-place-items-center hu-bg-slate-950/60 hu-p-4" role="dialog" aria-modal="true">
            <form
                className="hu-max-h-[90vh] hu-w-full hu-max-w-lg hu-overflow-y-auto"
                onSubmit={handleSubmit(submit)}
            >
                <Card className="hu-p-6">
                <h2 className="hu-mb-4 hu-mt-0 hu-text-xl hu-font-bold">{t('pqr_order_title')}</h2>
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
                <Field label={`${t('pqr_notes')} *`} htmlFor="pqr-notes" error={errors.notes?.message}>
                    <textarea
                        id="pqr-notes"
                        className="hu-w-full hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-2.5 hu-text-sm hu-outline-none focus:hu-border-blue-600 focus:hu-ring-2 focus:hu-ring-blue-100"
                        rows="3"
                        aria-invalid={Boolean(errors.notes)}
                        {...register('notes')}
                    />
                </Field>

                <div className="hu-mt-5 hu-flex hu-justify-end hu-gap-2">
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>{t('cancel')}</Button>
                    <Button type="submit" disabled={isSubmitting}>{t('create_pqr_order')}</Button>
                </div>
                </Card>
            </form>
        </div>
    );
}

export default PqrOrderDialog;
