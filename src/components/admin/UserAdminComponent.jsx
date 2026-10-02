import React, { Component } from 'react';
import HeaderComponent from '../dashboard/HeaderComponent.jsx';
import FooterComponent from '../dashboard/FooterComponent.jsx';
import navigationComponent from '../navigation/NavigationComponent.jsx';
import UserService from '../../services/UserService.js';
import AuthenticationService from '../../services/AuthenticationService.js';
import translationService from '../../services/TranslationService.js';

class UserAdminComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            users: [],
            currentLanguage: translationService.getLanguage()
        };
        this.handleToggleStatus = this.handleToggleStatus.bind(this);
        this.handleResetPassword = this.handleResetPassword.bind(this);
        this.unsubscribeFromLanguage = null;
    }

    async componentDidMount() {
        if (!AuthenticationService.isUserAdmin()) {
            this.props.navigate('/welcome');
            return;
        }

        try {
            const users = await UserService.getUsers();
            this.setState({ users });
        } catch (error) {
            console.error('Error loading users:', error);
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

    async handleToggleStatus(username) {
        try {
            await UserService.toggleUserStatus(username);
            const users = await UserService.getUsers();
            this.setState({ users });
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    }

    async handleResetPassword(username) {
        const newPassword = window.prompt(`Ingrese la nueva contraseña para el usuario "${username}":`);
        if (newPassword === null) return;
        if (newPassword.trim() === '') {
            alert('La contraseña no puede estar vacía.');
            return;
        }

        try {
            await UserService.resetPassword(username, newPassword);
            alert(`¡Contraseña restablecida con éxito para el usuario "${username}"!`);
        } catch (error) {
            console.error('Error resetting password:', error);
            alert(`Ocurrió un error al restablecer la contraseña: ${error.message}`);
        }
    }

    render() {
        const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
        const { users } = this.state;
        const t = (key) => translationService.t(key);

        return (
            <>
                <HeaderComponentWithNavigation />
                
                <div className="container-fluid">
                    <div className="row px-xl-5">
                        <div className="col-12">
                            <nav className="breadcrumb bg-light mb-30">
                                <span className="breadcrumb-item text-dark">Admin</span>
                                <span className="breadcrumb-item active">{t('manage_users')}</span>
                            </nav>
                        </div>
                    </div>
                </div>

                <div className="container-fluid pb-5">
                    <div className="row px-xl-5">
                        <div className="col">
                            <h2 className="section-title position-relative text-uppercase mb-4">
                                <span className="bg-secondary pr-3">{t('manage_users')}</span>
                            </h2>
                            <div className="bg-light p-30 table-responsive">
                                <table className="table table-bordered table-striped table-hover text-center align-middle">
                                    <thead className="thead-dark">
                                        <tr>
                                            <th>Usuario</th>
                                            <th>Nombre Completo</th>
                                            <th>Dirección</th>
                                            <th>Teléfono</th>
                                            <th>Identificación</th>
                                            <th>Rol</th>
                                            <th>Estado</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u) => {
                                            const isSelf = u.username === 'admin';
                                            return (
                                                <tr key={u.username}>
                                                    <td className="align-middle font-weight-bold">{u.username}</td>
                                                    <td className="align-middle">{u.nombre} {u.apellido}</td>
                                                    <td className="align-middle">{u.direccion}</td>
                                                    <td className="align-middle">{u.telefono}</td>
                                                    <td className="align-middle">{u.tipoIdentificacion} - {u.numeroIdentificacion}</td>
                                                    <td className="align-middle">
                                                        <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-secondary'} py-2 px-3`}>
                                                            {u.role.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="align-middle">
                                                        <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'} py-2 px-3`}>
                                                            {u.active ? 'ACTIVO' : 'INACTIVO'}
                                                        </span>
                                                    </td>
                                                    <td className="align-middle">
                                                        <div className="d-flex justify-content-center" style={{ gap: '5px' }}>
                                                            <button
                                                                type="button"
                                                                className={`btn btn-sm ${u.active ? 'btn-danger' : 'btn-success'} font-weight-bold px-2`}
                                                                onClick={() => this.handleToggleStatus(u.username)}
                                                                disabled={isSelf}
                                                                title={isSelf ? "No se puede inactivar al Administrador principal" : ""}
                                                            >
                                                                {u.active ? 'Inactivar' : 'Activar'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-warning font-weight-bold px-2"
                                                                onClick={() => this.handleResetPassword(u.username)}
                                                                title="Restablecer contraseña de usuario"
                                                            >
                                                                Restablecer Clave
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <FooterComponent />
            </>
        );
    }
}

export default UserAdminComponent;
