import React from 'react';
import axios from 'axios';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext.jsx';
import { authHandlers } from '../services/httpClient.js';

const MINUTE = 60 * 1000;
const NOW = new Date('2026-01-01T12:00:00Z');

const makeToken = ({ iat = Date.now(), ttlMs = 60 * MINUTE } = {}) => {
    const encode = (value) => btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${encode({ alg: 'HS256' })}.${encode({ iat: Math.floor(iat / 1000), exp: Math.floor((iat + ttlMs) / 1000) })}.sig`;
};

const seedSession = (token) => {
    sessionStorage.setItem('authenticatedUser', 'maria');
    sessionStorage.setItem('userProfile', JSON.stringify({ username: 'maria', role: 'cliente' }));
    if (token) sessionStorage.setItem('token', token);
};

let authApi;

const Probe = () => {
    authApi = useAuth();
    return <div data-testid="state">{authApi.isAuthenticated ? 'in' : 'out'}</div>;
};

const LoginStub = () => {
    const { state } = useLocation();
    return <div data-testid="login">{`login:${state?.notice ?? ''}`}</div>;
};

const renderProvider = () =>
    render(
        <MemoryRouter initialEntries={['/home']}>
            <AuthProvider inactivityMinutes={15} sessionRefreshMinutes={55}>
                <Routes>
                    <Route path="/login" element={<LoginStub />} />
                    <Route path="*" element={<Probe />} />
                </Routes>
            </AuthProvider>
        </MemoryRouter>,
    );

beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    sessionStorage.clear();
});

describe('AuthProvider session restore', () => {
    it('restores a session whose token is still valid', () => {
        seedSession(makeToken());
        renderProvider();

        expect(screen.getByTestId('state')).toHaveTextContent('in');
        expect(authApi.user.username).toBe('maria');
    });

    it('clears the session on reload when the stored token is already expired', () => {
        seedSession(makeToken({ iat: Date.now() - 2 * 60 * MINUTE }));
        renderProvider();

        expect(screen.getByTestId('state')).toHaveTextContent('out');
        expect(sessionStorage.getItem('token')).toBeNull();
        expect(sessionStorage.getItem('authenticatedUser')).toBeNull();
        expect(sessionStorage.getItem('userProfile')).toBeNull();
    });
});

describe('AuthProvider session lifecycle', () => {
    // Simula un usuario activo: un movimiento por minuto.
    const workFor = async (minutes) => {
        for (let minute = 0; minute < minutes; minute += 1) {
            await act(async () => {
                window.dispatchEvent(new Event('mousemove'));
                vi.advanceTimersByTime(MINUTE);
            });
        }
    };

    it('renews the token only once, 55 minutes after it was issued, while the user is active', async () => {
        const first = makeToken();
        seedSession(first);
        const post = vi.spyOn(axios, 'post').mockImplementation(async () => ({
            data: { token: makeToken(), user: { username: 'maria', role: 'cliente' } },
        }));
        renderProvider();

        await workFor(54);
        expect(post).not.toHaveBeenCalled();
        expect(screen.getByTestId('state')).toHaveTextContent('in');

        await workFor(1);
        expect(post).toHaveBeenCalledTimes(1);
        expect(post.mock.calls[0][0]).toContain('/api/auth/refresh');
        expect(sessionStorage.getItem('token')).not.toBe(first);

        await workFor(10);
        expect(post).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('state')).toHaveTextContent('in');
    });

    it('shows the warning after 15 idle minutes and closes the session if nobody answers', async () => {
        seedSession(makeToken());
        const post = vi.spyOn(axios, 'post').mockImplementation(async (url) => {
            if (url.includes('/logout')) {
                throw Object.assign(new Error('401'), {
                    response: { status: 401, data: { code: 'SESSION_EXPIRED', message: 'Inactivity limit reached' } },
                });
            }
            return { data: {} };
        });
        renderProvider();

        await act(async () => { vi.advanceTimersByTime(15 * MINUTE - 1000); });
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

        await act(async () => { vi.advanceTimersByTime(1000); });
        expect(screen.getByRole('alertdialog')).toHaveTextContent('60s');
        expect(screen.getByTestId('state')).toHaveTextContent('in');

        await act(async () => { vi.advanceTimersByTime(MINUTE); });

        const logoutCall = post.mock.calls.find(([url]) => url.includes('/api/auth/logout'));
        expect(logoutCall[1]).toEqual({ reason: 'INACTIVITY' });
        expect(post.mock.calls.some(([url]) => url.includes('/refresh'))).toBe(false);
        expect(sessionStorage.getItem('token')).toBeNull();
        expect(screen.getByTestId('login')).toHaveTextContent('login:session_closed_inactivity');
    });

    it('closes the session as inactivity when the user accepts the warning', async () => {
        seedSession(makeToken());
        const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });
        renderProvider();

        await act(async () => { vi.advanceTimersByTime(15 * MINUTE); });
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Aceptar' })); });

        expect(post.mock.calls.find(([url]) => url.includes('/api/auth/logout'))[1]).toEqual({ reason: 'INACTIVITY' });
        expect(screen.getByTestId('login')).toHaveTextContent('login:session_closed_inactivity');
    });

    it('restarts the inactivity counter on cancel without renewing the token, and ignores movement while warning', async () => {
        const token = makeToken();
        seedSession(token);
        const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });
        renderProvider();

        await act(async () => { vi.advanceTimersByTime(15 * MINUTE); });
        await act(async () => {
            window.dispatchEvent(new Event('mousemove'));
            vi.advanceTimersByTime(30 * 1000);
        });
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();

        await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Cancelar' })); });
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        expect(post).not.toHaveBeenCalled();
        expect(sessionStorage.getItem('token')).toBe(token);

        await act(async () => { vi.advanceTimersByTime(15 * MINUTE - 1000); });
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        expect(screen.getByTestId('state')).toHaveTextContent('in');
    });

    it('manual logout sends no reason and clears the session even if the request fails', async () => {
        seedSession(makeToken());
        const post = vi.spyOn(axios, 'post').mockRejectedValue(new Error('Network Error'));
        renderProvider();

        await act(async () => { await authApi.logout(); });

        expect(post.mock.calls[0][0]).toContain('/api/auth/logout');
        expect(post.mock.calls[0][1]).toBeUndefined();
        expect(sessionStorage.getItem('token')).toBeNull();
        expect(screen.getByTestId('login')).toHaveTextContent('login:');
    });

    it('closes the session with a notice when the interceptor reports SESSION_EXPIRED', async () => {
        seedSession(makeToken());
        const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });
        renderProvider();

        await act(async () => {
            authHandlers.onSessionExpired();
            authHandlers.onSessionExpired(); // peticiones simultáneas: una sola redirección
        });

        expect(screen.getByTestId('login')).toHaveTextContent('login:session_expired');
        expect(sessionStorage.getItem('token')).toBeNull();
        expect(post).not.toHaveBeenCalled(); // el token ya está invalidado: no se intenta revocar
    });
});
