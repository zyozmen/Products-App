import axios from 'axios';
import AuthenticationService from './AuthenticationService.js';

export const ACCESS_DENIED_MESSAGE = 'Acceso denegado: no tiene permisos para realizar esta acción.';

const endpointMatches = (url, names) =>
    new RegExp(`/auth/(${names.join('|')})(?:[/?#]|$)`).test(String(url ?? ''));

export const getErrorCode = (data) =>
    (data && typeof data === 'object' ? (data.code ?? data.error) : undefined);

/**
 * Instala los interceptores de autenticación sobre un cliente axios.
 * `handlers` se lee en el momento de cada respuesta, por lo que puede asignarse después.
 */
export function installAuthInterceptors(client, { getToken, handlers = {} }) {
    let handled = false;

    const requestId = client.interceptors.request.use((config) => {
        if (endpointMatches(config.url, ['login', 'register'])) return config;

        const token = getToken();
        if (token && !config.headers.get('Authorization')) {
            config.headers.set('Authorization', `Bearer ${token}`);
        }
        return config;
    });

    const responseId = client.interceptors.response.use(
        (response) => response,
        (error) => {
            const status = error?.response?.status;
            const code = getErrorCode(error?.response?.data);
            const url = error?.config?.url;

            // login/logout/register gestionan sus propios errores (credenciales inválidas, 401 esperado, etc.)
            if (!endpointMatches(url, ['login', 'register', 'logout'])) {
                const sent = error?.config?.headers?.get?.('Authorization');
                const current = getToken();
                // Una petición enviada con un token ya reemplazado (refresh/relogin) no debe cerrar la sesión vigente.
                const isStale = Boolean(current && sent && sent !== `Bearer ${current}`);

                if (!isStale) {
                    if (status === 401 && code === 'SESSION_EXPIRED') {
                        if (!handled) {
                            handled = true;
                            handlers.onSessionExpired?.(error);
                        }
                    } else if (status === 403 && code === 'user_inactive') {
                        if (!handled) {
                            handled = true;
                            handlers.onUserInactive?.(error);
                        }
                    } else if (status === 403) {
                        error.userMessage = ACCESS_DENIED_MESSAGE;
                        handlers.onForbidden?.(error);
                    }
                }
            }

            return Promise.reject(error);
        },
    );

    return {
        eject: () => {
            client.interceptors.request.eject(requestId);
            client.interceptors.response.eject(responseId);
        },
        resetGuard: () => {
            handled = false;
        },
    };
}

// Los servicios existentes usan la instancia global de axios, por eso se configura esa misma.
export const authHandlers = {};
let globalControls = null;

export function setupHttpClient() {
    if (!globalControls) {
        globalControls = installAuthInterceptors(axios, {
            getToken: () => AuthenticationService.getToken(),
            handlers: authHandlers,
        });
    }
    return globalControls;
}

export const resetSessionGuard = () => globalControls?.resetGuard();
