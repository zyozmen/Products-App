import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import translationService from '../../services/TranslationService';
import './FooterComponent.css';

class FooterComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentLanguage: translationService.getLanguage(),
    };
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
    return (
      <div className="container-fluid bg-dark text-secondary mt-5 pt-5">
        <div className="row px-xl-5 pt-5">
          <div className="col-lg-4 col-md-12 mb-5 pr-3 pr-xl-5">
            <h5 className="text-secondary text-uppercase mb-4">{t('get_in_touch')}</h5>
            <p className="mb-4">
              {t('footer_touch_text')}
            </p>
            <p className="mb-0">
              <i className="fa fa-phone-alt text-primary mr-3" />
              +57 312 4058166
            </p>
          </div>
          <div className="col-lg-8 col-md-12">
            <div className="row">
              <div className="col-md-4 mb-5">
                <h5 className="text-secondary text-uppercase mb-4">{t('quick_shop')}</h5>
                <div className="d-flex flex-column justify-content-start">
                  <Link to="/welcome" className="btn btn-link text-secondary mb-2 p-0 text-left">
                    <i className="fa fa-angle-right mr-2" />
                    {t('home')}
                  </Link>
                   <Link to="/shop"className="btn btn-link text-secondary mb-2 p-0 text-left">
                    <i className="fa fa-angle-right mr-2" />
                    {t('our_shop')}
                  </Link>
                  <Link to="/cart" className="btn btn-link text-secondary mb-2 p-0 text-left">
                    <i className="fa fa-angle-right mr-2" />
                    {t('checkout')}
                  </Link>
                  <Link to="/contact" className="btn btn-link text-secondary p-0 text-left">
                    <i className="fa fa-angle-right mr-2" />
                    {t('contact_us')}
                  </Link>
                </div>
              </div>
              <div className="col-md-4 mb-5">
                <h5 className="text-secondary text-uppercase mb-4">{t('my_account')}</h5>
                <div className="d-flex flex-column justify-content-start">
                  <Link to="/welcome" className="btn btn-link text-secondary mb-2 p-0 text-left">
                    <i className="fa fa-angle-right mr-2" />
                    {t('home')}
                  </Link>
                  <button type="button" className="btn btn-link text-secondary mb-2 p-0 text-left">
                    <i className="fa fa-angle-right mr-2" />
                    {t('shopping_cart')}
                  </button>
                  <button type="button" className="btn btn-link text-secondary mb-2 p-0 text-left">
                    <i className="fa fa-angle-right mr-2" />
                    {t('checkout')}
                  </button>
                  <button type="button" className="btn btn-link text-secondary p-0 text-left">
                    <i className="fa fa-angle-right mr-2" />
                    {t('contact_us')}
                  </button>
                </div>
              </div>
              <div className="col-md-4 mb-5">
                <h5 className="text-secondary text-uppercase mb-4">{t('newsletter')}</h5>
                <p>{t('newsletter_text')}</p>
                <form action="">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder={t('email_placeholder')}
                    />
                    <div className="input-group-append">
                      <button className="btn btn-primary">{t('sign_up')}</button>
                    </div>
                  </div>
                </form>
                <h6 className="text-secondary text-uppercase mt-4 mb-3">{t('follow_us')}</h6>
                <div className="d-flex">
                  <button type="button" className="btn btn-primary btn-square mr-2" aria-label="Twitter">
                    <i className="fab fa-twitter" />
                  </button>
                  <button type="button" className="btn btn-primary btn-square mr-2" aria-label="Facebook">
                    <i className="fab fa-facebook-f" />
                  </button>
                  <button type="button" className="btn btn-primary btn-square mr-2" aria-label="LinkedIn">
                    <i className="fab fa-linkedin-in" />
                  </button>
                  <button type="button" className="btn btn-primary btn-square" aria-label="Instagram">
                    <i className="fab fa-instagram" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row border-top mx-xl-5 py-4 footer-border-top">
          <div className="col-md-6 px-xl-0">
            <p className="mb-md-0 text-center text-md-left text-secondary">
              ©{" "}
              <button type="button" className="btn btn-link text-primary p-0">
                Domain
              </button>
              . {t('all_rights_reserved')}
              <a className="text-primary" href="https://htmlcodex.com">
                HTML Codex
              </a>
            </p>
          </div>
          <div className="col-md-6 px-xl-0 text-center text-md-right">
            <img className="img-fluid" src="img/payments.png" alt="" />
          </div>
        </div>
      </div>

    );
  }
}
export default FooterComponent; 