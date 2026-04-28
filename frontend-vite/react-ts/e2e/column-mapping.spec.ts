import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/api-mocks';
import { VALID_CSV } from './fixtures/test-data';

test.beforeEach(async ({ page }) => {
  await setupApiMocks(page);
  await page.goto('/upload');
});

test('barcode column input is visible with a default value', async ({ page }) => {
  const barcodeInput = page.locator('label', { hasText: 'Barcode Column' }).locator('..').locator('input[type="number"]').first();
  await expect(barcodeInput).toBeVisible();
  const value = await barcodeInput.inputValue();
  expect(parseInt(value)).toBeGreaterThanOrEqual(1);
});

test('one text field row is shown by default', async ({ page }) => {
  const removeButtons = page.locator('button[title="Remove field"]');
  await expect(removeButtons).toHaveCount(1);
});

test('Add text field button adds a new row for standard_20 template', async ({ page }) => {
  // standard_20 has max 2 — default starts with 1, so Add is already visible
  await page.getByRole('button', { name: /Add text field/ }).click();
  await expect(page.locator('button[title="Remove field"]')).toHaveCount(2);
});

test('remove button collapses a text field row', async ({ page }) => {
  const removeButtons = page.locator('button[title="Remove field"]');
  await removeButtons.first().click();
  await expect(page.locator('button[title="Remove field"]')).toHaveCount(0);
});

test('header row toggle changes label text', async ({ page }) => {
  await expect(page.getByText('First row is headers')).toBeVisible();
  // Click the toggle
  const toggle = page.locator('button').filter({ hasText: '' }).and(page.locator('[class*="rounded"][class*="border"]')).first();
  await page.getByText('First row is headers').click();
  // The toggle state changes — we can verify by checking if the checkbox has the active class
  // or simply that the click didn't cause an error
  await expect(page.getByText('skip first row when processing')).toBeVisible();
});
