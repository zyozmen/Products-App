import React, { Component } from 'react';
import HeaderComponent from '../dashboard/HeaderComponent.jsx';
import FooterComponent from '../dashboard/FooterComponent.jsx';
import navigationComponent from '../navigation/NavigationComponent.jsx';
import UserService from '../../services/UserService.js';
import AuthenticationService from '../../services/AuthenticationService.js';
import translationService from '../../services/TranslationService.js';

class ProfileComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            nombre: '',
            apellido: '',
            direccion: '',
            telefono: '',
            password: '',
            successMessage: '',
            errorMessage: '',
            isSaving: false,
            currentLanguage: translationService.getLanguage()
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.unsubscribeFromLanguage = null;
    }

    componentDidMount() {
        if (!AuthenticationService.isUserLoggedIn()) {
            this.props.navigate('/login');
            return;
        }

        const user = AuthenticationService.getLoggedInUser();
        if (user) {
            this.setState({
                nombre: user.nombre || '',
                apellido: user.apellido || '',
                direccion: user.direccion || '',
                telefono: user.telefono || '',
            });
        }

        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });
    }

    componentWillUnmount() {
        if (this.unsubscribeFromLanguage) {
            this.unsubscribeFromLanguage();
        }
    }

    handleChange(event) {
        const { name, value } = event.target;
        this.setState({ [name]: value });
    }

    async handleSubmit(event) {
        event.preventDefault();
        this.setState({ isSaving: true, successMessage: '', errorMessage: '' });

        const user = AuthenticationService.getLoggedInUser();
        if (!user) {
            this.setState({ isSaving: false, errorMessage: 'No se encuentra logueado.' });
            return;
        }

        const profileData = {
            username: user.username,
            nombre: this.state.nombre.trim(),
            apellido: this.state.apellido.trim(),
            direccion: this.state.direccion.trim(),
            telefono: this.state.telefono.trim(),
        };

        if (this.state.password) {
            profileData.password = this.state.password;
        }

        try {
            const updatedUser = await UserService.updateProfile(profileData);
            
            const mergedProfile = { ...user, ...updatedUser };
            sessionStorage.setItem('userProfile', JSON.stringify(mergedProfile));

            this.setState({
                successMessage: translationService.t('profile_update_success') || '¡Perfil actualizado con éxito!',
                password: '',
                isSaving: false
            });
        } catch (error) {
            this.setState({
                errorMessage: error.message,
                isSaving: false
            });
        }
    }

    render() {
        const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
        const t = (key) => translationService.t(key);

        return (
            <>
                <HeaderComponentWithNavigation />

                <div className="container-fluid">
                    <div className="row px-xl-5">
                        <div className="col-12">
                            <nav className="breadcrumb bg-light mb-30">
                                <span className="breadcrumb-item text-dark">Mi Cuenta</span>
                                <span className="breadcrumb-item active">{t('profile_title') || 'Administrar Mi Perfil'}</span>
                            </nav>
                        </div>
                    </div>
                </div>

                <div className="container pb-5" style={{ maxWidth: '600px' }}>
                    <div className="bg-light p-30 rounded shadow-sm">
                        <h2 className="section-title position-relative text-uppercase mb-4 text-center">
                            <span className="bg-secondary pr-3 px-3">{t('profile_title') || 'Administrar Perfil'}</span>
                        </h2>

                        {this.state.successMessage && (
                            <div className="alert alert-success text-center py-2 mb-4">
                                {this.state.successMessage}
                            </div>
                        )}
                        {this.state.errorMessage && (
                            <div className="alert alert-danger text-center py-2 mb-4">
                                {this.state.errorMessage}
                            </div>
                        )}

                        <form onSubmit={this.handleSubmit}>
                            <div className="row">
                                <div className="col-md-6 form-group">
                                    <label htmlFor="nombre">Nombre *</label>
                                    <input
                                        id="nombre"
                                        className="form-control"
                                        type="text"
                                        name="nombre"
                                        value={this.state.nombre}
                                        onChange={this.handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6 form-group">
                                    <label htmlFor="apellido">Apellido *</label>
                                    <input
                                        id="apellido"
                                        className="form-control"
                                        type="text"
                                        name="apellido"
                                        value={this.state.apellido}
                                        onChange={this.handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="direccion">Dirección *</label>
                                <input
                                    id="direccion"
                                    className="form-control"
                                    type="text"
                                    name="direccion"
                                    value={this.state.direccion}
                                    onChange={this.handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="telefono">Teléfono *</label>
                                <input
                                    id="telefono"
                                    className="form-control"
                                    type="tel"
                                    name="telefono"
                                    value={this.state.telefono}
                                    onChange={this.handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group border-top pt-3 mt-4">
                                <label htmlFor="password"><strong>{t('password_change_label') || 'Cambiar Contraseña (Opcional)'}</strong></label>
                                <input
                                    id="password"
                                    className="form-control"
                                    type="password"
                                    name="password"
                                    placeholder="Dejar vacío para mantener la actual"
                                    value={this.state.password}
                                    onChange={this.handleChange}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-block font-weight-bold py-3 mt-4 text-uppercase"
                                disabled={this.state.isSaving}
                            >
                                {this.state.isSaving ? 'Guardando...' : (t('save_profile_btn') || 'Guardar Cambios')}
                            </button>
                        </form>
                    </div>
                </div>

                <FooterComponent />
            </>
        );
    }
}

export default ProfileComponent;
