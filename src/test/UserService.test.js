import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UserService from '../services/UserService.js';

const loginAs = (role) => {
    sessionStorage.setItem('authenticatedUser', 'someone');
    sessionStorage.setItem('userProfile', JSON.stringify({ username: 'someone', role }));
};

afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
});

describe('UserService.updateUserState', () => {
    it('lets an ADMIN update the state with the new { state } body', async () => {
        loginAs('ADMIN');
        const put = vi.spyOn(axios, 'put').mockResolvedValue({ data: { state: 'ACTIVO' } });

        await UserService.updateUserState('nuevo', 'activo');

        expect(put.mock.calls[0][0]).toMatch(/\/admin\/users\/nuevo\/state$/);
        expect(put.mock.calls[0][1]).toEqual({ state: 'ACTIVO' });
    });

    it('rejects non-admin users without calling the backend', async () => {
        loginAs('cliente');
        const put = vi.spyOn(axios, 'put');

        await expect(UserService.updateUserState('nuevo', 'ACTIVO')).rejects.toThrow(/administrador/);
        expect(put).not.toHaveBeenCalled();
    });

    it('rejects states outside ACTIVO, INACTIVO and PENDIENTE', async () => {
        loginAs('admin');
        const put = vi.spyOn(axios, 'put');

        await expect(UserService.updateUserState('nuevo', 'BLOQUEADO')).rejects.toThrow(/inválido/);
        expect(put).not.toHaveBeenCalled();
    });
});
