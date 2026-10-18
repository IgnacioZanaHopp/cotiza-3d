import { describe, expect, it } from 'vitest';
import { calculateQuote, defaults, QuoteInputError } from '../src/calculator';
import { exportQuote } from '../src/export';

describe('costos por impresión', () => {
  it('convierte gramos, watts y minutos con un ejemplo independiente', () => {
    const quote = calculateQuote({ grams: 200, filamentPerKg: 20000, watts: 100, hours: 5, electricityPerKwh: 200, wearPerHour: 100, failurePercent: 0, laborMinutes: 30, laborPerHour: 4000, marginPercent: 0 });
    expect(quote).toEqual({ filament: 4000, electricity: 100, wear: 500, failureAllowance: 0, labor: 2000, cost: 6600, price: 6600, profit: 0 });
  });
  it('calcula repeticiones esperadas, sin duplicar mano de obra', () => {
    const quote = calculateQuote({ ...defaults, grams: 100, filamentPerKg: 10000, watts: 0, hours: 0, failurePercent: 50, laborMinutes: 60, laborPerHour: 5000, marginPercent: 0 });
    expect(quote.failureAllowance).toBe(1000);
    expect(quote.cost).toBe(7000);
  });
  it('aplica margen sobre venta y redondea hacia arriba', () => {
    const quote = calculateQuote({ ...defaults, grams: 1, filamentPerKg: 1000, hours: 0, failurePercent: 0, laborMinutes: 0, marginPercent: 30 });
    expect(quote.cost).toBe(1);
    expect(quote.price).toBe(2);
    expect(quote.profit / quote.price).toBeGreaterThanOrEqual(0.3);
  });
  it('verifica el ejemplo predeterminado y su desglose', () => {
    const quote = calculateQuote(defaults);
    expect(quote.filament).toBe(2640);
    expect(quote.electricity).toBeCloseTo(198);
    expect(quote.wear).toBe(1800);
    expect(quote.failureAllowance).toBeCloseTo(515.333333);
    expect(quote.labor).toBe(2500);
    expect(quote.cost).toBeCloseTo(7653.333333);
    expect(quote.price).toBe(10934);
    expect(quote.cost).toBeCloseTo(quote.filament + quote.electricity + quote.wear + quote.failureAllowance + quote.labor);
  });
  it('acepta una cotización gratuita y ceros en todos los campos', () => {
    const input = Object.fromEntries(Object.keys(defaults).map((key) => [key, 0])) as unknown as typeof defaults;
    expect(calculateQuote(input).price).toBe(0);
  });
  it.each(Object.keys(defaults) as (keyof typeof defaults)[])('valida el campo %s', (field) => {
    for (const value of [-1, NaN, Infinity, -Infinity, undefined]) {
      expect(() => calculateQuote({ ...defaults, [field]: value })).toThrow(QuoteInputError);
    }
  });
  it.each(['failurePercent', 'marginPercent'] as const)('rechaza %s al 100%%', (field) => {
    expect(() => calculateQuote({ ...defaults, [field]: 100 })).toThrow(QuoteInputError);
    expect(() => calculateQuote({ ...defaults, [field]: 101 })).toThrow(QuoteInputError);
    expect(calculateQuote({ ...defaults, [field]: 99 }).price).toBeGreaterThan(0);
  });
  it('rechaza resultados fuera del rango numérico', () => {
    expect(() => calculateQuote({ ...defaults, grams: Number.MAX_VALUE })).toThrow(QuoteInputError);
  });
  it('mantiene monotonicidad y margen con valores decimales', () => {
    const quote = calculateQuote({ ...defaults, grams: 123.45, hours: 7.25, marginPercent: 42.5 });
    expect(quote.profit / quote.price).toBeGreaterThanOrEqual(0.425);
    expect(calculateQuote({ ...defaults, failurePercent: 20 }).price).toBeGreaterThan(calculateQuote(defaults).price);
    expect(calculateQuote({ ...defaults, marginPercent: 40 }).price).toBeGreaterThan(calculateQuote(defaults).price);
  });
  it('no modifica los datos de entrada', () => {
    expect(() => calculateQuote(Object.freeze({ ...defaults }))).not.toThrow();
  });
});

describe('exportación', () => {
  it('incluye entradas, desglose, fecha y supuestos para reproducir el precio', () => {
    const value = JSON.parse(exportQuote('  Soporte de escritorio  ', defaults, new Date('2026-10-18T12:00:00Z')));
    expect(value).toMatchObject({ schemaVersion: 1, currency: 'CLP', name: 'Soporte de escritorio', createdAt: '2026-10-18T12:00:00.000Z', input: defaults, quote: { price: 10934 } });
    expect(value.assumptions.margin).toContain('precio de venta');
  });
  it('normaliza el nombre y valida antes de exportar', () => {
    expect(JSON.parse(exportQuote(' ', defaults)).name).toBe('Cotización de impresión 3D');
    expect(JSON.parse(exportQuote('a'.repeat(200), defaults)).name).toHaveLength(120);
    expect(() => exportQuote('Título', { ...defaults, marginPercent: 100 })).toThrow(QuoteInputError);
  });
});
