import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { formatCOP } from '../../../Interfaces/ProductInterface';
import { Badge, Button, Card, ErrorNotice, Field, Input } from '../../ui/shadcn';
import { createOrderDeliverySchema, orderPaidSchema } from '../../../schemas/orderStatus';

const overlayClass = 'hu-fixed hu-inset-0 hu-z-[9999] hu-flex hu-items-center hu-justify-center hu-bg-black/60 hu-p-5';

function OrderStatusDialog({ order, status, onCancel, onConfirm, t }) {
    const isPaid = status === 'PAGADA';
    const schema = isPaid ? orderPaidSchema : createOrderDeliverySchema(Boolean(order.cashOnDelivery), Number(order.total) || 0);
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: isPaid
            ? { cashOnDelivery: false }
            : { cashAmount: '', cardAmount: '' },
    });

    const onSubmit = form.handleSubmit((values) => {
        if (isPaid) {
            onConfirm(values);
            return;
        }
        onConfirm({
            cashAmount: values.cashAmount,
            cardAmount: values.cardAmount,
        });
    });

    const paymentError = form.formState.errors.root?.message;
    const amountError = (name) => {
        const message = form.formState.errors[name]?.message;
        return message ? t(message) : undefined;
    };

    return (
        <div className={overlayClass} role="dialog" aria-modal="true" aria-labelledby="order-status-dialog-title">
            <Card className="hu-w-full hu-max-w-md hu-p-6">
                <form className="hu-grid hu-gap-4" onSubmit={onSubmit} noValidate>
                    <h2 id="order-status-dialog-title" className="hu-m-0 hu-text-lg hu-font-bold">
                        #{order.id} · {t('order_status_' + status.toLowerCase())}
                    </h2>
                    {paymentError && <ErrorNotice>{t(paymentError)}</ErrorNotice>}

                    {isPaid ? (
                        <label className="hu-flex hu-cursor-pointer hu-items-center hu-gap-2 hu-text-sm hu-font-medium hu-text-slate-700">
                            <input type="checkbox" {...form.register('cashOnDelivery')} />
                            {t('order_flag_cash_on_delivery')}
                        </label>
                    ) : (
                        <>
                            <p className="hu-m-0 hu-text-sm">
                                {t('total')}: <strong>{formatCOP(order.total)}</strong>
                                {order.cashOnDelivery && (
                                    <span className="hu-ml-2"><Badge tone="orange">{t('order_flag_cash_on_delivery')}</Badge></span>
                                )}
                            </p>
                            <p className="hu-m-0 hu-text-sm hu-text-slate-600">{t('delivery_payment_detail')}</p>
                            <Field label={t('report_cash')} htmlFor="order-cash-amount" error={amountError('cashAmount')}>
                                <Input
                                    id="order-cash-amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    aria-invalid={Boolean(form.formState.errors.cashAmount)}
                                    {...form.register('cashAmount', { valueAsNumber: true })}
                                />
                            </Field>
                            <Field label={t('report_card')} htmlFor="order-card-amount" error={amountError('cardAmount')}>
                                <Input
                                    id="order-card-amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    aria-invalid={Boolean(form.formState.errors.cardAmount)}
                                    {...form.register('cardAmount', { valueAsNumber: true })}
                                />
                            </Field>
                        </>
                    )}

                    <div className="hu-flex hu-justify-end hu-gap-2">
                        <Button type="button" variant="secondary" onClick={onCancel}>{t('cancel')}</Button>
                        <Button type="submit">{t('accept')}</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

export default OrderStatusDialog;
