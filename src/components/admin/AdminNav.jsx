import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import useTranslation from '../../hooks/useTranslation.js';
import CreatedOrdersBadge from './orders/CreatedOrdersBadge.jsx';

const ITEMS = [
    { to: '/admin', labelKey: 'admin_section', end: true },
    { to: '/admin/orders', labelKey: 'manage_orders', end: true },
    { to: '/admin/users', labelKey: 'manage_users' },
    { to: '/admin/proveedores', labelKey: 'manage_suppliers' },
    { to: '/admin/liquidacion', labelKey: 'daily_settlement' },
    { to: '/admin/cepas', labelKey: 'manage_strains' },
    { to: '/admin/categories', labelKey: 'manage_categories' },
    { to: '/admin/orders/report', labelKey: 'orders_report' },
];

const linkClass = ({ isActive }) => (
    `hu-whitespace-nowrap hu-border-0 hu-border-b-2 hu-border-solid hu-px-4 hu-py-3 hu-text-sm hu-font-semibold hu-no-underline ${
        isActive ? 'hu-border-green-600 hu-text-green-700' : 'hu-border-transparent hu-text-slate-600 hover:hu-text-green-700'
    }`
);

function AdminNav() {
    const t = useTranslation();
    const { pathname } = useLocation();
    const scrollerRef = useRef(null);

    // Cada página monta su propio menú (el scroll vuelve a 0): se centra la pestaña activa.
    useEffect(() => {
        const scroller = scrollerRef.current;
        const active = scroller?.querySelector('[aria-current="page"]');
        if (!scroller || !active) return;
        scroller.scrollLeft = active.offsetLeft - (scroller.clientWidth - active.offsetWidth) / 2;
    }, [pathname]);

    return (
        <nav className="hu-sticky hu-top-[104px] hu-z-30 hu-border-0 hu-border-b hu-border-solid hu-border-slate-200 hu-bg-white md:hu-static" aria-label={t('admin_section')}>
            <div ref={scrollerRef} className="hu-relative hu-mx-auto hu-flex hu-max-w-[1600px] hu-overflow-x-auto hu-px-4 md:hu-px-8">
                {ITEMS.map(({ to, labelKey, end }) => (
                    <NavLink key={to} to={to} end={end} className={linkClass}>
                        {t(labelKey)}
                        {to === '/admin/orders' && <CreatedOrdersBadge />}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}

export default AdminNav;
