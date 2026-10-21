import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { supplierService } from '../../services/supplierService';

afterEach(() => vi.restoreAllMocks());

describe('supplier lots API', () => {
  it('encodes literal search using URLSearchParams and sends API sort field names', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: [{ id: 'lot' }], headers: { 'x-total-count': '21' } });
    expect(await supplierService.getSupplierLots('supplier/id', '  Bolsa.* & +  5g ', 2, 10, 'costoTotalLote,desc'))
      .toEqual({ lots: [{ id: 'lot' }], total: 21 });
    const requestedUrl = String(get.mock.calls[0][0]);
    const url = new URL(requestedUrl, 'http://localhost');
    expect(url.pathname).toBe('/api/proveedores/supplier%2Fid/lotes');
    expect(url.searchParams.get('buscar')).toBe('Bolsa.* & +  5g');
    expect(url.searchParams.get('sort')).toBe('costoTotalLote,desc');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('size')).toBe('10');
    expect(url.searchParams.getAll('sort')).toHaveLength(1);
  });

  it('defaults to all lots, page zero and newest first, retaining totals for an empty page', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: [], headers: { 'x-total-count': '3' } });
    expect(await supplierService.getSupplierLots('supplier')).toEqual({ lots: [], total: 3 });
    const url = new URL(String(get.mock.calls[0][0]), 'http://localhost');
    expect(Object.fromEntries(url.searchParams)).toEqual({ buscar: '', page: '0', size: '10', sort: 'fechaIngreso,desc' });
  });

  it('reports a missing total instead of guessing pagination from response length', async () => {
    vi.spyOn(axios, 'get').mockResolvedValue({ data: [], headers: {} });
    await expect(supplierService.getSupplierLots('supplier')).rejects.toThrow('X-Total-Count');
  });
});

describe('HU-03 packaging API', () => {
  it('posts a bare JSON array with exact decimal numbers to the versioned endpoint', async () => {
    const originalAdapter = axios.defaults.adapter;
    let body = '';
    let url = '';
    axios.defaults.adapter = async (config) => {
      body = config.data;
      url = config.url ?? '';
      return { data: { id: 'lot', estado: 'PROCESADO' }, status: 201, statusText: 'Created', headers: {}, config };
    };
    try {
      const result = await supplierService.packageContainer('lot/id', 'container/id', [{
        sku: 'SAT-5', nombre: 'Bolsa 5g', contenidoUnidad: '999999999999999.999', unidadesCreadas: 1,
        precioVenta: '999999999999999.99', activoMarketplace: true, confirmacionMargenNegativo: true,
        fotografia: { nombre: 'photo.jpg', extension: 'jpg', filepart: 'YWJj' },
      }]);
      expect(url).toMatch(/\/api\/v1\/lotes\/lot%2Fid\/contenedores\/container%2Fid\/presentaciones$/);
      expect(body).toContain('"contenidoUnidad":999999999999999.999');
      expect(body).toContain('"precioVenta":999999999999999.99');
      expect(JSON.parse(body)).toEqual([expect.objectContaining({ confirmacionMargenNegativo: true, fotografia: { nombre: 'photo.jpg', extension: 'jpg', filepart: 'YWJj' } })]);
      expect(body).not.toContain('costoPresentacionCalculado');
      expect(body).not.toContain('stockDisponible');
      expect(result.estado).toBe('PROCESADO');
    } finally {
      axios.defaults.adapter = originalAdapter;
    }
  });
});

describe('paginated supplier payments API', () => {
  it('sends page and size, returning the array and the total header separately', async () => {
    const payments = [{ id: 'payment-1', fecha: '2026-10-21T18:00:00Z' }];
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: payments, headers: { 'x-total-count': '101' } });
    expect(await supplierService.getPayments('supplier/id', 2, 50)).toEqual({ payments, total: 101 });
    expect(get).toHaveBeenCalledWith(expect.stringMatching(/\/proveedores\/supplier%2Fid\/abonos$/), {
      params: { page: 2, size: 50 },
    });
  });

  it('defaults to page zero and size 20 and preserves totals for an empty page', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: [], headers: { 'x-total-count': '12' } });
    expect(await supplierService.getPayments('supplier')).toEqual({ payments: [], total: 12 });
    expect(get).toHaveBeenCalledWith(expect.any(String), { params: { page: 0, size: 20 } });
  });

  it.each([undefined, '', 'invalid', '-1', '1.5'])('reports invalid total header: %s', async (total) => {
    vi.spyOn(axios, 'get').mockResolvedValue({ data: [], headers: { 'x-total-count': total } });
    await expect(supplierService.getPayments('supplier')).rejects.toThrow('X-Total-Count');
  });
});

describe('supplier search API', () => {
  it('sends a trimmed literal query and reads the total from X-Total-Count', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({
      data: [{ id: 'supplier-1', nombre: 'Proveedor' }],
      headers: { 'x-total-count': '45' },
    });
    const result = await supplierService.searchSuppliers('  NIT.123-*  ', 2, 20);
    expect(get).toHaveBeenCalledWith(expect.stringMatching(/\/api\/proveedores$/), {
      params: { buscar: 'NIT.123-*', page: 2, size: 20 },
    });
    expect(result).toEqual({ suppliers: [{ id: 'supplier-1', nombre: 'Proveedor' }], total: 45 });
  });

  it('supports listing all suppliers and an empty page with a nonzero total', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: [], headers: { 'x-total-count': '10' } });
    expect(await supplierService.searchSuppliers('   ')).toEqual({ suppliers: [], total: 10 });
    expect(get).toHaveBeenCalledWith(expect.any(String), { params: { buscar: '', page: 0, size: 20 } });
  });

  it.each([undefined, '', 'invalid', '-1', '1.5'])('reports a missing or invalid total header: %s', async (total) => {
    vi.spyOn(axios, 'get').mockResolvedValue({ data: [], headers: { 'x-total-count': total } });
    await expect(supplierService.searchSuppliers('')).rejects.toThrow('X-Total-Count');
  });
});
