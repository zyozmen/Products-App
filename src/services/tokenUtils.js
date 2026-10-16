const base64UrlDecode = (segment) => {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const percentEncoded = Array.from(binary, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('');
    return decodeURIComponent(percentEncoded);
};

export const decodeToken = (token) => {
    try {
        const parts = String(token ?? '').split('.');
        if (parts.length !== 3) return null;
        return JSON.parse(base64UrlDecode(parts[1]));
    } catch {
        return null;
    }
};

// Devuelve iat/exp en milisegundos (o null si el token no los trae).
export const getTokenTimes = (token) => {
    const payload = decodeToken(token);
    const toMs = (seconds) => (Number.isFinite(seconds) ? seconds * 1000 : null);
    return { iat: toMs(payload?.iat), exp: toMs(payload?.exp) };
};

// Un token sin `exp` legible no se considera vencido: el backend decide con un 401.
export const isTokenExpired = (token, now = Date.now()) => {
    const { exp } = getTokenTimes(token);
    return exp !== null && exp <= now;
};
