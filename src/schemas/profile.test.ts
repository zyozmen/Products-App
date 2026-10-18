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
