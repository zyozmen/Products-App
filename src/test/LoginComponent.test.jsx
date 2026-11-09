import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import LoginComponent from '../components/login/LoginComponent.jsx';
import userService from '../services/UserService.js';

vi.mock('../services/UserService.js', () => ({
  default: { registerUser: vi.fn() },
}));

const renderLogin = (props = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <LoginComponent navigate={vi.fn()} location={{ state: null }} {...props} />
      </QueryClientProvider>
    </MemoryRouter>,
  );
};

describe('LoginComponent', () => {
  it('validates the login form without calling the authentication service', async () => {
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('Ingrese un correo electrónico válido')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
  });

  it('switches to a fully validated registration form and back to login', () => {
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }));
    expect(screen.getByRole('heading', { name: 'Crear cuenta' })).toBeInTheDocument();
    expect(screen.getByLabelText('Declaro que soy mayor de 18 años y doy mi consentimiento. *')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Tipo de identificación' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('returns to the requested page after successful login', async () => {
    const navigate = vi.fn();
    const login = vi.fn().mockResolvedValue({ user: { username: 'customer' } });
    renderLogin({
      auth: { login, isLoading: false },
      location: { state: { from: '/profile?tab=orders' } },
      navigate,
    });

    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'customer@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/profile?tab=orders', { replace: true }));
  });

  it('prefills the referral code from the ?ref= query and normalizes manual edits', () => {
    renderLogin({ startInRegister: true, location: { state: null, search: '?ref=ab%20cd12' } });

    const referralInput = screen.getByLabelText('Código de referido *');
    expect(referralInput).toHaveValue('ABCD12');

    fireEvent.change(referralInput, { target: { value: ' xy 98 ' } });
    expect(referralInput).toHaveValue('XY98');
  });

  it('shows the required error for a blank referral code on submit', async () => {
    renderLogin({ startInRegister: true });

    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(await screen.findByText('El código de referido es obligatorio.')).toBeInTheDocument();
  });

  it('sends the referral code and shows a specific alert when it does not exist', async () => {
    const invalidReferral = Object.assign(new Error('El codigo de referido no es valido'), { referralCodeInvalid: true });
    userService.registerUser.mockRejectedValueOnce(invalidReferral);
    renderLogin({ startInRegister: true, location: { state: null, search: '?ref=nope1234' } });

    fireEvent.change(screen.getByLabelText('Nombre de usuario *'), { target: { value: 'nuevo_usuario' } });
    fireEvent.change(screen.getByLabelText('Correo electrónico *'), { target: { value: 'nuevo@example.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña *'), { target: { value: 'Password1!' } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña *'), { target: { value: 'Password1!' } });
    fireEvent.change(screen.getByLabelText('Nombre *'), { target: { value: 'Nuevo' } });
    fireEvent.change(screen.getByLabelText('Apellido *'), { target: { value: 'Usuario' } });
    fireEvent.change(screen.getByLabelText('Dirección *'), { target: { value: 'Calle 1' } });
    fireEvent.change(screen.getByLabelText('Teléfono de contacto *'), { target: { value: '3001234567' } });
    fireEvent.change(screen.getByLabelText('Número de identificación *'), { target: { value: '123456789' } });
    fireEvent.click(screen.getByLabelText('Declaro que soy mayor de 18 años y doy mi consentimiento. *'));
    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(await screen.findByText('El código de referido no es válido. Verifica el código con quien te invitó.')).toBeInTheDocument();
    expect(userService.registerUser).toHaveBeenCalledWith(expect.objectContaining({ codigoReferido: 'NOPE1234' }));
  });
});
