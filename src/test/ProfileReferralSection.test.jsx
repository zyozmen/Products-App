import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileComponent from '../components/profile/ProfileComponent.jsx';
import userService from '../services/UserService.js';

vi.mock('../components/dashboard/HeaderComponent.jsx', () => ({ default: () => null }));
vi.mock('../components/dashboard/FooterComponent.jsx', () => ({ default: () => null }));
vi.mock('../components/navigation/NavigationComponent.jsx', () => ({ default: () => () => null }));

const renderProfile = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={client}>
            <ProfileComponent navigate={vi.fn()} />
        </QueryClientProvider>,
    );
};

beforeEach(() => {
    sessionStorage.setItem('authenticatedUser', 'someone');
    sessionStorage.setItem('userProfile', JSON.stringify({ username: 'someone', role: 'cliente' }));
});

afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
});

describe('ProfileComponent referral section', () => {
    it('shows the code and the magic link returned by the backend', async () => {
        vi.spyOn(userService, 'getProfile').mockResolvedValue({ username: 'someone', codigoReferido: 'AB12CD34' });

        renderProfile();

        expect(await screen.findByDisplayValue('AB12CD34')).toBeTruthy();
        expect(screen.getByDisplayValue('https://growshopp.netlify.app/register?ref=AB12CD34')).toBeTruthy();
    });

    it('copies the code to the clipboard and shows visual feedback', async () => {
        vi.spyOn(userService, 'getProfile').mockResolvedValue({ username: 'someone', codigoReferido: 'AB12CD34' });
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

        renderProfile();
        fireEvent.click(await screen.findByText('Copiar código'));

        await waitFor(() => expect(writeText).toHaveBeenCalledWith('AB12CD34'));
        expect(await screen.findByText('¡Copiado al portapapeles!')).toBeTruthy();
    });

    it('shows an error and does not invent a code when the profile request fails', async () => {
        vi.spyOn(userService, 'getProfile').mockRejectedValue(new Error('Not found'));

        renderProfile();

        expect(await screen.findByText('No se pudo cargar tu código de referido. Intenta de nuevo más tarde.')).toBeTruthy();
        expect(screen.queryByText('Copiar código')).toBeNull();
    });
});
