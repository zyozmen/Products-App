import React, { useEffect, useState } from 'react';
import useTranslation from '../../hooks/useTranslation.js';

const SessionWarningModal = ({ remainingMs, onContinue, onLogout }) => {
    const [secondsLeft, setSecondsLeft] = useState(Math.ceil(remainingMs / 1000));

    useEffect(() => {
        const deadline = Date.now() + remainingMs;
        const interval = setInterval(() => {
            setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
        }, 1000);
        return () => clearInterval(interval);
    }, [remainingMs]);

    const t = useTranslation();

    return (
        <div
            className="hu-fixed hu-inset-0 hu-z-50 hu-grid hu-place-items-center hu-bg-slate-950/50 hu-p-4"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="session-warning-title"
        >
            <div className="hu-w-full hu-max-w-md hu-rounded-2xl hu-bg-white hu-p-6 hu-shadow-2xl">
                <h2 className="hu-m-0 hu-text-xl hu-font-bold hu-text-slate-900" id="session-warning-title">{t('session_warning_title')}</h2>
                <p className="hu-mb-6 hu-mt-3 hu-text-sm hu-leading-6 hu-text-slate-600">{t('session_warning_text')} <strong>{secondsLeft}s</strong></p>
                <div className="hu-flex hu-justify-end hu-gap-3">
                    <button type="button" className="hu-cursor-pointer hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-4 hu-py-2.5 hu-text-sm hu-font-semibold hu-text-slate-700 hover:hu-bg-slate-50" onClick={onLogout}>
                        {t('logout')}
                    </button>
                    <button type="button" className="hu-cursor-pointer hu-rounded-lg hu-border-0 hu-bg-green-700 hu-px-4 hu-py-2.5 hu-text-sm hu-font-semibold hu-text-white hover:hu-bg-green-800" onClick={onContinue}>
                        {t('session_continue')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionWarningModal;
