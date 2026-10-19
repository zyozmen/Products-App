import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import AgeVerificationRouteGate from '../components/auth/AgeVerificationRouteGate.jsx';
import { AuthContext } from '../context/AuthContext.jsx';

function LoginLocation() {
    const location = useLocation();
    return <div data-testid="login-location">{location.state?.from}</div>;
}

function renderGate({ isAuthenticated, initialPath }) {
    return render(
        <AuthContext.Provider value={{ isAuthenticated }}>
            <MemoryRouter initialEntries={[initialPath]}>
                <AgeVerificationRouteGate>
                    <Routes>
                        <Route path="/login" element={<LoginLocation />} />
                        <Route path="*" element={<div>Requested page</div>} />
                    </Routes>
                </AgeVerificationRouteGate>
            </MemoryRouter>
        </AuthContext.Provider>,
    );
}

describe('AgeVerificationRouteGate', () => {
    it('shows age verification on any route except login when unauthenticated', () => {
        renderGate({ isAuthenticated: false, initialPath: '/profile?tab=orders#history' });

        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
        expect(screen.queryByText('Requested page')).not.toBeInTheDocument();
    });

    it('returns to the requested route after login', () => {
        renderGate({ isAuthenticated: false, initialPath: '/profile?tab=orders#history' });

        fireEvent.click(screen.getByRole('button', { name: 'Sí, soy mayor de 18 años' }));

        expect(screen.getByTestId('login-location')).toHaveTextContent('/profile?tab=orders#history');
    });

    it('allows the login route without an authenticated session', () => {
        renderGate({ isAuthenticated: false, initialPath: '/login' });

        expect(screen.getByTestId('login-location')).toBeInTheDocument();
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('allows requested routes when authenticated', () => {
        renderGate({ isAuthenticated: true, initialPath: '/profile' });

        expect(screen.getByText('Requested page')).toBeInTheDocument();
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
});
