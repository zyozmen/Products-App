import React, { Component } from 'react';
import translationService from '../../services/TranslationService';

class ErrorComponent extends Component {
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
                <div>{t('error_generic')}</div>
        )        
    }
}
export default ErrorComponent;