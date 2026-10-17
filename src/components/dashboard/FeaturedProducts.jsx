import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import productosService from '../../services/ProductosService';
import cartService from '../../services/CartService';
import translationService from '../../services/TranslationService';
import { formatCOP } from '../../Interfaces/ProductInterface';
import ConfirmationModal from '../ui/ConfirmationModal';


class FeaturedProducts extends Component {
    constructor(props) {
        super(props);
        this.state = {
            featuredProducts: [],
            isProductAdded: false,
            currentLanguage: translationService.getLanguage(),
        };
        this.callBackendService = this.callBackendService.bind(this);
        this.handleAddToCart = this.handleAddToCart.bind(this);
        this.unsubscribeFromLanguage = null;
    }

    handleAddToCart(event, featuredProduct) {
        event.preventDefault();
        cartService.addToCart({
            id: featuredProduct.id,
            name: featuredProduct.name,
            price: featuredProduct.price?.current ?? 0,
            image: featuredProduct.foto_principal || '/img/no_image.jpg',
        });
        this.setState({ isProductAdded: true });
    }

    componentDidMount() {
        this.callBackendService();
        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });
    }

    componentWillUnmount() {
        if (this.unsubscribeFromLanguage) {
            this.unsubscribeFromLanguage();
        }
    }

    render() {
        const t = (key) => translationService.t(key);
        return (
            <div className="container-fluid pt-5 pb-3">
                <h2 className="section-title position-relative text-uppercase mx-xl-5 mb-4">
                    <span className="bg-secondary pr-3">{t('featured_products')}</span>
                </h2>
                <div className="row px-xl-5">
                    {this.state.featuredProducts.map((featuredProduct) => (
                        <div className="col-lg-3 col-md-4 col-sm-6 pb-1" key={featuredProduct.id}>
                            <div className="product-item bg-light mb-4">
                                <div className="product-img position-relative overflow-hidden">
                                    <Link to={`/product/${featuredProduct.id}`}>
                                        <img
                                            className="img-fluid w-100"
                                            src={featuredProduct.foto_principal || "/img/no_image.jpg"}
                                            alt={featuredProduct.name}
                                            style={{ height: "280px", objectFit: "cover" }}
                                        />
                                    </Link>
                                    <div className="product-action">
                                        <button type="button" className="btn btn-outline-dark btn-square active" onClick={(event) => this.handleAddToCart(event, featuredProduct)} aria-label={t('add_to_cart')}>
                                            <i className="fa fa-shopping-cart" />
                                        </button>
                                        <Link className="btn btn-outline-dark btn-square active" to={`/product/${featuredProduct.id}`} aria-label={t('view_details')}>
                                            <i className="fa fa-search" />
                                        </Link>
                                    </div>
                                </div>
                                <div className="text-center py-4">
                                    <Link className="h6 text-decoration-none text-truncate" to={`/product/${featuredProduct.id}`}>
                                        {featuredProduct.name}
                                    </Link>
                                    <div className="d-flex align-items-center justify-content-center mt-2">
                                        <h5>{formatCOP(featuredProduct.price.current)}</h5>
                                        {featuredProduct.price.previous && (
                                            <h6 className="text-muted ml-2">
                                                <del>{formatCOP(featuredProduct.price.previous)}</del>
                                            </h6>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {this.state.isProductAdded && (
                    <ConfirmationModal
                        title={t('product_added_to_cart')}
                        acceptLabel={t('accept')}
                        onAccept={() => this.setState({ isProductAdded: false })}
                    />
                )}
            </div>


        );
    }

    callBackendService() {
        productosService.listarDestacados()
            .then(response => this.setState({ featuredProducts: response }))
            .catch(error => console.log(error));
    }
}
export default FeaturedProducts;