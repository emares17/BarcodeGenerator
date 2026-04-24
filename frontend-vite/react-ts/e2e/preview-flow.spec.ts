import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/api-mocks';
import { VALID_CSV } from './fixtures/test-data';

async function uploadFile(page: import('@playwright/test').Page) {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({ name: 'test.csv', mimeType: 'text/csv', buffer: Buffer.from(VALID_CSV) });
}

test.beforeEach(async ({ page }) => {
  await setupApiMocks(page);
  await page.goto('/upload');
});

test('clicking Preview fires POST /preview', async ({ page }) => {
  const previewPromise = page.waitForRequest('**/preview');
  await uploadFile(page);
  await page.getByRole('button', { name: 'Preview First Sheet' }).click();
  const req = await previewPromise;
  expect(req.method()).toBe('POST');
});

test('preview panel appears after successful preview', async ({ page }) => {
  await uploadFile(page);
  await Promise.all([
    page.waitForResponse('**/preview'),
    page.getByRole('button', { name: 'Preview First Sheet' }).click(),
  ]);
  await expect(page.getByText('First Sheet Preview')).toBeVisible();
});

test('preview panel shows label count metadata', async ({ page }) => {
  await uploadFile(page);
  await Promise.all([
    page.waitForResponse('**/preview'),
    page.getByRole('button', { name: 'Preview First Sheet' }).click(),
  ]);
  // Mock returns label_count: 3, total_sheets: 1, labels_on_first_sheet: 3
  await expect(page.getByText(/3 of 3/)).toBeVisible();
});

test('Generate All button is visible in preview panel', async ({ page }) => {
  await uploadFile(page);
  await Promise.all([
    page.waitForResponse('**/preview'),
    page.getByRole('button', { name: 'Preview First Sheet' }).click(),
  ]);
  await expect(page.getByRole('button', { name: 'Generate All' })).toBeVisible();
});

test('clicking Generate All from preview fires POST /upload', async ({ page }) => {
  await uploadFile(page);
  await Promise.all([
    page.waitForResponse('**/preview'),
    page.getByRole('button', { name: 'Preview First Sheet' }).click(),
  ]);

  const uploadPromise = page.waitForRequest('**/upload');
  await page.getByRole('button', { name: 'Generate All' }).click();
  const req = await uploadPromise;
  expect(req.method()).toBe('POST');
});
