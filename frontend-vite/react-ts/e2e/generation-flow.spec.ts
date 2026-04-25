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

test('Generate button shows loading state during upload', async ({ page }) => {
  // Delay the upload response so we can catch the loading state
  await page.route('**/upload', async (route) => {
    await new Promise(r => setTimeout(r, 300));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, user_sheet_id: 'abc', label_count: 3, sheet_count: 1, message: 'Done' }),
    });
  });

  await uploadFile(page);
  await page.getByRole('button', { name: 'Generate Label Sheets' }).click();
  await expect(page.getByRole('button', { name: 'Generating...' })).toBeVisible();
});

test('success message appears after generation completes', async ({ page }) => {
  await uploadFile(page);
  await Promise.all([
    page.waitForResponse('**/upload'),
    page.getByRole('button', { name: 'Generate Label Sheets' }).click(),
  ]);
  await expect(page.getByText(/Successfully processed/)).toBeVisible();
});

test('file selection is cleared after successful generation', async ({ page }) => {
  await uploadFile(page);
  await expect(page.getByRole('button', { name: 'test.csv' })).toBeVisible();
  await Promise.all([
    page.waitForResponse('**/upload'),
    page.getByRole('button', { name: 'Generate Label Sheets' }).click(),
  ]);
  await expect(page.getByRole('button', { name: 'Browse Files' })).toBeVisible();
});
