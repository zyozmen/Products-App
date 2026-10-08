import React, { Component } from 'react';

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

// Las órdenes PQR solo las crea el administrador y siempre tienen valor 0.
class PqrOrderDialog extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            productName: '',
            quantity: 1,
            recipientName: '',
            address: '',
            contactPhone: '',
            notes: '',
            isSaving: false,
            error: '',
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        const { name, value } = event.target;
        this.setState({ [name]: value });
    }

    async handleSubmit(event) {
        event.preventDefault();
        const { username, productName, quantity, recipientName, address, contactPhone, notes } = this.state;
        this.setState({ isSaving: true, error: '' });
        try {
            await this.props.onCreate({
                username: username.trim(),
                productName: productName.trim(),
                quantity: Math.max(1, Number(quantity) || 1),
                delivery: {
                    recipientName: recipientName.trim(),
                    address: address.trim(),
                    addressComplement: '',
                    contactPhone: contactPhone.trim(),
                },
                notes: notes.trim(),
            });
        } catch (error) {
            this.setState({ isSaving: false, error: error.message });
        }
    }

    render() {
        const { onCancel, t } = this.props;
        const { username, productName, quantity, recipientName, address, contactPhone, notes, isSaving, error } = this.state;

        return (
            <div style={overlayStyle} role="dialog" aria-modal="true">
                <form
                    className="bg-light p-30 rounded"
                    style={{ maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
                    onSubmit={this.handleSubmit}
                >
                    <h5 className="mb-3">{t('pqr_order_title')}</h5>
                    {error && <div className="alert alert-danger py-2">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="pqr-username">{t('pqr_customer_username')} *</label>
                        <input id="pqr-username" name="username" className="form-control" value={username} onChange={this.handleChange} required />
                    </div>
                    <div className="form-row">
                        <div className="form-group col-8">
                            <label htmlFor="pqr-product">{t('product')} *</label>
                            <input id="pqr-product" name="productName" className="form-control" value={productName} onChange={this.handleChange} required />
                        </div>
                        <div className="form-group col-4">
                            <label htmlFor="pqr-quantity">{t('quantity')} *</label>
                            <input id="pqr-quantity" name="quantity" type="number" min="1" className="form-control" value={quantity} onChange={this.handleChange} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="pqr-recipient">{t('other_recipient_name')} *</label>
                        <input id="pqr-recipient" name="recipientName" className="form-control" value={recipientName} onChange={this.handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="pqr-address">{t('address')} *</label>
                        <input id="pqr-address" name="address" className="form-control" value={address} onChange={this.handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="pqr-phone">{t('contact_phone')} *</label>
                        <input id="pqr-phone" name="contactPhone" type="tel" className="form-control" value={contactPhone} onChange={this.handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="pqr-notes">{t('pqr_notes')} *</label>
                        <textarea id="pqr-notes" name="notes" className="form-control" rows="3" value={notes} onChange={this.handleChange} required />
                    </div>

                    <div className="d-flex justify-content-end" style={{ gap: '8px' }}>
                        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSaving}>{t('cancel')}</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>{t('create_pqr_order')}</button>
                    </div>
                </form>
            </div>
        );
    }
}

export default PqrOrderDialog;
