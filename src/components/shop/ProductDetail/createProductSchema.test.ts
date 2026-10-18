import { describe, expect, it } from 'vitest';
import { quickCreateProductSchema } from './createProductSchema';

const validProduct = {
  name: 'Grow Kit',
  description: 'A complete kit',
  sku: '',
  slug: '',
  status: 'ACTIVE' as const,
  price: '20',
  originalPrice: '25',
  currency: 'USD',
  taxInclusive: false,
};

describe('quickCreateProductSchema', () => {
  it('accepts a valid product and an omitted original price', () => {
    expect(quickCreateProductSchema.safeParse(validProduct).success).toBe(true);
    expect(quickCreateProductSchema.safeParse({ ...validProduct, originalPrice: '' }).success).toBe(true);
  });

  it('rejects missing required values and an original price below the current price', () => {
    expect(quickCreateProductSchema.safeParse({ ...validProduct, name: '' }).success).toBe(false);
    expect(quickCreateProductSchema.safeParse({ ...validProduct, originalPrice: '19' }).success).toBe(false);
  });
});
