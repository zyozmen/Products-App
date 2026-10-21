import { z } from 'zod';
import { getMissingPasswordRequirements } from './registration';

export const profileSchema = z.object({
  nombre: z.string().trim().min(1, 'profile_field_required'),
  apellido: z.string().trim().min(1, 'profile_field_required'),
  direccion: z.string().trim().min(1, 'profile_field_required'),
  telefono: z.string().trim().min(1, 'profile_field_required'),
  password: z.string(),
  confirmPassword: z.string().default(''),
}).superRefine((profile, ctx) => {
  if (!profile.password) return;

  // Misma regla que el registro: mínimo 8 caracteres, un número y un carácter especial.
  const [firstMissing] = getMissingPasswordRequirements(profile.password);
  if (firstMissing) ctx.addIssue({ code: 'custom', path: ['password'], message: firstMissing });

  if (!profile.confirmPassword) {
    ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'password_confirmation_required' });
  } else if (profile.confirmPassword !== profile.password) {
    ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'password_mismatch' });
  }
});

export type ProfileFormValues = z.infer<typeof profileSchema>;