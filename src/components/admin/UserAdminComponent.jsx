import React, { Component } from 'react';
import HeaderComponent from '../dashboard/HeaderComponent.jsx';
import FooterComponent from '../dashboard/FooterComponent.jsx';
import navigationComponent from '../navigation/NavigationComponent.jsx';
import UserService from '../../services/UserService.js';
import AuthenticationService from '../../services/AuthenticationService.js';
import translationService from '../../services/TranslationService.js';
import { USER_STATES, USER_STATE_VALUES, normalizeUserState } from '../../services/userState.js';

const STATE_LABEL_KEYS = {
    [USER_STATES.ACTIVE]: 'active_label',
    [USER_STATES.INACTIVE]: 'inactive_label',
    [USER_STATES.PENDING]: 'pending_label',
};

const STATE_BADGES = {
    [USER_STATES.ACTIVE]: 'badge-success',
    [USER_STATES.INACTIVE]: 'badge-secondary',
    [USER_STATES.PENDING]: 'badge-warning',
};

const PRIMARY_ADMIN = 'admin';

class UserAdminComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            users: [],
            filter: 'ALL',
            stateError: '',
            currentLanguage: translationService.getLanguage()
        };
        this.handleChangeState = this.handleChangeState.bind(this);
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

    async handleChangeState(username, state) {
        // Solo el rol ADMIN puede cambiar el estado (también se valida en UserService y en el backend).
        if (!AuthenticationService.isUserAdmin()) return;
        const t = (key) => translationService.t(key);
        const nextState = normalizeUserState(state);

        if (nextState === USER_STATES.INACTIVE && !window.confirm(t('confirm_set_inactive'))) return;

        const previous = this.state.users;
        this.setState({
            users: previous.map((u) => (u.username === username ? { ...u, state: nextState } : u)),
            stateError: ''
        });

        try {
            const updated = await UserService.updateUserState(username, nextState);
            if (updated && typeof updated === 'object' && updated.username) {
                this.setState((s) => ({
                    users: s.users.map((u) => (u.username === username ? { ...u, ...updated } : u))
                }));
            }
            this.notifyUsersChanged();
        } catch (error) {
            console.error('Error updating user state:', error?.message);
            this.setState({ users: previous, stateError: this.describeStateError(error) });
        }
    }

    notifyUsersChanged() {
        window.dispatchEvent(new Event('users-changed'));
    }

    describeStateError(error) {
        const t = (key) => translationService.t(key);
        const status = error?.response?.status;
        if (status === 403) return t('state_change_forbidden');
        if (status === 404) return t('user_not_found');
        return error?.message || t('state_change_failed');
    }

    async handleResetPassword(username) {
        const t = (key) => translationService.t(key);
        const newPassword = window.prompt(`${t('reset_password_prompt')} "${username}":`);
        if (newPassword === null) return;
        if (newPassword.trim() === '') {
            alert(t('password_empty_error'));
            return;
        }

        try {
            await UserService.resetPassword(username, newPassword);
            alert(`${t('password_reset_success')} "${username}".`);
        } catch (error) {
            console.error('Error resetting password:', error);
            alert(`${t('password_reset_error')}: ${error.message}`);
        }
    }

    render() {
        const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
        const { users, filter, stateError } = this.state;
        const isAdmin = AuthenticationService.isUserAdmin();
        const currentUsername = AuthenticationService.getLoggedInUser()?.username;
        const t = (key) => translationService.t(key);
        const pendingCount = users.filter((u) => normalizeUserState(u.state) === USER_STATES.PENDING).length;
        const visibleUsers = filter === USER_STATES.PENDING
            ? users.filter((u) => normalizeUserState(u.state) === USER_STATES.PENDING)
            : users;

        return (
            <>
                <HeaderComponentWithNavigation />
                
                <div className="container-fluid">
                    <div className="row px-xl-5">
                        <div className="col-12">
                            <nav className="breadcrumb bg-light mb-30">
                                <span className="breadcrumb-item text-dark">{t('admin_section')}</span>
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
                                {stateError && <div className="alert alert-danger py-2" role="alert">{stateError}</div>}
                                <div className="btn-group mb-3" role="group">
                                    <button type="button" className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => this.setState({ filter: 'ALL' })}>{t('all_filter')}</button>
                                    <button type="button" className={`btn btn-sm ${filter === USER_STATES.PENDING ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => this.setState({ filter: USER_STATES.PENDING })}>
                                        {t('pending_filter')} <span className="badge badge-warning">{pendingCount}</span>
                                    </button>
                                </div>
                                <table className="table table-bordered table-striped table-hover text-center align-middle">
                                    <thead className="thead-dark">
                                        <tr>
                                            <th>{t('user_label')}</th>
                                            <th>{t('email')}</th>
                                            <th>{t('full_name')}</th>
                                            <th>{t('address')}</th>
                                            <th>{t('contact_phone')}</th>
                                            <th>{t('identification')}</th>
                                            <th>{t('role')}</th>
                                            <th>{t('status')}</th>
                                            <th>{t('action')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleUsers.map((u) => {
                                            const isSelf = u.username === PRIMARY_ADMIN || u.username === currentUsername;
                                            const isPending = normalizeUserState(u.state) === USER_STATES.PENDING;
                                            return (
                                                <tr key={u.username}>
                                                    <td className="align-middle font-weight-bold">{u.username}</td>
                                                    <td className="align-middle">{u.email}</td>
                                                    <td className="align-middle">{u.nombre} {u.apellido}</td>
                                                    <td className="align-middle">{u.direccion}</td>
                                                    <td className="align-middle">{u.telefono}</td>
                                                    <td className="align-middle">{u.tipoIdentificacion} - {u.numeroIdentificacion}</td>
                                                    <td className="align-middle">
                                                        <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-secondary'} py-2 px-3`}>
                                                            {u.role === 'admin' ? t('role_admin') : t('role_user')}
                                                        </span>
                                                    </td>
                                                    <td className="align-middle">
                                                        <span className={`badge ${STATE_BADGES[normalizeUserState(u.state)] ?? 'badge-secondary'} py-2 px-3`}>
                                                            {STATE_LABEL_KEYS[normalizeUserState(u.state)] ? t(STATE_LABEL_KEYS[normalizeUserState(u.state)]) : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="align-middle">
                                                        <div className="d-flex justify-content-center" style={{ gap: '5px' }}>
                                                            {isPending && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-success font-weight-bold px-2"
                                                                    onClick={() => this.handleChangeState(u.username, USER_STATES.ACTIVE)}
                                                                    disabled={isSelf || !isAdmin}
                                                                >
                                                                    {t('approve')}
                                                                </button>
                                                            )}
                                                            <select
                                                                className="form-control form-control-sm"
                                                                style={{ width: 'auto' }}
                                                                aria-label={t('change_state')}
                                                                value={normalizeUserState(u.state)}
                                                                onChange={(e) => this.handleChangeState(u.username, e.target.value)}
                                                                disabled={isSelf || !isAdmin}
                                                                title={isSelf ? t('cannot_disable_admin') : t('change_state')}
                                                            >
                                                                {USER_STATE_VALUES.map((state) => (
                                                                    <option key={state} value={state}>{t(STATE_LABEL_KEYS[state])}</option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-warning font-weight-bold px-2"
                                                                onClick={() => this.handleResetPassword(u.username)}
                                                                title={t('reset_password')}
                                                            >
                                                                {t('reset_password_button')}
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
