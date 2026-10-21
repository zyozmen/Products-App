import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import HeaderComponent from '../dashboard/HeaderComponent.jsx';
import FooterComponent from '../dashboard/FooterComponent.jsx';
import navigationComponent from '../navigation/NavigationComponent.jsx';
import AuthenticationService from '../../services/AuthenticationService.js';
import useTranslation from '../../hooks/useTranslation.js';
import { useUserMutations } from '../../hooks/useApiQueries.ts';
import { profileSchema } from '../../schemas/profile';
import PasswordFields from '../ui/PasswordFields.jsx';
import { Button, Card, ErrorNotice, Field, Input } from '../ui/shadcn';

const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);

function ProfileComponent({ navigate }) {
    const t = useTranslation();
    const user = AuthenticationService.getLoggedInUser();
    const { updateProfile } = useUserMutations();
    const [successMessage, setSuccessMessage] = useState('');
    const [submitError, setSubmitError] = useState('');
    const form = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            nombre: user?.nombre || '',
            apellido: user?.apellido || '',
            direccion: user?.direccion || '',
            telefono: user?.telefono || '',
            password: '',
            confirmPassword: '',
        },
    });

    useEffect(() => {
        if (!AuthenticationService.isUserLoggedIn()) navigate('/login');
    }, [navigate]);

    const onSubmit = form.handleSubmit(async (values) => {
        setSuccessMessage('');
        setSubmitError('');
        const currentUser = AuthenticationService.getLoggedInUser();
        if (!currentUser) {
            setSubmitError(t('profile_login_required'));
            return;
        }

        const profileData = {
            username: currentUser.username,
            nombre: values.nombre,
            apellido: values.apellido,
            direccion: values.direccion,
            telefono: values.telefono,
            ...(values.password ? { password: values.password } : {}),
        };

        try {
            const updatedUser = await updateProfile.mutateAsync(profileData);
            const mergedProfile = {
                ...currentUser,
                ...(updatedUser || {}),
                username: currentUser.username,
                nombre: values.nombre,
                apellido: values.apellido,
                direccion: values.direccion,
                telefono: values.telefono,
            };
            sessionStorage.setItem('userProfile', JSON.stringify(mergedProfile));
            form.setValue('password', '');
            form.setValue('confirmPassword', '');
            setSuccessMessage(t('profile_update_success'));
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : t('profile_update_error'));
        }
    });

    const fieldError = (name) => {
        const message = form.formState.errors[name]?.message;
        return message ? t(message) : undefined;
    };

    return (
        <div className="hu-flex hu-min-h-screen hu-flex-col admin-page-bg hu-text-slate-900">
            <HeaderComponentWithNavigation />
            <main className="hu-mx-auto hu-w-full hu-max-w-3xl hu-flex-1 hu-px-4 hu-py-8 md:hu-px-8">
                <div className="hu-mb-6">
                    <h1 className="hu-m-0 hu-text-3xl hu-font-bold hu-tracking-tight hu-text-green-800 admin-title">{t('profile_title')}</h1>
                </div>

                <Card className="hu-p-5 md:hu-p-7 kanban-board">
                    {successMessage && (
                        <div className="hu-mb-5 hu-rounded-lg hu-border hu-border-green-200 hu-bg-green-50 hu-p-3 hu-text-sm hu-text-green-800 dark:hu-border-[#3d6b4c] dark:hu-bg-[#18251e] dark:hu-text-green-200" role="status">
                            {successMessage}
                        </div>
                    )}
                    {submitError && (
                        <div className="hu-mb-5">
                            <ErrorNotice>{submitError}</ErrorNotice>
                        </div>
                    )}

                    <form className="hu-grid hu-gap-5" onSubmit={onSubmit} noValidate>
                        <div className="hu-grid hu-gap-5 sm:hu-grid-cols-2">
                            <Field label={`${t('first_name')} *`} htmlFor="nombre" error={fieldError('nombre')}>
                                <Input id="nombre" autoComplete="given-name" aria-invalid={Boolean(form.formState.errors.nombre)} {...form.register('nombre')} />
                            </Field>
                            <Field label={`${t('last_name')} *`} htmlFor="apellido" error={fieldError('apellido')}>
                                <Input id="apellido" autoComplete="family-name" aria-invalid={Boolean(form.formState.errors.apellido)} {...form.register('apellido')} />
                            </Field>
                        </div>
                        <Field label={`${t('address')} *`} htmlFor="direccion" error={fieldError('direccion')}>
                            <Input id="direccion" autoComplete="street-address" aria-invalid={Boolean(form.formState.errors.direccion)} {...form.register('direccion')} />
                        </Field>
                        <Field label={`${t('contact_phone')} *`} htmlFor="telefono" error={fieldError('telefono')}>
                            <Input id="telefono" type="tel" autoComplete="tel" aria-invalid={Boolean(form.formState.errors.telefono)} {...form.register('telefono')} />
                        </Field>
                        <div className="hu-border-0 hu-border-t hu-border-solid hu-border-[#74a782] hu-pt-5 dark:hu-border-[#3d6b4c]">
                            <PasswordFields
                                form={form}
                                idPrefix="profile"
                                passwordLabel={t('password_change_label')}
                                confirmLabel={t('confirm_password')}
                                hint={t('profile_password_placeholder')}
                            />
                        </div>
                        <div className="hu-flex hu-justify-end">
                            <Button type="submit" disabled={form.formState.isSubmitting || updateProfile.isPending}>
                                {form.formState.isSubmitting || updateProfile.isPending ? t('saving_btn') : t('save_profile_btn')}
                            </Button>
                        </div>
                    </form>
                </Card>
            </main>
            <FooterComponent />
        </div>
    );
}

export default ProfileComponent;
