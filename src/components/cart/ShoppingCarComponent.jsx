import React, { Component } from "react";
import HeaderComponent from "../dashboard/HeaderComponent";
import NavBarComponent from "../dashboard/NavBarComponent";
import FooterComponent from "../dashboard/FooterComponent";
import navigationComponent from "../navigation/NavigationComponent";
import cartService, { DEFAULT_TAX_RATE } from "../../services/CartService";
import translationService from "../../services/TranslationService";
import './ShoppingCarComponent.css';

const whatsappPhoneNumber = String(import.meta.env.VITE_WHATSAPP_NUMBER ?? '573124058166').trim();

export const createWhatsAppCheckoutUrl = ({ items, phoneNumber, subtotal, taxAmount, total, delivery = {} }) => {
    const orderLines = items.map((item) =>
        `- ${item.name} x${item.quantity}: $${(item.price * item.quantity).toFixed(2)}`
    );
    const message = [
        'Hola, quiero realizar este pedido:',
        ...orderLines,
        '',
        'Datos de entrega:',
        `Receptor: ${delivery.recipientName ?? ''}`,
        `Direccion: ${delivery.address ?? ''}`,
        delivery.addressComplement ? `Complemento: ${delivery.addressComplement}` : null,
        `Telefono de contacto: ${delivery.contactPhone ?? ''}`,
        '',
        `Total: $${total.toFixed(2)}`,
    ].filter((line) => line !== null).join('\n');
    const normalizedPhoneNumber = String(phoneNumber ?? '').replace(/\D/g, '');

    return `https://wa.me/${normalizedPhoneNumber}?text=${encodeURIComponent(message)}`;
};

class ShoppingCarComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            items: cartService.getCart(),
            delivery: {
                recipientName: '',
                address: '',
                addressComplement: '',
                contactPhone: '',
            },
            isOrderConfirmed: false,
            currentLanguage: translationService.getLanguage(),
        };
        this.handleRemove = this.handleRemove.bind(this);
        this.handleIncrement = this.handleIncrement.bind(this);
        this.handleDecrement = this.handleDecrement.bind(this);
        this.handleQuantityChange = this.handleQuantityChange.bind(this);
        this.handleDeliveryChange = this.handleDeliveryChange.bind(this);
        this.handleCheckout = this.handleCheckout.bind(this);
        this.handleConfirmationAccept = this.handleConfirmationAccept.bind(this);
        this.unsubscribe = null;
        this.unsubscribeFromLanguage = null;
    }

    componentDidMount() {
        this.unsubscribe = cartService.subscribe((items) => this.setState({ items }));
        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });
    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        if (this.unsubscribeFromLanguage) {
            this.unsubscribeFromLanguage();
        }
    }

    handleRemove(productId) {
        cartService.removeFromCart(productId);
    }

    handleIncrement(item) {
        cartService.updateQuantity(item.id, item.quantity + 1);
    }

    handleDecrement(item) {
        if (item.quantity > 1) {
            cartService.updateQuantity(item.id, item.quantity - 1);
        }
    }

    handleQuantityChange(item, value) {
        const quantity = Number(value);
        if (Number.isFinite(quantity) && quantity > 0) {
            cartService.updateQuantity(item.id, quantity);
        }
    }

    handleDeliveryChange(event) {
        const { name, value } = event.target;
        this.setState((previousState) => ({
            delivery: {
                ...previousState.delivery,
                [name]: value,
            },
        }));
    }

    handleCheckout(event) {
        event.preventDefault();
        const items = cartService.getCart();
        if (items.length === 0) {
            return;
        }

        const url = createWhatsAppCheckoutUrl({
            items,
            phoneNumber: whatsappPhoneNumber,
            subtotal: cartService.getSubtotal(),
            taxAmount: cartService.getTaxAmount(),
            total: cartService.getTotal(),
            delivery: this.state.delivery,
        });

        window.open(url, '_blank', 'noopener,noreferrer');
        cartService.clearCart();
        this.setState({ isOrderConfirmed: true });
    }

    handleConfirmationAccept() {
        this.props.navigate('/');
    }

    render() {
        const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
        const { items } = this.state;
        const subtotal = cartService.getSubtotal();
        const taxAmount = cartService.getTaxAmount();
        const total = cartService.getTotal();
        const taxPercentage = (DEFAULT_TAX_RATE * 100).toFixed(0);
        const t = (key) => translationService.t(key);

        return (
            <>
                <HeaderComponentWithNavigation />
                <NavBarComponent />
                <div className="container-fluid">
                    <div className="row px-xl-5">
                        <div className="col-lg-8 table-responsive mb-5">
                            <table className="table table-light table-borderless table-hover text-center mb-0">
                                <thead className="thead-dark">
                                    <tr>
                                        <th>{t('product')}</th>
                                        <th>{t('price')}</th>
                                        <th>{t('quantity')}</th>
                                        <th>{t('total')}</th>
                                        <th>{t('remove')}</th>
                                    </tr>
                                </thead>
                                <tbody className="align-middle">
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="align-middle py-4">
                                                {t('empty_cart')}
                                            </td>
                                        </tr>
                                    )}
                                    {items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="align-middle">
                                                <img src={item.image} alt={item.name} className="cart-product-image" />{" "}
                                                {item.name}
                                            </td>
                                            <td className="align-middle">${item.price.toFixed(2)}</td>
                                            <td className="align-middle">
                                                <div
                                                    className="input-group quantity mx-auto cart-quantity-input"
                                                >
                                                    <div className="input-group-btn">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-primary btn-minus"
                                                            onClick={() => this.handleDecrement(item)}
                                                        >
                                                            <i className="fa fa-minus" />
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm bg-secondary border-0 text-center"
                                                        value={item.quantity}
                                                        onChange={(e) => this.handleQuantityChange(item, e.target.value)}
                                                    />
                                                    <div className="input-group-btn">
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-primary btn-plus"
                                                            onClick={() => this.handleIncrement(item)}
                                                        >
                                                            <i className="fa fa-plus" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="align-middle">${(item.price * item.quantity).toFixed(2)}</td>
                                            <td className="align-middle">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => this.handleRemove(item.id)}
                                                >
                                                    <i className="fa fa-times" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="col-lg-4">
                            <h5 className="section-title position-relative text-uppercase mb-3">
                                <span className="bg-secondary pr-3">{t('cart_summary')}</span>
                            </h5>
                            <div className="bg-light p-30 mb-5">
                                <form onSubmit={this.handleCheckout}>
                                    <div className="cart-delivery-form border-bottom pb-3 mb-3">
                                        <h6>{t('delivery_details')}</h6>
                                        <div className="cart-delivery-fields">
                                            <div>
                                                <label htmlFor="delivery-recipient">{t('recipient_name')}</label>
                                                <input
                                                    id="delivery-recipient"
                                                    className="form-control"
                                                    name="recipientName"
                                                    type="text"
                                                    autoComplete="name"
                                                    value={this.state.delivery.recipientName}
                                                    onChange={this.handleDeliveryChange}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="delivery-address">{t('address')}</label>
                                                <input
                                                    id="delivery-address"
                                                    className="form-control"
                                                    name="address"
                                                    type="text"
                                                    autoComplete="street-address"
                                                    value={this.state.delivery.address}
                                                    onChange={this.handleDeliveryChange}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="delivery-complement">{t('address_complement')}</label>
                                                <input
                                                    id="delivery-complement"
                                                    className="form-control"
                                                    name="addressComplement"
                                                    type="text"
                                                    placeholder="Casa 34, unidad 4, apto. 204"
                                                    value={this.state.delivery.addressComplement}
                                                    onChange={this.handleDeliveryChange}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="delivery-phone">{t('contact_phone')}</label>
                                                <input
                                                    id="delivery-phone"
                                                    className="form-control"
                                                    name="contactPhone"
                                                    type="tel"
                                                    autoComplete="tel"
                                                    value={this.state.delivery.contactPhone}
                                                    onChange={this.handleDeliveryChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                <div className="border-bottom pb-2">
                                    <div className="d-flex justify-content-between mb-3">
                                        <h6>{t('subtotal')}</h6>
                                        <h6>${subtotal.toFixed(2)}</h6>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <h6 className="font-weight-medium">{t('tax')} ({taxPercentage}%)</h6>
                                        <h6 className="font-weight-medium">${taxAmount.toFixed(2)}</h6>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <div className="d-flex justify-content-between mt-2">
                                        <h5>{t('total')}</h5>
                                        <h5>${total.toFixed(2)}</h5>
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-block btn-primary font-weight-bold my-3 py-3"
                                        disabled={items.length === 0}
                                    >
                                        {t('proceed_checkout')}
                                    </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                <FooterComponent />
                {this.state.isOrderConfirmed && (
                    <div className="cart-checkout-modal-backdrop">
                        <section
                            className="cart-checkout-modal"
                            role="alertdialog"
                            aria-modal="true"
                            aria-labelledby="checkout-confirmation-title"
                            aria-describedby="checkout-confirmation-message"
                        >
                            <h2 id="checkout-confirmation-title">{t('thank_you_purchase')}</h2>
                            <p id="checkout-confirmation-message">{t('order_opened_whatsapp')}</p>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={this.handleConfirmationAccept}
                                autoFocus
                            >
                                {t('accept')}
                            </button>
                        </section>
                    </div>
                )}
            </>
        );
    }
}

export default ShoppingCarComponent;
