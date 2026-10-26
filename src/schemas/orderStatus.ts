import { z } from 'zod';

const paymentAmountSchema = z.preprocess(
  (value) => value === '' || (typeof value === 'number' && Number.isNaN(value)) ? 0 : value,
  z.number({ error: 'payment_amount_invalid' })
    .finite('payment_amount_invalid')
    .min(0, 'payment_amount_invalid'),
);

export const orderPaidSchema = z.object({
  cashOnDelivery: z.boolean(),
});

export const createOrderDeliverySchema = (cashOnDelivery: boolean, total: number) =>
  z.object({
    cashAmount: paymentAmountSchema,
    cardAmount: paymentAmountSchema,
  }).superRefine(({ cashAmount, cardAmount }, context) => {
    const hasDetail = cashAmount > 0 || cardAmount > 0;
    if (cashOnDelivery && total > 0 && !hasDetail) {
      context.addIssue({ code: 'custom', message: 'payment_detail_required', path: ['root'] });
      return;
    }
    if (hasDetail && Math.abs(Math.round(cashAmount * 100) + Math.round(cardAmount * 100) - Math.round(total * 100)) > 1) {
      context.addIssue({ code: 'custom', message: 'payment_detail_mismatch', path: ['root'] });
    }
  });

export type OrderPaidFormValues = z.infer<typeof orderPaidSchema>;
export type OrderDeliveryFormValues = z.infer<ReturnType<typeof createOrderDeliverySchema>>;
