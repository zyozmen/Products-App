import React, { Component } from "react";
import cartService from "../../../services/CartService";

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
                <div className="d-flex mb-3">
                    <strong className="text-dark mr-3">Sizes:</strong>
                    <form>
                        <div className="custom-control custom-radio custom-control-inline">
                            <input
                                type="radio"
                                className="custom-control-input"
                                id="size-1"
                                name="size"
                            />
                            <label className="custom-control-label" htmlFor="size-1">
                                XS
                            </label>
                        </div>
                        <div className="custom-control custom-radio custom-control-inline">
                            <input
                                type="radio"
                                className="custom-control-input"
                                id="size-2"
                                name="size"
                            />
                            <label className="custom-control-label" htmlFor="size-2">
                                S
                            </label>
                        </div>
                        <div className="custom-control custom-radio custom-control-inline">
                            <input
                                type="radio"
                                className="custom-control-input"
                                id="size-3"
                                name="size"
                            />
                            <label className="custom-control-label" htmlFor="size-3">
                                M
                            </label>
                        </div>
                        <div className="custom-control custom-radio custom-control-inline">
                            <input
                                type="radio"
                                className="custom-control-input"
                                id="size-4"
                                name="size"
                            />
                            <label className="custom-control-label" htmlFor="size-4">
                                L
                            </label>
                        </div>
                        <div className="custom-control custom-radio custom-control-inline">
                            <input
                                type="radio"
                                className="custom-control-input"
                                id="size-5"
                                name="size"
                            />
                            <label className="custom-control-label" htmlFor="size-5">
                                XL
                            </label>
                        </div>
                    </form>
                </div>
                <div className="d-flex mb-4">
                    <strong className="text-dark mr-3">Colors:</strong>
                    <form>
                        <div className="custom-control custom-radio custom-control-inline">
                            <input
                                type="radio"
                                className="custom-control-input"
                                id="color-1"
                                name="color"
                            />
                            <label className="custom-control-label" htmlFor="color-1">
                                Black
                            </label>
                        </div>
                        <div className="custom-control custom-radio custom-control-inline">
                            <input
                                type="radio"
                                className="custom-control-input"
                                id="color-2"
                                name="color"
                            />
                            <label className="custom-control-label" htmlFor="color-2">
                                White
                            </label>
                        </div>
                        <div className="custom-control custom-radio custom-control-inline">
                            <input
                                type="radio"
                                className="custom-control-input"
                                id="color-3"
                                name="color"
                            />
                            <label className="custom-control-label" htmlFor="color-3">
                                Red
                            </label>
                        </div>
                        <div className="custom-control custom-radio custom-control-inline">
                            <input
                                type="radio"
                                className="custom-control-input"
                                id="color-4"
                                name="color"
                            />
                            <label className="custom-control-label" htmlFor="color-4">
                                Blue
                            </label>
                        </div>
                        <div className="custom-control custom-radio custom-control-inline">
                            <input
                                type="radio"
                                className="custom-control-input"
                                id="color-5"
                                name="color"
                            />
                            <label className="custom-control-label" htmlFor="color-5">
                                Green
                            </label>
                        </div>
                    </form>
                </div>
                <div className="d-flex align-items-center mb-4 pt-2">
                    <div className="input-group quantity mr-3" style={{ width: 130 }}>
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