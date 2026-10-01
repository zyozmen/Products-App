import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import productosService from '../../services/ProductosService';
import cartService from '../../services/CartService';
import translationService from '../../services/TranslationService';
import { formatCOP } from '../../Interfaces/ProductInterface';


class FeaturedProducts extends Component {
    constructor(props) {
        super(props);
        this.state = {
            featuredProducts:[],
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
            image: `/img/product-${featuredProduct.id}.jpg`,
        });
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
                                <img className="img-fluid w-100" src={`/img/product-${featuredProduct.id}.jpg`} alt={featuredProduct.description || featuredProduct.description} />
                                <div className="product-action">
                                    <button type="button" className="btn btn-outline-dark btn-square" onClick={(event) => this.handleAddToCart(event, featuredProduct)} aria-label="Agregar al carrito">
                                        <i className="fa fa-shopping-cart" />
                                    </button>
                                    <button type="button" className="btn btn-outline-dark btn-square" aria-label="Agregar a favoritos">
                                        <i className="far fa-heart" />
                                    </button>
                                    <button type="button" className="btn btn-outline-dark btn-square" aria-label="Actualizar producto">
                                        <i className="fa fa-sync-alt" />
                                    </button>
                                    <Link className="btn btn-outline-dark btn-square" to={`/product/${featuredProduct.id}`}>
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
                                <div className="d-flex align-items-center justify-content-center mb-1">
                                    <small className="fa fa-star text-primary mr-1" />
                                    <small className="fa fa-star text-primary mr-1" />
                                    <small className="fa fa-star text-primary mr-1" />
                                    <small className="fa fa-star text-primary mr-1" />
                                    <small className="fa fa-star text-primary mr-1" />
                                    <small>(99)</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
            </div>


        );
    }

    callBackendService() {
    productosService.listarDestacados()
      .then(response =>  this.setState({ featuredProducts: response }))
      .catch(error => console.log(error));
  }
}
export default FeaturedProducts;