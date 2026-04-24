import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/api-mocks';
import { ERROR_PAYLOADS, VALID_CSV } from './fixtures/test-data';

async function uploadFile(page: import('@playwright/test').Page) {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({ name: 'test.csv', mimeType: 'text/csv', buffer: Buffer.from(VALID_CSV) });
}

test('401 response shows authentication error message', async ({ page }) => {
  await setupApiMocks(page, { upload: { status: 401, body: ERROR_PAYLOADS[401] } });
  await page.goto('/upload');
  await uploadFile(page);
  await Promise.all([
    page.waitForResponse(r => r.url().includes('/upload') && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Generate Label Sheets' }).click(),
  ]);
  await expect(page.getByText(/Authentication failed|log in/i)).toBeVisible();
});

test('400 response shows validation error message', async ({ page }) => {
  await setupApiMocks(page, { upload: { status: 400, body: ERROR_PAYLOADS[400] } });
  await page.goto('/upload');
  await uploadFile(page);
  await Promise.all([
    page.waitForResponse(r => r.url().includes('/upload') && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Generate Label Sheets' }).click(),
  ]);
  await expect(page.getByText(/Invalid file format/i)).toBeVisible();
});

test('413 response shows file too large message', async ({ page }) => {
  await setupApiMocks(page, { upload: { status: 413, body: ERROR_PAYLOADS[413] } });
  await page.goto('/upload');
  await uploadFile(page);
  await Promise.all([
    page.waitForResponse(r => r.url().includes('/upload') && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Generate Label Sheets' }).click(),
  ]);
  await expect(page.getByText(/too large/i)).toBeVisible();
});

test('429 response shows rate limit message', async ({ page }) => {
  await setupApiMocks(page, { upload: { status: 429, body: ERROR_PAYLOADS[429] } });
  await page.goto('/upload');
  await uploadFile(page);
  await Promise.all([
    page.waitForResponse(r => r.url().includes('/upload') && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Generate Label Sheets' }).click(),
  ]);
  await expect(page.getByText(/Too many requests|wait/i)).toBeVisible();
});

test('500 response shows server error message', async ({ page }) => {
  await setupApiMocks(page, { upload: { status: 500, body: ERROR_PAYLOADS[500] } });
  await page.goto('/upload');
  await uploadFile(page);
  await Promise.all([
    page.waitForResponse(r => r.url().includes('/upload') && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Generate Label Sheets' }).click(),
  ]);
  await expect(page.getByText(/Server error|try again later/i)).toBeVisible();
});

test('preview 429 response shows rate limit message', async ({ page }) => {
  await setupApiMocks(page, { preview: { status: 429, body: { error: 'Rate limit exceeded.' } } });
  await page.goto('/upload');
  await uploadFile(page);
  await Promise.all([
    page.waitForResponse(r => r.url().includes('/preview') && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Preview First Sheet' }).click(),
  ]);
  await expect(page.getByText(/Preview limit|wait/i)).toBeVisible();
});
