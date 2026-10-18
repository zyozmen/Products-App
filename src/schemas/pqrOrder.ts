import { z } from 'zod';

export const pqrOrderSchema = z.object({
  username: z.string().trim().min(1, 'Ingresa el usuario del cliente.'),
  productName: z.string().trim().min(1, 'Ingresa el producto solicitado.'),
  quantity: z.number({ error: 'Ingresa una cantidad válida.' }).int('Usa unidades enteras.').min(1, 'La cantidad mínima es 1.'),
  recipientName: z.string().trim().min(1, 'Ingresa el nombre de quien recibe.'),
  address: z.string().trim().min(1, 'Ingresa la dirección de entrega.'),
  contactPhone: z.string().trim().regex(/^\+?[0-9]{7,15}$/, 'Ingresa un teléfono válido de 7 a 15 dígitos.'),
  notes: z.string().trim().min(1, 'Ingresa el detalle de la solicitud.'),
});

export type PqrOrderForm = z.infer<typeof pqrOrderSchema>;
