import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/api-mocks';

test.beforeEach(async ({ page }) => {
  await setupApiMocks(page);
  await page.goto('/inventory');
});

test('sheet history table renders rows from GET /my-sheets', async ({ page }) => {
  // Mock returns one sheet: inventory.csv
  await expect(page.getByText('inventory.csv')).toBeVisible();
});

test('empty state message is shown when no sheets exist', async ({ page }) => {
  await setupApiMocks(page, { mySheets: { status: 200, body: { sheets: [] } } });
  await page.reload();
  await expect(page.getByText(/0 generated sheet/)).toBeVisible();
});

test('download button fires GET /download-sheet/{id}', async ({ page }) => {
  const downloadPromise = page.waitForRequest('**/download-sheet/**');
  await page.getByRole('button', { name: /Download/i }).first().click();
  const req = await downloadPromise;
  expect(req.method()).toBe('GET');
});

test('delete button triggers confirmation before DELETE request', async ({ page }) => {
  let deleteRequestFired = false;
  await page.route('**/delete-sheet/**', async (route) => {
    deleteRequestFired = true;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });

  page.on('dialog', async dialog => {
    // Dismiss the confirm dialog — DELETE should NOT fire
    await dialog.dismiss();
  });

  await page.getByRole('button', { name: /Delete/i }).first().click();
  await page.waitForTimeout(200);
  expect(deleteRequestFired).toBe(false);
});

test('confirmed delete removes the row from the table', async ({ page }) => {
  page.on('dialog', async dialog => dialog.accept());

  await expect(page.getByText('inventory.csv')).toBeVisible();
  await Promise.all([
    page.waitForResponse('**/delete-sheet/**'),
    page.getByRole('button', { name: /Delete/i }).first().click(),
  ]);
  await expect(page.getByText('inventory.csv')).not.toBeVisible();
});
