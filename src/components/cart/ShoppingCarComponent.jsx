import React, { Component } from "react";
import HeaderComponent from "../dashboard/HeaderComponent";
import NavBarComponent from "../dashboard/NavBarComponent";
import FooterComponent from "../dashboard/FooterComponent";
import navigationComponent from "../navigation/NavigationComponent";
import cartService, { DEFAULT_TAX_RATE } from "../../services/CartService";
import './ShoppingCarComponent.css';

class ShoppingCarComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            items: cartService.getCart(),
        };
        this.handleRemove = this.handleRemove.bind(this);
        this.handleIncrement = this.handleIncrement.bind(this);
        this.handleDecrement = this.handleDecrement.bind(this);
        this.handleQuantityChange = this.handleQuantityChange.bind(this);
        this.unsubscribe = null;
    }

    componentDidMount() {
        this.unsubscribe = cartService.subscribe((items) => this.setState({ items }));
    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
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

    render() {
        const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
        const { items } = this.state;
        const subtotal = cartService.getSubtotal();
        const taxAmount = cartService.getTaxAmount();
        const total = cartService.getTotal();
        const taxPercentage = (DEFAULT_TAX_RATE * 100).toFixed(0);

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
                                        <th>Products</th>
                                        <th>Price</th>
                                        <th>Quantity</th>
                                        <th>Total</th>
                                        <th>Remove</th>
                                    </tr>
                                </thead>
                                <tbody className="align-middle">
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="align-middle py-4">
                                                Your shopping cart is empty.
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
                                <span className="bg-secondary pr-3">Cart Summary</span>
                            </h5>
                            <div className="bg-light p-30 mb-5">
                                <div className="border-bottom pb-2">
                                    <div className="d-flex justify-content-between mb-3">
                                        <h6>Subtotal</h6>
                                        <h6>${subtotal.toFixed(2)}</h6>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <h6 className="font-weight-medium">Tax ({taxPercentage}%)</h6>
                                        <h6 className="font-weight-medium">${taxAmount.toFixed(2)}</h6>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <div className="d-flex justify-content-between mt-2">
                                        <h5>Total</h5>
                                        <h5>${total.toFixed(2)}</h5>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-block btn-primary font-weight-bold my-3 py-3"
                                        disabled={items.length === 0}
                                    >
                                        Proceed To Checkout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <FooterComponent />
            </>
        );
    }
}

export default ShoppingCarComponent;
