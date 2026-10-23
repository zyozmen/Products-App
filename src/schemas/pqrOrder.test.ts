import { describe, expect, it } from 'vitest';
import { pqrOrderSchema } from './pqrOrder';

describe('pqrOrderSchema', () => {
  it('accepts a complete PQR order with an integer quantity and valid phone', () => {
    const result = pqrOrderSchema.safeParse({
      username: 'customer',
      productId: 'presentation-1',
      productName: 'Custom product',
      quantity: 2,
      recipientName: 'Recipient',
      address: '123 Main Street',
      contactPhone: '+573001234567',
      notes: 'Requested by customer support',
    });

    expect(result.success).toBe(true);
  });

  it('rejects non-positive quantities, invalid phone numbers, and blank required fields', () => {
    const result = pqrOrderSchema.safeParse({
      username: ' ',
      productId: 'presentation-1',
      productName: 'Custom product',
      quantity: 0.5,
      recipientName: 'Recipient',
      address: '123 Main Street',
      contactPhone: 'abc',
      notes: 'Requested by customer support',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(['username', 'quantity', 'contactPhone']),
      );
    }
  });
});
