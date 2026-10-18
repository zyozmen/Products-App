import { z } from 'zod';

export const reviewSchema = z.object({
  message: z.string().trim().min(1, 'review_field_required'),
  name: z.string().trim().min(1, 'review_field_required'),
  email: z.string().trim().email('email_invalid'),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
