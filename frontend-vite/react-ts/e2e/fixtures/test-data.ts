export const VALID_CSV = `Location,Barcode,Name,Unit
Aisle-01,SKU001,Widget A,EA
Aisle-02,SKU002,Widget B,EA
Aisle-03,SKU003,Widget C,PK
`;

export const TEMPLATE_IDS = ['standard_20', '5163', '5160', '94233'] as const;
export type TemplateId = typeof TEMPLATE_IDS[number];

// Minimal valid PDF header encoded as base64 — good enough for iframe preview mocking
export const MOCK_PDF_BASE64 = 'JVBERi0xLjQKJSVFT0Y=';

export const ERROR_PAYLOADS = {
  401: { error: 'Authentication required' },
  400: { error: 'Invalid file format.' },
  413: { error: 'File too large' },
  429: { error: 'Rate limit exceeded. Maximum 5 requests per hour.' },
  500: { error: 'An internal error occurred' },
} as const;

export const MOCK_SHEETS = [
  {
    id: 'sheet-001',
    original_filename: 'inventory.csv',
    label_count: 30,
    sheet_count: 2,
    total_size_bytes: 204800,
    created_at: '2024-06-01T12:00:00.000Z',
  },
];
