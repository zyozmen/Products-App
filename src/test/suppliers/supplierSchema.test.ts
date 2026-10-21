import { describe, expect, it } from 'vitest';
import { calculateContainerSubtotalCents, calculateLotTotalCents } from '../../utils/supplierCalculations';
import { containerSchema, lotSchema, paymentSchema, paymentSchemaForBalance, supplierSchema } from '../../schemas/supplier';

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

describe('container validation and lot calculations', () => {
  const containers = [
    { tipoCepa: 'Sativa Premium', unidadBase: 'gramo', capacidadUnidadesBase: 1000, costoBasePorUnidad: 5000 },
    { tipoCepa: 'Indica Gold', unidadBase: 'gramo', capacidadUnidadesBase: 500, costoBasePorUnidad: 6000 },
  ];

  it('calculates rounded subtotals in cents and totals the rounded values', () => {
    expect(calculateLotTotalCents(containers)).toBe(800_000_000n);
    expect(calculateContainerSubtotalCents({
      capacidadUnidadesBase: 0.001,
      costoBasePorUnidad: 5,
    })).toBe(1n);
  });

  it('requires valid type, base unit, positive capacity, and valid monetary precision', () => {
    expect(containerSchema.safeParse({
      tipoCepa: '  Sativa  ',
      unidadBase: ' gramo ',
      presentacionId: '',
      capacidadUnidadesBase: 0.125,
      costoBasePorUnidad: 1.25,
    }).success).toBe(true);
    expect(containerSchema.safeParse({ ...containers[0], tipoCepa: '  ' }).success).toBe(false);
    expect(containerSchema.safeParse({ ...containers[0], unidadBase: ' ' }).success).toBe(false);
    expect(containerSchema.safeParse({ ...containers[0], capacidadUnidadesBase: 0 }).success).toBe(false);
    expect(containerSchema.safeParse({ ...containers[0], capacidadUnidadesBase: 0.1234 }).success).toBe(false);
    expect(containerSchema.safeParse({ ...containers[0], capacidadUnidadesBase: 0.0001 }).success).toBe(false);
    expect(containerSchema.safeParse({ ...containers[0], costoBasePorUnidad: 0.001 }).success).toBe(false);
    expect(containerSchema.safeParse({ ...containers[0], costoBasePorUnidad: 1.0000000001 }).success).toBe(false);
    expect(containerSchema.safeParse({ ...containers[0], costoBasePorUnidad: 1_000_000_000_000_000 }).success).toBe(false);
  });

  it('requires a container, a positive rounded lot total, and a payment within that total', () => {
    expect(lotSchema.safeParse({ contenedores: containers }).success).toBe(true);
    expect(lotSchema.safeParse({ contenedores: [], abonoInicial: 0 }).success).toBe(false);
    expect(lotSchema.safeParse({
      contenedores: [{ ...containers[0], costoBasePorUnidad: 0.01, capacidadUnidadesBase: 0.001 }],
    }).success).toBe(false);
    expect(lotSchema.safeParse({ contenedores: containers, abonoInicial: 8_000_000 }).success).toBe(true);
    expect(lotSchema.safeParse({ contenedores: containers, abonoInicial: 8_000_000.01 }).success).toBe(false);
    expect(lotSchema.safeParse({ contenedores: containers, abonoInicial: null }).success).toBe(true);
  });
});

describe('payment validation', () => {
  it('requires a positive amount with no more than two decimals', () => {
    expect(paymentSchema.safeParse({ monto: 1.25, tipo: 'ABONO' }).success).toBe(true);
    expect(paymentSchema.safeParse({ monto: 0, tipo: 'ABONO' }).success).toBe(false);
    expect(paymentSchema.safeParse({ monto: 1.256, tipo: 'ABONO' }).success).toBe(false);
    expect(paymentSchema.safeParse({ monto: 1, tipo: 'DEUDA_LOTE' }).success).toBe(false);
    expect(paymentSchema.safeParse({ monto: 1_000_000_000_000_000, tipo: 'ABONO' }).success).toBe(false);
  });

  it('limits the amount to the supplier balance and validates an optional lot ID', () => {
    const validate = paymentSchemaForBalance(200);
    expect(validate.safeParse({ monto: 200, tipo: 'ABONO' }).success).toBe(true);
    expect(validate.safeParse({ monto: 200.01, tipo: 'ABONO' }).success).toBe(false);
    expect(validate.safeParse({ monto: 10, loteId: 'invalid', tipo: 'ABONO' }).success).toBe(false);
  });
});
