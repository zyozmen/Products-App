import { describe, expect, it } from 'vitest';
import { checkoutSchema } from './checkout';

const validDelivery = {
  recipientName: 'María Pérez',
  address: 'Calle 10',
  addressComplement: '',
  contactPhone: '+573001234567',
};

describe('checkoutSchema', () => {
  it('accepts delivery details with an optional address complement', () => {
    expect(checkoutSchema.safeParse(validDelivery).success).toBe(true);
    expect(checkoutSchema.safeParse({
      ...validDelivery,
      addressComplement: 'Apartamento 204',
    }).success).toBe(true);
  });

  it('rejects missing required delivery details', () => {
    const result = checkoutSchema.safeParse({
      ...validDelivery,
      recipientName: ' ',
      contactPhone: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(['recipientName', 'contactPhone']),
      );
    }
  });
});
