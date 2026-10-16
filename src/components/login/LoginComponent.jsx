import React, { Component } from 'react';
import './LoginComponent.css';
import { NavLink } from 'react-router-dom';
import AuthenticationService from '../../services/AuthenticationService.js';
import translationService from '../../services/TranslationService.js';
import UserService from '../../services/UserService.js';
import { LOGOUT_NOTICES } from '../../context/AuthContext.jsx';
import { getErrorCode } from '../../services/httpClient.js';
import { sanitizeMessage } from '../../services/messageUtils.js';

class LoginComponent extends Component {
    render() {
        return (
            <div className="LoginComponent">
                <LoginForm navigate={this.props.navigate} auth={this.props.auth} location={this.props.location} />
            </div>
        );
    }
}

// Solo se aceptan avisos conocidos: el estado de navegación no debe inyectar texto arbitrario.
const ALLOWED_NOTICES = Object.values(LOGOUT_NOTICES);

class LoginForm extends Component {

    getNotice() {
        const notice = this.props.location?.state?.notice;
        return ALLOWED_NOTICES.includes(notice) ? translationService.t(notice) : '';
    }

    constructor(props) {
        super(props);
        this.state = {
            // Sign In State
            username: '',
            email: '',
            password: '',
            hasLoginFailed: false,
            loginErrorMessage: '',
            showSuccessMessage: false,
            currentLanguage: translationService.getLanguage(),

            // Sign Up State
            regUsername: '',
            regEmail: '',
            regPassword: '',
            regNombre: '',
            regApellido: '',
            regDireccion: '',
            regTelefono: '',
            regTipoIdentificacion: 'CC',
            regNumeroIdentificacion: '',
            regMayorDeEdad: false,
            regSuccessMessage: '',
            regErrorMessage: '',
        };

        this.handleSignIn = this.handleSignIn.bind(this);
        this.handleSignUp = this.handleSignUp.bind(this);
        this.unsubscribeFromLanguage = null;
    }

    componentDidMount() {
        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });

        // Event listeners for responsive sliding transition on mobile/desktop
        const signUpButton = document.getElementById('signUp');
        const signInButton = document.getElementById('signIn');
        const container = document.getElementById('container');

        if (signUpButton && signInButton && container) {
            signUpButton.addEventListener('click', () => {
                container.classList.add("right-panel-active");
            });

            signInButton.addEventListener('click', () => {
                container.classList.remove("right-panel-active");
            });
        }
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
                {/* SIGN UP CONTAINER */}
                <div className="form-container sign-up-container">
                    <form action="#" className="LoginComponentForm" onSubmit={this.handleSignUp}>
                        <h2 className="mb-2" style={{ fontSize: '24px' }}>{t('create_account')}</h2>
                        
                        {this.state.regSuccessMessage && <div className="alert alert-success py-2 w-100" style={{ fontSize: '13px' }}>{this.state.regSuccessMessage}</div>}
                        {this.state.regErrorMessage && <div className="alert alert-danger py-2 w-100" style={{ fontSize: '13px' }}>{this.state.regErrorMessage}</div>}

                        <input 
                            className="LoginInput py-1 my-1" 
                            type="text" 
                            placeholder={t('user_name_label') + " *"} 
                            value={this.state.regUsername} 
                            onChange={e => this.setState({ regUsername: e.target.value })} 
                            required 
                        />
                        <input 
                            className="LoginInput py-1 my-1" 
                            type="email" 
                            autoComplete="email"
                            placeholder={t('email') + " *"} 
                            value={this.state.regEmail} 
                            onChange={e => this.setState({ regEmail: e.target.value })} 
                            required 
                        />
                        <input 
                            className="LoginInput py-1 my-1" 
                            type="password" 
                            placeholder={t('password') + " *"} 
                            value={this.state.regPassword} 
                            onChange={e => this.setState({ regPassword: e.target.value })} 
                            required 
                        />
                        <input 
                            className="LoginInput py-1 my-1" 
                            type="text" 
                            placeholder={`${t('first_name')} *`}
                            value={this.state.regNombre} 
                            onChange={e => this.setState({ regNombre: e.target.value })} 
                            required 
                        />
                        <input 
                            className="LoginInput py-1 my-1" 
                            type="text" 
                            placeholder={`${t('last_name')} *`}
                            value={this.state.regApellido} 
                            onChange={e => this.setState({ regApellido: e.target.value })} 
                            required 
                        />
                        <input 
                            className="LoginInput py-1 my-1" 
                            type="text" 
                            placeholder={`${t('address')} *`}
                            value={this.state.regDireccion} 
                            onChange={e => this.setState({ regDireccion: e.target.value })} 
                            required 
                        />
                        <input 
                            className="LoginInput py-1 my-1" 
                            type="tel" 
                            placeholder={`${t('contact_phone')} *`}
                            value={this.state.regTelefono} 
                            onChange={e => this.setState({ regTelefono: e.target.value })} 
                            required 
                        />
                        
                        <div className="w-100 d-flex mb-1" style={{ gap: '10px' }}>
                            <select 
                                className="form-control" 
                                style={{ width: '40%', fontSize: '14px', height: '38px', backgroundColor: '#eee', border: 'none' }}
                                value={this.state.regTipoIdentificacion}
                                onChange={e => this.setState({ regTipoIdentificacion: e.target.value })}
                            >
                                <option value="CC">CC</option>
                                <option value="CE">CE</option>
                                <option value="Pasaporte">{t('passport')}</option>
                                <option value="NIT">NIT</option>
                            </select>
                            <input 
                                className="LoginInput py-1 m-0" 
                                style={{ width: '60%' }}
                                type="text" 
                                placeholder={`${t('identification_number')} *`}
                                value={this.state.regNumeroIdentificacion} 
                                onChange={e => this.setState({ regNumeroIdentificacion: e.target.value })} 
                                required 
                            />
                        </div>

                        <div className="form-check my-2 text-left w-100 px-3">
                            <input 
                                className="form-check-input" 
                                type="checkbox" 
                                id="regMayorDeEdad" 
                                checked={this.state.regMayorDeEdad}
                                onChange={e => this.setState({ regMayorDeEdad: e.target.checked })}
                                required
                            />
                            <label className="form-check-label text-muted" htmlFor="regMayorDeEdad" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                                {t('age_consent_text')}
                            </label>
                        </div>

                        <button type="submit" className="live mt-1">{t('sign_up')}</button>
                    </form>
                </div>

                {/* SIGN IN CONTAINER */}
                <div className="form-container sign-in-container">
                    <form action="#" className="LoginComponentForm" onSubmit={this.handleSignIn}>
                        <div>
                            <NavLink to="/welcome" className="btn btn-link text-decoration-none p-0">
                                        <span className="h1 text-uppercase text-dark bg-light px-2">
                                            Zona
                                        </span>
                                        <span className="h1 text-uppercase text-light bg-primary px-2 ml-n1">
                                            Green
                                        </span>
                                    </NavLink>
                        </div>
                        <label htmlFor="email" className="d-block mt-2">{t('email')}</label>
                        <input id="email" className="LoginInput" type="email" autoComplete="email" placeholder={t('email')} value={this.state.email} onChange={e => this.setState({ email: e.target.value })} required />
                        <label htmlFor="password" className="d-block mt-2">{t('password')}</label>
                        <input id="password" className="LoginInput" type="password" placeholder={t('password')} value={this.state.password} onChange={e => this.setState({ password: e.target.value })} required />
                        <button type="button" className="btn btn-link forgot-password p-0">{t('forgot_password')}</button>
                        <ShowInvalidCredentials hasLoginFailed={this.state.hasLoginFailed} errorMessage={this.state.loginErrorMessage} t={t} />
                        {this.getNotice() && <div className="alert alert-warning w-100 py-2 mt-2" role="status" style={{ fontSize: '13px' }}>{this.getNotice()}</div>}                        <button type="submit" className="live">{t('sign_in')}</button>
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

    async handleSignUp(e) {
        e.preventDefault();
        const {
            regUsername,
            regEmail,
            regPassword,
            regNombre,
            regApellido,
            regDireccion,
            regTelefono,
            regTipoIdentificacion,
            regNumeroIdentificacion,
            regMayorDeEdad
        } = this.state;

        if (!regMayorDeEdad) {
            this.setState({
                regErrorMessage: translationService.t('register_requires_age'),
                regSuccessMessage: ''
            });
            return;
        }

        try {
            const newUser = {
                username: regUsername.trim(),
                email: regEmail.trim(),
                password: regPassword,
                nombre: regNombre.trim(),
                apellido: regApellido.trim(),
                direccion: regDireccion.trim(),
                telefono: regTelefono.trim(),
                tipoIdentificacion: regTipoIdentificacion,
                numeroIdentificacion: regNumeroIdentificacion.trim(),
                mayorDeEdad: true
            };

            await UserService.registerUser(newUser);

            this.setState({
                regSuccessMessage: translationService.t('register_success_login_prompt'),
                regErrorMessage: '',
                // Clear fields
                regUsername: '',
                regEmail: '',
                regPassword: '',
                regNombre: '',
                regApellido: '',
                regDireccion: '',
                regTelefono: '',
                regTipoIdentificacion: 'CC',
                regNumeroIdentificacion: '',
                regMayorDeEdad: false
            });

            // Transition back to login
            setTimeout(() => {
                const container = document.getElementById('container');
                if (container) {
                    container.classList.remove("right-panel-active");
                }
            }, 2500);

        } catch (error) {
            this.setState({ regErrorMessage: error.message, regSuccessMessage: '' });
        }
    }

    async handleSignIn(e) {
        e.preventDefault();
        const { email, password } = this.state;

        try {
            const login = this.props.auth
                ? this.props.auth.login
                : AuthenticationService.login.bind(AuthenticationService);
            const data = await login(email.trim(), password);
            const username = data?.user?.username || data?.username || email.trim();
            this.props.navigate(`/welcome/${encodeURIComponent(username)}`);
        } catch (error) {
            const t = (key) => translationService.t(key);
            const status = error.response?.status;
            const data = error.response?.data;
            let errorMessage = t('invalid_credentials');

            if (status === 403) {
                if (getErrorCode(data) === 'user_inactive') {
                    errorMessage = t('user_inactive');
                }
            } else if (status !== 401) {
                // 401 = credenciales inválidas; otros errores pueden traer un mensaje del servidor
                errorMessage = sanitizeMessage(data?.message, errorMessage);
            }

            this.setState({ 
                showSuccessMessage: false, 
                hasLoginFailed: true,
                loginErrorMessage: errorMessage
            });
        }
    }
}

function ShowInvalidCredentials(props) {
    if (props.hasLoginFailed) {
        return <div className="alert alert-danger w-100 py-2 mt-2" style={{ fontSize: '13px' }}>{props.errorMessage || props.t('invalid_credentials')}</div>;
    }
    return null;
}

export default LoginComponent;