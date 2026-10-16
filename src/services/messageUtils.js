// Elimina etiquetas y caracteres de control, y limita la longitud de mensajes provenientes del servidor.
export const sanitizeMessage = (value, fallback = '', maxLength = 200) => {
    if (typeof value !== 'string') return fallback;

    const cleaned = value
        .replace(/<[^>]*>/g, '')
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength);

    return cleaned || fallback;
};
