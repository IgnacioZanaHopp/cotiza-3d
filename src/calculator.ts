export interface QuoteInput {
  grams: number;
  filamentPerKg: number;
  watts: number;
  hours: number;
  electricityPerKwh: number;
  wearPerHour: number;
  failurePercent: number;
  laborMinutes: number;
  laborPerHour: number;
  marginPercent: number;
}

export interface Quote {
  filament: number;
  electricity: number;
  wear: number;
  failureAllowance: number;
  labor: number;
  cost: number;
  profit: number;
  price: number;
}

export const defaults: Readonly<QuoteInput> = Object.freeze({
  grams: 120, filamentPerKg: 22000, watts: 150, hours: 6,
  electricityPerKwh: 220, wearPerHour: 300, failurePercent: 10,
  laborMinutes: 25, laborPerHour: 6000, marginPercent: 30,
});

export class QuoteInputError extends Error {
  constructor(message: string, public readonly field: keyof QuoteInput | null = null) {
    super(message); this.name = 'QuoteInputError';
  }
}

/** Coste esperado: los fallos repiten material/máquina; la mano de obra se cobra una vez. */
export function calculateQuote(input: QuoteInput): Quote {
  for (const key of Object.keys(defaults) as (keyof QuoteInput)[]) {
    if (!Number.isFinite(input[key]) || input[key] < 0) throw new QuoteInputError('Ingresa valores finitos no negativos.', key);
  }
  for (const field of ['failurePercent', 'marginPercent'] as const) {
    if (input[field] >= 100) throw new QuoteInputError('El porcentaje debe ser menor que 100.', field);
  }
  const filament = input.grams / 1000 * input.filamentPerKg;
  const electricity = input.watts / 1000 * input.hours * input.electricityPerKwh;
  const wear = input.hours * input.wearPerHour;
  const printCost = filament + electricity + wear;
  const expectedPrintCost = printCost / (1 - input.failurePercent / 100);
  const failureAllowance = expectedPrintCost - printCost;
  const labor = input.laborMinutes / 60 * input.laborPerHour;
  const cost = expectedPrintCost + labor;
  // Margen sobre venta: (precio - costo) / precio. Redondeo hacia arriba al CLP.
  const price = Math.ceil(cost / (1 - input.marginPercent / 100));
  if (!Number.isSafeInteger(price) || !Number.isFinite(cost)) throw new QuoteInputError('Los valores exceden el rango de cálculo.');
  return { filament, electricity, wear, failureAllowance, labor, cost, price, profit: price - cost };
}
