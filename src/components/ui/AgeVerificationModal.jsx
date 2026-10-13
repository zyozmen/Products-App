import React, { Component } from 'react';
import translationService from '../../services/TranslationService.js';
import './AgeVerificationModal.css';

class AgeVerificationModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false,
            currentLanguage: translationService.getLanguage(),
            declined: false
        };
        this.handleAccept = this.handleAccept.bind(this);
        this.handleDecline = this.handleDecline.bind(this);
        this.unsubscribeFromLanguage = null;
    }

    componentDidMount() {
        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });

        const isVerified = sessionStorage.getItem('age_verified') === 'true';
        if (!isVerified) {
            this.setState({ isOpen: true });
        }
    }

    componentWillUnmount() {
        if (this.unsubscribeFromLanguage) {
            this.unsubscribeFromLanguage();
        }
    }

    handleAccept() {
        sessionStorage.setItem('age_verified', 'true');
        this.setState({ isOpen: false });
        this.props.navigate('/login');
    }

    handleDecline() {
        this.setState({ declined: true });
    }

    render() {
        if (!this.state.isOpen) return null;

        const t = (key) => translationService.t(key);

        return (
            <div className="age-verification-overlay">
                <div className="age-verification-modal">
                    <div className="mb-4">
                        <span className="h1 text-uppercase text-dark bg-light px-2">
                            Zona
                        </span>
                        <span className="h1 text-uppercase text-dark bg-primary px-2 ml-n1">
                            Green
                        </span>
                    </div>

                    {!this.state.declined ? (
                        <>
                            <h3 className="age-verification-title mb-3 text-dark font-weight-bold">
                                {t('underage_warning')}
                            </h3>
                            <p className="age-verification-description text-muted mb-4">
                                {t('underage_confirmation_details')}
                            </p>
                            <div className="age-verification-actions d-flex flex-column">
                                <button 
                                    className="btn btn-primary btn-block font-weight-bold py-3 text-uppercase" 
                                    onClick={this.handleAccept}
                                >
                                    {t('yes_over_18')}
                                </button>
                                <button 
                                    className="btn btn-outline-danger btn-block font-weight-bold py-3 text-uppercase m-0" 
                                    onClick={this.handleDecline}
                                >
                                    {t('no_under_18')}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="age-verification-title mb-3 text-danger font-weight-bold">
                                {t('must_be_over_18')}
                            </h3>
                            <p className="age-verification-description text-muted mb-4">
                                {t('underage_exit_message')}
                            </p>
                            <button 
                                className="btn btn-secondary btn-block font-weight-bold py-3" 
                                onClick={() => window.location.href = 'https://www.google.com'}
                            >
                                {t('exit')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }
}

export default AgeVerificationModal;
