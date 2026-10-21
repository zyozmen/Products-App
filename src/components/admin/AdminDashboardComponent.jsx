import { Link } from 'react-router-dom';
import HeaderComponent from '../dashboard/HeaderComponent.jsx';
import FooterComponent from '../dashboard/FooterComponent.jsx';
import navigationComponent from '../navigation/NavigationComponent.jsx';
import useTranslation from '../../hooks/useTranslation.js';
import { useAdminUsers } from '../../hooks/useApiQueries.ts';
import { isPendingUser } from '../../services/userState.js';
import CreatedOrdersBadge from './orders/CreatedOrdersBadge.jsx';

const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);

function AdminDashboardComponent() {
    const t = useTranslation();
    const usersQuery = useAdminUsers(true);
    const pendingCount = (usersQuery.data || []).filter(isPendingUser).length;

    const sections = [
        { to: '/admin/orders', icon: 'fa-clipboard-list', title: t('manage_orders'), description: t('admin_orders_description') },
        { to: '/admin/users', icon: 'fa-users', title: t('manage_users'), description: t('admin_users_description'), badge: pendingCount },
        { to: '/admin/proveedores', icon: 'fa-truck', title: t('manage_suppliers'), description: t('admin_suppliers_description') },
        { to: '/admin/categories', icon: 'fa-tags', title: t('manage_categories'), description: t('admin_categories_description') },
        { to: '/admin/orders/report', icon: 'fa-chart-bar', title: t('orders_report'), description: t('admin_report_description') },
        { to: '/createProduct', icon: 'fa-plus-circle', title: t('create_product'), description: t('admin_product_description') },
    ];

    return (
        <div className="admin-page-bg">
            <HeaderComponentWithNavigation />
            <main className="hu-min-h-[70vh] hu-px-4 hu-pb-16 hu-pt-36 sm:hu-px-8 lg:hu-px-[8%]">
                <h1 className="hu-m-0 hu-font-display hu-text-3xl hu-text-green-800 sm:hu-text-4xl admin-title">{t('admin_section')}</h1>
                <p className="hu-mb-10 hu-mt-2 hu-text-green-800">{t('admin_dashboard_subtitle')}</p>
                <div className="hu-grid hu-gap-4 sm:hu-grid-cols-2 lg:hu-grid-cols-3 ">
                    {sections.map(({ to, icon, title, description, badge }) => (
                        <Link
                            key={to}
                            to={to}
                            className="hu-relative hu-flex hu-items-start hu-gap-4 hu-rounded-xl hu-bg-green-900/90 hu-p-6 hu-text-white hu-no-underline hover:hu-bg-green-700"
                        >
                            <i className={`fas ${icon} hu-w-9 hu-shrink-0 hu-text-center hu-text-3xl hu-text-green-400`} aria-hidden="true" />
                            <div className="hu-min-w-0">
                                <h2 className="hu-mb-2 hu-mt-0 hu-text-xl hu-font-bold">{title}</h2>
                                <p className="hu-m-0 hu-text-sm hu-text-green-100">{description}</p>
                            </div>
                            {badge > 0 && (
                                <span className="hu-absolute hu-right-4 hu-top-4 hu-rounded-full hu-bg-green-500 hu-px-2 hu-py-0.5 hu-text-xs hu-font-bold hu-text-white">{badge}</span>
                            )}
                            {to === '/admin/orders' && <span className="hu-absolute hu-right-4 hu-top-4"><CreatedOrdersBadge /></span>}
                        </Link>
                    ))}
                </div>
            </main>
            <FooterComponent />
        </div>
    );
}

export default AdminDashboardComponent;
