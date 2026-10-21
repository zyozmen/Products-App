import { z } from 'zod';
import { calculateLotTotalCents } from '../utils/supplierCalculations';

const hasAtMostDecimals = (amount: number, places: number) => {
  if (!Number.isFinite(amount)) return false;
  const [coefficient, exponentText] = amount.toString().toLowerCase().split('e');
  const decimalPlaces = coefficient.split('.')[1]?.length ?? 0;
  const exponent = Number(exponentText ?? 0);
  return Math.max(0, decimalPlaces - exponent) <= places;
};

const hasAtMostTwoDecimals = (amount: number) => hasAtMostDecimals(amount, 2);
const belowMaximumAmount = (amount: number) => amount < 1_000_000_000_000_000;

const optionalTrimmed = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(''));

export const supplierSchema = z.object({
  nombre: z.string().trim().min(1, 'Ingresa el nombre del proveedor.').max(150, 'Máximo 150 caracteres.'),
  nit: z.string().trim().min(1, 'Ingresa el NIT.').max(30, 'Máximo 30 caracteres.'),
  telefono: optionalTrimmed(20).refine(
    (value) => !value || /^\+?[0-9]{7,15}$/.test(value),
    'Usa entre 7 y 15 dígitos; puedes incluir + al inicio.',
  ),
  email: optionalTrimmed(254).refine(
    (value) => !value || z.string().email().safeParse(value).success,
    'Ingresa un correo electrónico válido.',
  ),
});

export const containerSchema = z.object({
  tipoCepa: z.string().trim().min(1, 'Ingresa el tipo o cepa.'),
  unidadBase: z.string().trim().min(1, 'Ingresa la unidad base.'),
  presentacionId: z.string().trim().optional().or(z.literal('')),
  capacidadUnidadesBase: z.number({ error: 'Ingresa una capacidad válida.' })
    .positive('La capacidad debe ser mayor que cero.')
    .refine(belowMaximumAmount, 'La capacidad admite máximo 15 enteros.')
    .refine((value) => hasAtMostDecimals(value, 3), 'Usa máximo 3 decimales.'),
  costoBasePorUnidad: z.number({ error: 'Ingresa un costo válido.' })
    .min(0.01, 'El costo mínimo es $0,01.')
    .refine(belowMaximumAmount, 'El costo admite máximo 15 enteros.')
    .refine(hasAtMostTwoDecimals, 'Usa máximo 2 decimales.'),
});

export const lotSchema = z.object({
  contenedores: z.array(containerSchema).min(1, 'Agrega al menos un contenedor.'),
  abonoInicial: z.preprocess(
    (value) => value === null || (typeof value === 'number' && Number.isNaN(value)) ? undefined : value,
    z.number({ error: 'Ingresa un valor válido.' })
      .min(0, 'El abono no puede ser negativo.')
      .refine(belowMaximumAmount, 'El abono admite máximo 15 enteros.')
      .refine(hasAtMostTwoDecimals, 'Usa máximo 2 decimales.')
      .optional(),
  ),
}).superRefine((values, context) => {
  const totalCents = calculateLotTotalCents(values.contenedores);
  const paymentCents = Math.round((values.abonoInicial ?? 0) * 100);
  if (totalCents <= 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['contenedores'],
      message: 'El valor total redondeado del lote debe ser mayor que cero.',
    });
  }
  if (paymentCents > totalCents) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['abonoInicial'],
      message: 'El abono inicial no puede superar el total del lote.',
    });
  }
});

export const paymentSchema = z.object({
  monto: z.number({ error: 'Ingresa un monto válido.' })
    .positive('El monto debe ser mayor a $0.')
    .refine(belowMaximumAmount, 'El monto admite máximo 15 enteros.')
    .refine(hasAtMostTwoDecimals, 'Usa máximo 2 decimales.'),
  loteId: z.string().trim().optional().refine(
    (value) => !value || /^[a-f\d]{24}$/i.test(value),
    'El ID del lote debe tener 24 caracteres hexadecimales.',
  ),
  tipo: z.enum(['ABONO', 'PAGO_CORTESIA', 'AJUSTE_PQR']),
  observaciones: z.string().trim().max(500, 'Máximo 500 caracteres.').optional(),
});

export const paymentSchemaForBalance = (availableBalance: number) =>
  paymentSchema.refine(
    ({ monto }) => monto <= availableBalance,
    { path: ['monto'], message: 'El monto supera el saldo pendiente del proveedor.' },
  );

export const liquidationSchema = z.object({
  montoLiquidable: z.number({ error: 'Ingresa un monto válido.' })
    .min(0, 'El monto no puede ser negativo.')
    .refine(hasAtMostTwoDecimals, 'Usa máximo 2 decimales.'),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;
export type LotFormInput = z.input<typeof lotSchema>;
export type LotFormValues = z.infer<typeof lotSchema>;
export type PaymentFormValues = z.infer<typeof paymentSchema>;
export type LiquidationFormValues = z.infer<typeof liquidationSchema>;
