import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticationService from '../services/AuthenticationService.js';
import authService from '../services/authService.js';
import { authHandlers, resetSessionGuard } from '../services/httpClient.js';
import { getInactivityMinutes, getSessionRefreshMinutes } from '../services/apiConfig.js';
import { getTokenTimes } from '../services/tokenUtils.js';
import useInactivityTimer from '../hooks/useInactivityTimer.js';
import SessionWarningModal from '../components/auth/SessionWarningModal.jsx';

export const AuthContext = createContext(null);

// Claves de traducción que se pasan a /login mediante location.state.notice
export const LOGOUT_NOTICES = {
    INACTIVITY: 'session_closed_inactivity',
    SESSION_EXPIRED: 'session_expired',
    USER_INACTIVE: 'user_inactive',
};

const MINUTE_MS = 60 * 1000;
// Al cumplirse la inactividad se muestra el aviso; si no se cancela en este lapso, se cierra la sesión.
const WARNING_MS = MINUTE_MS;
const REFRESH_BEFORE_EXP_MS = MINUTE_MS;
const REFRESH_RETRY_MS = 30 * 1000;

const EMPTY_SESSION = { authenticated: false, user: null, token: null };

const readSession = () => {
    if (!AuthenticationService.isUserLoggedIn()) return EMPTY_SESSION;
    return {
        authenticated: true,
        user: AuthenticationService.getLoggedInUser(),
        token: AuthenticationService.getToken(),
    };
};

const isTransientError = (error) => !error?.response || error.response.status >= 500;

export function AuthProvider({
    children,
    inactivityMinutes = getInactivityMinutes(),
    sessionRefreshMinutes = getSessionRefreshMinutes(),
}) {
    const navigate = useNavigate();
    const [session, setSession] = useState(readSession);
    const sessionRef = useRef(session);
    const endingRef = useRef(false);

    const inactivityMs = inactivityMinutes * MINUTE_MS;
    const sessionRefreshMs = sessionRefreshMinutes * MINUTE_MS;

    const applySession = useCallback((next) => {
        sessionRef.current = next;
        setSession(next);
    }, []);

    const login = useCallback(async (email, password) => {
        const data = await AuthenticationService.login(email, password);
        endingRef.current = false;
        resetSessionGuard();
        applySession(readSession());
        return data;
    }, [applySession]);

    // reason: 'USER' | 'INACTIVITY' | 'SESSION_EXPIRED' | 'USER_INACTIVE'
    const logout = useCallback(async (reason = 'USER') => {
        if (endingRef.current) return;
        endingRef.current = true;

        const token = AuthenticationService.getToken();
        AuthenticationService.clearSession();
        applySession(EMPTY_SESSION);

        const notice = LOGOUT_NOTICES[reason];
        navigate('/login', { replace: true, state: notice ? { notice } : undefined });

        // Si el servidor ya invalidó el token no hay nada que revocar.
        if (token && (reason === 'USER' || reason === 'INACTIVITY')) {
            await authService.logout(reason, token);
        }
    }, [applySession, navigate]);

    const refreshSession = useCallback(async () => {
        const data = await authService.refresh();
        // Si la sesión terminó mientras la petición estaba en vuelo, no se debe restaurar el token.
        if (!sessionRef.current.authenticated || endingRef.current || !data?.token) return null;

        AuthenticationService.updateSession(data);
        applySession(readSession());
        return data;
    }, [applySession]);

    // Contador de inactividad: el aviso aparece al cumplirse `inactivityMs` sin actividad y la sesión
    // se cierra si en WARNING_MS no se pulsa "Cancelar". Con el aviso visible el movimiento no cuenta.
    const { isWarning, reset } = useInactivityTimer({
        timeoutMs: inactivityMs + WARNING_MS,
        warningMs: WARNING_MS,
        enabled: session.authenticated,
        onTimeout: () => logout('INACTIVITY'),
    });

    // "Cancelar" en el aviso: reinicia el contador de inactividad sin renovar el token.
    const continueSession = useCallback(() => {
        reset();
    }, [reset]);

    useEffect(() => {
        authHandlers.onSessionExpired = () => {
            if (sessionRef.current.authenticated) logout('SESSION_EXPIRED');
        };
        authHandlers.onUserInactive = () => {
            if (sessionRef.current.authenticated) logout('USER_INACTIVE');
        };
        return () => {
            delete authHandlers.onSessionExpired;
            delete authHandlers.onUserInactive;
        };
    }, [logout]);

    // Contador de sesión: el token dura 60 min y se renueva una vez, a los `sessionRefreshMs` de su emisión
    // (55 min por defecto). Mientras la sesión siga abierta el usuario no ha superado el límite de inactividad.
    useEffect(() => {
        if (!session.token) return undefined;

        const { iat, exp } = getTokenTimes(session.token);
        let dueAt = (iat ?? Date.now()) + sessionRefreshMs;
        if (exp) dueAt = Math.min(dueAt, exp - REFRESH_BEFORE_EXP_MS);

        let timer;
        const run = async () => {
            try {
                await refreshSession();
            } catch (error) {
                if (isTransientError(error) && sessionRef.current.authenticated) {
                    timer = setTimeout(run, REFRESH_RETRY_MS);
                }
            }
        };

        timer = setTimeout(run, Math.max(dueAt - Date.now(), 0));
        return () => clearTimeout(timer);
    }, [session.token, sessionRefreshMs, refreshSession]);

    const value = useMemo(() => ({
        user: session.user,
        token: session.token,
        isAuthenticated: session.authenticated,
        login,
        logout,
        refreshSession,
    }), [session, login, logout, refreshSession]);

    return (
        <AuthContext.Provider value={value}>
            {children}
            {session.authenticated && isWarning && (
                <SessionWarningModal
                    remainingMs={WARNING_MS}
                    onCancel={continueSession}
                    onAccept={() => logout('INACTIVITY')}
                />
            )}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de <AuthProvider>');
    }
    return context;
};
