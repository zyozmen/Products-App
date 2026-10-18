import { z } from 'zod';

const hasAtMostTwoDecimals = (amount: number) =>
  Number.isFinite(amount) && Math.abs(amount * 100 - Math.round(amount * 100)) < 1e-8;

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

export const presentationSchema = z.object({
  presentacionId: z.string().trim().min(1, 'Ingresa la presentación.'),
  cantidadUnidades: z.number({ error: 'Ingresa una cantidad válida.' })
    .int('La cantidad debe ser un número entero.')
    .min(1, 'La cantidad mínima es 1.'),
  costoUnitario: z.number({ error: 'Ingresa un costo válido.' })
    .min(0.01, 'El costo mínimo es $0,01.')
    .refine(hasAtMostTwoDecimals, 'Usa máximo 2 decimales.'),
});

export const lotSchema = z.object({
  codigoLote: z.string().trim().min(1, 'Ingresa el código del lote.'),
  presentaciones: z.array(presentationSchema).min(1, 'Agrega al menos una presentación.'),
  abonoInicial: z.preprocess(
    (value) => typeof value === 'number' && Number.isNaN(value) ? undefined : value,
    z.number({ error: 'Ingresa un valor válido.' })
      .min(0, 'El abono no puede ser negativo.')
      .refine(hasAtMostTwoDecimals, 'Usa máximo 2 decimales.')
      .optional(),
  ),
}).superRefine((values, context) => {
  const totalCents = values.presentaciones.reduce(
    (sum, item) => sum + Math.round(item.costoUnitario * 100) * item.cantidadUnidades,
    0,
  );
  const paymentCents = Math.round((values.abonoInicial ?? 0) * 100);
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
