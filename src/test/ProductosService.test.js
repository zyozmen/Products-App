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

    const { default: productosService } = await import('../services/ProductosService');

    expect(productosService.url).toBe('/api/productos');
    expect(productosService.categoriesUrl).toBe('/api/productos/categories');
  });

  it('uses a same-origin API path in development when an absolute URL is configured', async () => {
    vi.stubEnv('VITE_APP_PRODUCTS_API_URL', 'http://127.0.0.1:8080/api/productos');
    vi.stubEnv('NODE_ENV', 'development');

    const { default: productosService } = await import('../services/ProductosService');

    expect(productosService.url).toBe('/api/productos');
    expect(productosService.categoriesUrl).toBe('/api/productos/categories');
  });

  it('propagates the remote API error when the backend is unavailable', async () => {
    vi.stubEnv('VITE_APP_PRODUCTS_API_URL', 'http://localhost:8080/api/productos');
    vi.stubEnv('NODE_ENV', 'development');
    axios.get.mockRejectedValueOnce(new Error('network down'));

    const { default: productosService } = await import('../services/ProductosService');

    await expect(productosService.listarProductos(0, 5, {})).rejects.toThrow('network down');
  });

  it('maps the main product image to the image property', async () => {
    vi.stubEnv('VITE_APP_PRODUCTS_API_URL', 'http://localhost:8080/api/productos');
    vi.stubEnv('NODE_ENV', 'development');
    axios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        content: [{
          id: 'product-1',
          name: 'Product 1',
          images: {
            foto_principal: {
              extension: 'png',
              filepart: 'aW1hZ2UtZGF0YQ==',
            },
          },
        }],
      },
    });

    const { default: productosService } = await import('../services/ProductosService');
    const result = await productosService.listarProductos(0, 5, {});

    expect(result.products[0].image).toBe('data:image/png;base64,aW1hZ2UtZGF0YQ==');
    expect(result.products[0].image).toBe(result.products[0].foto_principal);
  });

  it('keeps the product status in the listed products', async () => {
    vi.stubEnv('VITE_APP_PRODUCTS_API_URL', 'http://localhost:8080/api/productos');
    vi.stubEnv('NODE_ENV', 'development');
    axios.get.mockResolvedValueOnce({
      status: 200,
      data: { content: [{ id: 'p1', name: 'Draft product', status: 'DRAFT' }] },
    });

    const { default: productosService } = await import('../services/ProductosService');
    const result = await productosService.listarProductos(0, 5, {});

    expect(result.products[0].status).toBe('DRAFT');
  });

  it('sends numeric price filter boundaries to the API without currency formatting', async () => {
    vi.stubEnv('VITE_APP_PRODUCTS_API_URL', 'http://localhost:8080/api/productos');
    vi.stubEnv('NODE_ENV', 'development');
    axios.get.mockResolvedValueOnce({
      status: 200,
      data: { content: [] },
    });

    const { default: productosService } = await import('../services/ProductosService');

    await productosService.listarProductos(0, 15, {
      minPrice: 50000,
      maxPrice: 100000,
    });

    const [requestUrl] = axios.get.mock.calls[0];
    const queryParams = new URL(requestUrl, 'http://localhost').searchParams;
    expect(queryParams.get('min_price')).toBe('50000');
    expect(queryParams.get('max_price')).toBe('100000');
  });
});
