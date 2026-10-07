import React, { Component } from "react";
import Reviews from "./Reviews";
import translationService from "../../../services/TranslationService";

class ReviewsComponent extends Component {
    constructor(props) {
        super(props);
        this.state = { currentLanguage: translationService.getLanguage() };
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
            <div className="tab-pane fade" id="tab-pane-3">
                <div className="row">
                    <Reviews t={t} />
                    <div className="col-md-6">
                        <h4 className="mb-4">{t('leave_review')}</h4>
                        <small>
                            {t('review_email_notice')}
                        </small>
                        <div className="d-flex my-3">
                            <p className="mb-0 mr-2">{t('your_rating')}</p>
                            <div className="text-primary">
                                <i className="far fa-star" />
                                <i className="far fa-star" />
                                <i className="far fa-star" />
                                <i className="far fa-star" />
                                <i className="far fa-star" />
                            </div>
                        </div>
                        <form>
                            <div className="form-group">
                                <label htmlFor="message">{t('your_review')}</label>
                                <textarea
                                    id="message"
                                    cols={30}
                                    rows={5}
                                    className="form-control"
                                    defaultValue={""}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="name">{t('your_name')}</label>
                                <input type="text" className="form-control" id="name" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">{t('your_email')}</label>
                                <input type="email" className="form-control" id="email" />
                            </div>
                            <div className="form-group mb-0">
                                <input
                                    type="submit"
                                    defaultValue={t('submit_review')}
                                    className="btn btn-primary px-3"
                                />
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}
export default ReviewsComponent;