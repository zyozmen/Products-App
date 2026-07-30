import React, { Component } from 'react';
import cartService from '../../services/CartService';
import { NavLink } from 'react-router-dom';

class NavBarComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            cartItemCount: cartService.getItemCount(),
        };
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

    render() {
        const { cartItemCount } = this.state;
        return (
            <div className="container-fluid bg-dark mb-30">
                <div className="row px-xl-5">
                    <div className="col-lg-3 d-none d-lg-block">
                        <NavLink
                            className="btn d-flex align-items-center justify-content-between bg-primary w-100"
                            data-toggle="collapse"
                            style={{ height: 65, padding: "0 30px" }}
                        >
                            <h6 className="text-dark m-0">
                                <i className="fa fa-bars mr-2" />
                                Servicios
                            </h6>
                            <i className="fa fa-angle-down text-dark" />
                        </NavLink>
                        <nav
                            className="collapse position-absolute navbar navbar-vertical navbar-light align-items-start p-0 bg-light"
                            id="navbar-vertical"
                            style={{ width: "calc(100% - 30px)", zIndex: 999 }}
                        >
                            <div className="navbar-nav w-100">
                                <div className="nav-item dropdown dropright">
                                    <NavLink
                                        to="#"
                                        className="nav-link dropdown-toggle"
                                        data-toggle="dropdown"
                                    >
                                        Premium <i className="fa fa-angle-right float-right mt-1" />
                                    </NavLink>
                                    <div className="dropdown-menu position-absolute rounded-0 border-0 m-0">
                                        <NavLink to="" className="dropdown-item">
                                            Armarios Inteligentes
                                        </NavLink>
                                        <NavLink to="" className="dropdown-item">
                                            Iluminacion
                                        </NavLink>
                                        <NavLink to="" className="dropdown-item">
                                            Sistemas de Ventilacion
                                        </NavLink>
                                    </div>
                                </div>
                                <NavLink to="" className="nav-item nav-link">
                                    Mantenimiento de equipos
                                </NavLink>
                                <NavLink to="" className="nav-item nav-link">
                                    Alquiler de Equipo
                                </NavLink>
                                <NavLink to="" className="nav-item nav-link">
                                    Calendario de Cultivo
                                </NavLink>
                                <NavLink to="" className="nav-item nav-link">
                                    Kit de Nutrientes
                                </NavLink>
                                <NavLink to="" className="nav-item nav-link">
                                    Caja Sorpresa
                                </NavLink>
                                <NavLink to="" className="nav-item nav-link">
                                    Calculadora de Nutrientes
                                </NavLink>
                                <NavLink to="" className="nav-item nav-link">
                                    Cuidado de plantas
                                </NavLink>
                                <NavLink to="" className="nav-item nav-link">
                                    Automatizaciones
                                </NavLink>
                            </div>
                        </nav>
                    </div>
                    <div className="col-lg-9">
                        <nav className="navbar navbar-expand-lg bg-dark navbar-dark py-3 py-lg-0 px-0">
                            <NavLink to="" className="text-decoration-none d-block d-lg-none">
                                <span className="h1 text-uppercase text-dark bg-light px-2">
                                    Multi
                                </span>
                                <span className="h1 text-uppercase text-light bg-primary px-2 ml-n1">
                                    Shop
                                </span>
                            </NavLink>
                            <button
                                type="button"
                                className="navbar-toggler"
                                data-toggle="collapse"
                                data-target="#navbarCollapse"
                            >
                                <span className="navbar-toggler-icon" />
                            </button>
                            <div
                                className="collapse navbar-collapse justify-content-between"
                                id="navbarCollapse"
                            >
                                <div className="navbar-nav mr-auto py-0">
                                    <NavLink to="/welcome/admin" className="nav-item nav-link active">
                                        Inicio
                                    </NavLink>
                                    <NavLink to="/shop" className="nav-item nav-link">
                                        Esquejes
                                    </NavLink>
                                    <NavLink to="/detail" className="nav-item nav-link">
                                        Asesoria de Cultivo
                                    </NavLink>
                                    <NavLink to="/detail" className="nav-item nav-link">
                                        Elementos Indoor
                                    </NavLink>
                                    <NavLink to="/detail" className="nav-item nav-link">
                                        Hidroponia
                                    </NavLink>
                                    <NavLink to="/contact" className="nav-item nav-link">
                                        Contacto
                                    </NavLink>
                                </div>
                                <div className="navbar-nav ml-auto py-0 d-none d-lg-block">
                                    <NavLink to="" className="btn px-0">
                                        <i className="fas fa-heart text-primary" />
                                        <span
                                            className="badge text-secondary border border-secondary rounded-circle"
                                            style={{ paddingBottom: 2 }}
                                        >
                                            0
                                        </span>
                                    </NavLink>
                                    <NavLink to="/cart" className="btn px-0 ml-3">
                                        <i className="fas fa-shopping-cart text-primary" />
                                        <span
                                            className="badge text-secondary border border-secondary rounded-circle"
                                            style={{ paddingBottom: 2 }}
                                        >
                                            {cartItemCount}
                                        </span>
                                    </NavLink>
                                </div>
                            </div>
                        </nav>
                    </div>
                </div>
            </div>

        );
    }
}

export default NavBarComponent;