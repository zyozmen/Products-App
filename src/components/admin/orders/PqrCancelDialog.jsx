import { Button, Card, ErrorNotice } from '../../ui/shadcn';
import { businessDateOf } from '../../../utils/businessDate';

const overlayClass = 'hu-fixed hu-inset-0 hu-z-[9999] hu-flex hu-items-center hu-justify-center hu-bg-black/60 hu-p-5';

function PqrCancelDialog({ order, onCancel, onConfirm, t, isSubmitting = false }) {
    const units = (order.items || []).reduce((total, item) => total + (Number(item.quantity) || 0), 0);
    const journey = businessDateOf(order.createdAt) ?? '—';

    return (
        <div className={overlayClass} role="dialog" aria-modal="true" aria-labelledby="pqr-cancel-title">
            <Card className="hu-grid hu-w-full hu-max-w-md hu-gap-4 hu-p-6">
                <h2 id="pqr-cancel-title" className="hu-m-0 hu-text-lg hu-font-bold">
                    #{order.id} · {t('pqr_cancel_title')}
                </h2>
                <ul className="hu-m-0 hu-list-disc hu-pl-5 hu-text-sm hu-text-slate-700">
                    {(order.items || []).map((item, index) => (
                        <li key={`${item.productId}-${index}`}>{item.name} x{item.quantity}</li>
                    ))}
                </ul>
                <div className="hu-grid hu-gap-1 hu-rounded-lg hu-border hu-border-amber-200 hu-bg-amber-50 hu-p-3 hu-text-sm hu-text-amber-900" role="note">
                    <p className="hu-m-0 hu-font-semibold">{t('pqr_cancel_stock').replace('{units}', units)}</p>
                    <p className="hu-m-0">{t('pqr_cancel_reversal').replace('{date}', journey)}</p>
                    <p className="hu-m-0">{t('pqr_cancel_irreversible')}</p>
                </div>
                {!order.createdAt && <ErrorNotice>{t('pqr_cancel_no_date')}</ErrorNotice>}
                <div className="hu-flex hu-justify-end hu-gap-2">
                    <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>{t('pqr_cancel_back')}</Button>
                    <Button type="button" className="hu-bg-red-700 hover:hu-bg-red-800" onClick={onConfirm} disabled={isSubmitting}>
                        {isSubmitting ? t('loading') : t('pqr_cancel_confirm')}
                    </Button>
                </div>
            </Card>
        </div>
    );
}

export default PqrCancelDialog;
