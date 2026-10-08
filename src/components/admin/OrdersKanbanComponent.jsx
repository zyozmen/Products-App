import React, { Component } from 'react';
import HeaderComponent from '../dashboard/HeaderComponent.jsx';
import FooterComponent from '../dashboard/FooterComponent.jsx';
import navigationComponent from '../navigation/NavigationComponent.jsx';
import AuthenticationService from '../../services/AuthenticationService.js';
import translationService from '../../services/TranslationService.js';
import orderService, {
    ORDER_STATUSES,
    ORDER_STATUS_BADGES,
    canTransition,
    getAllowedTransitions,
    getOrderStatus,
} from '../../services/OrderService.js';
import OrderStatusDialog from './OrderStatusDialog.jsx';
import PqrOrderDialog from './PqrOrderDialog.jsx';
import { formatCOP } from '../../Interfaces/ProductInterface';
import { filterOrders, getPeriodRange, toDateInputValue } from './OrdersReportHelper.js';

const formatDateTime = (value, language) => (
    value ? new Date(value).toLocaleString(language === 'EN' ? 'en-US' : 'es-CO') : ''
);

class OrdersKanbanComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            orders: [],
            loading: true,
            error: '',
            dragOverStatus: null,
            pendingChange: null,
            showPqrDialog: false,
            searchTerm: '',
            selectedDate: toDateInputValue(new Date()),
            currentLanguage: translationService.getLanguage(),
        };
        this.unsubscribeFromLanguage = null;
        this.loadOrders = this.loadOrders.bind(this);
        this.handleStatusChange = this.handleStatusChange.bind(this);
        this.applyStatusChange = this.applyStatusChange.bind(this);
        this.handleCreatePqr = this.handleCreatePqr.bind(this);
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

    handleStatusChange(order, status) {
        if (!status || status === getOrderStatus(order)) {
            return;
        }
        if (!canTransition(order, status)) {
            this.setState({ error: translationService.t('transition_not_allowed') });
            return;
        }
        if (status === 'PAGADA' || status === 'ENTREGADA') {
            this.setState({ pendingChange: { order, status }, error: '' });
            return;
        }
        this.applyStatusChange(order, status);
    }

    async applyStatusChange(order, status, extra = {}) {
        try {
            const updated = await orderService.updateOrderStatus(order.id, status, extra);
            this.setState((prev) => ({
                orders: prev.orders.map((o) => (o.id === order.id ? { ...o, ...extra, ...(updated || {}), status } : o)),
                pendingChange: null,
                error: '',
            }));
        } catch (error) {
            this.setState({ error: error.message, pendingChange: null });
        }
    }

    async handleCreatePqr(data) {
        await orderService.createPqrOrder(data);
        this.setState({ showPqrDialog: false });
        await this.loadOrders();
    }

    renderCard(order) {
        const t = (key) => translationService.t(key);
        const getOrderStatusLabel = (status) => {
            const key = `order_status_${String(status).toLowerCase()}`;
            const label = t(key);
            return label === key ? status : label;
        };
        const currentStatus = getOrderStatus(order);
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
                        <span className={`badge ${ORDER_STATUS_BADGES[currentStatus] || 'badge-secondary'}`}>
                            {getOrderStatusLabel(currentStatus)}
                        </span>
                    </div>
                    {(order.pqr || order.cashOnDelivery) && (
                        <div className="mt-1">
                            {order.pqr && <span className="badge badge-dark mr-1">{t('order_flag_pqr')}</span>}
                            {order.cashOnDelivery && <span className="badge badge-warning">{t('order_flag_cash_on_delivery')}</span>}
                        </div>
                    )}
                    <div className="small text-muted">{formatDateTime(order.createdAt, this.state.currentLanguage)}</div>
                    <div className="small">{t('customer')}: <strong>{order.username}</strong></div>
                    <ul className="small pl-3 mb-1 mt-1">
                        {(order.items || []).map((item, index) => (
                            <li key={`${order.id}-${item.productId}-${index}`}>
                                {item.name} x{item.quantity} ({formatCOP(item.unitPrice)})
                            </li>
                        ))}
                    </ul>
                    <div className="font-weight-bold">{t('total')}: {formatCOP(order.total)}</div>
                    <select
                        className="form-control form-control-sm mt-2"
                        value={currentStatus}
                        onChange={(e) => this.handleStatusChange(order, e.target.value)}
                        aria-label={`${t('status')} ${order.id}`}
                        disabled={getAllowedTransitions(order).length === 0}
                    >
                        {ORDER_STATUSES.filter((status) => status === currentStatus || canTransition(order, status)).map((status) => (
                            <option key={status} value={status}>{getOrderStatusLabel(status)}</option>
                        ))}
                    </select>
                </div>
            </div>
        );
    }

    render() {
        const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
        const { orders, loading, error, dragOverStatus, pendingChange, showPqrDialog, searchTerm, selectedDate } = this.state;
        const t = (key) => translationService.t(key);
        const getOrderStatusLabel = (status) => {
            const key = `order_status_${String(status).toLowerCase()}`;
            const label = t(key);
            return label === key ? status : label;
        };
        const dayRange = getPeriodRange(selectedDate, 'day');
        const dayOrders = orders.filter((o) => {
            const createdAt = new Date(o.createdAt);
            return createdAt >= dayRange.start && createdAt < dayRange.end;
        });
        const visibleOrders = filterOrders(dayOrders, searchTerm, getOrderStatusLabel);

        return (
            <>
                <HeaderComponentWithNavigation />
                <div className="container-fluid">
                    <div className="row px-xl-5">
                        <div className="col-12">
                            <nav className="breadcrumb bg-light mb-30">
                                <span className="breadcrumb-item text-dark">{t('admin_section')}</span>
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
                                <div className="d-flex" style={{ gap: '8px' }}>
                                    <button type="button" className="btn btn-sm btn-dark" onClick={() => this.setState({ showPqrDialog: true })}>
                                        {t('create_pqr_order')}
                                    </button>
                                    <button type="button" className="btn btn-sm btn-primary" onClick={this.loadOrders}>
                                        {t('update')}
                                    </button>
                                </div>
                            </div>
                            <div className="form-row align-items-end mb-3">
                                <div className="form-group col-md-3 mb-2">
                                    <label htmlFor="orders-day" className="mb-1">{t('orders_day')}</label>
                                    <div className="input-group">
                                        <input
                                            id="orders-day"
                                            type="date"
                                            className="form-control"
                                            value={selectedDate}
                                            onChange={(e) => e.target.value && this.setState({ selectedDate: e.target.value })}
                                        />
                                        <div className="input-group-append">
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => this.setState({ selectedDate: toDateInputValue(new Date()) })}
                                            >
                                                {t('orders_today')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group col-md-9 mb-2">
                                    <div className="input-group">
                                        <input
                                            type="search"
                                            className="form-control"
                                            placeholder={t('search_orders_placeholder')}
                                            aria-label={t('search_orders_placeholder')}
                                            value={searchTerm}
                                            onChange={(e) => this.setState({ searchTerm: e.target.value })}
                                        />
                                        {searchTerm && (
                                            <div className="input-group-append">
                                                <button type="button" className="btn btn-secondary" onClick={() => this.setState({ searchTerm: '' })}>
                                                    {t('clear_btn')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {error && <div className="alert alert-danger">{error}</div>}
                            {!loading && visibleOrders.length === 0 && (
                                <div className="alert alert-info">
                                    {searchTerm && dayOrders.length > 0 ? t('search_orders_no_results') : t('orders_no_orders_day')}
                                </div>
                            )}
                            {loading ? (
                                <p>{t('loading')}</p>
                            ) : (
                                <div className="d-flex" style={{ gap: '12px', overflowX: 'auto' }}>
                                    {ORDER_STATUSES.map((status) => {
                                        const columnOrders = visibleOrders.filter((o) => getOrderStatus(o) === status);
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
                                                    <span>{getOrderStatusLabel(status)}</span>
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
                {pendingChange && (
                    <OrderStatusDialog
                        key={`${pendingChange.order.id}-${pendingChange.status}`}
                        order={pendingChange.order}
                        status={pendingChange.status}
                        t={t}
                        onCancel={() => this.setState({ pendingChange: null })}
                        onConfirm={(extra) => this.applyStatusChange(pendingChange.order, pendingChange.status, extra)}
                    />
                )}
                {showPqrDialog && (
                    <PqrOrderDialog
                        t={t}
                        onCancel={() => this.setState({ showPqrDialog: false })}
                        onCreate={this.handleCreatePqr}
                    />
                )}
                <FooterComponent />
            </>
        );
    }
}

export default OrdersKanbanComponent;
