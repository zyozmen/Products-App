import { describe, expect, it } from 'vitest';
import { reviewSchema } from './review';

describe('reviewSchema', () => {
  it('accepts a complete review', () => {
    expect(reviewSchema.safeParse({
      message: 'Useful product',
      name: 'María',
      email: 'maria@example.com',
    }).success).toBe(true);
  });

  it('rejects blank required fields and invalid email', () => {
    expect(reviewSchema.safeParse({
      message: ' ',
      name: 'María',
      email: 'invalid',
    }).success).toBe(false);
  });
});
