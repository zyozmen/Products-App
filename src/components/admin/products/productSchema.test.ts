import { describe, expect, it } from 'vitest';
import { createInitialForm } from './CreateProductHelper.js';
import { createProductSchema } from './productSchema';

const validProduct = {
  ...createInitialForm(),
  name: 'Growing medium',
  description: 'Suitable for indoor plants',
  price_current: '100',
  categories: [{ name: 'Soil', slug: 'soil', category_id: 'new-category' }],
};

describe('createProductSchema', () => {
  it('accepts valid product data and a new category', () => {
    expect(createProductSchema([]).safeParse(validProduct).success).toBe(true);
  });

  it('rejects invalid required fields and price relationships', () => {
    const result = createProductSchema([]).safeParse({
      ...validProduct,
      name: ' ',
      price_current: '0',
      price_original: '1',
    });

    expect(result.success).toBe(false);
  });

  it('rejects duplicate new category names and requires at least one category', () => {
    const categories = [{ category_id: 'existing-1', name: 'Soil', slug: 'soil' }];
    expect(createProductSchema(categories).safeParse(validProduct).success).toBe(false);
    expect(createProductSchema([]).safeParse({
      ...validProduct,
      categories: [{ name: '', slug: '', category_id: '' }],
    }).success).toBe(false);
  });
});
