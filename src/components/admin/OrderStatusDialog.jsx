import React, { Component } from 'react';
import { formatCOP } from '../../Interfaces/ProductInterface';

const overlayStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
};

// Solicita los datos adicionales de un cambio de estado:
// PAGADA -> marca contra entrega; ENTREGADA -> detalle de efectivo y tarjeta.
class OrderStatusDialog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cashOnDelivery: false,
            cashAmount: '',
            cardAmount: '',
            error: '',
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();
        const { order, status, onConfirm, t } = this.props;

        if (status === 'PAGADA') {
            onConfirm({ cashOnDelivery: this.state.cashOnDelivery });
            return;
        }

        const cash = Number(this.state.cashAmount) || 0;
        const card = Number(this.state.cardAmount) || 0;
        const total = Number(order.total) || 0;
        const hasDetail = cash > 0 || card > 0;

        if (cash < 0 || card < 0) {
            this.setState({ error: t('payment_detail_mismatch') });
            return;
        }
        if (order.cashOnDelivery && !hasDetail && total > 0) {
            this.setState({ error: t('payment_detail_required') });
            return;
        }
        if (hasDetail && Math.round(cash + card) !== Math.round(total)) {
            this.setState({ error: t('payment_detail_mismatch') });
            return;
        }
        onConfirm({ cashAmount: cash, cardAmount: card });
    }

    render() {
        const { order, status, onCancel, t } = this.props;
        const { cashOnDelivery, cashAmount, cardAmount, error } = this.state;
        const isPaid = status === 'PAGADA';

        return (
            <div style={overlayStyle} role="dialog" aria-modal="true">
                <form className="bg-light p-30 rounded" style={{ maxWidth: '440px', width: '100%' }} onSubmit={this.handleSubmit}>
                    <h5 className="mb-3">
                        #{order.id} · {t('order_status_' + status.toLowerCase())}
                    </h5>
                    {error && <div className="alert alert-danger py-2">{error}</div>}

                    {isPaid ? (
                        <div className="custom-control custom-checkbox mb-3">
                            <input
                                id="order-cash-on-delivery"
                                type="checkbox"
                                className="custom-control-input"
                                checked={cashOnDelivery}
                                onChange={(e) => this.setState({ cashOnDelivery: e.target.checked })}
                            />
                            <label className="custom-control-label" htmlFor="order-cash-on-delivery">
                                {t('order_flag_cash_on_delivery')}
                            </label>
                        </div>
                    ) : (
                        <>
                            <p className="mb-2">
                                {t('total')}: <strong>{formatCOP(order.total)}</strong>
                                {order.cashOnDelivery && (
                                    <span className="badge badge-warning ml-2">{t('order_flag_cash_on_delivery')}</span>
                                )}
                            </p>
                            <p className="text-muted small">{t('delivery_payment_detail')}</p>
                            <div className="form-group">
                                <label htmlFor="order-cash-amount">{t('report_cash')}</label>
                                <input
                                    id="order-cash-amount"
                                    type="number"
                                    min="0"
                                    className="form-control"
                                    value={cashAmount}
                                    onChange={(e) => this.setState({ cashAmount: e.target.value, error: '' })}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="order-card-amount">{t('report_card')}</label>
                                <input
                                    id="order-card-amount"
                                    type="number"
                                    min="0"
                                    className="form-control"
                                    value={cardAmount}
                                    onChange={(e) => this.setState({ cardAmount: e.target.value, error: '' })}
                                />
                            </div>
                        </>
                    )}

                    <div className="d-flex justify-content-end" style={{ gap: '8px' }}>
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>{t('cancel')}</button>
                        <button type="submit" className="btn btn-primary">{t('accept')}</button>
                    </div>
                </form>
            </div>
        );
    }
}

export default OrderStatusDialog;
