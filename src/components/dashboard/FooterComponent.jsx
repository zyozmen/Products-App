import { Link } from 'react-router-dom';
import useTranslation from '../../hooks/useTranslation.js';

function FooterComponent() {
  const t = useTranslation();
  const linkClass = 'hu-inline-flex hu-items-center hu-gap-2 hu-text-sm hu-text-slate-300 hover:hu-text-white';
  const titleClass = 'hu-mb-4 hu-mt-0 hu-text-sm hu-font-bold hu-uppercase hu-tracking-wide hu-text-white';

  return (
    <footer className="hu-mt-12 hu-bg-slate-950 hu-text-slate-300">
      <div className="hu-mx-auto hu-grid hu-max-w-7xl hu-gap-10 hu-px-4 hu-py-10 sm:hu-grid-cols-2 sm:hu-px-6 lg:hu-grid-cols-4 lg:hu-px-8">
        <section>
          <h2 className={titleClass}>{t('get_in_touch')}</h2>
          <p className="hu-mb-4 hu-text-sm hu-leading-6">{t('footer_touch_text')}</p>
          <p className="hu-m-0 hu-text-sm"><i className="fa fa-phone-alt hu-mr-2 hu-text-green-400" aria-hidden="true" />+57 312 4058166</p>
        </section>
        <nav aria-label={t('quick_shop')}>
          <h2 className={titleClass}>{t('quick_shop')}</h2>
          <div className="hu-flex hu-flex-col hu-items-start hu-gap-3">
            <Link to="/welcome" className={linkClass}><i className="fa fa-angle-right" aria-hidden="true" />{t('home')}</Link>
            <Link to="/shop" className={linkClass}><i className="fa fa-angle-right" aria-hidden="true" />{t('our_shop')}</Link>
            <Link to="/cart" className={linkClass}><i className="fa fa-angle-right" aria-hidden="true" />{t('checkout')}</Link>
            <Link to="/contact" className={linkClass}><i className="fa fa-angle-right" aria-hidden="true" />{t('contact_us')}</Link>
          </div>
        </nav>
        <nav aria-label={t('my_account')}>
          <h2 className={titleClass}>{t('my_account')}</h2>
          <div className="hu-flex hu-flex-col hu-items-start hu-gap-3">
            <Link to="/welcome" className={linkClass}><i className="fa fa-angle-right" aria-hidden="true" />{t('home')}</Link>
            <Link to="/cart" className={linkClass}><i className="fa fa-angle-right" aria-hidden="true" />{t('shopping_cart')}</Link>
            <Link to="/cart" className={linkClass}><i className="fa fa-angle-right" aria-hidden="true" />{t('checkout')}</Link>
            <Link to="/contact" className={linkClass}><i className="fa fa-angle-right" aria-hidden="true" />{t('contact_us')}</Link>
          </div>
        </nav>
        <section>
          <h2 className={titleClass}>{t('newsletter')}</h2>
          <p className="hu-text-sm hu-leading-6">{t('newsletter_text')}</p>
          <form className="hu-flex" onSubmit={(event) => event.preventDefault()}>
            <label className="hu-sr-only" htmlFor="newsletter-email">{t('email_placeholder')}</label>
            <input
              id="newsletter-email"
              type="email"
              className="hu-min-w-0 hu-flex-1 hu-rounded-l-lg hu-border hu-border-slate-600 hu-bg-slate-900 hu-px-3 hu-py-2 hu-text-sm hu-text-white hu-outline-none focus:hu-border-green-500"
              placeholder={t('email_placeholder')}
            />
            <button type="submit" className="hu-rounded-r-lg hu-bg-green-700 hu-px-4 hu-text-sm hu-font-semibold hu-text-white hover:hu-bg-green-600">{t('sign_up')}</button>
          </form>
          <h3 className="hu-mb-3 hu-mt-6 hu-text-sm hu-font-bold hu-uppercase hu-text-white">{t('follow_us')}</h3>
          <div className="hu-flex hu-gap-2">
            {[
              ['Twitter', 'fab fa-twitter'],
              ['Facebook', 'fab fa-facebook-f'],
              ['LinkedIn', 'fab fa-linkedin-in'],
              ['Instagram', 'fab fa-instagram'],
            ].map(([label, icon]) => (
              <button key={label} type="button" aria-label={label} className="hu-flex hu-h-9 hu-w-9 hu-items-center hu-justify-center hu-rounded-lg hu-bg-green-700 hu-text-white hover:hu-bg-green-600">
                <i className={icon} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      </div>
      <div className="hu-border-t hu-border-white/10">
        <div className="hu-mx-auto hu-flex hu-max-w-7xl hu-flex-col hu-items-center hu-justify-between hu-gap-4 hu-px-4 hu-py-5 hu-text-center sm:hu-flex-row sm:hu-px-6 sm:hu-text-left lg:hu-px-8">
          <p className="hu-m-0 hu-text-xs">© Zona Green. {t('all_rights_reserved')} <a className="hu-text-green-400 hover:hu-text-green-300" href="https://htmlcodex.com">HTML Codex</a></p>
          <img className="hu-h-6 hu-w-auto" src="/img/payments.png" alt={t('payment_methods')} />
        </div>
      </div>
    </footer>
  );
}

export default FooterComponent;
