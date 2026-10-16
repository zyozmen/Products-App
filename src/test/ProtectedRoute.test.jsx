import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx';
import { AuthContext } from '../context/AuthContext.jsx';

const renderRoute = ({ auth, allowedRoles, path = '/admin' }) =>
    render(
        <AuthContext.Provider value={auth}>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/login" element={<div>login page</div>} />
                    <Route
                        path="/admin"
                        element={<ProtectedRoute allowedRoles={allowedRoles}><div>secret content</div></ProtectedRoute>}
                    />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>,
    );

describe('ProtectedRoute', () => {
    it('redirects to /login when there is no session', () => {
        renderRoute({ auth: { isAuthenticated: false, user: null }, allowedRoles: ['admin'] });

        expect(screen.getByText('login page')).toBeInTheDocument();
        expect(screen.queryByText('secret content')).not.toBeInTheDocument();
    });

    it('shows access denied when the role is not allowed', () => {
        renderRoute({ auth: { isAuthenticated: true, user: { role: 'cliente' } }, allowedRoles: ['admin'] });

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.queryByText('secret content')).not.toBeInTheDocument();
    });

    it('renders the content when the role is allowed (case-insensitive)', () => {
        renderRoute({ auth: { isAuthenticated: true, user: { role: 'ADMIN' } }, allowedRoles: ['admin'] });

        expect(screen.getByText('secret content')).toBeInTheDocument();
    });

    it('renders the content for any authenticated user when no roles are required', () => {
        renderRoute({ auth: { isAuthenticated: true, user: { role: 'cliente' } } });

        expect(screen.getByText('secret content')).toBeInTheDocument();
    });
});
