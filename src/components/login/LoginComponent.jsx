import React, { Component } from 'react';
import './LoginComponent.css';
import AuthenticationService from '../../services/AuthenticationService.js';
import translationService from '../../services/TranslationService.js';

class LoginComponent extends Component {
    render() {
        return (
            <div className="LoginComponent">
                <LoginForm navigate={this.props.navigate} />
            </div>
        );
    }
}

class LoginForm extends Component {

    constructor(props) {
        super(props);
        this.state = {
            username: '',
            password: '',
            hasLoginFailed: false,
            showSuccessMessage: false,
            currentLanguage: translationService.getLanguage(),
        };

        this.handleSignIn = this.handleSignIn.bind(this);
        this.handleSignUp = this.handleSignUp.bind(this);
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
            <div className="container" id="container">
                <div className="form-container sign-up-container">
                    <form action="#" className="LoginComponentForm">
                        <h1>{t('create_account')}</h1>
                        <span>{t('or_use_email')}</span>
                        <input type="text" placeholder={t('name')} />
                        <input type="email" placeholder={t('email')} />
                        <input type="password" placeholder={t('password')} />
                        <button type="button" onClick={this.handleSignUp}>{t('create_account')}</button>
                    </form>
                </div>
                <div className="form-container sign-in-container">
                    <form action="#" className="LoginComponentForm">
                        <h1>{t('sign_in')}</h1>
                        <span>{t('my_account')}</span>
                        <label htmlFor="username" className="d-block mt-2">{t('user_name_label')}</label>
                        <input id="username" className="LoginInput" type="text" placeholder={t('user_name_label')} value={this.state.username} onChange={e => this.setState({ username: e.target.value })} />
                        <label htmlFor="password" className="d-block mt-2">{t('password')}</label>
                        <input id="password" className="LoginInput" type="password" placeholder={t('password')} value={this.state.password} onChange={e => this.setState({ password: e.target.value })} />
                        <button type="button" className="btn btn-link forgot-password p-0">{t('forgot_password')}</button>
                        <ShowInvalidCredentials hasLoginFailed={this.state.hasLoginFailed} t={t} />
                        <button type="button" className="live" onClick={this.handleSignIn}>{t('sign_in')}</button>
                    </form>
                </div>
                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h1>{t('welcome_back')}</h1>
                            <p>{t('welcome_back_text')}</p>
                            <button type="button" className="ghost live" id="signIn">{t('sign_in')}</button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <h1>{t('hello_friend')}</h1>
                            <p>{t('journey_text')}</p>
                            <button type="button" className="ghost live" id="signUp">{t('create_account')}</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    handleSignUp = (e) => {
        e.preventDefault();
        console.log("Sign Up clicked");
    }

    handleSignIn(e) {

        e.preventDefault();

        if (this.state.username === "admin" && this.state.password === "admin") {
            AuthenticationService.registerSuccessfulLogin(this.state.username, this.state.password);
           this.props.navigate(`/welcome/${this.state.username}`);

        
            
        }
        else {
            console.log("Login failed");
            this.setState({ showSuccessMessage: false, hasLoginFailed: true });
        }
    }



}

function ShowInvalidCredentials(props) {
    if (props.hasLoginFailed) {
        return <div className="alert alert-warning">{props.t('invalid_credentials')}</div>;
    }
    return null;
}

export default LoginComponent;