import { z } from 'zod';

export const CATEGORY_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const CATEGORY_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const CATEGORY_IMAGE_EXTENSIONS = /\.(png|jpe?g|webp)$/i;

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'category_name_required').max(100, 'category_name_too_long'),
  description: z.string().trim().max(1000, 'category_description_too_long'),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

// Devuelve la clave de traducción del error o '' si el archivo es válido.
export function validateCategoryImage(file: { name: string; type: string; size: number } | null | undefined): string {
  if (!file) return '';
  const validType = CATEGORY_IMAGE_TYPES.includes(file.type) || (!file.type && CATEGORY_IMAGE_EXTENSIONS.test(file.name));
  if (!validType || !CATEGORY_IMAGE_EXTENSIONS.test(file.name)) return 'category_image_invalid_type';
  if (file.size > CATEGORY_IMAGE_MAX_BYTES) return 'category_image_too_large';
  return '';
}
