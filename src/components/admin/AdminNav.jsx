import { NavLink } from 'react-router-dom';
import useTranslation from '../../hooks/useTranslation.js';

const ITEMS = [
    { to: '/admin', labelKey: 'admin_section', end: true },
    { to: '/admin/orders', labelKey: 'manage_orders', end: true },
    { to: '/admin/users', labelKey: 'manage_users' },
    { to: '/admin/proveedores', labelKey: 'manage_suppliers' },
    { to: '/admin/orders/report', labelKey: 'orders_report' },
];

const linkClass = ({ isActive }) => (
    `hu-whitespace-nowrap hu-border-0 hu-border-b-2 hu-border-solid hu-px-4 hu-py-3 hu-text-sm hu-font-semibold hu-no-underline ${
        isActive ? 'hu-border-green-600 hu-text-green-700' : 'hu-border-transparent hu-text-slate-600 hover:hu-text-green-700'
    }`
);

function AdminNav() {
    const t = useTranslation();
    return (
        <nav className="hu-border-0 hu-border-b hu-border-solid hu-border-slate-200 hu-bg-white" aria-label={t('admin_section')}>
            <div className="hu-mx-auto hu-flex hu-max-w-[1600px] hu-overflow-x-auto hu-px-4 md:hu-px-8">
                {ITEMS.map(({ to, labelKey, end }) => (
                    <NavLink key={to} to={to} end={end} className={linkClass}>{t(labelKey)}</NavLink>
                ))}
            </div>
        </nav>
    );
}

export default AdminNav;
