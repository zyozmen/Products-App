import React, { useMemo, useState } from 'react';
import HeaderComponent from '../../dashboard/HeaderComponent.jsx';
import AdminNav from '../AdminNav.jsx';
import FooterComponent from '../../dashboard/FooterComponent.jsx';
import navigationComponent from '../../navigation/NavigationComponent.jsx';
import AuthenticationService from '../../../services/AuthenticationService.js';
import useTranslation from '../../../hooks/useTranslation.js';
import { useAdminUsers, useUserMutations } from '../../../hooks/useApiQueries.ts';
import { USER_STATES, USER_STATE_VALUES, normalizeUserState } from '../../../services/userState.js';
import { Badge, Button, Card, ErrorNotice, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/shadcn';

const STATE_LABEL_KEYS = {
    [USER_STATES.ACTIVE]: 'active_label',
    [USER_STATES.INACTIVE]: 'inactive_label',
    [USER_STATES.PENDING]: 'pending_label',
};

const STATE_BADGES = {
    [USER_STATES.ACTIVE]: 'green',
    [USER_STATES.INACTIVE]: 'neutral',
    [USER_STATES.PENDING]: 'orange',
};

const PRIMARY_ADMIN = 'admin';
const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);

function UserAdminComponent() {
    const t = useTranslation();
    const [filter, setFilter] = useState('ALL');
    const [stateError, setStateError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const { data: users = [], isPending, isError, error, refetch } = useAdminUsers();
    const { updateState, resetPassword } = useUserMutations();
    const isAdmin = AuthenticationService.isUserAdmin();
    const currentUsername = AuthenticationService.getLoggedInUser()?.username;
    const pendingCount = useMemo(
        () => users.filter((user) => normalizeUserState(user.state) === USER_STATES.PENDING).length,
        [users],
    );
    const visibleUsers = filter === USER_STATES.PENDING
        ? users.filter((user) => normalizeUserState(user.state) === USER_STATES.PENDING)
        : users;

    const handleChangeState = (username, state) => {
        if (!isAdmin) return;
        const nextState = normalizeUserState(state);
        if (nextState === USER_STATES.INACTIVE && !window.confirm(t('confirm_set_inactive'))) return;

        setStateError('');
        updateState.mutate({ username, state: nextState }, {
            onSuccess: () => window.dispatchEvent(new Event('users-changed')),
            onError: (mutationError) => {
                const status = mutationError?.response?.status;
                if (status === 403) setStateError(t('state_change_forbidden'));
                else if (status === 404) setStateError(t('user_not_found'));
                else setStateError(mutationError?.message || t('state_change_failed'));
            },
        });
    };

    const handleResetPassword = async (username) => {
        const newPassword = window.prompt(`${t('reset_password_prompt')} "${username}":`);
        if (newPassword === null) return;
        if (newPassword.trim() === '') {
            setPasswordError(t('password_empty_error'));
            return;
        }
        setPasswordError('');
        try {
            await resetPassword.mutateAsync({ username, password: newPassword });
            window.alert(`${t('password_reset_success')} "${username}".`);
        } catch (mutationError) {
            setPasswordError(`${t('password_reset_error')}: ${mutationError.message}`);
        }
    };

    return (
        <div className="hu-flex hu-min-h-screen hu-flex-col admin-page-bg hu-text-slate-900">
            <HeaderComponentWithNavigation />
            <AdminNav />
            <main className="hu-mx-auto hu-w-full hu-max-w-[1600px] hu-flex-1 hu-px-4 hu-py-8 md:hu-px-8">
                <div className="hu-mb-6 hu-flex hu-flex-wrap hu-items-end hu-justify-between hu-gap-4">
                    <div>
                        <h1 className="hu-m-0 hu-text-3xl hu-font-bold hu-tracking-tight">{t('manage_users')}</h1>
                    </div>
                    <Badge tone="blue">{users.length} usuarios</Badge>
                </div>

                <Card className="hu-overflow-hidden kanban-board">
                    <div className="hu-flex hu-flex-wrap hu-items-center hu-justify-between hu-gap-3 hu-border-b hu-border-slate-200 hu-p-5 ">
                        <div>
                            <h2 className="hu-m-0 hu-text-lg hu-font-bold">{t('manage_users')}</h2>
                            <p className="hu-mb-0 hu-mt-1 hu-text-sm hu-text-slate-500">Administra estados de cuenta y restablece contraseñas.</p>
                        </div>
                        <div className="hu-flex hu-flex-wrap hu-items-center hu-gap-2" role="group" aria-label="Filtrar usuarios">
                            <Button type="button" variant={filter === 'ALL' ? 'primary' : 'secondary'} className="hu-px-3 hu-py-2" onClick={() => setFilter('ALL')}>{t('all_filter')}</Button>
                            <Button type="button" variant={filter === USER_STATES.PENDING ? 'primary' : 'secondary'} className="hu-px-3 hu-py-2" onClick={() => setFilter(USER_STATES.PENDING)}>
                                {t('pending_filter')} <Badge tone="orange">{pendingCount}</Badge>
                            </Button>
                        </div>
                    </div>

                    <div className="hu-grid hu-gap-3 hu-p-5">
                        {stateError && <ErrorNotice>{stateError}</ErrorNotice>}
                        {passwordError && <ErrorNotice>{passwordError}</ErrorNotice>}
                        {isError && (
                            <ErrorNotice>
                                <span>{error?.message || 'No fue posible cargar los usuarios.'}</span>
                                <Button type="button" variant="secondary" className="hu-ml-3 hu-py-1.5" onClick={() => void refetch()}>Reintentar</Button>
                            </ErrorNotice>
                        )}
                        {updateState.isPending && <p className="hu-m-0 hu-text-sm hu-text-blue-800" role="status">Actualizando estado…</p>}
                        {isPending ? (
                            <p className="hu-m-0 hu-p-5 hu-text-sm hu-text-slate-600" role="status">{t('loading')}</p>
                        ) : (
                            <div className="hu-overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:hu-bg-slate-50">
                                            {[t('user_label'), t('email'), t('full_name'), t('address'), t('contact_phone'), t('identification'), t('role'), t('status'), t('action')].map((label) => (
                                                <TableHead key={label}>{label}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {visibleUsers.map((user) => {
                                            const username = user.username;
                                            const state = normalizeUserState(user.state);
                                            const isSelf = username === PRIMARY_ADMIN || username === currentUsername;
                                            const isUserPending = state === USER_STATES.PENDING;
                                            return (
                                                <TableRow key={username}>
                                                    <TableCell className="hu-font-semibold">{username}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>{user.nombre} {user.apellido}</TableCell>
                                                    <TableCell>{user.direccion}</TableCell>
                                                    <TableCell>{user.telefono}</TableCell>
                                                    <TableCell>{user.tipoIdentificacion} - {user.numeroIdentificacion}</TableCell>
                                                    <TableCell><Badge tone={user.role === 'admin' ? 'blue' : 'neutral'}>{user.role === 'admin' ? t('role_admin') : t('role_user')}</Badge></TableCell>
                                                    <TableCell><Badge tone={STATE_BADGES[state] || 'neutral'}>{STATE_LABEL_KEYS[state] ? t(STATE_LABEL_KEYS[state]) : '-'}</Badge></TableCell>
                                                    <TableCell>
                                                        <div className="hu-flex hu-min-w-[250px] hu-flex-wrap hu-items-center hu-gap-2">
                                                            {isUserPending && (
                                                                <Button type="button" variant="secondary" className="hu-px-2.5 hu-py-1.5" onClick={() => handleChangeState(username, USER_STATES.ACTIVE)} disabled={isSelf || !isAdmin}>
                                                                    {t('approve')}
                                                                </Button>
                                                            )}
                                                            <Select
                                                                className="hu-w-auto hu-px-2 hu-py-1.5"
                                                                aria-label={t('change_state')}
                                                                value={state}
                                                                onChange={(event) => handleChangeState(username, event.target.value)}
                                                                disabled={isSelf || !isAdmin}
                                                                title={isSelf ? t('cannot_disable_admin') : t('change_state')}
                                                            >
                                                                {USER_STATE_VALUES.map((value) => (
                                                                    <option key={value} value={value}>{t(STATE_LABEL_KEYS[value])}</option>
                                                                ))}
                                                            </Select>
                                                            <Button type="button" variant="secondary" className="hu-px-2.5 hu-py-1.5" onClick={() => void handleResetPassword(username)} disabled={resetPassword.isPending} title={t('reset_password')}>
                                                                {t('reset_password_button')}
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {!visibleUsers.length && (
                                            <TableRow><TableCell colSpan={9} className="hu-py-10 hu-text-center hu-text-slate-500">{isError ? 'No se pudieron cargar los usuarios.' : 'No hay usuarios para mostrar.'}</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </Card>
            </main>
            <FooterComponent />
        </div>
    );
}

export default UserAdminComponent;
