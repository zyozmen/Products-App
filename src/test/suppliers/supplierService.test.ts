import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { supplierService } from '../../services/supplierService';

afterEach(() => vi.restoreAllMocks());

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
