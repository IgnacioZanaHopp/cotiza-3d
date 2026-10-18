import './style.css';
import { calculateQuote, defaults, type QuoteInput, type Quote } from './calculator';
import { exportQuote } from './export';

function element<T extends HTMLElement>(selector: string): T {
  const value = document.querySelector<T>(selector);
  if (!value) throw new Error(`Falta el elemento ${selector}`);
  return value;
}
const form = element<HTMLFormElement>('#quote-form');
const nameInput = element<HTMLInputElement>('#project-name');
const exportButton = element<HTMLButtonElement>('#export-button');
const printButton = element<HTMLButtonElement>('#print-button');
const errorMessage = element<HTMLParagraphElement>('#error-message');
const total = element<HTMLOutputElement>('#total-price');
const marginNote = element<HTMLParagraphElement>('#margin-note');
const costs = [...document.querySelectorAll<HTMLElement>('[data-cost]')];
const money = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const keys = Object.keys(defaults) as (keyof QuoteInput)[];
const inputs = new Map(keys.map(key => [key, element<HTMLInputElement>(`#${key}`)]));
for (const [key, input] of inputs) input.setAttribute('aria-describedby', `${key}-unit`);
let validInput: QuoteInput | null = null;

function render(): void {
  element('#quote-name').textContent = nameInput.value.trim() || 'Cotización de impresión 3D';
  const values = {} as QuoteInput;
  let invalid = false;
  for (const [key, input] of inputs) {
    const ok = input.validity.valid && Number.isFinite(input.valueAsNumber);
    input.setAttribute('aria-invalid', String(!ok));
    invalid ||= !ok;
    values[key] = input.valueAsNumber;
  }
  try {
    if (invalid) throw new Error('Revisa los campos marcados: completa todos los valores, sin negativos. Los porcentajes deben estar entre 0 y 99.');
    const quote = calculateQuote(values);
    validInput = values;
    for (const node of costs) node.textContent = money.format(quote[node.dataset.cost as keyof Quote]);
    total.value = money.format(quote.price);
    marginNote.textContent = `${values.marginPercent.toLocaleString('es-CL')}% de margen sobre la venta · una pieza`;
    errorMessage.hidden = true;
    errorMessage.textContent = '';
    exportButton.disabled = false; printButton.disabled = false;
  } catch (error) {
    validInput = null;
    for (const node of costs) node.textContent = '—';
    total.value = '—'; marginNote.textContent = 'Completa los datos para calcular.';
    errorMessage.textContent = error instanceof Error ? error.message : 'No fue posible calcular.';
    errorMessage.hidden = false;
    exportButton.disabled = true; printButton.disabled = true;
  }
}
form.addEventListener('input', render);
form.addEventListener('submit', (event) => { event.preventDefault(); render(); });
element<HTMLButtonElement>('#reset-button').addEventListener('click', () => { form.reset(); render(); });
exportButton.addEventListener('click', () => {
  if (!validInput) return;
  const now = new Date();
  const blob = new Blob([exportQuote(nameInput.value, validInput, now)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = `cotizacion-3d-${now.toISOString().slice(0, 10)}.json`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
printButton.addEventListener('click', () => { if (validInput) window.print(); });

const themeButton = element<HTMLButtonElement>('#theme-toggle');
const preference = window.matchMedia('(prefers-color-scheme: dark)');
let saved: string | null = null;
try { saved = localStorage.getItem('cotiza3d-theme'); } catch { /* Sigue funcionando sin almacenamiento. */ }
let manualTheme = saved === 'dark' || saved === 'light';
function setTheme(dark: boolean): void {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
  themeButton.textContent = dark ? 'Modo claro ☀' : 'Modo oscuro ◐';
  element<HTMLMetaElement>('meta[name="theme-color"]').content = dark ? '#171c19' : '#f5f4ef';
}
setTheme(manualTheme ? saved === 'dark' : preference.matches);
themeButton.addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  manualTheme = true; setTheme(dark);
  try { localStorage.setItem('cotiza3d-theme', dark ? 'dark' : 'light'); } catch { /* Preferencia solo de esta sesión. */ }
});
preference.addEventListener('change', () => { if (!manualTheme) setTheme(preference.matches); });
render();
