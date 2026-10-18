import { z } from 'zod';

export const checkoutSchema = z.object({
  recipientName: z.string().trim().min(1, 'checkout_field_required'),
  address: z.string().trim().min(1, 'checkout_field_required'),
  addressComplement: z.string().trim(),
  contactPhone: z.string().trim().min(1, 'checkout_field_required'),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
