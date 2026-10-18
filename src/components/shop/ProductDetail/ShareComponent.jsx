import useTranslation from '../../../hooks/useTranslation.js';

function ShareComponent() {
    const t = useTranslation();

    return (
        <div className="hu-flex hu-items-center hu-gap-3 hu-pt-2">
            <strong className="hu-text-sm hu-text-slate-800">{t('share_on')}</strong>
            <div className="hu-flex hu-gap-3">
                {[
                    ['Facebook', 'fab fa-facebook-f'],
                    ['Twitter', 'fab fa-twitter'],
                    ['LinkedIn', 'fab fa-linkedin-in'],
                    ['Pinterest', 'fab fa-pinterest'],
                ].map(([network, icon]) => (
                    <button key={network} type="button" className="hu-cursor-pointer hu-border-0 hu-bg-transparent hu-p-1 hu-text-slate-700 hover:hu-text-blue-700" aria-label={`${t('share_on')} ${network}`}>
                        <i className={icon} aria-hidden="true" />
                    </button>
                ))}
            </div>
        </div>
    );
}

export default ShareComponent;
