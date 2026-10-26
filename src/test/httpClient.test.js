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

    describe('while the token is being renewed', () => {
        const setupWithRefresh = (onSessionExpired) => {
            let currentToken = 'old';
            let finishRefresh;
            let pending = new Promise((resolve) => { finishRefresh = () => { currentToken = 'new'; pending = null; resolve(); }; });
            const client = axios.create({ adapter });
            installAuthInterceptors(client, {
                getToken: () => currentToken,
                handlers: { onSessionExpired },
                waitForRefresh: () => pending,
            });
            return { client, finish: () => finishRefresh() };
        };

        it('holds other requests until the renewal ends and sends them with the new token', async () => {
            const { client, finish } = setupWithRefresh(vi.fn());
            const request = client.get('/api/admin/orders');
            await Promise.resolve();
            expect(requests).toHaveLength(0);

            finish();
            await request;
            expect(requests[0].headers.get('Authorization')).toBe('Bearer new');
        });

        it('does not send the renewal itself or the logout through the wait', async () => {
            const { client } = setupWithRefresh(vi.fn());
            await client.post('/api/auth/refresh');
            await client.post('/api/auth/logout');
            expect(requests.map((config) => config.headers.get('Authorization'))).toEqual(['Bearer old', 'Bearer old']);
        });

        it('does not close the session when the 401 arrives before the renewal response', async () => {
            const onSessionExpired = vi.fn();
            let currentToken = 'old';
            let pending = null;
            let finish;
            const client = axios.create({ adapter });
            installAuthInterceptors(client, {
                getToken: () => currentToken,
                handlers: { onSessionExpired },
                waitForRefresh: () => pending,
            });
            // La petición salió con el token anterior; mientras tanto empezó la renovación, que lo revocó.
            respondWith = () => {
                pending = new Promise((resolve) => { finish = () => { currentToken = 'new'; pending = null; resolve(); }; });
                return { status: 401, data: { code: 'SESSION_EXPIRED' } };
            };

            const sent = client.get('/api/admin/orders').catch(() => {});
            await vi.waitFor(() => expect(finish).toBeDefined());
            finish();
            await sent;
            expect(onSessionExpired).not.toHaveBeenCalled();
        });

        it('still closes the session on a real expiration with no renewal in progress', async () => {
            const onSessionExpired = vi.fn();
            const client = axios.create({ adapter });
            installAuthInterceptors(client, { getToken: () => 'old', handlers: { onSessionExpired }, waitForRefresh: () => null });
            respondWith = () => ({ status: 401, data: { code: 'SESSION_EXPIRED' } });

            await client.get('/api/admin/orders').catch(() => {});
            expect(onSessionExpired).toHaveBeenCalledTimes(1);
        });
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
