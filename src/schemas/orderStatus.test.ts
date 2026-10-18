import { describe, expect, it } from 'vitest';
import { createOrderDeliverySchema, orderPaidSchema } from './orderStatus';

describe('order status form schemas', () => {
  it('accepts paid status options', () => {
    expect(orderPaidSchema.safeParse({ cashOnDelivery: true }).success).toBe(true);
  });

  it('allows both payment details to be empty when no payment detail is required', () => {
    expect(createOrderDeliverySchema(false, 100).safeParse({
      cashAmount: '',
      cardAmount: '',
    }).success).toBe(true);
  });

  it('requires payment detail for cash-on-delivery and matches the total', () => {
    const schema = createOrderDeliverySchema(true, 100);
    expect(schema.safeParse({ cashAmount: 0, cardAmount: 0 }).success).toBe(false);
    expect(schema.safeParse({ cashAmount: 40, cardAmount: 60 }).success).toBe(true);
    expect(schema.safeParse({ cashAmount: 40, cardAmount: 50 }).success).toBe(false);
  });

  it('rejects negative payment values', () => {
    expect(createOrderDeliverySchema(false, 100).safeParse({
      cashAmount: -1,
      cardAmount: 0,
    }).success).toBe(false);
  });
});
