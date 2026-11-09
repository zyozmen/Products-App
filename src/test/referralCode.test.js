import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UserService from '../services/UserService.js';
import { buildReferralLink, REFERRAL_REGISTER_BASE_URL } from '../utils/referralLink';

afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
});

describe('buildReferralLink', () => {
    it('builds the magic register link with the referral code', () => {
        expect(REFERRAL_REGISTER_BASE_URL).toBe('https://growshopp.netlify.app/register?ref=');
        expect(buildReferralLink('AB12CD34')).toBe('https://growshopp.netlify.app/register?ref=AB12CD34');
    });

    it('encodes the code so it cannot alter the query string', () => {
        expect(buildReferralLink(' A&B=C ')).toBe('https://growshopp.netlify.app/register?ref=A%26B%3DC');
    });
});

describe('UserService.getProfile', () => {
    it('reads the authenticated profile including codigoReferido', async () => {
        const profile = { username: 'someone', codigoReferido: 'AB12CD34' };
        const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: profile });

        await expect(UserService.getProfile()).resolves.toEqual(profile);
        expect(get.mock.calls[0][0]).toMatch(/\/users\/profile$/);
    });

    it('surfaces the server message when the request fails', async () => {
        vi.spyOn(axios, 'get').mockRejectedValue({ response: { status: 404, data: { message: 'Perfil no encontrado' } } });

        await expect(UserService.getProfile()).rejects.toThrow('Perfil no encontrado');
    });
});
