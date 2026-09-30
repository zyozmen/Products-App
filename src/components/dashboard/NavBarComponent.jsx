import React, { Component } from 'react';
import cartService from '../../services/CartService';
import translationService from '../../services/TranslationService';
import { NavLink } from 'react-router-dom';
import DropdownMenu from '../ui/DropdownMenu';
import CollapseMenu from '../ui/CollapseMenu';
import './NavBarComponent.css';

class NavBarComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cartItemCount: cartService.getItemCount(),
            currentLanguage: translationService.getLanguage(),
        };
        this.unsubscribeFromCart = null;
        this.unsubscribeFromLanguage = null;
    }

    componentDidMount() {
        this.unsubscribeFromCart = cartService.subscribe((items) => {
            const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
            this.setState({ cartItemCount });
        });
        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });
    }

    componentWillUnmount() {
        if (this.unsubscribeFromCart) {
            this.unsubscribeFromCart();
        }
        if (this.unsubscribeFromLanguage) {
            this.unsubscribeFromLanguage();
        }
    }

    render() {
        const { cartItemCount } = this.state;
        const t = (key) => translationService.t(key);
        return (
            <div className="container-fluid bg-dark mb-30">
                <div className="row px-xl-5">
                    <div className="col-lg-3 d-none d-lg-block">
                        
                            
                    </div>
                    <div className="col-lg-9">
                        <nav className="navbar navbar-expand-lg bg-dark navbar-dark py-3 py-lg-0 px-0">
                            <NavLink to="" className="text-decoration-none d-block d-lg-none">
                                <span className="h1 text-uppercase text-dark bg-light px-2">
                                    Zona
                                </span>
                                <span className="h1 text-uppercase text-light bg-primary px-2 ml-n1">
                                    Green
                                </span>
                            </NavLink>
                            <CollapseMenu
                                className="w-100"
                                title={<span className="navbar-toggler-icon" />}
                                triggerClassName="navbar-toggler"
                                contentClassName="navbar-collapse justify-content-between"
                            >
                                <div className="navbar-nav mr-auto py-0">
                                    <NavLink to="/shop" className="nav-item nav-link">
                                        {t('cafe_premium')}
                                    </NavLink>
                                    <NavLink to="/shop" className="nav-item nav-link">
                                        {t('flor_premium')}
                                    </NavLink>
                                    <NavLink to="/shop" className="nav-item nav-link">
                                        {t('flor_en_sale')}
                                    </NavLink>
                                    <NavLink to="/shop" className="nav-item nav-link">
                                        {t('hidroponia')}
                                    </NavLink>
                                    <NavLink to="/contact" className="nav-item nav-link">
                                        {t('contacto')}
                                    </NavLink>
                                </div>
                                <div className="navbar-nav ml-auto py-0 d-none d-lg-block">
                                    <NavLink to="" className="btn px-0">
                                        <i className="fas fa-heart text-primary" />
                                        <span className="badge text-secondary border border-secondary rounded-circle header-badge">
                                            0
                                        </span>
                                    </NavLink>
                                    <NavLink to="/cart" className="btn px-0 ml-3">
                                        <i className="fas fa-shopping-cart text-primary" />
                                        <span className="badge text-secondary border border-secondary rounded-circle header-badge">
                                            {cartItemCount}
                                        </span>
                                    </NavLink>
                                </div>
                            </CollapseMenu>
                        </nav>
                    </div>
                </div>
            </div>

        );
    }
}

export default NavBarComponent;