import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/api-mocks';
import { VALID_CSV } from './fixtures/test-data';

test.beforeEach(async ({ page }) => {
  await setupApiMocks(page);
  await page.goto('/upload');
});

test('all four templates are visible', async ({ page }) => {
  await expect(page.getByRole('button', { name: /Standard 20/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /5163/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /5160/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /94233/ })).toBeVisible();
});

test('selecting a template marks it as active', async ({ page }) => {
  await page.getByRole('button', { name: /5163/ }).click();
  // The selected template shows a DEFAULT badge
  const badge = page.locator('span', { hasText: 'DEFAULT' });
  const templateBtn = page.getByRole('button', { name: /5163/ });
  await expect(templateBtn).toContainText('DEFAULT');
  await expect(badge).toBeVisible();
});

test('5160 template limits text fields to 1', async ({ page }) => {
  // Load a file to enable the form
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({ name: 'test.csv', mimeType: 'text/csv', buffer: Buffer.from(VALID_CSV) });

  // Start with standard_20 (max 2 text fields) — add a second field
  await page.getByRole('button', { name: /Standard 20/ }).click();
  const addBtn = page.getByRole('button', { name: /Add text field/ });
  if (await addBtn.isVisible()) {
    await addBtn.click();
  }

  // Switch to 5160 (max 1 text field) — second field should be removed
  await page.getByRole('button', { name: /5160/ }).click();
  const removeButtons = page.locator('button[title="Remove field"]');
  await expect(removeButtons).toHaveCount(1);
});

test('switching templates does not clear the selected file', async ({ page }) => {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({ name: 'test.csv', mimeType: 'text/csv', buffer: Buffer.from(VALID_CSV) });
  await page.getByRole('button', { name: /5163/ }).click();
  await expect(page.getByRole('button', { name: 'test.csv' })).toBeVisible();
});
