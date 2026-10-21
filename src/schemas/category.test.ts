import { describe, expect, it } from 'vitest';
import { CATEGORY_IMAGE_MAX_BYTES, categorySchema, validateCategoryImage } from './category';

describe('categorySchema', () => {
  it('requires a name and trims values', () => {
    expect(categorySchema.safeParse({ name: '  ', description: '' }).success).toBe(false);
    const result = categorySchema.safeParse({ name: ' Flores ', description: ' Desc ' });
    expect(result.success && result.data).toEqual({ name: 'Flores', description: 'Desc' });
  });
});

describe('validateCategoryImage', () => {
  it('accepts png, jpg and webp up to 2MB', () => {
    expect(validateCategoryImage({ name: 'a.png', type: 'image/png', size: 1000 })).toBe('');
    expect(validateCategoryImage({ name: 'a.jpg', type: 'image/jpeg', size: CATEGORY_IMAGE_MAX_BYTES })).toBe('');
    expect(validateCategoryImage({ name: 'a.webp', type: 'image/webp', size: 1000 })).toBe('');
    expect(validateCategoryImage(null)).toBe('');
  });

  it('rejects other formats and oversized files', () => {
    expect(validateCategoryImage({ name: 'a.gif', type: 'image/gif', size: 1000 })).toBe('category_image_invalid_type');
    expect(validateCategoryImage({ name: 'a.png', type: 'image/png', size: CATEGORY_IMAGE_MAX_BYTES + 1 })).toBe('category_image_too_large');
  });
});
