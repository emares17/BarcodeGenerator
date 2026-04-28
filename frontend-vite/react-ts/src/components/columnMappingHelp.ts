export interface HelpContent {
  title: string;
  body: string;
  example?: string;
}

export const BARCODE_COLUMN_HELP: HelpContent = {
  title: 'Which column holds the barcode value?',
  body: 'Count from the left — column A in your spreadsheet is column 1, column B is column 2, and so on. Enter the number of the column that contains the value to encode (a part number, SKU, or product ID).',
  example: `Qty | Location | Part Number
 4  | 10-02-01  | 4001-PPHT175

→ Part Number is column 3`,
};

export const TEXT_FIELDS_HELP: HelpContent = {
  title: 'What text appears on the label?',
  body: "Each text field prints a human-readable line below the barcode. 'Col' is which column in your file to pull the value from. 'Label' is a short caption printed before that value on the label.",
  example: `Col: 2 | Label: "Location"
→ prints "Location: 10-02-01"`,
};

export const HEADER_ROW_HELP: HelpContent = {
  title: 'Does your file start with column headers?',
  body: "If row 1 of your file has column names like 'Part Number' or 'Location' instead of real data, check this box. The app will skip row 1 and start generating labels from row 2.",
  example: `Row 1 (headers): Qty | Location | Part Number
Row 2 (first data): 4 | 101-002  | 4001-PPH`,
};
