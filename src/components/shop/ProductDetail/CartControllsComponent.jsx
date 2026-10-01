import React, { Component } from "react";
import cartService from "../../../services/CartService";
import { formatCOP } from "../../../Interfaces/ProductInterface.js";
import './CartControllsComponent.css';

class ShareComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            quantity: 1,
        };
        this.handleIncrement = this.handleIncrement.bind(this);
        this.handleDecrement = this.handleDecrement.bind(this);
        this.handleQuantityChange = this.handleQuantityChange.bind(this);
        this.handleAddToCart = this.handleAddToCart.bind(this);
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

        return (
            <>
                <div className="d-flex align-items-center mb-4 pt-2">
                    <div className=" mr-1">
                        <h3 className="font-weight-semi-bold mb-4 text-primary">{formatCOP(this.props.product.price?.current ?? 0)}</h3>
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
                        <i className="fa fa-shopping-cart mr-1" /> Add To Cart
                    </button>
                </div>
            </>
        );
    }
}

export default ShareComponent;