import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('App', () => {
  it('renders without crashing when the products API URL is not configured', async () => {
    vi.stubEnv('VITE_APP_PRODUCTS_API_URL', '');

    const { default: App } = await import('./App');

    expect(() => render(<App />)).not.toThrow();
  });
});
