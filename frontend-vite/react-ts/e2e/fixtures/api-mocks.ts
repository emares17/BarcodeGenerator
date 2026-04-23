import type { Page } from '@playwright/test';
import { MOCK_PDF_BASE64, MOCK_SHEETS } from './test-data';

type RouteKey = 'mySheets' | 'upload' | 'preview' | 'download' | 'delete';

type RouteOverrides = Partial<Record<RouteKey, {
  status?: number;
  body?: unknown;
}>>;

const DEFAULT_RESPONSES: Record<RouteKey, { status: number; body: unknown }> = {
  mySheets: {
    status: 200,
    body: { sheets: MOCK_SHEETS },
  },
  upload: {
    status: 200,
    body: {
      success: true,
      user_sheet_id: 'new-sheet-abc',
      label_count: 3,
      sheet_count: 1,
      message: 'Successfully processed 3 labels and uploaded as ZIP',
    },
  },
  preview: {
    status: 200,
    body: {
      preview_pdf: MOCK_PDF_BASE64,
      label_count: 3,
      total_sheets: 1,
      labels_on_first_sheet: 3,
    },
  },
  download: {
    status: 200,
    body: Buffer.from('PK\x03\x04fake-zip-content'),
  },
  delete: {
    status: 200,
    body: { success: true },
  },
};

export async function setupApiMocks(page: Page, overrides: RouteOverrides = {}) {
  const resolve = (key: RouteKey) => ({
    ...DEFAULT_RESPONSES[key],
    ...(overrides[key] ?? {}),
  });

  await page.route('**/my-sheets', async (route) => {
    const r = resolve('mySheets');
    await route.fulfill({ status: r.status, contentType: 'application/json', body: JSON.stringify(r.body) });
  });

  await page.route('**/upload', async (route) => {
    const r = resolve('upload');
    if (r.status >= 400) {
      await route.fulfill({ status: r.status, contentType: 'application/json', body: JSON.stringify(r.body) });
    } else {
      await route.fulfill({ status: r.status, contentType: 'application/json', body: JSON.stringify(r.body) });
    }
  });

  await page.route('**/preview', async (route) => {
    const r = resolve('preview');
    await route.fulfill({ status: r.status, contentType: 'application/json', body: JSON.stringify(r.body) });
  });

  await page.route('**/download-sheet/**', async (route) => {
    const r = resolve('download');
    await route.fulfill({ status: r.status, contentType: 'application/zip', body: r.body as Buffer });
  });

  await page.route('**/delete-sheet/**', async (route) => {
    const r = resolve('delete');
    await route.fulfill({ status: r.status, contentType: 'application/json', body: JSON.stringify(r.body) });
  });
}
