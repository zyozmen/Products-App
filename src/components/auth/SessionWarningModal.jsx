import React, { useEffect, useState } from 'react';
import translationService from '../../services/TranslationService.js';

const SessionWarningModal = ({ remainingMs, onContinue, onLogout }) => {
    const [secondsLeft, setSecondsLeft] = useState(Math.ceil(remainingMs / 1000));

    useEffect(() => {
        const deadline = Date.now() + remainingMs;
        const interval = setInterval(() => {
            setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
        }, 1000);
        return () => clearInterval(interval);
    }, [remainingMs]);

    const t = (key) => translationService.t(key);

    return (
        <div
            className="modal d-block"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="session-warning-title"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="session-warning-title">{t('session_warning_title')}</h5>
                    </div>
                    <div className="modal-body">
                        <p>{t('session_warning_text')} <strong>{secondsLeft}s</strong></p>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline-secondary" onClick={onLogout}>
                            {t('logout')}
                        </button>
                        <button type="button" className="btn btn-primary" onClick={onContinue}>
                            {t('session_continue')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionWarningModal;
