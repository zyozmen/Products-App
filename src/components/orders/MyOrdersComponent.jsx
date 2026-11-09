import React from 'react';
import HeaderComponent from '../dashboard/HeaderComponent.jsx';
import FooterComponent from '../dashboard/FooterComponent.jsx';
import navigationComponent from '../navigation/NavigationComponent.jsx';
import { useMyOrders } from '../../hooks/useApiQueries.ts';
import useTranslation from '../../hooks/useTranslation.js';
import { formatCOP } from '../../Interfaces/ProductInterface.js';
import { Badge, Card, ErrorNotice, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button } from '../ui/shadcn';

const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
const hasAmount = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
const orderSteps = ['CREADA', 'PAGADA', 'EMPACADA', 'ENTREGADA'];

function OrderThermometer({ status, getLabel }) {
    const isCancelled = status === 'CANCELADA';
    const currentIndex = orderSteps.indexOf(status);
    const initialFillPercent = 15;
    const stepFillPercent = (100 - initialFillPercent) / (orderSteps.length - 1);
    const fillPercent = isCancelled
        ? 100
        : currentIndex < 0
            ? 0
            : initialFillPercent + currentIndex * stepFillPercent;
    const labelSteps = isCancelled ? ['CREADA', 'CANCELADA'] : orderSteps;

    return (
        <div
            role="progressbar"
            aria-label={getLabel(status)}
            aria-valuemin={0}
            aria-valuemax={orderSteps.length - 1}
            aria-valuenow={isCancelled ? 0 : Math.max(currentIndex, 0)}
            className="hu-px-5 hu-pt-4"
        >
            <div className={`hu-relative hu-h-3 hu-w-full hu-overflow-hidden hu-rounded-full hu-bg-slate-200 ${isCancelled ? 'hu-ring-1 hu-ring-red-200' : ''}`}>
                <div
                    className={`hu-h-full hu-rounded-full hu-transition-all hu-duration-500 ${isCancelled ? 'hu-bg-red-500' : 'hu-bg-green-600'}`}
                    style={{ width: `${fillPercent}%` }}
                />
            </div>
            <div className={`hu-mt-2 hu-grid hu-text-xs hu-text-slate-500 ${isCancelled ? 'hu-grid-cols-2' : 'hu-grid-cols-4'}`}>
                {labelSteps.map((step, index) => {
                    const reached = !isCancelled && index <= currentIndex;
                    const isLast = index === labelSteps.length - 1;
                    const alignment = index === 0 ? 'hu-text-left' : isLast ? 'hu-text-right' : 'hu-text-center';
                    const emphasis = isCancelled && isLast
                        ? 'hu-font-semibold hu-text-red-700'
                        : reached ? 'hu-font-semibold hu-text-green-800' : '';
                    return (
                        <span key={step} className={`${alignment} ${emphasis}`}>
                            {getLabel(step)}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
const orderDateFormatter = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
});
const statusTones = {
    CREADA: 'blue',
    PAGADA: 'green',
    EMPACADA: 'orange',
    ENTREGADA: 'green',
    CANCELADA: 'red',
};

function MyOrdersComponent() {
    const t = useTranslation();
    const { data: orders = [], isPending, isError, error, refetch } = useMyOrders();

    const getOrderStatusLabel = (status) => {
        const key = `order_status_${String(status).toLowerCase()}`;
        const label = t(key);
        return label === key ? status : label;
    };

    return (
        <div className="hu-flex hu-min-h-screen hu-flex-col hu-bg-slate-50 hu-text-slate-900">
            <HeaderComponentWithNavigation />
            <main className="hu-mx-auto hu-w-full hu-max-w-7xl hu-flex-1 hu-px-4 hu-py-8 md:hu-px-8">
                <div className="hu-mb-6">
                    <p className="hu-mb-2 hu-text-xs hu-font-bold hu-uppercase hu-tracking-[0.16em] hu-text-blue-700">{t('my_account')}</p>
                    <h1 className="hu-m-0 hu-text-3xl hu-font-bold">{t('my_orders')}</h1>
                </div>
                {isError && (
                    <div className="hu-mb-5 hu-grid hu-gap-3">
                        <ErrorNotice>{error?.message || t('my_orders_load_failed')}</ErrorNotice>
                        <Button type="button" variant="secondary" className="hu-w-fit" onClick={() => void refetch()}>Reintentar</Button>
                    </div>
                )}
                {isPending ? (
                    <p className="hu-py-6 hu-text-sm hu-text-slate-600" role="status">{t('loading')}</p>
                ) : !orders.length && !isError ? (
                    <Card className="hu-p-8 hu-text-center hu-text-slate-600">{t('orders_empty')}</Card>
                ) : (
                    <div className="hu-grid hu-gap-5">
                        {orders.map((order) => {
                            const status = String(order.status ?? '').toUpperCase() === 'DESPACHADA'
                                ? 'EMPACADA'
                                : String(order.status ?? '').toUpperCase();
                            return (
                                <Card key={order.id} className="hu-overflow-hidden">
                                    <div className="hu-flex hu-flex-wrap hu-items-center hu-justify-between hu-gap-3 hu-border-b hu-border-slate-200 hu-p-5">
                                        <div>
                                            <h2 className="hu-m-0 hu-text-lg hu-font-bold">Orden #{order.id}</h2>
                                            <p className="hu-mb-0 hu-mt-1 hu-text-sm hu-text-slate-500">
                                                {order.createdAt ? orderDateFormatter.format(new Date(order.createdAt)) : ''}
                                            </p>
                                        </div>
                                        <div className="hu-flex hu-flex-wrap hu-items-center hu-gap-2">
                                            {order.cashOnDelivery && <Badge tone="orange">{t('order_flag_cash_on_delivery')}</Badge>}
                                        </div>
                                    </div>
                                    <OrderThermometer status={status} getLabel={getOrderStatusLabel} />
                                    <div className="hu-overflow-x-auto hu-p-5">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:hu-bg-slate-50">
                                                    <TableHead>{t('product')}</TableHead>
                                                    <TableHead>{t('quantity')}</TableHead>
                                                    <TableHead>{t('unit_price')}</TableHead>
                                                    <TableHead>{t('subtotal')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(order.items || []).map((item, index) => (
                                                    <TableRow key={`${order.id}-${item.productId}-${index}`}>
                                                        <TableCell className="hu-font-medium">{item.name}</TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell>{formatCOP(item.unitPrice)}</TableCell>
                                                        <TableCell>{formatCOP(item.unitPrice * item.quantity)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <p className="hu-mb-0 hu-mt-4 hu-text-right hu-font-bold">{t('total')}: {formatCOP(order.total)}</p>
                                        {(hasAmount(order.cashAmount) || hasAmount(order.cardAmount)) && (
                                            <div className="hu-mt-2 hu-flex hu-flex-wrap hu-justify-end hu-gap-4 hu-text-sm hu-text-slate-600">
                                                {hasAmount(order.cashAmount) && <p className="hu-m-0">{t('report_cash')}: {formatCOP(order.cashAmount)}</p>}
                                                {hasAmount(order.cardAmount) && <p className="hu-m-0">{t('report_card')}: {formatCOP(order.cardAmount)}</p>}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>
            <FooterComponent />
        </div>
    );
}

export default MyOrdersComponent;
