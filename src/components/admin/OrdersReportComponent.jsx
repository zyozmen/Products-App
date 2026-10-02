import React, { Component } from 'react';
import HeaderComponent from '../dashboard/HeaderComponent.jsx';
import FooterComponent from '../dashboard/FooterComponent.jsx';
import navigationComponent from '../navigation/NavigationComponent.jsx';
import AuthenticationService from '../../services/AuthenticationService.js';
import translationService from '../../services/TranslationService.js';

class OrdersReportComponent extends Component {
    constructor(props) {
        super(props);
        this.state = { currentLanguage: translationService.getLanguage() };
        this.unsubscribeFromLanguage = null;
    }

    componentDidMount() {
        if (!AuthenticationService.isUserAdmin()) {
            this.props.navigate('/welcome');
            return;
        }
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
        const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
        const t = (key) => translationService.t(key);

        return (
            <>
                <HeaderComponentWithNavigation />
                <div className="container-fluid pb-5">
                    <div className="row px-xl-5">
                        <div className="col">
                            <h2 className="section-title position-relative text-uppercase my-4">
                                <span className="bg-secondary pr-3">{t('orders_report')}</span>
                            </h2>
                            <div className="bg-light p-30">
                                <p className="mb-0">{t('orders_report_coming_soon')}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <FooterComponent />
            </>
        );
    }
}

export default OrdersReportComponent;
