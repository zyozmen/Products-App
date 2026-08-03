import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe('ProductosService', () => {
  it('uses a same-origin API path in production even when an absolute URL is configured', async () => {
    vi.stubEnv('VITE_APP_PRODUCTS_API_URL', 'http://3.14.127.28:8080/api/productos');
    vi.stubEnv('NODE_ENV', 'production');

    const { default: productosService } = await import('./ProductosService');

    expect(productosService.url).toBe('/api/productos');
    expect(productosService.categoriesUrl).toBe('/api/productos/categories');
  });
});
