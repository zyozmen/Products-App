import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import AuthenticationService from '../../services/AuthenticationService.js';
import { isPendingUser } from '../../services/userState.js';
import cartService from '../../services/CartService.js';
import translationService from '../../services/TranslationService.js';
import useTranslation from '../../hooks/useTranslation.js';
import { apiQueryKeys, useAdminUsers } from '../../hooks/useApiQueries.ts';
import DropdownMenu from '../ui/DropdownMenu';

function HeaderComponent({ navigate, auth }) {
    const t = useTranslation();
    const isAdmin = AuthenticationService.isUserAdmin();
    const pendingUsersQuery = useAdminUsers(isAdmin);
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [cartItemCount, setCartItemCount] = useState(cartService.getItemCount());
    const [theme, setTheme] = useState(() => localStorage.getItem('growShopTheme') || 'light');
    const [menuOpen, setMenuOpen] = useState(false);
    const isLoggedIn = AuthenticationService.isUserLoggedIn();
    const isUserAdmin = AuthenticationService.isUserAdmin();
    const loggedInUser = AuthenticationService.getLoggedInUser();
    const pendingCount = (pendingUsersQuery.data || []).filter(isPendingUser).length;

    useEffect(() => cartService.subscribe((items) => {
        setCartItemCount(items.reduce((total, item) => total + item.quantity, 0));
    }), []);

    useEffect(() => {
        if (!isAdmin) return undefined;
        const refreshUsers = () => {
            void queryClient.invalidateQueries({ queryKey: apiQueryKeys.adminUsers });
        };
        window.addEventListener('users-changed', refreshUsers);
        return () => window.removeEventListener('users-changed', refreshUsers);
    }, [isAdmin, queryClient]);

    useEffect(() => {
        document.body.classList.toggle('dark-theme', theme === 'dark');
    }, [theme]);

    const signOut = () => {
        if (auth) {
            auth.logout('USER');
            return;
        }
        AuthenticationService.logout();
        navigate('/welcome');
    };

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        localStorage.setItem('growShopTheme', nextTheme);
    };

    const submitSearch = (event) => {
        event.preventDefault();
        const normalizedSearch = searchTerm.trim();
        navigate(normalizedSearch ? `/shop?name=${encodeURIComponent(normalizedSearch)}` : '/shop');
        setMenuOpen(false);
    };

    const menuItemClass = 'hu-block hu-w-full hu-rounded-md hu-px-3 hu-py-1 hu-text-left hu-text-sm hu-text-green-700 hover:hu-bg-green-100';
    const navLinkClass = ({ isActive }) =>
        `hu-whitespace-nowrap hu-py-2 hu-text-sm hu-font-medium ${isActive ? 'hu-text-green-400' : 'hu-text-white hover:hu-text-green-300'}`;
    const brand = (
        <NavLink to="/welcome" className="hu-inline-flex hu-text-xl hu-font-black hu-no-underline">
            <span className="hu-bg-white hu-px-2 hu-text-slate-900">Zona</span>
            <span className="hu-bg-green-700 hu-px-2 hu-text-white">Green</span>
        </NavLink>
    );

    return (
        <header className="hu-w-full">
            <div className="hu-bg-slate-100">
                <div className="hu-mx-auto hu-flex hu-max-w-7xl hu-flex-wrap hu-items-center hu-justify-end hu-gap-2 hu-px-4 hu-py-2 sm:hu-px-6 lg:hu-px-8">
                    <DropdownMenu label={isLoggedIn && loggedInUser ? loggedInUser.username : t('sign_in')}>
                        {!isLoggedIn && <button className={menuItemClass} type="button" onClick={() => navigate('/login')}>{t('sign_in')}</button>}
                        {isLoggedIn && <button className={menuItemClass} type="button" onClick={() => navigate('/profile')}>{t('manage_profile')}</button>}
                        {isUserAdmin && (
                            <button className={menuItemClass} type="button" onClick={() => navigate('/admin/users')}>
                                {t('manage_users')}
                                {pendingCount > 0 && <span className="hu-ml-2 hu-rounded-full hu-bg-amber-100 hu-px-2 hu-py-0.5 hu-text-xs hu-text-amber-900">{pendingCount}</span>}
                                {pendingUsersQuery.isError && <span className="hu-ml-2 hu-text-red-700" role="alert" title={pendingUsersQuery.error?.message}>!</span>}
                            </button>
                        )}
                        {isLoggedIn && !isUserAdmin && <button className={menuItemClass} type="button" onClick={() => navigate('/orders')}>{t('my_orders')}</button>}
                        {isUserAdmin && <button className={menuItemClass} type="button" onClick={() => navigate('/admin/orders')}>{t('manage_orders')}</button>}
                        {isUserAdmin && <button className={menuItemClass} type="button" onClick={() => navigate('/admin/proveedores')}>{t('manage_suppliers')}</button>}
                        {isUserAdmin && <button className={menuItemClass} type="button" onClick={() => navigate('/admin/orders/report')}>{t('orders_report')}</button>}
                        {isUserAdmin && <button className={menuItemClass} type="button" onClick={() => navigate('/createProduct')}>{t('create_product')}</button>}
                        {isLoggedIn && <button className={menuItemClass} type="button" onClick={signOut}>{t('logout')}</button>}
                    </DropdownMenu>
                    <DropdownMenu label={translationService.getLanguage()}>
                        <button className={menuItemClass} type="button" onClick={() => translationService.setLanguage('ES')}>ES</button>
                        <button className={menuItemClass} type="button" onClick={() => translationService.setLanguage('EN')}>EN</button>
                    </DropdownMenu>
                    <button
                        className={`hu-inline-flex hu-items-center hu-gap-2 hu-rounded-full hu-px-3 hu-py-1.5 hu-text-xs hu-font-semibold ${theme === 'dark' ? 'hu-bg-green-700 hu-text-white' : 'hu-bg-slate-900 hu-text-white'}`}
                        type="button"
                        onClick={toggleTheme}
                    >
                        <i className={theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'} aria-hidden="true" />
                        {theme === 'dark' ? t('switch_to_light') : t('switch_to_dark')}
                    </button>
                    <NavLink to="/cart" className="hu-inline-flex hu-items-center hu-gap-2 hu-rounded-lg hu-px-2 hu-py-1.5 hu-text-sm hu-text-slate-800 hover:hu-bg-slate-200" aria-label={t('view_cart')}>
                        <i className="fas fa-shopping-cart" aria-hidden="true" />
                        <span>{cartItemCount}</span>
                    </NavLink>
                </div>
            </div>

            <div className="hu-bg-slate-900">
                <div className="hu-mx-auto hu-flex hu-max-w-7xl hu-flex-wrap hu-items-center hu-justify-between hu-gap-4 hu-px-4 hu-py-4 sm:hu-px-6 lg:hu-flex-nowrap lg:hu-px-8">
                    <div className="hu-flex hu-w-full hu-items-center hu-justify-between lg:hu-w-auto">
                        {brand}
                        <button
                            className="hu-rounded-md hu-border hu-border-slate-600 hu-px-3 hu-py-2 hu-text-white lg:hu-hidden"
                            type="button"
                            aria-expanded={menuOpen}
                            aria-label={t('toggle_navigation')}
                            onClick={() => setMenuOpen((open) => !open)}
                        >
                            <i className="fas fa-bars" aria-hidden="true" />
                        </button>
                    </div>
                    <nav className={`${menuOpen ? 'hu-flex' : 'hu-hidden'} hu-w-full hu-flex-col hu-items-start hu-gap-3 lg:hu-flex lg:hu-w-auto lg:hu-flex-row lg:hu-items-center lg:hu-gap-6`} aria-label={t('main_navigation')}>
                        <NavLink to="/shop" className={navLinkClass} onClick={() => setMenuOpen(false)}>{t('menu_marketplace')}</NavLink>
                        <NavLink to="/shop" className={navLinkClass} onClick={() => setMenuOpen(false)}>{t('menu_cursos_online')}</NavLink>
                        <NavLink to="/shop" className={navLinkClass} onClick={() => setMenuOpen(false)}>{t('menu_legal')}</NavLink>
                        <NavLink to="/Legal" className={navLinkClass} onClick={() => setMenuOpen(false)}>{t('menu_blog')}</NavLink>
                        <form className="hu-flex hu-w-full hu-max-w-sm" onSubmit={submitSearch}>
                            <label className="hu-sr-only" htmlFor="header-search">{t('search_placeholder')}</label>
                            <input
                                id="header-search"
                                type="search"
                                className="hu-min-w-0 hu-flex-1 hu-rounded-l-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-2 hu-text-sm hu-text-slate-900 hu-outline-none focus:hu-border-green-500"
                                placeholder={t('search_placeholder')}
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                            <button className="hu-rounded-r-lg hu-bg-green-700 hu-px-3 hu-text-white hover:hu-bg-green-600" type="submit" aria-label={t('search_placeholder')}>
                                <i className="fa fa-search" aria-hidden="true" />
                            </button>
                        </form>
                        <div className="hu-whitespace-nowrap">
                            <p className="hu-m-0 hu-text-xs hu-text-slate-300">{t('customer_service')}</p>
                            <p className="hu-m-0 hu-font-bold hu-text-green-400">{t('customer_service_num')}</p>
                        </div>
                        <NavLink to="/cart" className="hu-hidden hu-items-center hu-gap-2 hu-text-white hover:hu-text-green-300 lg:hu-inline-flex" aria-label={t('view_cart')}>
                            <i className="fas fa-shopping-cart hu-text-green-400" aria-hidden="true" />
                            {cartItemCount}
                        </NavLink>
                    </nav>
                </div>
            </div>
        </header>
    );
}

export default HeaderComponent;
