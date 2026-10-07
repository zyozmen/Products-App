import React, { Component } from "react";
import translationService from "../../../services/TranslationService";

class ShareComponent extends Component {
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
            <div className="d-flex pt-2">
                <strong className="text-dark mr-2">{t('share_on')}</strong>
                <div className="d-inline-flex">
                    <button type="button" className="btn btn-link text-dark px-2 p-0" aria-label={`${t('share_on')} Facebook`}>
                        <i className="fab fa-facebook-f" />
                    </button>
                    <button type="button" className="btn btn-link text-dark px-2 p-0" aria-label={`${t('share_on')} Twitter`}>
                        <i className="fab fa-twitter" />
                    </button>
                    <button type="button" className="btn btn-link text-dark px-2 p-0" aria-label={`${t('share_on')} LinkedIn`}>
                        <i className="fab fa-linkedin-in" />
                    </button>
                    <button type="button" className="btn btn-link text-dark px-2 p-0" aria-label={`${t('share_on')} Pinterest`}>
                        <i className="fab fa-pinterest" />
                    </button>
                </div>
            </div>
        );
    }
}

export default ShareComponent;