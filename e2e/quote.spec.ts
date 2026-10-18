import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test('cotizar, validar, descargar y restablecer', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#total-price')).toContainText('10.934');
  await page.getByLabel('Nombre del proyecto').fill('Soporte de escritorio');
  await page.getByLabel('Filamento por pieza').fill('240');
  await expect(page.locator('#total-price')).not.toContainText('10.934');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar cotización' }).click();
  const path = await (await downloading).path();
  expect(path).not.toBeNull();
  const data = JSON.parse(await readFile(path!, 'utf8'));
  expect(data).toMatchObject({ name: 'Soporte de escritorio', input: { grams: 240 }, currency: 'CLP' });
  await page.getByLabel('Tasa de fallos').fill('100');
  await expect(page.getByRole('button', { name: 'Exportar cotización' })).toBeDisabled();
  await expect(page.locator('#total-price')).toContainText('—');
  await page.getByRole('button', { name: 'Restablecer ejemplo' }).click();
  await expect(page.locator('#total-price')).toContainText('10.934');
});

test('temas, accesibilidad y ausencia de desbordamiento horizontal', async ({ page }) => {
  await page.goto('/');
  for (const theme of ['dark', 'light']) {
    const current = await page.locator('html').getAttribute('data-theme');
    if (current !== theme) await page.locator('#theme-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('captura real de la calculadora', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByLabel('Nombre del proyecto').fill('Soporte de escritorio');
  await expect(page.locator('#total-price')).toContainText('10.934');
  await page.screenshot({ path: testInfo.outputPath('cotiza-3d.png'), fullPage: true });
});
