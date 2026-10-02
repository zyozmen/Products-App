import axios from 'axios';

const rawProductsApiUrl = String(import.meta.env.VITE_APP_PRODUCTS_API_URL ?? '').trim();
const nodeEnv = String(import.meta.env.NODE_ENV ?? import.meta.env.PROD ?? '').toLowerCase();
const isProduction = nodeEnv === 'true' || nodeEnv === 'production';

const resolveApiBaseUrl = () => {
    if (rawProductsApiUrl) {
        return rawProductsApiUrl.replace(/\/productos\/?$/, '');
    }

    if (!isProduction) {
        return 'http://localhost:8080/api';
    }

    return '/api';
};

const apiBaseUrl = resolveApiBaseUrl();

class AuthenticationService {
    async login(username, password) {
        try {
            const response = await axios.post(`${apiBaseUrl}/auth/login`, { username, password });
            if (response.data) {
                const data = response.data;
                sessionStorage.setItem('authenticatedUser', data.username || username);
                if (data.token) {
                    sessionStorage.setItem('token', data.token);
                }
                const profile = data.user || {
                    username: data.username || username,
                    nombre: data.nombre || '',
                    apellido: data.apellido || '',
                    direccion: data.direccion || '',
                    telefono: data.telefono || '',
                    tipoIdentificacion: data.tipoIdentificacion || 'CC',
                    numeroIdentificacion: data.numeroIdentificacion || '',
                    role: data.role || 'cliente',
                    active: data.active !== undefined ? data.active : true
                };
                sessionStorage.setItem('userProfile', JSON.stringify(profile));
                return data;
            }
        } catch (error) {
            console.error('Error in login API:', error);
            throw error;
        }
    }

    logout() {
        console.log("logout");
        sessionStorage.removeItem('authenticatedUser');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userProfile');
    }

    isUserLoggedIn() {
        let user = sessionStorage.getItem('authenticatedUser');
        if (user === null) return false;
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