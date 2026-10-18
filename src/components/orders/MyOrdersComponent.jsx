import React from 'react';
import HeaderComponent from '../dashboard/HeaderComponent.jsx';
import FooterComponent from '../dashboard/FooterComponent.jsx';
import navigationComponent from '../navigation/NavigationComponent.jsx';
import { useMyOrders } from '../../hooks/useApiQueries.ts';
import useTranslation from '../../hooks/useTranslation.js';
import { formatCOP } from '../../Interfaces/ProductInterface.js';
import { Badge, Card, ErrorNotice, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button } from '../ui/shadcn';

const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
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
                                                {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                                            </p>
                                        </div>
                                        <Badge tone={statusTones[status] || 'neutral'}>{getOrderStatusLabel(status)}</Badge>
                                    </div>
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
