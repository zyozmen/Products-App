import { z } from 'zod';
import { validateProductForm } from './CreateProductHelper.js';

const productCategorySchema = z.object({
  name: z.string(),
  slug: z.string(),
  category_id: z.string(),
});

const productCommentSchema = z.object({
  username: z.string(),
  rating: z.union([z.string(), z.number()]),
  title: z.string(),
  body: z.string(),
  comment_id: z.string(),
  user_id: z.string(),
  created_at: z.string(),
});

export const createProductSchema = (availableCategories: Array<{ category_id: string; name: string; slug?: string }>) =>
  z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    sku: z.string(),
    status: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    price_current: z.string(),
    price_original: z.string(),
    price_currency: z.string(),
    price_discount_percentage: z.string(),
    price_tax_inclusive: z.boolean(),
    ranking_average_rating: z.string(),
    ranking_total_reviews: z.string(),
    ranking_5_star: z.string(),
    ranking_4_star: z.string(),
    ranking_3_star: z.string(),
    ranking_2_star: z.string(),
    ranking_1_star: z.string(),
    categories: z.array(productCategorySchema),
    recent_comments: z.array(productCommentSchema),
  }).superRefine((product, context) => {
    const validationMessage = validateProductForm(product, availableCategories);
    if (validationMessage) {
      context.addIssue({
        code: 'custom',
        message: validationMessage,
        path: ['name'],
      });
    }
  });

export type ProductFormValues = z.infer<ReturnType<typeof createProductSchema>>;
