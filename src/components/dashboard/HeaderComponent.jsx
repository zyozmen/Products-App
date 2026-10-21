import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import AuthenticationService from '../../services/AuthenticationService.js';
import { isPendingUser } from '../../services/userState.js';
import cartService from '../../services/CartService.js';
import translationService from '../../services/TranslationService.js';
import useTranslation from '../../hooks/useTranslation.js';
import { apiQueryKeys, useAdminUsers } from '../../hooks/useApiQueries.ts';
import DropdownMenu from '../ui/DropdownMenu';
import './HeaderComponent.css';

function HeaderComponent({ navigate, auth }) {
    const t = useTranslation();
    const isAdmin = AuthenticationService.isUserAdmin();
    const pendingUsersQuery = useAdminUsers(isAdmin);
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [cartItemCount, setCartItemCount] = useState(cartService.getItemCount());
    const [theme, setTheme] = useState(() => localStorage.getItem('growShopTheme') || 'light');
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const { pathname } = useLocation();
    const isHome = pathname === '/' || pathname.startsWith('/welcome');
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
        setSearchOpen(false);
    };

    const menuItemClass = 'hu-block hu-w-full hu-cursor-pointer hu-rounded-none hu-border-0 hu-bg-transparent hu-px-4 hu-py-2.5 hu-text-left hu-text-sm hu-font-medium hu-text-white hu-shadow-none hu-outline-none hover:hu-bg-green-700 focus-visible:hu-bg-green-700';
    const dropdownPanelClass = 'hu-rounded-sm hu-border-0 hu-bg-green-950 hu-shadow-none';
    const navLinkClass = ({ isActive }) =>
        `hu-whitespace-nowrap hu-border-0 hu-border-b-2 hu-border-solid hu-py-1 hu-text-base hu-font-medium hu-text-white hu-no-underline ${isActive ? 'hu-border-green-500' : 'hu-border-transparent hover:hu-text-green-300'}`;
    const iconButtonClass = 'hu-relative hu-inline-flex hu-h-10 hu-w-10 hu-cursor-pointer hu-items-center hu-justify-center hu-rounded-full hu-border-0 hu-bg-transparent hu-p-0 hu-text-xl hu-text-white hu-no-underline hover:hu-bg-white/10';
    const navItems = [
        ['menu_marketplace', '/shop'],
        ['menu_cursos_online', '/shop'],
        ['menu_legal', '/shop'],
        ['menu_blog', '/Legal'],
    ];
    const renderNavLinks = (className) => navItems.map(([key, to]) => (
        <NavLink key={key} to={to} className={className} onClick={() => setMenuOpen(false)}>{t(key)}</NavLink>
    ));

    return (
        <header className={`hu-z-30 hu-w-full ${isHome ? 'hu-absolute hu-inset-x-0 hu-top-0 hu-bg-transparent' : 'hu-relative site-header-bg'}`}>
            <div className="hu-mx-auto hu-flex hu-max-w-[1600px] hu-items-center hu-justify-between hu-gap-4 hu-px-4 hu-py-3 sm:hu-px-8 lg:hu-px-12">
                <NavLink to="/welcome" className="hu-inline-flex hu-shrink-0" aria-label="Cheyn Verde">
                    <img className="hu-h-20 hu-w-auto" src="/img/logo-cheyn-verde.png" alt="Cheyn Verde" />
                </NavLink>
                <nav className="hu-hidden hu-items-center hu-gap-12 lg:hu-flex xl:hu-gap-20" aria-label={t('main_navigation')}>
                    {renderNavLinks(navLinkClass)}
                </nav>
                <div className="hu-flex hu-items-center hu-gap-1">
                    <button className={iconButtonClass} type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? t('switch_to_light') : t('switch_to_dark')} title={theme === 'dark' ? t('switch_to_light') : t('switch_to_dark')}>
                        <i className={theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'} aria-hidden="true" />
                    </button>
                    <DropdownMenu
                        ariaLabel={t('user_menu')}
                        buttonClassName={iconButtonClass}
                        menuClassName="hu-right-0"
                        panelClassName={dropdownPanelClass}
                        label={<i className="far fa-user-circle" aria-hidden="true" />}
                    >
                        <p className="hu-m-0 hu-px-3 hu-py-1 hu-text-xs hu-font-bold hu-uppercase hu-tracking-wider hu-text-green-400">{isLoggedIn && loggedInUser ? loggedInUser.username : t('sign_in')}</p>
                        {!isLoggedIn && <button className={menuItemClass} type="button" onClick={() => navigate('/login')}>{t('sign_in')}</button>}
                        {isLoggedIn && <button className={menuItemClass} type="button" onClick={() => navigate('/profile')}>{t('manage_profile')}</button>}
                        {isUserAdmin && (
                            <button className={menuItemClass} type="button" onClick={() => navigate('/admin')}>
                                {t('admin_section')}
                                {pendingCount > 0 && <span className="hu-ml-2 hu-rounded-full hu-bg-green-500 hu-px-2 hu-py-0.5 hu-text-xs hu-font-bold hu-text-white">{pendingCount}</span>}
                                {pendingUsersQuery.isError && <span className="hu-ml-2 hu-text-red-400" role="alert" title={pendingUsersQuery.error?.message}>!</span>}
                            </button>
                        )}
                        {isLoggedIn && !isUserAdmin && <button className={menuItemClass} type="button" onClick={() => navigate('/orders')}>{t('my_orders')}</button>}                        {isLoggedIn && <button className={menuItemClass} type="button" onClick={signOut}>{t('logout')}</button>}
                        <div className="hu-mt-1 hu-flex hu-border-0 hu-border-t hu-border-solid hu-border-green-800">
                            {['ES', 'EN'].map((lang) => (
                                <button
                                    key={lang}
                                    className={`${menuItemClass} hu-text-center ${translationService.getLanguage() === lang ? 'hu-bg-green-600 hu-font-bold' : ''}`}
                                    type="button"
                                    onClick={() => translationService.setLanguage(lang)}
                                >{lang}</button>
                            ))}
                        </div>
                    </DropdownMenu>
                    <button className={iconButtonClass} type="button" aria-expanded={searchOpen} aria-label={t('open_search')} onClick={() => setSearchOpen((open) => !open)}>
                        <i className="fas fa-search" aria-hidden="true" />
                    </button>
                    <NavLink to="/cart" className={iconButtonClass} aria-label={t('view_cart')}>
                        <i className="fas fa-shopping-cart" aria-hidden="true" />
                        {cartItemCount > 0 && (
                            <span className="hu-absolute hu-right-0 hu-top-0 hu-min-w-4 hu-rounded-full hu-bg-green-500 hu-px-1 hu-text-center hu-text-[10px] hu-font-bold hu-leading-4 hu-text-white">{cartItemCount}</span>
                        )}
                    </NavLink>
                    <button
                        className={`${iconButtonClass} lg:hu-hidden`}
                        type="button"
                        aria-expanded={menuOpen}
                        aria-label={t('toggle_navigation')}
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        <i className="fas fa-bars" aria-hidden="true" />
                    </button>
                </div>
            </div>

            {searchOpen && (
                <form className="hu-mx-auto hu-flex hu-max-w-md hu-px-4 hu-pb-3 sm:hu-mr-8 sm:hu-pr-0 lg:hu-mr-12" onSubmit={submitSearch}>
                    <label className="hu-sr-only" htmlFor="header-search">{t('search_placeholder')}</label>
                    <input
                        id="header-search"
                        type="search"
                        autoFocus
                        className="hu-min-w-0 hu-flex-1 hu-rounded-l-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-2 hu-text-sm hu-text-slate-900 hu-outline-none focus:hu-border-green-500"
                        placeholder={t('search_placeholder')}
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                    <button className="hu-rounded-r-lg hu-border-0 hu-bg-green-700 hu-px-3 hu-text-white hover:hu-bg-green-600" type="submit" aria-label={t('search_placeholder')}>
                        <i className="fa fa-search" aria-hidden="true" />
                    </button>
                </form>
            )}

            {menuOpen && (
                <nav className="hu-flex hu-flex-col hu-items-start hu-gap-4 hu-bg-green-950/95 hu-px-6 hu-py-4 lg:hu-hidden" aria-label={t('main_navigation')}>
                    {renderNavLinks(navLinkClass)}
                </nav>
            )}
        </header>
    );
}

export default HeaderComponent;
