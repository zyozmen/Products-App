import { afterEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { marketplaceService } from '../services/marketplaceService';
import orderService from '../services/OrderService.js';

afterEach(() => vi.restoreAllMocks());

describe('marketplaceService', () => {
  it('requests the public grouped catalog with bounded paging and search', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({
      data: { content: [], page: 2, size: 20, totalElements: 0, totalPages: 0 },
    });

    await marketplaceService.list('  10 gr  ', 2, 20);

    expect(get).toHaveBeenCalledWith(expect.stringContaining('/marketplace/presentaciones'), {
      params: { buscar: '10 gr', page: 2, size: 20 },
      paramsSerializer: { indexes: null },
    });
  });

  it('sends combined server filters with repeated category parameters', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: { content: [] } });
    await marketplaceService.list('Tangerine', 0, 20, {
      categoryIds: ['7', '8'], minPrice: 50000, maxPrice: 100000,
    });
    const [url, config] = get.mock.calls[0];
    const serialized = axios.getUri({ ...config, url });
    const params = new URL(serialized, 'http://localhost').searchParams;
    expect(params.getAll('categoryIds')).toEqual(['7', '8']);
    expect(params.get('minPrice')).toBe('50000');
    expect(params.get('maxPrice')).toBe('100000');
    expect(params.get('buscar')).toBe('Tangerine');
  });

  it('creates and updates shared strain categories while keeping the version', async () => {
    const cepa = { id: 'strain', nombre: 'Anterior', version: 3, categoryIds: [7] };
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: cepa });
    const put = vi.spyOn(axios, 'put').mockResolvedValue({ data: cepa });
    await marketplaceService.createCepa('Tangerine', [7, 8]);
    expect(post).toHaveBeenCalledWith(expect.stringContaining('/cepas'), { nombre: 'Tangerine', categoryIds: [7, 8] });
    await marketplaceService.renameCepa(cepa, 'Nueva', []);
    expect(put).toHaveBeenCalledWith(expect.stringContaining('/cepas/strain'), {
      nombre: 'Nueva', version: 3, categoryIds: [],
    });
    await marketplaceService.renameCepa(cepa, 'Solo nombre');
    expect(put).toHaveBeenLastCalledWith(expect.stringContaining('/cepas/strain'), {
      nombre: 'Solo nombre', version: 3,
    });
  });

  it('encodes the selected strain and presentation in detail requests', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: { cepaId: 'strain/id' } });

    await marketplaceService.detail('strain/id', 'presentation id');

    expect(get).toHaveBeenCalledWith(expect.stringContaining('/marketplace/cepas/strain%2Fid/presentaciones/presentation%20id'));
  });

  it('requires the administrative count header', async () => {
    vi.spyOn(axios, 'get').mockResolvedValue({ data: [], headers: {} });

    await expect(marketplaceService.listCepas()).rejects.toThrow('X-Total-Count');
  });

  it('creates PQR orders using selected presentation IDs without client-supplied amounts', async () => {
    const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: { id: 'pqr-1' } });

    await orderService.createPqrOrder({
      username: 'customer',
      items: [{ productId: 'presentation-1', name: 'Tangerine · Bolsa 5 g', quantity: 2 }],
      delivery: { recipientName: 'Customer', address: 'Street', addressComplement: '', contactPhone: '3001234567' },
      notes: 'Request',
    });

    expect(post).toHaveBeenCalledWith(
      expect.stringContaining('/admin/orders/pqr'),
      {
        username: 'customer',
        items: [{ productId: 'presentation-1', name: 'Tangerine · Bolsa 5 g', quantity: 2 }],
        delivery: { recipientName: 'Customer', address: 'Street', addressComplement: '', contactPhone: '3001234567' },
        notes: 'Request',
      },
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });
});
