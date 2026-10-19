import { describe, expect, it } from 'vitest';
import { loginSchema, registrationSchema } from './registration';

describe('loginSchema', () => {
  it('trims a valid email and requires a password', () => {
    const result = loginSchema.safeParse({ email: ' user@example.com ', password: 'secret' });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('user@example.com');
    expect(loginSchema.safeParse({ email: 'invalid', password: '' }).success).toBe(false);
  });
});

describe('registrationSchema', () => {
  const validRegistration = {
    username: 'customer',
    email: 'person@example.com',
    password: 'secret123',
    confirmPassword: 'secret123',
    nombre: 'María',
    apellido: 'Pérez',
    direccion: 'Calle 10',
    telefono: '3001234567',
    tipoIdentificacion: 'CC',
    numeroIdentificacion: '123456789',
    mayorDeEdad: true,
  };

  it('accepts all required account and identity fields', () => {
    expect(registrationSchema.safeParse(validRegistration).success).toBe(true);
  });

  it('rejects invalid email, missing identity information, and absent age consent', () => {
    expect(registrationSchema.safeParse({
      ...validRegistration,
      email: 'invalid',
      numeroIdentificacion: ' ',
      mayorDeEdad: false,
    }).success).toBe(false);
  });

  it('requires an eight-character password and matching confirmation', () => {
    expect(registrationSchema.safeParse({
      ...validRegistration,
      password: 'short',
      confirmPassword: 'short',
    }).success).toBe(false);
    expect(registrationSchema.safeParse({
      ...validRegistration,
      confirmPassword: 'different123',
    }).success).toBe(false);
    expect(registrationSchema.safeParse({
      ...validRegistration,
      confirmPassword: '',
    }).success).toBe(false);
  });

});
