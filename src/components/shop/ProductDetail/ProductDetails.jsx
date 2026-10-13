import React, { Component } from "react";
import productosService from "../../../services/ProductosService.js";
import translationService from "../../../services/TranslationService.js";
import AuthenticationService from "../../../services/AuthenticationService";
import { NavLink } from "react-router-dom";
import CartControllsComponent from "./CartControllsComponent";
import { toProduct } from "../../../Interfaces/ProductInterface.js";
import ImageCarousel from "../../ui/ImageCarousel";
import { formatCOP } from "../../../Interfaces/ProductInterface.js";

class ProductDetails extends Component {
    constructor(props) {
        super(props);
        this.state = {
            product: {},
            currentLanguage: translationService.getLanguage(),
        }
        this.unsubscribeFromLanguage = null;
        this.getProductDetails = this.getProductDetails.bind(this);
    }

    componentDidMount() {
        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });
        this.getProductDetails();
        console.log(this.state.product);
    }

    componentWillUnmount() {
        if (this.unsubscribeFromLanguage) {
            this.unsubscribeFromLanguage();
        }
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
        const t = (key) => translationService.t(key);
        const ranking = this.state.product.ranking || {};
        const price = this.state.product.price || {};
        const categories = Array.isArray(this.state.product.categories)
            ? this.state.product.categories
            : [];

        // Configuración dinámica de imágenes para el carrusel
        const itemImages = [];
        if (this.state.product.foto_principal) {
            itemImages.push({ id: 'p', src: this.state.product.foto_principal });
        }
        if (Array.isArray(this.state.product.fotos_secundarias)) {
            this.state.product.fotos_secundarias.forEach((src, idx) => {
                if (src) {
                    itemImages.push({ id: `s-${idx}`, src });
                }
            });
        }
        // Fallback si no tiene imágenes cargadas
        if (itemImages.length === 0) {
            itemImages.push({ id: 'f1', src: '/img/no_image.jpg' });
        }

        return (
            <div className="container-fluid pb-5">
                <div className="row px-xl-5">
                    <div className="col-lg-5 mb-30">
                        <ImageCarousel
                            items={itemImages}
                            altPrefix={t('product_image')}
                            previousLabel={t('image_navigation_previous')}
                            nextLabel={t('image_navigation_next')}
                        />
                    </div>
                    <div className="col-lg-7 h-auto mb-30">
                        <div className="h-auto bg-light p-30">
                            <h3>{this.state.product.name}</h3>
                            <div className="mt-10">
                                <h3 className="font-weight-semi-bold text-primary mt-10">{formatCOP(price?.current ?? 0)}</h3>
                            </div>
                            <div className="d-flex mb-3 categories-container">
                                <ul className="product-categories">
                                    {categories.length > 0 ? (
                                        categories.map((category, index) => (
                                            <li key={`${category.name || 'category'}-${index}`}><span className="label label-custom">{category.name}</span></li>
                                        ))
                                    ) : (
                                        <small className="text-muted">{t('no_categories_available')}</small>
                                    )}
                                </ul>
                            </div>
                        </div>
                        <CartControllsComponent product={this.state.product} />
                        {AuthenticationService.isUserAdmin() && this.state.product.id && (
                            <div className="bg-light px-30 pb-3">
                                <NavLink className="btn btn-outline-primary" to={`/editProduct/${this.state.product.id}`}>
                                    <i className="fa fa-edit mr-2" />
                                    {t('edit_product_title')}
                                </NavLink>
                            </div>
                        )}
                        <div className="d-flex h-auto bg-light p-30">
                            <div className="d-block mb-3 categories-container">
                                <div className="d-block mb-3">
                                    <h4 className="mb-1">{t('product_description')}</h4>
                                </div>
                                <div className="mb-3">
                                    <p>{this.state.product.description}</p>
                                </div>
                            </div>
                        </div>
                    </div>
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