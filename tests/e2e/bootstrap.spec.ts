import { test, expect } from '@playwright/test';
test('renders foundation and actual API liveness', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Plataforma de aula' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('API activa');
});
test('reports unavailable API truthfully', async ({ page }) => {
  await page.route('**/health/live', route => route.abort());
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('API no disponible');
});
