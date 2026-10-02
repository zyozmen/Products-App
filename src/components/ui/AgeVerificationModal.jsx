import React, { Component } from 'react';
import translationService from '../../services/TranslationService.js';

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
    }

    handleDecline() {
        this.setState({ declined: true });
    }

    render() {
        if (!this.state.isOpen) return null;

        const t = (key) => translationService.t(key);

        return (
            <div 
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    zIndex: 9999,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px'
                }}
            >
                <div 
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: '10px',
                        padding: '40px 30px',
                        maxWidth: '500px',
                        width: '100%',
                        textAlign: 'center',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                    }}
                >
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
                            <h3 className="mb-3 text-dark font-weight-bold" style={{ fontSize: '22px' }}>
                                {t('underage_warning')}
                            </h3>
                            <p className="text-muted mb-4" style={{ fontSize: '15px' }}>
                                Para continuar navegando por nuestro catálogo de Grow Shop, por favor confirma tu edad.
                            </p>
                            <div className="d-flex flex-column" style={{ gap: '10px' }}>
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
                            <h3 className="mb-3 text-danger font-weight-bold" style={{ fontSize: '22px' }}>
                                {t('must_be_over_18')}
                            </h3>
                            <p className="text-muted mb-4" style={{ fontSize: '15px' }}>
                                No se permite el acceso a menores de edad a este sitio. Serás redirigido.
                            </p>
                            <button 
                                className="btn btn-secondary btn-block font-weight-bold py-3" 
                                onClick={() => window.location.href = 'https://www.google.com'}
                            >
                                Salir
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }
}

export default AgeVerificationModal;
