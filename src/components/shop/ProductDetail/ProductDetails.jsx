import React, { Component } from "react";
import ProductDescriptionComponent from "./ProductDescriptionComponent";
import ShareComponent from "./ShareComponent";
import CartControllsComponent from "./CartControllsComponent";
import productosService from "../../../services/ProductosService.js";
import productInterface, { toProduct } from "../../../Interfaces/ProductInterface.js";
import { Link } from "react-router-dom";

class ProductDetails extends Component {
    constructor(props) {
        super(props);
        this.state = {
                product: {}
        }
        this.getProductDetails = this.getProductDetails.bind(this);
    }

    componentDidMount() {
        this.getProductDetails();
        console.log(this.state.product);
    }

    renderStars(rating) {
        const clampedRating = Math.min(Math.max(Number(rating) || 0, 0), 5);
        const fullStars = Math.floor(clampedRating);
        const hasHalf = (clampedRating - fullStars) >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

        return [
            ...Array.from({ length: fullStars }, (_, i) => (
                <small key={`full-${i}`} className="fas fa-star" />
            )),
            ...(hasHalf ? [<small key="half" className="fas fa-star-half-alt" />] : []),
            ...Array.from({ length: emptyStars }, (_, i) => (
                <small key={`empty-${i}`} className="far fa-star" />
            )),
        ];
    }

    render() {
        const productId = Number(this.props.params?.id);
        const ranking = this.state.product.ranking || {};
        const price = this.state.product.price || {};
        const categories = Array.isArray(this.state.product.categories)
            ? this.state.product.categories
            : [];
        return (
            <div className="container-fluid pb-5">
                <div className="row px-xl-5">
                    <div className="col-lg-5 mb-30">
                        <div
                            id="product-carousel"
                            className="carousel slide"
                            data-ride="carousel"
                        >
                            <div className="carousel-inner bg-light">
                                <div className="carousel-item active">
                                    <img className="w-100 h-100" src="/img/product-1.jpg" alt="Product view 1" />
                                </div>
                                <div className="carousel-item">
                                    <img className="w-100 h-100" src="/img/product-2.jpg" alt="Product view 2" />
                                </div>
                                <div className="carousel-item">
                                    <img className="w-100 h-100" src="/img/product-3.jpg" alt="Product view 3" />
                                </div>
                                <div className="carousel-item">
                                    <img className="w-100 h-100" src="/img/product-4.jpg" alt="Product view 4" />
                                </div>
                            </div>
                            <a
                                className="carousel-control-prev"
                                href="#product-carousel"
                                data-slide="prev"
                            >
                                <i className="fa fa-2x fa-angle-left text-dark" />
                            </a>
                            <a
                                className="carousel-control-next"
                                href="#product-carousel"
                                data-slide="next"
                            >
                                <i className="fa fa-2x fa-angle-right text-dark" />
                            </a>
                        </div>
                    </div>
                    <div className="col-lg-7 h-auto mb-30">
                        <div className="h-100 bg-light p-30">
                            <h3>{this.state.product.name}</h3>
                            <div className="d-flex mb-3">
                                <div className="text-primary mr-2">
                                    {this.renderStars(ranking.average_rating)}
                                </div>
                                <small className="pt-1">({ranking.total_reviews} Reviews)</small>
                            </div>
                            <h3 className="font-weight-semi-bold mb-4">${price.current}</h3>
                            <p className="mb-4">
                                {this.state.product.LongDescription}
                            </p>
                            <div className="d-flex mb-3 categories-container">
                                <ul className="product-categories">
                                {categories.length > 0 ? (
                                    categories.map((category) => (
                                            <li><span className="label label-custom">{category.name}</span></li>
                                    ))
                                ) : (
                                    <small className="text-muted">No categories available</small>
                                )}
                                </ul>
                            </div>
                            <CartControllsComponent product={this.state.product} />
                            <ShareComponent />
                        </div>
                    </div>
                    <ProductDescriptionComponent params={{ product: this.state.product }} />
                </div>
            </div>
        );
    }


    getProductDetails() {
        productosService.detalleProducto(this.props.params.id)
            .then((response) => {
                console.log("Product details response:", response);
                this.setState({ product: toProduct(response) });
            })
            .catch((error) => {
                console.error("Error fetching product details:", error);
            });
    }
}
export default ProductDetails;