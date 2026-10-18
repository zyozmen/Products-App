import { Navigate } from 'react-router-dom';
import AuthenticationService from '../../services/AuthenticationService.js';
import HeaderComponent from '../dashboard/HeaderComponent.jsx';
import FooterComponent from '../dashboard/FooterComponent.jsx';
import navigationComponent from '../navigation/NavigationComponent.jsx';
import useTranslation from '../../hooks/useTranslation.js';

const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);

function ErrorComponent() {
    const t = useTranslation();

    if (!AuthenticationService.isUserLoggedIn()) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="hu-flex hu-min-h-screen hu-flex-col">
            <HeaderComponentWithNavigation />
            <main className="hu-flex hu-flex-1 hu-items-center hu-justify-center hu-p-6">
                <img className="hu-h-auto hu-max-h-[70vh] hu-max-w-full hu-object-contain" src="/img/not_found.jpg" alt={t('page_not_found')} />
            </main>
            <FooterComponent />
        </div>
    );
}

export default ErrorComponent;
