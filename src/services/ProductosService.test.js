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

  it('propagates the remote API error when the backend is unavailable', async () => {
    vi.stubEnv('VITE_APP_PRODUCTS_API_URL', 'http://localhost:8080/api/productos');
    vi.stubEnv('NODE_ENV', 'development');
    axios.get.mockRejectedValueOnce(new Error('network down'));

    const { default: productosService } = await import('./ProductosService');

    await expect(productosService.listarProductos(0, 5, {})).rejects.toThrow('network down');
  });
});
