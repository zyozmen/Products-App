const DEFAULT_INACTIVITY_MINUTES = 15;

const withApiSuffix = (url) => {
    const trimmed = url.replace(/\/+$/, '');
    return /\/api$/.test(trimmed) ? trimmed : `${trimmed}/api`;
};

// Se lee en cada llamada para respetar variables de entorno cambiadas (p. ej. en pruebas).
export const getApiBaseUrl = () => {
    const apiUrl = String(import.meta.env.VITE_API_URL ?? '').trim();
    if (apiUrl) {
        return withApiSuffix(apiUrl);
    }

    const productsUrl = String(import.meta.env.VITE_APP_PRODUCTS_API_URL ?? '').trim();
    if (productsUrl) {
        return productsUrl.replace(/\/productos\/?$/, '');
    }

    return import.meta.env.PROD ? '/api' : 'http://localhost:8080/api';
};

export const getInactivityMinutes = () => {
    const minutes = Number(import.meta.env.VITE_INACTIVITY_MINUTES);
    return Number.isFinite(minutes) && minutes > 0 ? minutes : DEFAULT_INACTIVITY_MINUTES;
};
