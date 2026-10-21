import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

const load = async () => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:8080');
  return import('../services/categoryService.js');
};

describe('categoryService', () => {
  it('maps the v1 response and resolves relative image URLs against the backend origin', async () => {
    const { default: service, getCategoryImageSrc } = await load();
    axios.get.mockResolvedValueOnce({ data: [{ id: 7, name: 'Audio', description: null, imageUrl: '/api/v1/categories/7/image' }] });

    const [category] = await service.getCategories();

    expect(axios.get).toHaveBeenCalledWith('http://localhost:8080/api/v1/categories');
    expect(category).toMatchObject({ category_id: '7', name: 'Audio', description: '' });
    expect(getCategoryImageSrc(category)).toBe('http://localhost:8080/api/v1/categories/7/image');
  });

  it('creates with JSON and then uploads the image as multipart with target CATEGORY', async () => {
    const { default: service } = await load();
    axios.post
      .mockResolvedValueOnce({ data: { id: 9, name: 'Flores' } })
      .mockResolvedValueOnce({ data: { id: 9, name: 'Flores', imageUrl: '/api/v1/categories/9/image' } });
    const file = new File(['x'], 'a.png', { type: 'image/png' });

    const result = await service.saveCategory({ name: ' Flores ', description: '', image: file });

    expect(axios.post.mock.calls[0]).toEqual(['http://localhost:8080/api/v1/categories', { name: 'Flores', description: null }]);
    const [url, form] = axios.post.mock.calls[1];
    expect(url).toBe('http://localhost:8080/api/v1/images/9');
    expect(form.get('target')).toBe('CATEGORY');
    expect(form.get('fotoPrincipal')).toBe(file);
    expect(result.imageFailed).toBe(false);
  });

  it('reports a pending image without repeating the creation when the upload fails', async () => {
    const { default: service } = await load();
    axios.post.mockResolvedValueOnce({ data: { id: 9, name: 'Flores' } }).mockRejectedValueOnce(new Error('boom'));

    const result = await service.saveCategory({ name: 'Flores', description: '', image: new File(['x'], 'a.png', { type: 'image/png' }) });

    expect(result.imageFailed).toBe(true);
    expect(result.category.category_id).toBe('9');
    expect(axios.post).toHaveBeenCalledTimes(2);
  });
});
