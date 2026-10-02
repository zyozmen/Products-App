import React, { Component } from 'react';
import HeaderComponent from '../dashboard/HeaderComponent.jsx';
import FooterComponent from '../dashboard/FooterComponent.jsx';
import navigationComponent from '../navigation/NavigationComponent.jsx';
import AuthenticationService from '../../services/AuthenticationService.js';
import translationService from '../../services/TranslationService.js';
import orderService, { ORDER_STATUSES, ORDER_STATUS_LABELS, ORDER_STATUS_BADGES } from '../../services/OrderService.js';
import { formatCOP } from '../../Interfaces/ProductInterface';

const formatDateTime = (value) => (value ? new Date(value).toLocaleString('es-CO') : '');

class OrdersKanbanComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            orders: [],
            loading: true,
            error: '',
            dragOverStatus: null,
            currentLanguage: translationService.getLanguage(),
        };
        this.unsubscribeFromLanguage = null;
        this.loadOrders = this.loadOrders.bind(this);
        this.handleStatusChange = this.handleStatusChange.bind(this);
    }

    async componentDidMount() {
        if (!AuthenticationService.isUserAdmin()) {
            this.props.navigate('/welcome');
            return;
        }
        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });
        await this.loadOrders();
    }

    componentWillUnmount() {
        if (this.unsubscribeFromLanguage) {
            this.unsubscribeFromLanguage();
        }
    }

    async loadOrders() {
        this.setState({ loading: true, error: '' });
        try {
            const orders = await orderService.getAllOrders();
            this.setState({ orders, loading: false });
        } catch (error) {
            this.setState({ loading: false, error: error.message });
        }
    }

    async handleStatusChange(order, status) {
        if (!status || status === order.status) {
            return;
        }
        try {
            const updated = await orderService.updateOrderStatus(order.id, status);
            this.setState((prev) => ({
                orders: prev.orders.map((o) => (o.id === order.id ? { ...o, ...(updated || {}), status } : o)),
                error: '',
            }));
        } catch (error) {
            this.setState({ error: error.message });
        }
    }

    renderCard(order) {
        return (
            <div
                key={order.id}
                className="card mb-2 shadow-sm"
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', String(order.id))}
                style={{ cursor: 'grab' }}
            >
                <div className="card-body p-2">
                    <div className="d-flex justify-content-between">
                        <strong>#{order.id}</strong>
                        <span className={`badge ${ORDER_STATUS_BADGES[order.status] || 'badge-secondary'}`}>
                            {ORDER_STATUS_LABELS[order.status] || order.status}
                        </span>
                    </div>
                    <div className="small text-muted">{formatDateTime(order.createdAt)}</div>
                    <div className="small">Cliente: <strong>{order.username}</strong></div>
                    <ul className="small pl-3 mb-1 mt-1">
                        {(order.items || []).map((item, index) => (
                            <li key={`${order.id}-${item.productId}-${index}`}>
                                {item.name} x{item.quantity} ({formatCOP(item.unitPrice)})
                            </li>
                        ))}
                    </ul>
                    <div className="font-weight-bold">Total: {formatCOP(order.total)}</div>
                    <select
                        className="form-control form-control-sm mt-2"
                        value={order.status}
                        onChange={(e) => this.handleStatusChange(order, e.target.value)}
                        aria-label={`Estado de la orden ${order.id}`}
                    >
                        {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>
                        ))}
                    </select>
                </div>
            </div>
        );
    }

    render() {
        const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
        const { orders, loading, error, dragOverStatus } = this.state;
        const t = (key) => translationService.t(key);

        return (
            <>
                <HeaderComponentWithNavigation />
                <div className="container-fluid">
                    <div className="row px-xl-5">
                        <div className="col-12">
                            <nav className="breadcrumb bg-light mb-30">
                                <span className="breadcrumb-item text-dark">Admin</span>
                                <span className="breadcrumb-item active">{t('manage_orders')}</span>
                            </nav>
                        </div>
                    </div>
                </div>

                <div className="container-fluid pb-5">
                    <div className="row px-xl-5">
                        <div className="col">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h2 className="section-title position-relative text-uppercase mb-0">
                                    <span className="bg-secondary pr-3">{t('manage_orders')}</span>
                                </h2>
                                <button type="button" className="btn btn-sm btn-primary" onClick={this.loadOrders}>
                                    Actualizar
                                </button>
                            </div>
                            {error && <div className="alert alert-danger">{error}</div>}
                            {loading ? (
                                <p>Cargando...</p>
                            ) : (
                                <div className="d-flex" style={{ gap: '12px', overflowX: 'auto' }}>
                                    {ORDER_STATUSES.map((status) => {
                                        const columnOrders = orders.filter((o) => o.status === status);
                                        return (
                                            <div
                                                key={status}
                                                className="bg-light p-2"
                                                style={{
                                                    minWidth: '260px',
                                                    flex: '1 0 260px',
                                                    outline: dragOverStatus === status ? '2px dashed #ffc107' : 'none',
                                                }}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    if (dragOverStatus !== status) this.setState({ dragOverStatus: status });
                                                }}
                                                onDragLeave={() => this.setState({ dragOverStatus: null })}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    this.setState({ dragOverStatus: null });
                                                    const id = e.dataTransfer.getData('text/plain');
                                                    const order = orders.find((o) => String(o.id) === id);
                                                    if (order) this.handleStatusChange(order, status);
                                                }}
                                            >
                                                <h6 className="text-uppercase d-flex justify-content-between">
                                                    <span>{ORDER_STATUS_LABELS[status]}</span>
                                                    <span className={`badge ${ORDER_STATUS_BADGES[status]}`}>{columnOrders.length}</span>
                                                </h6>
                                                {columnOrders.map((order) => this.renderCard(order))}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <FooterComponent />
            </>
        );
    }
}

export default OrdersKanbanComponent;
