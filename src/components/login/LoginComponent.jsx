import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LOGOUT_NOTICES } from '../../context/AuthContext.jsx';
import { useUserMutations } from '../../hooks/useApiQueries.ts';
import useTranslation from '../../hooks/useTranslation.js';
import AuthenticationService from '../../services/AuthenticationService.js';
import { getErrorCode } from '../../services/httpClient.js';
import { sanitizeMessage } from '../../services/messageUtils.js';
import { getMissingPasswordRequirements, loginSchema, registrationSchema } from '../../schemas/registration';
import { Button, Card, ErrorNotice, Field, Input, Select } from '../ui/shadcn';
import './LoginComponent.css';

const allowedNotices = Object.values(LOGOUT_NOTICES);

function LoginComponent(props) {
    const t = useTranslation();
    const userMutations = useUserMutations();
    const [isRegistering, setIsRegistering] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [loginErrorTone, setLoginErrorTone] = useState('red');
    const [registrationError, setRegistrationError] = useState('');
    const [registrationSuccess, setRegistrationSuccess] = useState('');
    const loginForm = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });
    const registrationForm = useForm({
        resolver: zodResolver(registrationSchema),
        defaultValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            nombre: '',
            apellido: '',
            direccion: '',
            telefono: '',
            tipoIdentificacion: 'CC',
            numeroIdentificacion: '',
            mayorDeEdad: false,
        },
    });
    const noticeKey = props.location?.state?.notice;
    const missingPasswordRules = getMissingPasswordRequirements(registrationForm.watch('password') || '');
    const notice = allowedNotices.includes(noticeKey) ? t(noticeKey) : '';

    const register = async (values) => {
        setRegistrationError('');
        setRegistrationSuccess('');
        try {
            await userMutations.register.mutateAsync({
                username: values.username,
                email: values.email,
                password: values.password,
                nombre: values.nombre,
                apellido: values.apellido,
                direccion: values.direccion,
                telefono: values.telefono,
                tipoIdentificacion: values.tipoIdentificacion,
                numeroIdentificacion: values.numeroIdentificacion,
                mayorDeEdad: true,
            });

            setRegistrationSuccess(t('register_pending_approval'));
            loginForm.setValue('email', values.email);
            registrationForm.reset();
        } catch (error) {
            setRegistrationError(error instanceof Error ? error.message : t('registration_failed'));
        }
    };

    const signIn = async (values) => {
        setLoginError('');
        try {
            const login = props.auth
                ? props.auth.login
                : AuthenticationService.login.bind(AuthenticationService);
            const data = await login(values.email, values.password);
            const username = data?.user?.username || data?.username || values.email;
            const requestedPath = props.location?.state?.from;
            const returnTo = typeof requestedPath === 'string'
                && requestedPath.startsWith('/')
                && !requestedPath.startsWith('//')
                && requestedPath !== '/login'
                ? requestedPath
                : `/welcome/${encodeURIComponent(username)}`;
            props.navigate(returnTo, { replace: true });
        } catch (error) {
            const status = error.response?.status;
            const data = error.response?.data;
            let message = t('login_failed');
            let tone = 'red';

            if (status === 403) {
                const code = getErrorCode(data);
                if (code === 'user_pending_approval') {
                    message = t('user_pending');
                    tone = 'blue';
                } else if (code === 'user_inactive') {
                    message = t('user_inactive');
                    tone = 'amber';
                } else {
                    message = sanitizeMessage(data?.message, message);
                }
            } else if (status !== 401) {
                message = sanitizeMessage(data?.message, message);
            }

            setLoginErrorTone(tone);
            setLoginError(message);
        }
    };

    const errorFor = (form, field) => {
        const message = form.formState.errors[field]?.message;
        return message ? t(message) : undefined;
    };
    const alertTone = {
        red: 'hu-border-red-200 hu-bg-red-50 hu-text-red-800',
        blue: 'hu-border-blue-200 hu-bg-blue-50 hu-text-blue-800',
        amber: 'hu-border-amber-200 hu-bg-amber-50 hu-text-amber-900',
    };

    return (
        <main className={`auth-screen${isRegistering ? ' auth-screen-register' : ''}`}>
            <div className="auth-layout">
                <h1 className="auth-heading">{isRegistering ? t('create_account') : t('sign_in')}</h1>
                <Card className="auth-card-frame">
                    <div className="auth-card-panel">
                {isRegistering ? (
                    <>
                        <p className="auth-register-intro">{t('register_pending_approval')}</p>
                        {registrationSuccess && (
                            <div className={`hu-mb-4 hu-rounded-lg hu-border hu-p-3 hu-text-sm ${alertTone.blue}`} role="status">
                                {registrationSuccess}{' '}
                                <button className="hu-font-semibold hu-underline" type="button" onClick={() => setIsRegistering(false)}>{t('go_to_login')}</button>
                            </div>
                        )}
                        {registrationError && <div className="hu-mb-4"><ErrorNotice>{registrationError}</ErrorNotice></div>}
                        <form className="auth-form auth-registration-form" noValidate onSubmit={registrationForm.handleSubmit(register)}>
                            <div className="hu-grid hu-gap-4 sm:hu-grid-cols-2">
                                <Field label={`${t('user_name_label')} *`} htmlFor="register-username" error={errorFor(registrationForm, 'username')}>
                                    <Input id="register-username" autoComplete="username" aria-invalid={Boolean(registrationForm.formState.errors.username)} {...registrationForm.register('username')} />
                                </Field>
                                <Field label={`${t('email')} *`} htmlFor="register-email" error={errorFor(registrationForm, 'email')}>
                                    <Input id="register-email" type="email" autoComplete="email" aria-invalid={Boolean(registrationForm.formState.errors.email)} {...registrationForm.register('email')} />
                                </Field>
                                <div className="password-group sm:hu-col-span-2">
                                    <Field label={`${t('password')} *`} htmlFor="register-password" error={errorFor(registrationForm, 'password')}>
                                        <Input id="register-password" type="password" autoComplete="new-password" aria-invalid={Boolean(registrationForm.formState.errors.password)} {...registrationForm.register('password')} />
                                    </Field>
                                    <Field label={`${t('confirm_password')} *`} htmlFor="register-confirm-password" error={errorFor(registrationForm, 'confirmPassword')}>
                                        <Input id="register-confirm-password" type="password" autoComplete="new-password" aria-invalid={Boolean(registrationForm.formState.errors.confirmPassword)} {...registrationForm.register('confirmPassword')} />
                                    </Field>
                                    {missingPasswordRules.length > 0 && (
                                        <div id="register-password-tooltip" role="tooltip" className="password-tooltip">
                                            <strong>{t('password_missing_hint')}</strong>
                                            <ul>{missingPasswordRules.map((rule) => <li key={rule}>{t(rule)}</li>)}</ul>
                                        </div>
                                    )}
                                </div>
                                <Field label={`${t('first_name')} *`} htmlFor="register-first-name" error={errorFor(registrationForm, 'nombre')}>
                                    <Input id="register-first-name" autoComplete="given-name" aria-invalid={Boolean(registrationForm.formState.errors.nombre)} {...registrationForm.register('nombre')} />
                                </Field>
                                <Field label={`${t('last_name')} *`} htmlFor="register-last-name" error={errorFor(registrationForm, 'apellido')}>
                                    <Input id="register-last-name" autoComplete="family-name" aria-invalid={Boolean(registrationForm.formState.errors.apellido)} {...registrationForm.register('apellido')} />
                                </Field>
                                <Field label={`${t('address')} *`} htmlFor="register-address" error={errorFor(registrationForm, 'direccion')}>
                                    <Input id="register-address" autoComplete="street-address" aria-invalid={Boolean(registrationForm.formState.errors.direccion)} {...registrationForm.register('direccion')} />
                                </Field>
                                <Field label={`${t('contact_phone')} *`} htmlFor="register-phone" error={errorFor(registrationForm, 'telefono')}>
                                    <Input id="register-phone" type="tel" autoComplete="tel" aria-invalid={Boolean(registrationForm.formState.errors.telefono)} {...registrationForm.register('telefono')} />
                                </Field>
                                <Field label={`${t('identification_type')} *`} htmlFor="register-id-type" error={errorFor(registrationForm, 'tipoIdentificacion')}>
                                    <div className="hu-flex hu-gap-4">
                                        <Select aria-label={t('identification_type')} {...registrationForm.register('tipoIdentificacion')}>
                                            <option value="CC">CC</option>
                                            <option value="CE">CE</option>
                                            <option value="Pasaporte">{t('passport')}</option>
                                            <option value="NIT">NIT</option>
                                        </Select>
                                    </div>
                                </Field>

                                <Field label={`${t('identification_number')} *`} htmlFor="register-id-number" error={errorFor(registrationForm, 'numeroIdentificacion')}>
                                    <Input id="register-id-number" aria-invalid={Boolean(registrationForm.formState.errors.numeroIdentificacion)} {...registrationForm.register('numeroIdentificacion')} />
                                </Field>
                            </div>
                            <div className="hu-text-sm hu-font-medium hu-text-slate-700">
                                <label className="hu-flex hu-items-start hu-gap-2 hu-font-normal" htmlFor="regMayorDeEdad">
                                    <input id="regMayorDeEdad" className="hu-mt-1 hu-h-4 hu-w-4 hu-shrink-0" type="checkbox" aria-invalid={Boolean(registrationForm.formState.errors.mayorDeEdad)} {...registrationForm.register('mayorDeEdad')} />
                                    <span>{t('age_consent_text')}</span>
                                </label>
                                {errorFor(registrationForm, 'mayorDeEdad') && <span className="hu-mt-1 hu-block hu-text-xs hu-font-normal hu-text-red-700" role="alert">{errorFor(registrationForm, 'mayorDeEdad')}</span>}
                            </div>
                            <div className="auth-actions">
                                <Button className="auth-button auth-button-primary" type="submit" disabled={userMutations.register.isPending}>
                                    {userMutations.register.isPending ? t('saving_btn') : t('sign_up')}
                                </Button>
                                <Button className="auth-button auth-button-secondary" type="button" variant="secondary" onClick={() => setIsRegistering(false)}>{t('sign_in')}</Button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        {notice && <div className={`hu-mb-4 hu-rounded-lg hu-border hu-p-3 hu-text-sm ${alertTone.amber}`} role="status">{notice}</div>}
                        {loginError && <div className={`hu-mb-4 hu-rounded-lg hu-border hu-p-3 hu-text-sm ${alertTone[loginErrorTone]}`} role="alert">{loginError}</div>}
                        <form className="auth-form" noValidate onSubmit={loginForm.handleSubmit(signIn)}>
                            <Field label={t('email')} htmlFor="email" error={errorFor(loginForm, 'email')}>
                                <Input id="email" type="email" autoComplete="email" placeholder="Correo@ejemplo.com" aria-invalid={Boolean(loginForm.formState.errors.email)} {...loginForm.register('email')} />
                            </Field>
                            <Field label={t('password')} htmlFor="password" error={errorFor(loginForm, 'password')}>
                                <Input id="password" type="password" autoComplete="current-password" placeholder={t('password')} aria-invalid={Boolean(loginForm.formState.errors.password)} {...loginForm.register('password')} />
                            </Field>
                            <Button className="auth-button auth-button-primary" type="submit" disabled={props.auth?.isLoading}>{props.auth?.isLoading ? t('loading') : t('sign_in')}</Button>
                            <Button className="auth-button auth-button-secondary" type="button" variant="secondary" onClick={() => setIsRegistering(true)}>{t('sign_up')}</Button>
                        </form>
                    </>
                )}
                    </div>
                </Card>
            </div>
        </main>
    );
}

export default LoginComponent;
