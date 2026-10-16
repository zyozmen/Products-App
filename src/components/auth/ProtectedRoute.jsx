import React from 'react';
import { Navigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import translationService from '../../services/TranslationService.js';

export const AccessDenied = () => (
    <div className="container text-center py-5" role="alert">
        <h2>{translationService.t('access_denied_title')}</h2>
        <p>{translationService.t('access_denied_text')}</p>
        <NavLink to="/" className="btn btn-primary">{translationService.t('back_to_home')}</NavLink>
    </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    if (allowedRoles?.length) {
        const role = String(user?.role ?? '').toLowerCase();
        if (!allowedRoles.map((allowed) => allowed.toLowerCase()).includes(role)) {
            return <AccessDenied />;
        }
    }

    return children;
};

export default ProtectedRoute;
