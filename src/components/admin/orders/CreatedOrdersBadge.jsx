import { useAdminOrders } from '../../../hooks/useApiQueries.ts';
import AuthenticationService from '../../../services/AuthenticationService.js';
import { getOrderStatus } from '../../../services/OrderService.js';
import useTranslation from '../../../hooks/useTranslation.js';

export default function CreatedOrdersBadge() {
    const t = useTranslation();
    const isAdmin = AuthenticationService.isUserAdmin();
    const ordersQuery = useAdminOrders(isAdmin);
    if (!isAdmin) return null;
    if (ordersQuery.isError) {
        return <span className="hu-ml-2 hu-text-red-500" role="alert" title={ordersQuery.error?.message}>{t('created_orders_count_error')}</span>;
    }
    if (!ordersQuery.data) return null;
    const count = ordersQuery.data.filter((order) => getOrderStatus(order) === 'CREADA').length;
    return count > 0 ? (
        <span className="hu-ml-2 hu-inline-block hu-rounded-full hu-bg-green-500 hu-px-2 hu-py-0.5 hu-text-xs hu-font-bold hu-text-white"
            role="status" aria-label={`${t('created_orders_count')}: ${count}`}>
            {count}
        </span>
    ) : null;
}
