import { Navigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import translationService from '../../services/TranslationService.js';

export const AccessDenied = () => (
    <div className="hu-mx-auto hu-max-w-2xl hu-px-4 hu-py-16 hu-text-center" role="alert">
        <h2 className="hu-mb-3 hu-text-2xl hu-font-bold hu-text-slate-900">{translationService.t('access_denied_title')}</h2>
        <p className="hu-mb-6 hu-text-slate-600">{translationService.t('access_denied_text')}</p>
        <NavLink to="/" className="hu-inline-flex hu-items-center hu-justify-center hu-rounded-lg hu-bg-green-700 hu-px-4 hu-py-2.5 hu-text-sm hu-font-semibold hu-text-white hu-no-underline hover:hu-bg-green-800">{translationService.t('back_to_home')}</NavLink>
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
