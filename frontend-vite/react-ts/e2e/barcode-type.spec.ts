import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/api-mocks';
import { VALID_CSV } from './fixtures/test-data';

test.beforeEach(async ({ page }) => {
  await setupApiMocks(page);
  await page.goto('/');
});

test('Code 128 and QR Code options are both visible', async ({ page }) => {
  await expect(page.getByRole('button', { name: /Code 128/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /QR Code/ })).toBeVisible();
});

test('toggling to QR Code updates selection', async ({ page }) => {
  await page.getByRole('button', { name: /QR Code/ }).click();
  // After toggling, Code 128 should no longer have the active (DEFAULT badge) indicator
  // The QR Code button should now have the highlighted border (primary)
  const qrButton = page.getByRole('button', { name: /QR Code/ });
  await expect(qrButton).toHaveClass(/border-primary/);
});

test('barcode type is included in the upload request', async ({ page }) => {
  let capturedFormData: string | null = null;
  await page.route('**/upload', async (route) => {
    const postData = route.request().postData();
    capturedFormData = postData;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, user_sheet_id: 'abc', label_count: 3, sheet_count: 1, message: 'done' }) });
  });

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({ name: 'test.csv', mimeType: 'text/csv', buffer: Buffer.from(VALID_CSV) });
  await page.getByRole('button', { name: /QR Code/ }).click();
  await page.getByRole('button', { name: 'Generate Label Sheets' }).click();
  await page.waitForResponse('**/upload');

  expect(capturedFormData).toContain('qr');
});
