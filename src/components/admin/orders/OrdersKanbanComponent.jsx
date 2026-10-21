import { useEffect, useState } from 'react';
import HeaderComponent from '../../dashboard/HeaderComponent.jsx';
import AdminNav from '../AdminNav.jsx';
import FooterComponent from '../../dashboard/FooterComponent.jsx';
import navigationComponent from '../../navigation/NavigationComponent.jsx';
import AuthenticationService from '../../../services/AuthenticationService.js';
import translationService from '../../../services/TranslationService.js';
import {
    ORDER_STATUSES,
    canTransition,
    getAllowedTransitions,
    getOrderStatus,
} from '../../../services/OrderService.js';
import { useAdminOrders, useOrderMutations } from '../../../hooks/useApiQueries.ts';
import useTranslation from '../../../hooks/useTranslation.js';
import OrderStatusDialog from './OrderStatusDialog.jsx';
import PqrOrderDialog from './PqrOrderDialog.jsx';
import { formatCOP } from '../../../Interfaces/ProductInterface.js';
import { filterOrders, getPeriodRange, toDateInputValue } from './OrdersReportHelper.js';
import { Badge, Button, Card, ErrorNotice, Input, Select } from '../../ui/shadcn';

const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
const STATUS_TONES = {
    CREADA: 'blue',
    PAGADA: 'green',
    EMPACADA: 'orange',
    ENTREGADA: 'neutral',
    CANCELADA: 'red',
};

const formatDateTime = (value, language) => (
    value ? new Date(value).toLocaleString(language === 'EN' ? 'en-US' : 'es-CO') : ''
);

function OrdersKanbanComponent({ navigate }) {
    const t = useTranslation();
    const language = translationService.getLanguage();
    const ordersQuery = useAdminOrders();
    const { updateStatus, createPqr } = useOrderMutations();
    const [error, setError] = useState('');
    const [dragOverStatus, setDragOverStatus] = useState(null);
    const [pendingChange, setPendingChange] = useState(null);
    const [showPqrDialog, setShowPqrDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(() => toDateInputValue(new Date()));
    const orders = ordersQuery.data ?? [];
    const getOrderStatusLabel = (status) => {
        const key = `order_status_${String(status).toLowerCase()}`;
        const label = t(key);
        return label === key ? status : label;
    };

    useEffect(() => {
        if (!AuthenticationService.isUserAdmin()) navigate('/welcome');
    }, [navigate]);

    const loadOrders = async () => {
        setError('');
        const result = await ordersQuery.refetch();
        if (result.isError) setError(result.error?.message || t('orders_load_error'));
    };

    const applyStatusChange = async (order, status, extra = {}) => {
        try {
            await updateStatus.mutateAsync({ id: order.id, status, extra });
            setPendingChange(null);
            setError('');
        } catch (mutationError) {
            setError(mutationError instanceof Error ? mutationError.message : t('order_status_update_failed'));
            setPendingChange(null);
        }
    };

    const handleStatusChange = (order, status) => {
        if (!status || status === getOrderStatus(order)) return;
        if (!canTransition(order, status)) {
            setError(t('transition_not_allowed'));
            return;
        }
        if (status === 'PAGADA' || (status === 'ENTREGADA' && order.cashOnDelivery)) {
            setPendingChange({ order, status });
            setError('');
            return;
        }
        void applyStatusChange(order, status);
    };

    const handleCreatePqr = async (data) => {
        try {
            await createPqr.mutateAsync(data);
            setShowPqrDialog(false);
            setError('');
        } catch (mutationError) {
            setError(mutationError instanceof Error ? mutationError.message : t('pqr_create_failed'));
            throw mutationError;
        }
    };

    const renderCard = (order) => {
        const currentStatus = getOrderStatus(order);
        return (
            <Card
                key={order.id}
                className="hu-mb-3 hu-p-3"
                draggable
                onDragStart={(event) => event.dataTransfer.setData('text/plain', String(order.id))}
            >
                <div className="hu-flex hu-items-start hu-justify-between hu-gap-2">
                    <strong>#{order.id}</strong>
                    <Badge tone={STATUS_TONES[currentStatus] || 'neutral'}>{getOrderStatusLabel(currentStatus)}</Badge>
                </div>
                {(order.pqr || order.cashOnDelivery) && (
                    <div className="hu-mt-2 hu-flex hu-flex-wrap hu-gap-2">
                        {order.pqr && <Badge>{t('order_flag_pqr')}</Badge>}
                        {order.cashOnDelivery && <Badge tone="orange">{t('order_flag_cash_on_delivery')}</Badge>}
                    </div>
                )}
                <p className="hu-mb-1 hu-mt-2 hu-text-xs hu-text-slate-500">{formatDateTime(order.createdAt, language)}</p>
                <p className="hu-mb-1 hu-mt-1 hu-text-sm">{t('customer')}: <strong>{order.username}</strong></p>
                <ul className="hu-mb-2 hu-mt-1 hu-list-disc hu-pl-5 hu-text-xs hu-text-slate-600">
                    {(order.items || []).map((item, index) => (
                        <li key={`${order.id}-${item.productId}-${index}`}>
                            {item.name} x{item.quantity} ({formatCOP(item.unitPrice)})
                        </li>
                    ))}
                </ul>
                <p className="hu-mb-2 hu-mt-0 hu-text-sm hu-font-bold">{t('total')}: {formatCOP(order.total)}</p>
                <Select
                    value={currentStatus}
                    onChange={(event) => handleStatusChange(order, event.target.value)}
                    aria-label={`${t('status')} ${order.id}`}
                    disabled={getAllowedTransitions(order).length === 0 || updateStatus.isPending}
                    className="hu-py-2"
                >
                    {ORDER_STATUSES.filter((status) => status === currentStatus || canTransition(order, status)).map((status) => (
                        <option key={status} value={status}>{getOrderStatusLabel(status)}</option>
                    ))}
                </Select>
            </Card>
        );
    };

    const dayRange = getPeriodRange(selectedDate, 'day');
    const dayOrders = orders.filter((order) => {
        const createdAt = new Date(order.createdAt);
        return createdAt >= dayRange.start && createdAt < dayRange.end;
    });
    const visibleOrders = filterOrders(dayOrders, searchTerm, getOrderStatusLabel);
    const errorMessage = error || (ordersQuery.isError ? ordersQuery.error?.message || t('orders_load_error') : '');

    return (
        <div className="hu-flex hu-min-h-screen hu-flex-col admin-page-bg hu-text-slate-900">
            <HeaderComponentWithNavigation />
            <AdminNav />
            <main className="hu-mx-auto hu-w-full hu-max-w-[1600px] hu-flex-1 hu-px-4 hu-py-8 md:hu-px-8">
                <div className="hu-mb-6 hu-flex hu-flex-wrap hu-items-center hu-justify-between hu-gap-4">
                    <div>
                        <h1 className="hu-m-0 hu-text-3xl hu-font-bold hu-tracking-tight">{t('manage_orders')}</h1>
                    </div>
                    <div className="hu-flex hu-flex-wrap hu-gap-2">
                        <Button type="button" variant="secondary" onClick={() => setShowPqrDialog(true)}>
                            {t('create_pqr_order')}
                        </Button>
                        <Button type="button" onClick={() => void loadOrders()} disabled={ordersQuery.isFetching} className="hu-bg-green-500 hu-text-white hover:hu-bg-green-600">
                            {ordersQuery.isFetching ? t('loading') : t('update')}
                        </Button>
                    </div>
                </div>

                <Card className="hu-mb-5 hu-grid hu-gap-4 hu-p-5 md:hu-grid-cols-[minmax(200px,280px)_1fr] md:hu-items-end kanban-board">
                    <label className="hu-grid hu-min-w-0 hu-gap-1.5 hu-text-sm hu-font-medium hu-text-slate-700" htmlFor="orders-day">
                        {t('orders_day')}
                        <Input id="orders-day" type="date" className="hu-box-border hu-h-11 hu-min-w-0" value={selectedDate} onChange={(event) => event.target.value && setSelectedDate(event.target.value)} />
                    </label>
                    <div className="hu-flex hu-min-w-0 hu-flex-wrap hu-items-center hu-gap-3">
                        <Input
                            type="search"
                            placeholder={t('search_orders_placeholder')}
                            aria-label={t('search_orders_placeholder')}
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="hu-box-border hu-h-11 hu-min-w-[200px] hu-flex-1"
                        />
                        {searchTerm && (
                            <Button className="hu-h-11" type="button" variant="secondary" onClick={() => setSearchTerm('')}>
                                {t('clear_btn')}
                            </Button>
                        )}
                        <Button type="button" className="hu-h-11" variant="secondary" onClick={() => setSelectedDate(toDateInputValue(new Date()))}>
                            {t('orders_today')}
                        </Button>
                    </div>
                </Card>
                {errorMessage && (
                    <div className="hu-mb-5">
                        <ErrorNotice>
                            <span>{errorMessage}</span>
                            {ordersQuery.isError && (
                                <Button type="button" variant="secondary" className="hu-ml-3 hu-py-1.5" onClick={() => void loadOrders()} disabled={ordersQuery.isFetching}>
                                    {t('retry')}
                                </Button>
                            )}
                        </ErrorNotice>
                    </div>
                )}
                {ordersQuery.isPending ? (
                    <p className="hu-p-5 hu-text-sm hu-text-slate-600" role="status">{t('loading')}</p>
                ) : ordersQuery.data === undefined && ordersQuery.isError ? null : (
                    <>
                        {visibleOrders.length === 0 && !ordersQuery.isError && (
                            <div className="hu-mb-5 hu-rounded-lg hu-border hu-border-green-200 hu-bg-green-50 hu-p-4 hu-text-sm hu-text-green-900" role="status">
                                {searchTerm && dayOrders.length > 0 ? t('search_orders_no_results') : t('orders_no_orders_day')}
                            </div>
                        )}
                        <div className="hu-grid hu-items-start hu-gap-4 xl:hu-grid-cols-5 kanban-board">
                            {ORDER_STATUSES.map((status) => {
                                const columnOrders = visibleOrders.filter((order) => getOrderStatus(order) === status);
                                const isDragOver = dragOverStatus === status;
                                return (
                                    <section
                                        key={status}
                                        className={`hu-min-w-[250px] hu-rounded-xl hu-border hu-border-slate-200 hu-p-3 ${isDragOver ? 'hu-border-amber-500 hu-bg-amber-50' : 'hu-border-slate-200 hu-bg-white'}`}
                                        onDragOver={(event) => {
                                            event.preventDefault();
                                            if (!isDragOver) setDragOverStatus(status);
                                        }}
                                        onDragLeave={() => setDragOverStatus(null)}
                                        onDrop={(event) => {
                                            event.preventDefault();
                                            setDragOverStatus(null);
                                            const orderId = event.dataTransfer.getData('text/plain');
                                            const order = orders.find((item) => String(item.id) === orderId);
                                            if (order) handleStatusChange(order, status);
                                        }}
                                    >
                                        <h2 className="hu-mb-3 hu-mt-0 hu-flex hu-items-center hu-justify-between hu-gap-2 hu-text-sm hu-font-bold hu-uppercase">
                                            <span>{getOrderStatusLabel(status)}</span>
                                            <Badge tone={STATUS_TONES[status]}>{columnOrders.length}</Badge>
                                        </h2>
                                        {columnOrders.map(renderCard)}
                                    </section>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>
            {pendingChange && (
                <OrderStatusDialog
                    key={`${pendingChange.order.id}-${pendingChange.status}`}
                    order={pendingChange.order}
                    status={pendingChange.status}
                    t={t}
                    onCancel={() => setPendingChange(null)}
                    onConfirm={(extra) => void applyStatusChange(pendingChange.order, pendingChange.status, extra)}
                />
            )}
            {showPqrDialog && (
                <PqrOrderDialog
                    t={t}
                    onCancel={() => setShowPqrDialog(false)}
                    onCreate={handleCreatePqr}
                />
            )}
            <FooterComponent />
        </div>
    );
}

export default OrdersKanbanComponent;
