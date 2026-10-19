import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AuthenticationService from '../services/AuthenticationService.js';

afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
});

describe('AuthenticationService', () => {
    it('does not create a session for a user in PENDIENTE state', async () => {
        vi.spyOn(axios, 'post').mockResolvedValue({
            data: { token: 't', user: { username: 'nuevo', state: 'PENDIENTE', role: 'cliente' } },
        });

        await expect(AuthenticationService.login('nuevo@example.com', 'secret')).rejects.toMatchObject({
            response: { status: 403, data: { error: 'user_pending_approval' } },
        });
        expect(sessionStorage.getItem('token')).toBeNull();
        expect(AuthenticationService.isUserLoggedIn()).toBe(false);
    });

    it('does not create a session for a user in INACTIVO state', async () => {
        vi.spyOn(axios, 'post').mockResolvedValue({
            data: { token: 't', user: { username: 'baja', state: 'INACTIVO' } },
        });

        await expect(AuthenticationService.login('baja@example.com', 'secret')).rejects.toMatchObject({
            response: { data: { error: 'user_inactive' } },
        });
        expect(sessionStorage.getItem('token')).toBeNull();
    });

    it('creates a session for a user in ACTIVO state', async () => {
        vi.spyOn(axios, 'post').mockResolvedValue({
            data: { token: 't', user: { username: 'maria', state: 'ACTIVO', role: 'cliente' } },
        });

        await AuthenticationService.login('maria@example.com', 'secret');
        expect(AuthenticationService.isUserLoggedIn()).toBe(true);
    });

    it('clears authentication and age-verification data on logout', () => {
        sessionStorage.setItem('authenticatedUser', 'maria');
        sessionStorage.setItem('token', 'token');
        sessionStorage.setItem('userProfile', JSON.stringify({ username: 'maria' }));
        sessionStorage.setItem('age_verified', 'true');

        AuthenticationService.clearSession();

        expect(sessionStorage.getItem('authenticatedUser')).toBeNull();
        expect(sessionStorage.getItem('token')).toBeNull();
        expect(sessionStorage.getItem('userProfile')).toBeNull();
        expect(sessionStorage.getItem('age_verified')).toBeNull();
    });

    it('sends the email (not username) to the login endpoint', async () => {
        const post = vi.spyOn(axios, 'post').mockResolvedValue({
            data: { token: 't', user: { username: 'maria', email: 'maria@example.com', role: 'cliente' } },
        });

        await AuthenticationService.login('maria@example.com', 'secret');

        expect(post.mock.calls[0][0]).toMatch(/\/auth\/login$/);
        expect(post.mock.calls[0][1]).toEqual({ email: 'maria@example.com', password: 'secret' });
        expect(sessionStorage.getItem('authenticatedUser')).toBe('maria');
    });

    it('stores the role returned with the login response', async () => {
        vi.spyOn(axios, 'post').mockResolvedValue({
            data: {
                username: 'admin-user',
                token: 'token',
                role: 'admin',
            },
        });

        await AuthenticationService.login('admin-user', 'password');

        expect(AuthenticationService.getUserRole()).toBe('admin');
        expect(AuthenticationService.isUserAdmin()).toBe(true);
    });

    it('uses the role from the login response when the user profile is nested', async () => {
        vi.spyOn(axios, 'post').mockResolvedValue({
            data: {
                role: 'admin',
                user: { username: 'admin-user' },
            },
        });

        await AuthenticationService.login('admin-user', 'password');

        expect(AuthenticationService.getLoggedInUser()).toEqual({
            username: 'admin-user',
            role: 'admin',
        });
    });

    it('does not assign a role when the login response omits it', async () => {
        vi.spyOn(axios, 'post').mockResolvedValue({
            data: { username: 'user' },
        });

        await AuthenticationService.login('user', 'password');

        expect(AuthenticationService.getUserRole()).toBeUndefined();
        expect(AuthenticationService.isUserAdmin()).toBe(false);
    });
});
