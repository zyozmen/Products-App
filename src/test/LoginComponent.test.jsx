import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import LoginComponent from '../components/login/LoginComponent.jsx';

const renderLogin = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <LoginComponent navigate={vi.fn()} location={{ state: null }} />
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
});
