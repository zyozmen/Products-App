import React, { Component } from "react";
import cartService from "../../../services/CartService";
import translationService from "../../../services/TranslationService";
import './CartControllsComponent.css';

class ShareComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            quantity: 1,
            currentLanguage: translationService.getLanguage(),
        };
        this.unsubscribeFromLanguage = null;
        this.handleIncrement = this.handleIncrement.bind(this);
        this.handleDecrement = this.handleDecrement.bind(this);
        this.handleQuantityChange = this.handleQuantityChange.bind(this);
        this.handleAddToCart = this.handleAddToCart.bind(this);
    }

    componentDidMount() {
        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });
    }

    componentWillUnmount() {
        if (this.unsubscribeFromLanguage) {
            this.unsubscribeFromLanguage();
        }
    }

    handleIncrement() {
        this.setState((prevState) => ({ quantity: prevState.quantity + 1 }));
    }

    handleDecrement() {
        this.setState((prevState) => ({ quantity: Math.max(1, prevState.quantity - 1) }));
    }

    handleQuantityChange(event) {
        const quantity = Number(event.target.value);
        if (Number.isFinite(quantity) && quantity > 0) {
            this.setState({ quantity });
        }
    }

    handleAddToCart() {
        const { product } = this.props;
        if (!product || !product.id) {
            return;
        }
        cartService.addToCart({
            id: product.id,
            name: product.name,
            price: product.price?.current ?? 0,
            image: `/img/product-${product.id}.jpg`,
        }, this.state.quantity);
        this.setState({ quantity: 1 });
    }

    render() {
        const { quantity } = this.state;
        const t = (key) => translationService.t(key);

        return (
            <>
                <div className="d-flex align-items-center pt-2">
                    <div className=" mr-1 mt-10">
                        <h2 className="font-weight-semi-bold text-primary mt-10 p-30 ">{formatCOP(this.props.product.price?.current ?? 0)}</h2>
                    </div>

                    <div className="input-group quantity mr-3 quantity-control">
                        <div className="input-group-btn">
                            <button type="button" className="btn btn-primary btn-minus" onClick={this.handleDecrement}>
                                <i className="fa fa-minus" />
                            </button>
                        </div>
                        <input
                            type="text"
                            className="form-control bg-secondary border-0 text-center"
                            value={quantity}
                            onChange={this.handleQuantityChange}
                        />
                        <div className="input-group-btn">
                            <button type="button" className="btn btn-primary btn-plus" onClick={this.handleIncrement}>
                                <i className="fa fa-plus" />
                            </button>
                        </div>
                    </div>
                    <button type="button" className="btn btn-primary px-3" onClick={this.handleAddToCart}>
                        <i className="fa fa-shopping-cart mr-1" /> {t('add_to_cart')}
                    </button>
                </div>
            </>
        );
    }
}

export default ShareComponent;