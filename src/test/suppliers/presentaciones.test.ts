import { describe, expect, it } from 'vitest';
import { createPresentacionesSchema, fotografiaSchema, presentacionesSchema, presentacionSchema } from '../../schemas/presentaciones';
import { consumedCapacity, decimalUnits, presentationCostCents } from '../../utils/packagingCalculations';
import { readPresentationPhoto, presentationPhotoSrc } from '../../utils/presentationPhoto';
import { serializePresentations } from '../../utils/serializePresentations';

const row = {
  sku: 'SAT-5', nombre: 'Bolsa 5g', contenidoUnidad: '5', unidadesCreadas: '100',
  precioVenta: '45000', activoMarketplace: true,
};

describe('HU-03 presentation validation and exact arithmetic', () => {
  it('generates blank SKUs using lot-container-name and preserves manual SKUs', () => {
    const schema = createPresentacionesSchema(' LOT-01 ', ' CONT-01 ');
    const result = schema.parse({ presentaciones: [
      { ...row, sku: '   ', nombre: ' Bolsa 5g ' },
      { ...row, sku: ' MANUAL ', nombre: 'Otro' },
    ] });
    expect(result.presentaciones.map((item) => item.sku)).toEqual(['LOT-01-CONT-01-Bolsa 5g', 'MANUAL']);
  });

  it('validates generated SKU length and duplicates including manual/generated collisions', () => {
    const schema = createPresentacionesSchema('LOT-01', 'CONT-01');
    expect(schema.safeParse({ presentaciones: [{ ...row, sku: '', nombre: 'n'.repeat(100) }] }).success).toBe(false);
    expect(schema.safeParse({ presentaciones: [{ ...row, sku: '' }, { ...row, sku: ' ' }] }).success).toBe(false);
    expect(schema.safeParse({ presentaciones: [
      { ...row, sku: '' }, { ...row, sku: 'LOT-01-CONT-01-Bolsa 5g' },
    ] }).success).toBe(false);
    expect(schema.safeParse({ presentaciones: [{ ...row, sku: '', nombre: '' }] }).success).toBe(false);
  });

  it('accepts the contract, trims names, and keeps exact decimal input', () => {
    const parsed = presentacionesSchema.parse({ presentaciones: [{ ...row, sku: ' SAT-5 ', nombre: ' Bolsa 5g ' }] });
    expect(parsed.presentaciones[0].sku).toBe('SAT-5');
    expect(presentacionSchema.safeParse({ ...row, contenidoUnidad: '999999999999999.999', precioVenta: '999999999999999.99' }).success).toBe(true);
  });

  it.each([
    { sku: '' }, { nombre: ' ' }, { sku: 's'.repeat(101) }, { nombre: 'n'.repeat(201) },
    { contenidoUnidad: '0' }, { contenidoUnidad: '-1' }, { contenidoUnidad: '0.0001' },
    { contenidoUnidad: '1000000000000000' }, { contenidoUnidad: 'NaN' },
    { unidadesCreadas: '0' }, { unidadesCreadas: '1.5' }, { unidadesCreadas: '2147483648' },
    { precioVenta: '-1' }, { precioVenta: '1.001' }, { precioVenta: '1000000000000000' },
    { presentacionId: 'bad-id' },
  ])('rejects invalid fields: %o', (patch) => {
    expect(presentacionSchema.safeParse({ ...row, ...patch }).success).toBe(false);
  });

  it('accepts zero prices, the Integer maximum and valid optional IDs', () => {
    expect(presentacionSchema.safeParse({ ...row, precioVenta: '0', unidadesCreadas: '2147483647', presentacionId: 'a'.repeat(24) }).success).toBe(true);
  });

  it('rejects empty/null rows and exact case-sensitive duplicate SKUs', () => {
    expect(presentacionesSchema.safeParse({ presentaciones: [] }).success).toBe(false);
    expect(presentacionesSchema.safeParse({ presentaciones: [null] }).success).toBe(false);
    expect(presentacionesSchema.safeParse({ presentaciones: [row, { ...row, sku: ' SAT-5 ' }] }).success).toBe(false);
    expect(presentacionesSchema.safeParse({ presentaciones: [row, { ...row, sku: 'sat-5' }] }).success).toBe(true);
    expect(presentacionesSchema.safeParse({ presentaciones: [
      { ...row, presentacionId: 'a'.repeat(24) }, { ...row, sku: 'different', presentacionId: 'a'.repeat(24) },
    ] }).success).toBe(false);
  });

  it('calculates consumed units and HALF_UP costs without floating point errors', () => {
    expect(consumedCapacity([row, { contenidoUnidad: '10', unidadesCreadas: '50' }])).toBe(decimalUnits(1000));
    expect(consumedCapacity([{ contenidoUnidad: '0.125', unidadesCreadas: '3' }])).toBe(375n);
    expect(presentationCostCents('0.001', 5)).toBe(1n);
    expect(presentationCostCents('5', 5000)).toBe(2500000n);
  });

  it('serializes a bare JSON array with exact numeric decimal tokens, not quoted amounts', () => {
    const text = serializePresentations([{ ...row, contenidoUnidad: '999999999999999.999', precioVenta: '999999999999999.99',
      unidadesCreadas: 1, confirmacionMargenNegativo: false }]);
    expect(text).toContain('"contenidoUnidad":999999999999999.999');
    expect(text).toContain('"precioVenta":999999999999999.99');
    expect(Array.isArray(JSON.parse(text))).toBe(true);
    expect(serializePresentations([{ ...row, contenidoUnidad: '0005.125', precioVenta: '000.00', unidadesCreadas: 1, confirmacionMargenNegativo: false }]))
      .toContain('"contenidoUnidad":5.125,"precioVenta":0.00');
  });
});

describe('HU-03 embedded images', () => {
  const photo = { nombre: 'photo.jpg', extension: 'jpg', filepart: 'YWJj' };
  it('validates pure Base64, name, extension and exact 200 KiB limit', () => {
    expect(fotografiaSchema.safeParse(photo).success).toBe(true);
    expect(fotografiaSchema.safeParse({ ...photo, nombre: 'photo.png' }).success).toBe(false);
    expect(fotografiaSchema.safeParse({ ...photo, filepart: 'data:image/jpeg;base64,YWJj' }).success).toBe(false);
    expect(fotografiaSchema.safeParse({ ...photo, filepart: '????' }).success).toBe(false);
    expect(fotografiaSchema.safeParse({ ...photo, filepart: btoa('a'.repeat(204800)) }).success).toBe(true);
    expect(fotografiaSchema.safeParse({ ...photo, filepart: btoa('a'.repeat(204801)) }).success).toBe(false);
  });

  it('reads an accepted file as JSON photo without data prefix and builds a preview', async () => {
    const result = await readPresentationPhoto(new File(['abc'], 'photo.jpg', { type: 'image/jpeg' }));
    expect(result).toEqual(photo);
    expect(presentationPhotoSrc(result)).toBe('data:image/jpeg;base64,YWJj');
  });

  it('rejects oversized, empty, unsupported or mismatched files before upload', async () => {
    await expect(readPresentationPhoto(new File([new Uint8Array(204801)], 'photo.jpg'))).rejects.toThrow('200 KiB');
    await expect(readPresentationPhoto(new File([], 'photo.png'))).rejects.toThrow('200 KiB');
    await expect(readPresentationPhoto(new File(['abc'], 'photo.gif'))).rejects.toThrow('PNG');
    await expect(readPresentationPhoto(new File(['abc'], 'photo.png', { type: 'image/jpeg' }))).rejects.toThrow('no coincide');
  });
});
