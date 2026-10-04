import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AuthenticationService from './AuthenticationService.js';

afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
});

describe('AuthenticationService', () => {
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
