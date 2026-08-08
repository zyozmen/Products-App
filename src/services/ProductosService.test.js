import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('ProductosService', () => {
  it('uses a same-origin API path in production even when an absolute URL is configured', async () => {
    vi.stubEnv('VITE_APP_PRODUCTS_API_URL', 'http://3.14.127.28:8080/api/productos');
    vi.stubEnv('NODE_ENV', 'production');

    const { default: productosService } = await import('./ProductosService');

    expect(productosService.url).toBe('/api/productos');
    expect(productosService.categoriesUrl).toBe('/api/productos/categories');
  });

  it('returns local mock products when the remote API is unavailable', async () => {
    vi.stubEnv('VITE_APP_USE_MOCK_DATA', 'true');
    axios.get.mockRejectedValueOnce(new Error('network down'));

    const { default: productosService } = await import('./ProductosService');
    const result = await productosService.listarProductos(0, 5, {});

    expect(result.products.length).toBeGreaterThan(0);
    expect(result.products[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
    });
  });
});
