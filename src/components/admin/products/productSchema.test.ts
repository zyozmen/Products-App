import { describe, expect, it } from 'vitest';
import { createInitialForm, formFromProduct } from './CreateProductHelper.js';
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

  it('converts loaded numeric values to form strings so products can be updated', () => {
    const form = formFromProduct({
      name: 'Growing medium',
      description: 'Suitable for indoor plants',
      price: {
        current: 100,
        original: 120,
        currency: 'USD',
        discount_percentage: 15,
        tax_inclusive: false,
      },
      ranking: {
        average_rating: 4.5,
        total_reviews: 10,
        rating_distribution: {
          '5_star': 7,
          '4_star': 2,
          '3_star': 1,
          '2_star': 0,
          '1_star': 0,
        },
      },
      categories: [{ name: 'Soil', slug: 'soil', category_id: 'soil-1' }],
    });

    expect(form.price_current).toBe('100');
    expect(form.ranking_average_rating).toBe('4.5');
    expect(createProductSchema([]).safeParse(form).success).toBe(true);
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
