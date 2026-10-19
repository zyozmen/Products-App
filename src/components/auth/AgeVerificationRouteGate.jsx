import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import AgeVerificationModal from '../ui/AgeVerificationModal.jsx';

function AgeVerificationRouteGate({ children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const isLoginRoute = location.pathname.replace(/\/+$/, '') === '/login';

    if (!isAuthenticated && !isLoginRoute) {
        const returnTo = `${location.pathname}${location.search}${location.hash}`;
        return <AgeVerificationModal navigate={navigate} returnTo={returnTo} />;
    }

    return children;
}

export default AgeVerificationRouteGate;
