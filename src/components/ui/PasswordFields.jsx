import useTranslation from '../../hooks/useTranslation.js';
import { getMissingPasswordRequirements } from '../../schemas/registration';
import { Field, Input } from './shadcn';
import './PasswordFields.css';

// Campos de contraseña + confirmación con el tooltip de requisitos (compartido por registro y perfil).
function PasswordFields({
    form,
    idPrefix,
    passwordLabel,
    confirmLabel,
    hint,
    className = '',
    passwordName = 'password',
    confirmName = 'confirmPassword',
}) {
    const t = useTranslation();
    const { errors } = form.formState;
    const missingRules = getMissingPasswordRequirements(form.watch(passwordName) || '');
    const errorFor = (name) => (errors[name]?.message ? t(errors[name].message) : undefined);

    return (
        <div className={`password-group ${className}`.trim()}>
            <Field label={passwordLabel} htmlFor={`${idPrefix}-password`} hint={hint} error={errorFor(passwordName)}>
                <Input
                    id={`${idPrefix}-password`}
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors[passwordName])}
                    aria-describedby={missingRules.length > 0 ? `${idPrefix}-password-tooltip` : undefined}
                    {...form.register(passwordName)}
                />
            </Field>
            <Field label={confirmLabel} htmlFor={`${idPrefix}-confirm-password`} error={errorFor(confirmName)}>
                <Input
                    id={`${idPrefix}-confirm-password`}
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors[confirmName])}
                    onMouseDown={(event) => {
                        // Con clic se redirige el foco a la contraseña; con teclado (Tab) se puede avanzar normalmente.
                        if (missingRules.length === 0) return;
                        event.preventDefault();
                        document.getElementById(`${idPrefix}-password`)?.focus();
                    }}
                    {...form.register(confirmName)}
                />
            </Field>
            {missingRules.length > 0 && (
                <div id={`${idPrefix}-password-tooltip`} role="tooltip" className="password-tooltip">
                    <strong>{t('password_missing_hint')}</strong>
                    <ul>{missingRules.map((rule) => <li key={rule}>{t(rule)}</li>)}</ul>
                </div>
            )}
        </div>
    );
}

export default PasswordFields;
