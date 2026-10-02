import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import AuthenticationService from '../../services/AuthenticationService.js';
import cartService from '../../services/CartService.js';
import translationService from '../../services/TranslationService.js';
import DropdownMenu from '../ui/DropdownMenu';
import CollapseMenu from '../ui/CollapseMenu';
import './HeaderComponent.css';

class HeaderComponent extends Component {
    constructor(props) {
        super(props);
        const savedTheme = localStorage.getItem('growShopTheme') || 'light';
        this.state = {
            searchTerm: '',
            cartItemCount: cartService.getItemCount(),
            currentLanguage: translationService.getLanguage(),
            theme: savedTheme
        };
        this.handleSignOut = this.handleSignOut.bind(this);
        this.handleSignIn = this.handleSignIn.bind(this);
        this.handleCreateProduct = this.handleCreateProduct.bind(this);
        this.handleManageUsers = this.handleManageUsers.bind(this);
        this.handleCartClick = this.handleCartClick.bind(this);
        this.handleLanguageChange = this.handleLanguageChange.bind(this);
        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.handleSearchSubmit = this.handleSearchSubmit.bind(this);
        this.toggleTheme = this.toggleTheme.bind(this);
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

        const savedTheme = localStorage.getItem('growShopTheme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    componentWillUnmount() {
        if (this.unsubscribeFromCart) {
            this.unsubscribeFromCart();
        }
        if (this.unsubscribeFromLanguage) {
            this.unsubscribeFromLanguage();
        }
    }

    handleSignOut(e) {
        AuthenticationService.logout();
        this.props.navigate(`/welcome`);
    }

    handleCreateProduct(e) {
        this.props.navigate(`/createProduct`);
    }

    handleManageUsers(e) {
        this.props.navigate(`/admin/users`);
    }

    handleSignIn(e) {
       this.props.navigate(`/login`);
    }

    handleCartClick(e) {
        e.preventDefault();
        this.props.navigate(`/cart`);
    }

    handleLanguageChange(lang) {
        translationService.setLanguage(lang);
    }

    toggleTheme() {
        const nextTheme = this.state.theme === 'dark' ? 'light' : 'dark';
        this.setState({ theme: nextTheme });
        localStorage.setItem('growShopTheme', nextTheme);
        if (nextTheme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    handleSearchSubmit(event) {
        event.preventDefault();
        const normalizedSearch = this.state.searchTerm.trim();
        const targetRoute = normalizedSearch
            ? `/shop?name=${encodeURIComponent(normalizedSearch)}`
            : '/shop';
        this.props.navigate(targetRoute);
    }

    handleSearchChange(event) {
        this.setState({ searchTerm: event.target.value });
    }

    render() {
        const isUserLoggedIn = AuthenticationService.isUserLoggedIn();
        const isUserAdmin = AuthenticationService.isUserAdmin();
        const loggedInUser = AuthenticationService.getLoggedInUser();
        const { searchTerm, cartItemCount, currentLanguage } = this.state;
        const t = (key) => translationService.t(key);
        const usernameLabel = isUserLoggedIn && loggedInUser ? loggedInUser.username : t('sign_in');
        console.log("isUserLoggedIn:", isUserLoggedIn);

        return (
            <div className="container-fluid p-0">
                {/* ── TOP BAR (Antiguo HeaderComponent) ── */}
                <div className="container-fluid bg-light">
                    <div className="row bg-secondary py-1 px-xl-5">
                        <div className="col-lg-6 d-none d-lg-block">
                        </div>
                        <div className="col-lg-6 text-center text-lg-right">
                            <div className="d-inline-flex align-items-center">
                                <DropdownMenu label={usernameLabel}>
                                    {!isUserLoggedIn && <button className="dropdown-item" type="button" onClick={this.handleSignIn}>
                                        {t('sign_in')}
                                    </button>}
                                    {isUserLoggedIn && <button className="dropdown-item font-weight-bold text-dark" type="button" onClick={() => this.props.navigate('/profile')}>
                                        {t('manage_profile')}
                                    </button>}
                                    {isUserAdmin && <button className="dropdown-item text-primary" type="button" onClick={this.handleManageUsers}>
                                        {t('manage_users')}
                                    </button>}
                                    {isUserLoggedIn && !isUserAdmin && <button className="dropdown-item" type="button" onClick={() => this.props.navigate('/orders')}>
                                        {t('my_orders')}
                                    </button>}
                                    {isUserAdmin && <button className="dropdown-item text-primary" type="button" onClick={() => this.props.navigate('/admin/orders')}>
                                        {t('manage_orders')}
                                    </button>}
                                    {isUserAdmin && <button className="dropdown-item" type="button" onClick={() => this.props.navigate('/admin/orders/report')}>
                                        {t('orders_report')}
                                    </button>}
                                    {isUserAdmin && <button className="dropdown-item" type="button" onClick={this.handleCreateProduct}>
                                        {t('create_product')}
                                    </button>}
                                    {isUserLoggedIn && <button className="dropdown-item" type="button" onClick={this.handleSignOut}>
                                        {t('logout')}
                                    </button>}
                                </DropdownMenu>
                                <DropdownMenu label={currentLanguage}>
                                    <button className="dropdown-item" type="button" onClick={() => this.handleLanguageChange('ES')}>
                                        ES
                                    </button> 
                                    <button className="dropdown-item" type="button" onClick={() => this.handleLanguageChange('EN')}>
                                        EN
                                    </button> 
                                </DropdownMenu>
                                <button 
                                    className="btn btn-sm btn-dark ml-2 d-inline-flex align-items-center" 
                                    type="button"
                                    onClick={this.toggleTheme}
                                    style={{ 
                                        borderRadius: '20px', 
                                        padding: '4px 10px', 
                                        fontSize: '12px',
                                        backgroundColor: this.state.theme === 'dark' ? '#ffc107' : '#3D464D',
                                        color: this.state.theme === 'dark' ? '#000' : '#fff',
                                        border: 'none',
                                        fontWeight: '700'
                                    }}
                                >
                                    <i className={this.state.theme === 'dark' ? 'fas fa-sun mr-1' : 'fas fa-moon mr-1'} />
                                    {this.state.theme === 'dark' ? 'CLARO' : 'OSCURO'}
                                </button>
                            </div>
                            <div className="d-inline-flex align-items-center d-block d-lg-none">
                                <button type="button" className="btn px-0 ml-2" aria-label={t('view_favs')}>
                                    <i className="fas fa-heart text-dark" />
                                    <span className="badge text-dark border border-dark rounded-circle header-badge">
                                        0
                                    </span>
                                </button>
                                <button type="button" className="btn px-0 ml-2" onClick={this.handleCartClick} aria-label={t('view_cart')}>
                                    <i className="fas fa-shopping-cart text-dark" />
                                    <span className="badge text-dark border border-dark rounded-circle header-badge">
                                        {cartItemCount}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── NAVIGATION BAR (Antiguo NavBarComponent) ── */}
                <div className="container-fluid bg-dark mb-30">
                    <div className="row px-xl-5">
                        <div className="col-lg-3 d-none d-lg-block">
                            <div className="row align-items-center bg-dark py-3 px-xl-5 d-none d-lg-flex" style={{ height: "100%" }}>
                                <div className="col-lg-12">
                                    <NavLink to="/welcome" className="btn btn-link text-decoration-none p-0">
                                        <span className="h1 text-uppercase text-dark bg-light px-2">
                                            Zona
                                        </span>
                                        <span className="h1 text-uppercase text-dark bg-primary px-2 ml-n1">
                                            Green
                                        </span>
                                    </NavLink>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-9">
                            <nav className="navbar navbar-expand-lg bg-dark navbar-dark py-3 py-lg-0 px-0">
                                <NavLink to="/welcome" className="text-decoration-none d-block d-lg-none">
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
                                            {t('hidroponia')}
                                        </NavLink>
                                        <NavLink to="/Legal" className="nav-item nav-link">
                                            {t('legal')}
                                        </NavLink> 
                                        <div className="nav-item px-lg-3 d-flex align-items-center">
                                            <form onSubmit={this.handleSearchSubmit}>
                                                <div className="input-group">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder={t('search_placeholder')}
                                                        value={searchTerm}
                                                        onChange={this.handleSearchChange}
                                                        style={{ width: "200px" }}
                                                    />
                                                    <div className="input-group-append">
                                                        <button type="submit" className="input-group-text bg-transparent text-primary border-left-0">
                                                            <i className="fa fa-search" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="mt-2">
                                        <p className="m-0 text-muted small text-light">{t('customer_service')}</p>
                                        <h5 className="m-0 font-weight-bold text-primary">{t('customer_service_num')}</h5>
                                    </div>
                                    </div>
                                    <div className="navbar-nav ml-auto py-0 d-none d-lg-block">
                                        <NavLink to="/cart" className="btn px-0 ml-3">
                                            <i className="fas fa-shopping-cart text-primary" />
                                            <span className="badge text-light border border-secondary rounded-circle header-badge">
                                                {cartItemCount}
                                            </span>
                                        </NavLink>
                                    </div>
                                </CollapseMenu>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default HeaderComponent;