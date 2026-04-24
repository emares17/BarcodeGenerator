import { test, expect } from '@playwright/test';
import { setupApiMocks, } from './fixtures/api-mocks';
import { VALID_CSV } from './fixtures/test-data';

test.beforeEach(async ({ page }) => {
  await setupApiMocks(page);
  await page.goto('/upload');
});

test('file input accepts a valid CSV and shows filename', async ({ page }) => {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'inventory.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(VALID_CSV),
  });
  await expect(page.getByRole('button', { name: 'inventory.csv' })).toBeVisible();
});

test('Browse Files button is visible before file selection', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Browse Files' })).toBeVisible();
});

test('second file selection replaces the first', async ({ page }) => {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({ name: 'first.csv', mimeType: 'text/csv', buffer: Buffer.from(VALID_CSV) });
  await expect(page.getByRole('button', { name: 'first.csv' })).toBeVisible();
  await fileInput.setInputFiles({ name: 'second.csv', mimeType: 'text/csv', buffer: Buffer.from(VALID_CSV) });
  await expect(page.getByRole('button', { name: 'second.csv' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'first.csv' })).not.toBeVisible();
});

test('Generate button is disabled before file selection', async ({ page }) => {
  const generateBtn = page.getByRole('button', { name: 'Generate Label Sheets' });
  await expect(generateBtn).toBeDisabled();
});

test('Preview button is disabled before file selection', async ({ page }) => {
  const previewBtn = page.getByRole('button', { name: 'Preview First Sheet' });
  await expect(previewBtn).toBeDisabled();
});
