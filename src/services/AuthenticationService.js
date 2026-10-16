import authService from './authService.js';
import { isTokenExpired } from './tokenUtils.js';

const buildProfile = (data) => {
    const profile = data.user || data;
    return profile.role === undefined && data.role !== undefined
        ? { ...profile, role: data.role }
        : profile;
};

class AuthenticationService {
    async login(email, password) {
        try {
            const data = await authService.login(email, password);
            if (data) {
                sessionStorage.setItem('authenticatedUser', data.username || data.user?.username || email);
                if (data.token) {
                    sessionStorage.setItem('token', data.token);
                }
                sessionStorage.setItem('userProfile', JSON.stringify(buildProfile(data)));
                return data;
            }
        } catch (error) {
            // No se registra el error completo: incluye la configuración de la petición (credenciales).
            console.error('Error in login API:', error?.response?.status ?? error?.message);
            throw error;
        }
    }

    // Reemplaza el token (y el perfil, si viene) tras un POST /refresh.
    updateSession(data) {
        if (data?.token) {
            sessionStorage.setItem('token', data.token);
        }
        if (data?.user) {
            sessionStorage.setItem('userProfile', JSON.stringify(buildProfile(data)));
        }
    }

    getToken() {
        return sessionStorage.getItem('token');
    }

    clearSession() {
        sessionStorage.removeItem('authenticatedUser');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userProfile');
    }

    logout() {
        this.clearSession();
    }

    isUserLoggedIn() {
        if (sessionStorage.getItem('authenticatedUser') === null) return false;

        const token = this.getToken();
        if (token && isTokenExpired(token)) {
            this.clearSession();
            return false;
        }
        return true;
    }

    getLoggedInUser() {
        const profile = sessionStorage.getItem('userProfile');
        if (!profile) return null;
        try {
            return JSON.parse(profile);
        } catch (e) {
            console.error('Error parsing user profile from sessionStorage:', e);
            return null;
        }
    }

    getUserRole() {
        const user = this.getLoggedInUser();
        return user ? user.role : null;
    }

    isUserAdmin() {
        return this.getUserRole() === 'admin';
    }
}
export default new AuthenticationService();