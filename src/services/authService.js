import axios from 'axios';
import { getApiBaseUrl } from './apiConfig.js';

const authUrl = (path) => `${getApiBaseUrl()}/auth/${path}`;
const LOGOUT_TIMEOUT_MS = 5000;

let refreshPromise = null;

const authService = {
    async login(email, password) {
        const response = await axios.post(authUrl('login'), { email, password });
        return response.data;
    },

    // Una sola petición en vuelo: las llamadas concurrentes comparten la misma promesa.
    refresh() {
        if (!refreshPromise) {
            refreshPromise = axios.post(authUrl('refresh'))
                .then((response) => response.data)
                .finally(() => {
                    refreshPromise = null;
                });
        }
        return refreshPromise;
    },

    // Nunca lanza: el 401 SESSION_EXPIRED con reason INACTIVITY es el resultado esperado
    // y cualquier otro fallo no debe impedir limpiar la sesión local.
    async logout(reason = 'USER', token) {
        const config = { timeout: LOGOUT_TIMEOUT_MS };
        if (token) {
            config.headers = { Authorization: `Bearer ${token}` };
        }
        const body = reason === 'INACTIVITY' ? { reason } : undefined;

        try {
            await axios.post(authUrl('logout'), body, config);
        } catch {
            // ignorado a propósito
        }
    },
};

export default authService;
