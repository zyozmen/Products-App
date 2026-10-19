import { useState } from 'react';
import useTranslation from '../../hooks/useTranslation.js';
import './AgeVerificationModal.css';

function AgeVerificationModal({ navigate, returnTo }) {
    const t = useTranslation();
    const [declined, setDeclined] = useState(false);

    const accept = () => {
        navigate('/login', { replace: true, state: { from: returnTo } });
    };

    return (
        <div className="age-verification-overlay">
            <section
                className="age-verification-frame"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="age-verification-title"
                aria-describedby="age-verification-description"
            >
                <img className="age-verification-logo" src="/img/logo-cheyn-verde.png" alt="Cheyn Verde" />
                <div className="age-verification-card">
                    {!declined ? (
                        <>
                            <h2 className="age-verification-title" id="age-verification-title">{t('underage_warning')}</h2>
                            <p className="age-verification-description" id="age-verification-description">{t('underage_confirmation_details')}</p>
                            <div className="age-verification-actions">
                                <button className="age-verification-button age-verification-button-primary" type="button" onClick={accept}>
                                    {t('yes_over_18')}
                                </button>
                                <button className="age-verification-button age-verification-button-secondary" type="button" onClick={() => setDeclined(true)}>
                                    {t('no_under_18')}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 className="age-verification-title" id="age-verification-title">{t('must_be_over_18')}</h2>
                            <p className="age-verification-description" id="age-verification-description">{t('underage_exit_message')}</p>
                            <button
                                className="age-verification-button age-verification-button-primary"
                                type="button"
                                onClick={() => { window.location.href = 'https://www.google.com'; }}
                            >
                                {t('exit')}
                            </button>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

export default AgeVerificationModal;
