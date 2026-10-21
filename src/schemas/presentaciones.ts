import { z } from 'zod';
import { decimalUnits } from '../utils/packagingCalculations';

function decimalField(places: number, positive: boolean) {
  return z.string().trim().regex(
    new RegExp(`^\\d{1,15}(?:\\.\\d{1,${places}})?$`),
    `Usa máximo 15 enteros y ${places} decimales, sin separadores.`,
  ).refine((value) => !positive || decimalUnits(value, places) > 0n, 'El valor debe ser mayor que cero.');
}

export const fotografiaSchema = z.object({
  nombre: z.string().trim().min(1).max(255),
  extension: z.enum(['png', 'jpg', 'jpeg', 'webp']),
  filepart: z.string().min(1),
}).superRefine((photo, ctx) => {
  if (!photo.nombre.toLowerCase().endsWith(`.${photo.extension}`)) {
    ctx.addIssue({ code: 'custom', path: ['nombre'], message: 'El nombre y la extensión de la imagen deben coincidir.' });
  }
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(photo.filepart)) {
    ctx.addIssue({ code: 'custom', path: ['filepart'], message: 'La imagen debe contener Base64 puro válido.' });
    return;
  }
  const bytes = photo.filepart.length * 3 / 4 - (photo.filepart.endsWith('==') ? 2 : photo.filepart.endsWith('=') ? 1 : 0);
  if (bytes === 0 || bytes > 204800) {
    ctx.addIssue({ code: 'custom', path: ['filepart'], message: 'La imagen debe tener contenido y pesar máximo 200 KiB.' });
  }
});

export const presentacionSchema = z.object({
  presentacionId: z.string().regex(/^[a-f\d]{24}$/i, 'El ID debe tener 24 caracteres hexadecimales.').optional(),
  sku: z.string().trim().min(1, 'Ingresa el SKU.').max(100, 'Máximo 100 caracteres.'),
  nombre: z.string().trim().min(1, 'Ingresa el nombre.').max(200, 'Máximo 200 caracteres.'),
  contenidoUnidad: decimalField(3, true),
  unidadesCreadas: z.string().trim().regex(/^\d+$/, 'Ingresa un entero positivo.')
    .refine((value) => Number(value) > 0 && Number(value) <= 2147483647, 'Usa entre 1 y 2147483647 paquetes.'),
  precioVenta: decimalField(2, false),
  activoMarketplace: z.boolean(),
  fotografia: fotografiaSchema.optional(),
});

export const presentacionesSchema = z.object({
  presentaciones: z.array(presentacionSchema).min(1, 'Agrega al menos una presentación.'),
}).superRefine(({ presentaciones }, ctx) => {
  const skus = new Set<string>();
  const ids = new Set<string>();
  presentaciones.forEach((row, index) => {
    if (skus.has(row.sku)) ctx.addIssue({ code: 'custom', path: ['presentaciones', index, 'sku'], message: 'El SKU está duplicado en esta solicitud.' });
    skus.add(row.sku);
    if (row.presentacionId && ids.has(row.presentacionId)) {
      ctx.addIssue({ code: 'custom', path: ['presentaciones', index, 'presentacionId'], message: 'El ID está duplicado.' });
    }
    if (row.presentacionId) ids.add(row.presentacionId);
  });
});

export type PresentacionesFormValues = z.infer<typeof presentacionesSchema>;

export function generatePresentationSku(lot: string, container: string, name: string): string {
  return `${lot.trim()}-${container.trim()}-${name.trim()}`;
}

export function createPresentacionesSchema(lot: string, container: string) {
  return z.object({
    presentaciones: z.array(presentacionSchema.extend({ sku: z.string().trim() })),
  }).transform(({ presentaciones }) => ({
    presentaciones: presentaciones.map((row) => ({
      ...row,
      sku: row.sku || generatePresentationSku(lot, container, row.nombre),
    })),
  })).pipe(presentacionesSchema);
}
