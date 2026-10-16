import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticationService from '../services/AuthenticationService.js';
import authService from '../services/authService.js';
import { authHandlers, resetSessionGuard } from '../services/httpClient.js';
import { getInactivityMinutes } from '../services/apiConfig.js';
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
const MAX_REFRESH_AGE_MS = 10 * MINUTE_MS;
const REFRESH_BEFORE_EXP_MS = 5 * MINUTE_MS;
const MIN_REFRESH_DELAY_MS = 30 * 1000;
const REFRESH_RETRY_MS = 30 * 1000;
const MAX_WARNING_MS = MINUTE_MS;

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

export function AuthProvider({ children, inactivityMinutes = getInactivityMinutes() }) {
    const navigate = useNavigate();
    const [session, setSession] = useState(readSession);
    const sessionRef = useRef(session);
    const endingRef = useRef(false);

    const inactivityMs = inactivityMinutes * MINUTE_MS;
    const warningMs = Math.min(MAX_WARNING_MS, inactivityMs / 2);

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

    const { isWarning, reset, getLastActivity } = useInactivityTimer({
        timeoutMs: inactivityMs,
        warningMs,
        enabled: session.authenticated,
        onTimeout: () => logout('INACTIVITY'),
    });

    const continueSession = useCallback(async () => {
        reset();
        try {
            await refreshSession();
        } catch {
            // un 401 SESSION_EXPIRED lo gestiona el interceptor de respuesta
        }
    }, [reset, refreshSession]);

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

    // Renovación: el backend rechaza el refresh si el token se emitió hace más del límite de inactividad,
    // por eso se renueva cuando el token tiene ~10 min (o antes si faltan 5 min para `exp`) y hubo actividad reciente.
    useEffect(() => {
        if (!session.token) return undefined;

        const { iat, exp } = getTokenTimes(session.token);
        const issuedAt = iat ?? Date.now();
        let dueAt = issuedAt + Math.min(MAX_REFRESH_AGE_MS, (inactivityMs * 2) / 3);
        if (exp) dueAt = Math.min(dueAt, exp - REFRESH_BEFORE_EXP_MS);

        let timer;
        const run = async () => {
            // Sin actividad reciente no se renueva: el temporizador de inactividad cerrará la sesión.
            if (Date.now() - getLastActivity() >= inactivityMs) return;
            try {
                await refreshSession();
            } catch (error) {
                if (isTransientError(error) && sessionRef.current.authenticated) {
                    timer = setTimeout(run, REFRESH_RETRY_MS);
                }
            }
        };

        timer = setTimeout(run, Math.max(dueAt - Date.now(), MIN_REFRESH_DELAY_MS));
        return () => clearTimeout(timer);
    }, [session.token, inactivityMs, refreshSession, getLastActivity]);

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
                    remainingMs={warningMs}
                    onContinue={continueSession}
                    onLogout={() => logout('USER')}
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
