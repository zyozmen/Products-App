import { useEffect, useState } from 'react';
import useTranslation from '../../hooks/useTranslation.js';

function AgeVerificationModal({ navigate }) {
    const t = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [declined, setDeclined] = useState(false);

    useEffect(() => {
        setIsOpen(sessionStorage.getItem('age_verified') !== 'true');
    }, []);

    if (!isOpen) return null;

    const accept = () => {
        sessionStorage.setItem('age_verified', 'true');
        setIsOpen(false);
        navigate('/login');
    };

    return (
        <div className="hu-fixed hu-inset-0 hu-z-[100] hu-grid hu-place-items-center hu-bg-slate-950/80 hu-p-4">
            <section className="hu-w-full hu-max-w-lg hu-rounded-2xl hu-bg-white hu-p-6 hu-text-center hu-shadow-2xl sm:hu-p-8" role="alertdialog" aria-modal="true">
                <div className="hu-mb-6 hu-text-3xl hu-font-black hu-uppercase">
                    <span className="hu-bg-slate-100 hu-px-2 hu-text-slate-800">Zona</span>
                    <span className="hu-bg-green-600 hu-px-2 hu-text-white">Green</span>
                </div>
                {!declined ? (
                    <>
                        <h2 className="hu-mb-3 hu-mt-0 hu-text-xl hu-font-bold hu-text-slate-900">{t('underage_warning')}</h2>
                        <p className="hu-mb-6 hu-mt-0 hu-leading-6 hu-text-slate-600">{t('underage_confirmation_details')}</p>
                        <div className="hu-grid hu-gap-3">
                            <button className="hu-cursor-pointer hu-rounded-lg hu-border-0 hu-bg-green-600 hu-px-4 hu-py-3 hu-font-bold hu-uppercase hu-text-white hover:hu-bg-green-700" type="button" onClick={accept}>
                                {t('yes_over_18')}
                            </button>
                            <button className="hu-cursor-pointer hu-rounded-lg hu-border hu-border-red-600 hu-bg-white hu-px-4 hu-py-3 hu-font-bold hu-uppercase hu-text-red-700 hover:hu-bg-red-50" type="button" onClick={() => setDeclined(true)}>
                                {t('no_under_18')}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="hu-mb-3 hu-mt-0 hu-text-xl hu-font-bold hu-text-red-700">{t('must_be_over_18')}</h2>
                        <p className="hu-mb-6 hu-mt-0 hu-leading-6 hu-text-slate-600">{t('underage_exit_message')}</p>
                        <button
                            className="hu-cursor-pointer hu-rounded-lg hu-border-0 hu-bg-slate-700 hu-px-4 hu-py-3 hu-font-bold hu-text-white hover:hu-bg-slate-800"
                            type="button"
                            onClick={() => { window.location.href = 'https://www.google.com'; }}
                        >
                            {t('exit')}
                        </button>
                    </>
                )}
            </section>
        </div>
    );
}

export default AgeVerificationModal;
