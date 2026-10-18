import { z } from 'zod';

export const profileSchema = z.object({
  nombre: z.string().trim().min(1, 'profile_field_required'),
  apellido: z.string().trim().min(1, 'profile_field_required'),
  direccion: z.string().trim().min(1, 'profile_field_required'),
  telefono: z.string().trim().min(1, 'profile_field_required'),
  password: z.string(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
