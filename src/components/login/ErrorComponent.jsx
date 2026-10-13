import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
import translationService from '../../services/TranslationService';
import AuthenticationService from '../../services/AuthenticationService';
import HeaderComponent from '../dashboard/HeaderComponent';
import FooterComponent from '../dashboard/FooterComponent';
import navigationComponent from '../navigation/NavigationComponent';

const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);

class ErrorComponent extends Component {
    constructor(props) {
        super(props);
        this.state = { currentLanguage: translationService.getLanguage() };
        this.unsubscribeFromLanguage = null;
    }

    componentDidMount() {
        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });
    }

    componentWillUnmount() {
        if (this.unsubscribeFromLanguage) {
            this.unsubscribeFromLanguage();
        }
    }

    render() {
        const t = (key) => translationService.t(key);

        if (!AuthenticationService.isUserLoggedIn()) {
            return <Navigate to="/login" replace />;
        }

        return (
            <>
                <HeaderComponentWithNavigation />
                <div className="container-fluid text-center py-5">
                    <img
                        className="img-fluid"
                        src="/img/not_found.jpg"
                        alt={t('page_not_found')}
                    />
                </div>
                <FooterComponent />
            </>
        );
    }
}
export default ErrorComponent;