import React, { Component } from 'react';
import './LoginComponent.css';
import { NavLink } from 'react-router-dom';
import AuthenticationService from '../../services/AuthenticationService.js';
import translationService from '../../services/TranslationService.js';
import UserService from '../../services/UserService.js';

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
            // Sign In State
            username: '',
            password: '',
            hasLoginFailed: false,
            loginErrorMessage: '',
            showSuccessMessage: false,
            currentLanguage: translationService.getLanguage(),

            // Sign Up State
            regUsername: '',
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
                            type="password" 
                            placeholder={t('password') + " *"} 
                            value={this.state.regPassword} 
                            onChange={e => this.setState({ regPassword: e.target.value })} 
                            required 
                        />
                        <input 
                            className="LoginInput py-1 my-1" 
                            type="text" 
                            placeholder="Nombre *" 
                            value={this.state.regNombre} 
                            onChange={e => this.setState({ regNombre: e.target.value })} 
                            required 
                        />
                        <input 
                            className="LoginInput py-1 my-1" 
                            type="text" 
                            placeholder="Apellido *" 
                            value={this.state.regApellido} 
                            onChange={e => this.setState({ regApellido: e.target.value })} 
                            required 
                        />
                        <input 
                            className="LoginInput py-1 my-1" 
                            type="text" 
                            placeholder="Dirección *" 
                            value={this.state.regDireccion} 
                            onChange={e => this.setState({ regDireccion: e.target.value })} 
                            required 
                        />
                        <input 
                            className="LoginInput py-1 my-1" 
                            type="tel" 
                            placeholder="Teléfono *" 
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
                                <option value="Pasaporte">Pasaporte</option>
                                <option value="NIT">NIT</option>
                            </select>
                            <input 
                                className="LoginInput py-1 m-0" 
                                style={{ width: '60%' }}
                                type="text" 
                                placeholder="Nº Identificación *" 
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
                                Declaro que soy mayor de 18 años y doy mi consentimiento. *
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
                                        <span className="h1 text-uppercase text-dark bg-primary px-2 ml-n1">
                                            Green
                                        </span>
                                    </NavLink>
                        </div>
                        <label htmlFor="username" className="d-block mt-2">{t('user_name_label')}</label>
                        <input id="username" className="LoginInput" type="text" placeholder={t('user_name_label')} value={this.state.username} onChange={e => this.setState({ username: e.target.value })} required />
                        <label htmlFor="password" className="d-block mt-2">{t('password')}</label>
                        <input id="password" className="LoginInput" type="password" placeholder={t('password')} value={this.state.password} onChange={e => this.setState({ password: e.target.value })} required />
                        <button type="button" className="btn btn-link forgot-password p-0">{t('forgot_password')}</button>
                        <ShowInvalidCredentials hasLoginFailed={this.state.hasLoginFailed} errorMessage={this.state.loginErrorMessage} t={t} />
                        <button type="submit" className="live">{t('sign_in')}</button>
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
            this.setState({ regErrorMessage: 'Debe declarar que es mayor de 18 años.', regSuccessMessage: '' });
            return;
        }

        try {
            const newUser = {
                username: regUsername.trim(),
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
                regSuccessMessage: '¡Usuario registrado con éxito! Ya puedes iniciar sesión.',
                regErrorMessage: '',
                // Clear fields
                regUsername: '',
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
        const { username, password } = this.state;

        try {
            await AuthenticationService.login(username, password);
            this.props.navigate(`/welcome/${username}`);
        } catch (error) {
            console.log("Login failed", error);
            const t = (key) => translationService.t(key);
            let errorMessage = t('invalid_credentials');

            if (error.response && error.response.status === 403) {
                if (error.response.data && error.response.data.error === 'user_inactive') {
                    errorMessage = t('user_inactive');
                }
            } else if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
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