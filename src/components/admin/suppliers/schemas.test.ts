import { describe, expect, it } from 'vitest';
import { lotSchema, paymentSchema, paymentSchemaForBalance, supplierSchema } from './schemas';

describe('supplier form validation', () => {
  it('accepts a valid supplier with optional contact fields', () => {
    expect(supplierSchema.safeParse({ nombre: 'Café Colombia', nit: '900123456-1', telefono: '', email: '' }).success).toBe(true);
  });

  it('rejects invalid contact information', () => {
    expect(supplierSchema.safeParse({
      nombre: 'Proveedor',
      nit: '123',
      telefono: '12',
      email: 'correo-invalido',
    }).success).toBe(false);
  });
});

describe('lot form financial validation', () => {
  const baseLot = {
    codigoLote: 'LOT-2026-001',
    presentaciones: [{ presentacionId: 'PRES-01', cantidadUnidades: 100, costoUnitario: 3000 }],
  };

  it('allows a zero or absent initial payment', () => {
    expect(lotSchema.safeParse({ ...baseLot, abonoInicial: 0 }).success).toBe(true);
    expect(lotSchema.safeParse({ ...baseLot, abonoInicial: Number.NaN }).success).toBe(true);
  });

  it('allows an initial payment equal to the lot total', () => {
    expect(lotSchema.safeParse({ ...baseLot, abonoInicial: 300000 }).success).toBe(true);
  });

  it('rejects an initial payment above the lot total', () => {
    expect(lotSchema.safeParse({ ...baseLot, abonoInicial: 300000.01 }).success).toBe(false);
  });

  it('rejects negative payments and amounts with more than two decimals', () => {
    expect(lotSchema.safeParse({ ...baseLot, abonoInicial: -1 }).success).toBe(false);
    expect(lotSchema.safeParse({ ...baseLot, abonoInicial: 0.001 }).success).toBe(false);
  });
});

describe('payment validation', () => {
  it('requires a positive amount with no more than two decimals', () => {
    expect(paymentSchema.safeParse({ monto: 1.25, tipo: 'ABONO' }).success).toBe(true);
    expect(paymentSchema.safeParse({ monto: 0, tipo: 'ABONO' }).success).toBe(false);
    expect(paymentSchema.safeParse({ monto: 1.256, tipo: 'ABONO' }).success).toBe(false);
    expect(paymentSchema.safeParse({ monto: 1, tipo: 'DEUDA_LOTE' }).success).toBe(false);
  });

  it('limits the amount to the supplier balance and validates an optional lot ID', () => {
    const validate = paymentSchemaForBalance(200);
    expect(validate.safeParse({ monto: 200, tipo: 'ABONO' }).success).toBe(true);
    expect(validate.safeParse({ monto: 200.01, tipo: 'ABONO' }).success).toBe(false);
    expect(validate.safeParse({ monto: 10, loteId: 'invalid', tipo: 'ABONO' }).success).toBe(false);
  });
});
