import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('email_invalid'),
  password: z.string().min(1, 'password_required'),
});

export const registrationSchema = z.object({
  username: z.string().trim().min(1, 'registration_required'),
  email: z.string().trim().email('email_invalid'),
  password: z.string().min(1, 'password_required'),
  nombre: z.string().trim().min(1, 'registration_required'),
  apellido: z.string().trim().min(1, 'registration_required'),
  direccion: z.string().trim().min(1, 'registration_required'),
  telefono: z.string().trim().min(1, 'registration_required'),
  tipoIdentificacion: z.enum(['CC', 'CE', 'Pasaporte', 'NIT']),
  numeroIdentificacion: z.string().trim().min(1, 'registration_required'),
  mayorDeEdad: z.boolean().refine((isAdult) => isAdult, 'register_requires_age'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegistrationFormValues = z.infer<typeof registrationSchema>;
