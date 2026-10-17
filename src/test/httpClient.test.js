import axios, { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCESS_DENIED_MESSAGE, installAuthInterceptors } from '../services/httpClient.js';

let respondWith;
let requests;

const adapter = (config) => {
    requests.push(config);
    const { status, data } = respondWith(config);
    const response = { status, data, headers: {}, config, statusText: '' };
    if (status >= 200 && status < 300) return Promise.resolve(response);
    return Promise.reject(new AxiosError('failed', String(status), config, null, response));
};

const setup = ({ token = 'abc', handlers = {} } = {}) => {
    let currentToken = token;
    const client = axios.create({ adapter });
    const controls = installAuthInterceptors(client, { getToken: () => currentToken, handlers });
    return { client, controls, setToken: (value) => { currentToken = value; } };
};

beforeEach(() => {
    requests = [];
    respondWith = () => ({ status: 200, data: {} });
});

describe('auth interceptors', () => {
    it('adds the Bearer token except for login and register', async () => {
        const { client } = setup();

        await client.get('/api/productos');
        await client.post('/api/auth/login', {});
        await client.post('/api/auth/register', {});

        expect(requests[0].headers.get('Authorization')).toBe('Bearer abc');
        expect(requests[1].headers.get('Authorization')).toBeFalsy();
        expect(requests[2].headers.get('Authorization')).toBeFalsy();
    });

    it('handles SESSION_EXPIRED only once even if several requests fail at the same time', async () => {
        respondWith = () => ({ status: 401, data: { code: 'SESSION_EXPIRED', message: 'expired' } });
        const onSessionExpired = vi.fn();
        const { client } = setup({ handlers: { onSessionExpired } });

        const results = await Promise.allSettled([
            client.get('/api/orders'),
            client.get('/api/products'),
            client.get('/api/profile'),
        ]);

        expect(results.every((result) => result.status === 'rejected')).toBe(true);
        expect(onSessionExpired).toHaveBeenCalledTimes(1);
        expect(requests).toHaveLength(3); // sin reintentos
    });

    it('can handle a new expiration after resetGuard()', async () => {
        respondWith = () => ({ status: 401, data: { code: 'SESSION_EXPIRED' } });
        const onSessionExpired = vi.fn();
        const { client, controls } = setup({ handlers: { onSessionExpired } });

        await client.get('/api/orders').catch(() => {});
        controls.resetGuard();
        await client.get('/api/orders').catch(() => {});

        expect(onSessionExpired).toHaveBeenCalledTimes(2);
    });

    it('treats a 401 from login as invalid credentials, not as an expired session', async () => {
        respondWith = () => ({ status: 401, data: { code: 'SESSION_EXPIRED' } });
        const onSessionExpired = vi.fn();
        const { client } = setup({ handlers: { onSessionExpired } });

        await expect(client.post('/api/auth/login', {})).rejects.toBeTruthy();
        expect(onSessionExpired).not.toHaveBeenCalled();
    });

    it('does not treat the expected 401 of an INACTIVITY logout as an expired session', async () => {
        respondWith = () => ({ status: 401, data: { code: 'SESSION_EXPIRED', message: 'Inactivity limit reached' } });
        const onSessionExpired = vi.fn();
        const { client } = setup({ handlers: { onSessionExpired } });

        await expect(client.post('/api/auth/logout', { reason: 'INACTIVITY' })).rejects.toBeTruthy();
        expect(onSessionExpired).not.toHaveBeenCalled();
    });

    it('ignores a 401 without code (no token)', async () => {
        respondWith = () => ({ status: 401, data: { message: 'Autenticación requerida' } });
        const onSessionExpired = vi.fn();
        const { client } = setup({ handlers: { onSessionExpired } });

        await expect(client.get('/api/orders')).rejects.toBeTruthy();
        expect(onSessionExpired).not.toHaveBeenCalled();
    });

    it('ignores failures of requests sent with a token that was already replaced', async () => {
        const onSessionExpired = vi.fn();
        const { client, setToken } = setup({ token: 'old', handlers: { onSessionExpired } });
        respondWith = () => {
            setToken('new'); // el refresh reemplazó el token mientras la petición estaba en vuelo
            return { status: 401, data: { code: 'SESSION_EXPIRED' } };
        };

        await client.get('/api/orders').catch(() => {});
        expect(onSessionExpired).not.toHaveBeenCalled();
    });

    it('distinguishes a deactivated user (403 user_inactive) from insufficient role (403)', async () => {
        const onUserInactive = vi.fn();
        const onForbidden = vi.fn();
        const { client } = setup({ handlers: { onUserInactive, onForbidden } });

        respondWith = () => ({ status: 403, data: { code: 'user_inactive' } });
        await client.get('/api/orders').catch(() => {});
        expect(onUserInactive).toHaveBeenCalledTimes(1);
        expect(onForbidden).not.toHaveBeenCalled();

        const second = setup({ handlers: { onUserInactive, onForbidden } });
        respondWith = () => ({ status: 403, data: { message: 'Forbidden' } });
        const error = await second.client.get('/api/admin/users').catch((e) => e);
        expect(onForbidden).toHaveBeenCalledTimes(1);
        expect(error.userMessage).toBe(ACCESS_DENIED_MESSAGE);
    });

    it('does not log out on 403 user_pending_approval', async () => {
        const onUserInactive = vi.fn();
        const onSessionExpired = vi.fn();
        const { client } = setup({ handlers: { onUserInactive, onSessionExpired } });

        respondWith = () => ({ status: 403, data: { error: 'user_pending_approval' } });
        await client.get('/api/orders').catch(() => {});
        expect(onUserInactive).not.toHaveBeenCalled();
        expect(onSessionExpired).not.toHaveBeenCalled();
    });
});
