// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from 'vitest';
import html from '../index.html?raw';

const preference = { matches: false, addEventListener: vi.fn() };
const select = <T extends HTMLElement>(selector: string): T => document.querySelector<T>(selector)!;
function change(id: string, value: string): void {
  const input = select<HTMLInputElement>(`#${id}`);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

beforeAll(async () => {
  document.documentElement.innerHTML = html.replace(/<!doctype html>/i, '');
  vi.stubGlobal('matchMedia', vi.fn(() => preference));
  await import('../src/main');
});

describe('interacción en DOM simulado', () => {
  it('presenta el ejemplo, nombre y unidades accesibles', () => {
    expect(select<HTMLOutputElement>('#total-price').value).toContain('10.934');
    change('project-name', '<script>ejemplo</script>');
    expect(select('#quote-name').textContent).toBe('<script>ejemplo</script>');
    expect(select('#quote-name').children).toHaveLength(0);
    expect(select('#grams').getAttribute('aria-describedby')).toBe('grams-unit');
  });
  it('oculta resultados y bloquea exportar ante datos inválidos', () => {
    change('grams', '');
    expect(select<HTMLOutputElement>('#total-price').value).toBe('—');
    expect(select<HTMLButtonElement>('#export-button').disabled).toBe(true);
    expect(select('#error-message').hidden).toBe(false);
    expect(select('#grams').getAttribute('aria-invalid')).toBe('true');
    change('grams', '240');
    expect(select<HTMLButtonElement>('#export-button').disabled).toBe(false);
    expect(select('#error-message').hidden).toBe(true);
    expect(select<HTMLOutputElement>('#total-price').value).not.toContain('10.934');
  });
  it('limita porcentajes y restablece el ejemplo', () => {
    change('marginPercent', '100');
    expect(select<HTMLButtonElement>('#print-button').disabled).toBe(true);
    select<HTMLButtonElement>('#reset-button').click();
    expect(select<HTMLOutputElement>('#total-price').value).toContain('10.934');
    expect(select<HTMLInputElement>('#project-name').value).toBe('');
  });
  it('alterna y persiste el tema', () => {
    select<HTMLButtonElement>('#theme-toggle').click();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('cotiza3d-theme')).toBe('dark');
    expect(select('#theme-toggle').getAttribute('aria-pressed')).toBe('true');
    select<HTMLButtonElement>('#theme-toggle').click();
    expect(document.documentElement.dataset.theme).toBe('light');
  });
  it('crea y libera una descarga local de cotización', async () => {
    vi.useFakeTimers();
    const create = vi.fn(() => 'blob:cotizacion');
    const revoke = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: create });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    select<HTMLButtonElement>('#export-button').click();
    expect(create).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector('a[download]')).toBeNull();
    await vi.advanceTimersByTimeAsync(1000);
    expect(revoke).toHaveBeenCalledWith('blob:cotizacion');
    click.mockRestore(); vi.useRealTimers();
  });
});
