import React, { Component } from 'react';
import HeaderComponent from '../dashboard/HeaderComponent.jsx';
import FooterComponent from '../dashboard/FooterComponent.jsx';
import navigationComponent from '../navigation/NavigationComponent.jsx';
import translationService from '../../services/TranslationService.js';
import orderService, { ORDER_STATUS_LABELS, ORDER_STATUS_BADGES } from '../../services/OrderService.js';
import { formatCOP } from '../../Interfaces/ProductInterface';

class MyOrdersComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            orders: [],
            loading: true,
            error: '',
            currentLanguage: translationService.getLanguage(),
        };
        this.unsubscribeFromLanguage = null;
    }

    async componentDidMount() {
        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });
        try {
            const orders = await orderService.getMyOrders();
            this.setState({ orders, loading: false });
        } catch (error) {
            this.setState({ loading: false, error: error.message });
        }
    }

    componentWillUnmount() {
        if (this.unsubscribeFromLanguage) {
            this.unsubscribeFromLanguage();
        }
    }

    render() {
        const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
        const { orders, loading, error } = this.state;
        const t = (key) => translationService.t(key);

        return (
            <>
                <HeaderComponentWithNavigation />
                <div className="container-fluid pb-5">
                    <div className="row px-xl-5">
                        <div className="col">
                            <h2 className="section-title position-relative text-uppercase my-4">
                                <span className="bg-secondary pr-3">{t('my_orders')}</span>
                            </h2>
                            {error && <div className="alert alert-danger">{error}</div>}
                            {loading ? (
                                <p>Cargando...</p>
                            ) : orders.length === 0 && !error ? (
                                <div className="bg-light p-30">Aún no has realizado órdenes.</div>
                            ) : (
                                orders.map((order) => (
                                    <div key={order.id} className="bg-light p-30 mb-4 table-responsive">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h5 className="mb-0">Orden #{order.id}</h5>
                                            <span className={`badge ${ORDER_STATUS_BADGES[order.status] || 'badge-secondary'} py-2 px-3`}>
                                                {ORDER_STATUS_LABELS[order.status] || order.status}
                                            </span>
                                        </div>
                                        <div className="text-muted mb-2">
                                            {order.createdAt ? new Date(order.createdAt).toLocaleString('es-CO') : ''}
                                        </div>
                                        <table className="table table-bordered text-center mb-2">
                                            <thead className="thead-dark">
                                                <tr>
                                                    <th>Producto</th>
                                                    <th>Cantidad</th>
                                                    <th>Valor unitario</th>
                                                    <th>Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(order.items || []).map((item, index) => (
                                                    <tr key={`${order.id}-${item.productId}-${index}`}>
                                                        <td className="text-left">{item.name}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>{formatCOP(item.unitPrice)}</td>
                                                        <td>{formatCOP(item.unitPrice * item.quantity)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <h6 className="text-right mb-0">Total: {formatCOP(order.total)}</h6>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                <FooterComponent />
            </>
        );
    }
}

export default MyOrdersComponent;
