import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useInactivityTimer from '../hooks/useInactivityTimer.js';

const MINUTE = 60 * 1000;

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('useInactivityTimer', () => {
    it('calls onTimeout once the inactivity limit is reached', () => {
        const onTimeout = vi.fn();
        renderHook(() => useInactivityTimer({ timeoutMs: 15 * MINUTE, onTimeout }));

        act(() => { vi.advanceTimersByTime(15 * MINUTE - 1); });
        expect(onTimeout).not.toHaveBeenCalled();

        act(() => { vi.advanceTimersByTime(1); });
        expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    it.each(['mousemove', 'keydown', 'click', 'scroll', 'touchstart'])('restarts the counter on %s', (eventName) => {
        const onTimeout = vi.fn();
        renderHook(() => useInactivityTimer({ timeoutMs: 15 * MINUTE, onTimeout }));

        act(() => { vi.advanceTimersByTime(14 * MINUTE); });
        act(() => { window.dispatchEvent(new Event(eventName)); });

        act(() => { vi.advanceTimersByTime(14 * MINUTE); });
        expect(onTimeout).not.toHaveBeenCalled();

        act(() => { vi.advanceTimersByTime(MINUTE); });
        expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    it('throttles activity events', () => {
        const onTimeout = vi.fn();
        renderHook(() => useInactivityTimer({ timeoutMs: 10 * MINUTE, throttleMs: 1000, onTimeout }));

        act(() => { vi.advanceTimersByTime(500); });
        act(() => { window.dispatchEvent(new Event('mousemove')); });

        // el evento llegó dentro del throttle: el contador sigue contando desde el inicio
        act(() => { vi.advanceTimersByTime(10 * MINUTE - 500); });
        expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    it('shows a warning before the timeout and ignores activity until reset() is called', () => {
        const onTimeout = vi.fn();
        const onWarning = vi.fn();
        const { result } = renderHook(() =>
            useInactivityTimer({ timeoutMs: 15 * MINUTE, warningMs: MINUTE, onTimeout, onWarning }));

        act(() => { vi.advanceTimersByTime(14 * MINUTE); });
        expect(result.current.isWarning).toBe(true);
        expect(onWarning).toHaveBeenCalledTimes(1);

        act(() => { window.dispatchEvent(new Event('mousemove')); });
        expect(result.current.isWarning).toBe(true);

        act(() => { result.current.reset(); });
        expect(result.current.isWarning).toBe(false);

        act(() => { vi.advanceTimersByTime(14 * MINUTE); });
        expect(onTimeout).not.toHaveBeenCalled();
        act(() => { vi.advanceTimersByTime(MINUTE); });
        expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    it('does nothing while disabled and removes its listeners on unmount', () => {
        const onTimeout = vi.fn();
        const { unmount, rerender } = renderHook(
            ({ enabled }) => useInactivityTimer({ timeoutMs: MINUTE, enabled, onTimeout }),
            { initialProps: { enabled: false } },
        );

        act(() => { vi.advanceTimersByTime(5 * MINUTE); });
        expect(onTimeout).not.toHaveBeenCalled();

        rerender({ enabled: true });
        unmount();
        act(() => { vi.advanceTimersByTime(5 * MINUTE); });
        expect(onTimeout).not.toHaveBeenCalled();
    });
});
