import { describe, expect, it } from 'vitest';
import { profileSchema } from './profile';

const validProfile = {
  nombre: 'María',
  apellido: 'Pérez',
  direccion: 'Calle 10',
  telefono: '+573001234567',
  password: '',
};

describe('profileSchema', () => {
  it('accepts the required profile details and an empty optional password', () => {
    expect(profileSchema.safeParse(validProfile).success).toBe(true);
  });

  it('requires a secure password, matching confirmation, only when a new password is typed', () => {
    const issues = (extra: Record<string, string>) => {
      const result = profileSchema.safeParse({ ...validProfile, ...extra });
      return result.success ? [] : result.error.issues.map((issue) => `${issue.path[0]}:${issue.message}`);
    };

    expect(issues({ password: 'abc' })).toContain('password:password_min_length');
    expect(issues({ password: 'abcdefgh1', confirmPassword: 'abcdefgh1' })).toContain('password:password_needs_special');
    expect(issues({ password: 'abcdefg!', confirmPassword: 'abcdefg!' })).toContain('password:password_needs_number');
    expect(issues({ password: 'secret123!' })).toContain('confirmPassword:password_confirmation_required');
    expect(issues({ password: 'secret123!', confirmPassword: 'other123!' })).toContain('confirmPassword:password_mismatch');
    expect(issues({ password: 'secret123!', confirmPassword: 'secret123!' })).toEqual([]);
  });

  it('trims profile values and rejects blank required fields', () => {
    const result = profileSchema.safeParse({ ...validProfile, nombre: '  ', direccion: '  ' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(['nombre', 'direccion']),
      );
    }
  });
});
