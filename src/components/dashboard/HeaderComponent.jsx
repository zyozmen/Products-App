import React, { Component } from 'react';
import AuthenticationService from '../../services/AuthenticationService.js';
import cartService from '../../services/CartService.js';

class HeaderComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            searchTerm: '',
            cartItemCount: cartService.getItemCount(),
        };
        this.handleSignOut = this.handleSignOut.bind(this);
        this.handleSignIn = this.handleSignIn.bind(this);
        this.handleCreateProduct = this.handleCreateProduct.bind(this);
        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.handleSearchSubmit = this.handleSearchSubmit.bind(this);
        this.handleCartClick = this.handleCartClick.bind(this);
        this.unsubscribeFromCart = null;
    }

    componentDidMount() {
        this.unsubscribeFromCart = cartService.subscribe((items) => {
            const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
            this.setState({ cartItemCount });
        });
    }

    componentWillUnmount() {
        if (this.unsubscribeFromCart) {
            this.unsubscribeFromCart();
        }
    }

    handleSignOut(e) {

        AuthenticationService.logout();
        this.props.navigate(`/welcome/guest`);

    }

    handleCreateProduct(e) {

        this.props.navigate(`/createProduct`);

    }

    handleSignIn(e) {

       this.props.navigate(`/login`);

    }

    handleCartClick(e) {
        e.preventDefault();
        this.props.navigate(`/cart`);
    }

    handleSearchChange(event) {
        this.setState({ searchTerm: event.target.value });
    }

    handleSearchSubmit(event) {
        event.preventDefault();
        const normalizedSearch = this.state.searchTerm.trim();
        const targetRoute = normalizedSearch
            ? `/shop?name=${encodeURIComponent(normalizedSearch)}`
            : '/shop';
        this.props.navigate(targetRoute);
    }

    render() {
        const isUserLoggedIn = AuthenticationService.isUserLoggedIn();
        const { searchTerm, cartItemCount } = this.state;
        console.log(isUserLoggedIn);
        return (
            <div className="container-fluid">
                <div className="row bg-secondary py-1 px-xl-5">
                    <div className="col-lg-6 d-none d-lg-block">
                        <div className="d-inline-flex align-items-center h-100">
                            <a className="text-body mr-3">
                                About
                            </a>
                            <a className="text-body mr-3" href="#">
                                Contact
                            </a>
                            <a className="text-body mr-3" href="#">
                                Help
                            </a>
                            <a className="text-body mr-3" href="#">
                                FAQs
                            </a>
                        </div>
                    </div>
                    <div className="col-lg-6 text-center text-lg-right">
                        <div className="d-inline-flex align-items-center">
                            <div className="btn-group">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-light dropdown-toggle"
                                    data-toggle="dropdown"
                                >
                                    My Account
                                </button>
                                <div className="dropdown-menu dropdown-menu-right">
                                    {!isUserLoggedIn && <button className="dropdown-item" type="button" onClick={this.handleSignIn}>
                                        Sign in
                                    </button>}
                                    {isUserLoggedIn && <button className="dropdown-item" type="button" onClick={this.handleCreateProduct}>
                                        Crear Producto
                                    </button>}
                                    {isUserLoggedIn && <button className="dropdown-item" type="button" onClick={this.handleSignOut}>
                                        Logout
                                    </button>}
                                </div>
                            </div>
                            <div className="btn-group mx-2">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-light dropdown-toggle"
                                    data-toggle="dropdown"
                                >
                                    USD
                                </button>
                                <div className="dropdown-menu dropdown-menu-right">
                                    <button className="dropdown-item" type="button">
                                        EUR
                                    </button>
                                    <button className="dropdown-item" type="button">
                                        GBP
                                    </button>
                                    <button className="dropdown-item" type="button">
                                        CAD
                                    </button>
                                </div>
                            </div>
                            <div className="btn-group">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-light dropdown-toggle"
                                    data-toggle="dropdown"
                                >
                                    EN
                                </button>
                                <div className="dropdown-menu dropdown-menu-right">
                                    <button className="dropdown-item" type="button">
                                        FR
                                    </button>
                                    <button className="dropdown-item" type="button">
                                        AR
                                    </button>
                                    <button className="dropdown-item" type="button">
                                        RU
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="d-inline-flex align-items-center d-block d-lg-none">
                            <a href="#" className="btn px-0 ml-2">
                                <i className="fas fa-heart text-dark" />
                                <span
                                    className="badge text-dark border border-dark rounded-circle"
                                    style={{ paddingBottom: 2 }}
                                >
                                    0
                                </span>
                            </a>
                            <a href="#" className="btn px-0 ml-2" onClick={this.handleCartClick}>
                                <i className="fas fa-shopping-cart text-dark" />
                                <span
                                    className="badge text-dark border border-dark rounded-circle"
                                    style={{ paddingBottom: 2 }}
                                >
                                    {cartItemCount}
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
                <div className="row align-items-center bg-light py-3 px-xl-5 d-none d-lg-flex">
                    <div className="col-lg-4">
                        <a href="" className="text-decoration-none">
                            <span className="h1 text-uppercase text-primary bg-dark px-2">
                                Grow
                            </span>
                            <span className="h1 text-uppercase text-dark bg-primary px-2 ml-n1">
                                Shop
                            </span>
                        </a>
                    </div>
                    <div className="col-lg-4 col-6 text-left">
                        <form onSubmit={this.handleSearchSubmit}>
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search for products"
                                    value={searchTerm}
                                    onChange={this.handleSearchChange}
                                />
                                <div className="input-group-append">
                                    <button type="submit" className="input-group-text bg-transparent text-primary">
                                        <i className="fa fa-search" />
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="col-lg-4 col-6 text-right">
                        <p className="m-0">Customer Service</p>
                        <h5 className="m-0">+012 345 6789</h5>
                    </div>
                </div>
            </div>
        );
    }

}
export default HeaderComponent;