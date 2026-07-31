import React, { Component } from 'react';
import cartService from '../../services/CartService';
import { NavLink } from 'react-router-dom';
import DropdownMenu from '../ui/DropdownMenu';
import CollapseMenu from '../ui/CollapseMenu';

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
                        <CollapseMenu
                            className="position-relative"
                            title={(
                                <div className="btn d-flex align-items-center justify-content-between bg-primary w-100" style={{ height: 65, padding: "0 30px" }}>
                                    <h6 className="text-dark m-0">
                                        <i className="fa fa-bars mr-2" />
                                        Servicios
                                    </h6>
                                    <i className="fa fa-angle-down text-dark" />
                                </div>
                            )}
                            triggerClassName="btn border-0 p-0 w-100"
                            contentClassName="position-absolute navbar navbar-vertical navbar-light align-items-start p-0 bg-light"
                        >
                            <div className="navbar-nav w-100" style={{ width: "calc(100% - 30px)" }}>
                                <DropdownMenu label="Premium" className="nav-item dropdown dropright w-100">
                                    <NavLink to="" className="dropdown-item">
                                        Armarios Inteligentes
                                    </NavLink>
                                    <NavLink to="" className="dropdown-item">
                                        Iluminacion
                                    </NavLink>
                                    <NavLink to="" className="dropdown-item">
                                        Sistemas de Ventilacion
                                    </NavLink>
                                </DropdownMenu>
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
                        </CollapseMenu>
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
                            <CollapseMenu
                                className="w-100"
                                title={<span className="navbar-toggler-icon" />}
                                triggerClassName="navbar-toggler"
                                contentClassName="navbar-collapse justify-content-between"
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
                            </CollapseMenu>
                        </nav>
                    </div>
                </div>
            </div>

        );
    }
}

export default NavBarComponent;