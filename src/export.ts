import { calculateQuote, type QuoteInput } from './calculator';

export function exportQuote(name: string, input: QuoteInput, date = new Date()): string {
  const quote = calculateQuote(input);
  return JSON.stringify({
    schemaVersion: 1, name: name.trim().slice(0, 120) || 'Cotización de impresión 3D',
    createdAt: date.toISOString(), currency: 'CLP', input: { ...input }, quote,
    assumptions: {
      failures: 'Material, electricidad y desgaste se repiten hasta obtener una pieza exitosa. Mano de obra una vez.',
      margin: 'Margen sobre precio de venta; precio = costo / (1 - margen).',
      rounding: 'Precio final redondeado hacia arriba al peso. Costos internos sin redondear.',
      taxes: 'No incluye impuestos ni envío.',
    },
  }, null, 2) + '\n';
}
