import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

/**
 * Detecta inactividad del usuario.
 * - `timeoutMs`: tiempo sin actividad tras el cual se llama `onTimeout`.
 * - `warningMs`: antelación con la que se activa `isWarning` / `onWarning` (0 = sin aviso).
 * Mientras el aviso está visible la actividad no reinicia el contador: hay que llamar `reset()` explícitamente.
 */
export default function useInactivityTimer({
    timeoutMs,
    warningMs = 0,
    enabled = true,
    throttleMs = 1000,
    onTimeout,
    onWarning,
    events = DEFAULT_EVENTS,
}) {
    const [isWarning, setIsWarning] = useState(false);
    const lastActivityRef = useRef(Date.now());
    const warningRef = useRef(false);
    const timersRef = useRef({ warning: null, timeout: null });
    const onTimeoutRef = useRef(onTimeout);
    const onWarningRef = useRef(onWarning);

    onTimeoutRef.current = onTimeout;
    onWarningRef.current = onWarning;

    const clearTimers = useCallback(() => {
        clearTimeout(timersRef.current.warning);
        clearTimeout(timersRef.current.timeout);
        timersRef.current = { warning: null, timeout: null };
    }, []);

    const start = useCallback(() => {
        clearTimers();
        lastActivityRef.current = Date.now();
        warningRef.current = false;
        setIsWarning(false);

        if (warningMs > 0 && warningMs < timeoutMs) {
            timersRef.current.warning = setTimeout(() => {
                warningRef.current = true;
                setIsWarning(true);
                onWarningRef.current?.();
            }, timeoutMs - warningMs);
        }

        timersRef.current.timeout = setTimeout(() => {
            clearTimers();
            warningRef.current = false;
            setIsWarning(false);
            onTimeoutRef.current?.();
        }, timeoutMs);
    }, [timeoutMs, warningMs, clearTimers]);

    useEffect(() => {
        if (!enabled) {
            clearTimers();
            warningRef.current = false;
            setIsWarning(false);
            return undefined;
        }

        start();

        const handleActivity = () => {
            if (warningRef.current) return;
            if (Date.now() - lastActivityRef.current < throttleMs) return;
            start();
        };

        const options = { passive: true, capture: true };
        events.forEach((eventName) => window.addEventListener(eventName, handleActivity, options));

        return () => {
            events.forEach((eventName) => window.removeEventListener(eventName, handleActivity, options));
            clearTimers();
        };
    }, [enabled, start, throttleMs, events, clearTimers]);

    const getLastActivity = useCallback(() => lastActivityRef.current, []);

    return { isWarning, reset: start, getLastActivity };
}
