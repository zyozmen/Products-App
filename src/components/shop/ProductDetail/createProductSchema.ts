import { z } from 'zod';

export const quickCreateProductSchema = z.object({
  name: z.string().trim().min(1, 'error_product_name_required'),
  description: z.string().trim().min(1, 'error_product_description_required'),
  sku: z.string(),
  slug: z.string(),
  status: z.enum(['ACTIVE', 'DRAFT', 'INACTIVE']),
  price: z.string().refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, 'error_current_price_positive'),
  originalPrice: z.string(),
  currency: z.string().trim().min(1, 'error_currency_required'),
  taxInclusive: z.boolean(),
}).superRefine((values, context) => {
  if (
    values.originalPrice !== ''
    && (!Number.isFinite(Number(values.originalPrice)) || Number(values.originalPrice) < Number(values.price))
  ) {
    context.addIssue({
      code: 'custom',
      message: 'error_original_price_minimum',
      path: ['originalPrice'],
    });
  }
});

export type QuickCreateProductValues = z.infer<typeof quickCreateProductSchema>;
