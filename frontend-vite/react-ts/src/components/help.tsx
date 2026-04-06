import { useState } from 'react';
import { ChevronDown, Upload, Cpu, Download, ScanBarcode, Settings, FileSpreadsheet } from 'lucide-react';
import Navbar from './Navbar';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: 'What file formats are supported?',
    answer: 'CSV (.csv), Excel (.xlsx), and older Excel (.xls) files are all supported. Maximum file size is 50MB with UTF-8 encoding.',
  },
  {
    question: 'How do I set up column mapping?',
    answer: 'After uploading your file, use the Column Mapping section to tell the app which column contains your barcode values (required) and which columns contain text you want on the label. You can add custom labels like "Location", "SKU", or "Size" to each text field.',
  },
  {
    question: 'What if my file has a header row?',
    answer: 'Check the "First row is headers" checkbox in the Column Mapping section. This tells the system to skip the first row when generating labels.',
  },
  {
    question: '"Failed to parse file" Error',
    answer: 'Make sure your file is a valid CSV or Excel file. Check that the column numbers you selected in the Column Mapping section exist in your file. Ensure there are no completely empty rows in your data.',
  },
  {
    question: 'Labels not printing correctly',
    answer: 'Print at 100% scale (never "fit to page"). Use the highest quality print settings available. Choose the label template that matches the label sheets you purchased. Test scan a few labels before printing large batches.',
  },
  {
    question: 'How long does processing take?',
    answer: 'Processing is fast: 2-5 seconds for 1-50 labels, 5-15 seconds for 51-200 labels, and 15-30 seconds for larger batches.',
  },
  {
    question: 'Which template should I use?',
    answer: 'Choose a template that matches your physical label sheets. Standard 20 is a general-purpose 5x4 grid. The Avery-compatible templates (5163, 5160, 94233) match those specific label sheet sizes. Each template shows the label dimensions and count to help you decide.',
  },
];

function Help() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1 min-w-0 p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-heading text-2xl font-bold text-foreground">Help Center</h1>
            <p className="text-sm text-muted-foreground mt-1">Learn how to use LabelGenius effectively</p>
          </div>

          {/* Quick Start Card */}
          <div className="bg-card border border-border rounded-[16px] shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-border">
              <h2 className="font-heading text-base font-semibold text-foreground">Quick Start Guide</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Get up and running in 3 simple steps</p>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    num: '1',
                    icon: Upload,
                    title: 'Upload Your File',
                    desc: 'Upload any CSV or Excel file with your data. No specific column order required.',
                  },
                  {
                    num: '2',
                    icon: Settings,
                    title: 'Configure Labels',
                    desc: 'Choose a label template, map your columns to barcodes and text fields, and add custom labels.',
                  },
                  {
                    num: '3',
                    icon: Download,
                    title: 'Download & Print',
                    desc: 'Download your print-ready PDF label sheets as a ZIP file. Print at 100% scale on 8.5" x 11" paper.',
                  },
                ].map((step) => (
                  <div key={step.num} className="flex flex-col items-center text-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <span className="font-heading text-lg font-bold text-primary-foreground">{step.num}</span>
                    </div>
                    <step.icon className="w-6 h-6 text-foreground" />
                    <h3 className="font-heading text-sm font-semibold text-foreground">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column Mapping Card */}
          <div className="bg-card border border-border rounded-[16px] shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="font-heading text-base font-semibold text-foreground">Column Mapping</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Use any spreadsheet layout — just tell us which columns to use</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-6">
              <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-[12px] mb-5">
                <span className="text-foreground text-sm font-medium">Your file can have any number of columns in any order. You choose which column has the barcode value and which columns appear as text on the label.</span>
              </div>

              <div className="space-y-4 mb-5">
                <div className="border border-border rounded-[12px] p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Barcode Column (required)</h3>
                  <p className="text-xs text-muted-foreground">Select the column number that contains the value to encode as a Code 128 barcode. This is typically a part number, SKU, or product ID.</p>
                </div>
                <div className="border border-border rounded-[12px] p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Text Fields (optional)</h3>
                  <p className="text-xs text-muted-foreground">Add up to 2 text fields that appear on the label alongside the barcode. For each text field, choose a column number and type a custom label (e.g., "Location", "Size", "SKU"). The number of text fields allowed depends on the template selected.</p>
                </div>
                <div className="border border-border rounded-[12px] p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Header Row</h3>
                  <p className="text-xs text-muted-foreground">If your file's first row contains column headers (like "Part Number", "Location", etc.), check "First row is headers" so the system skips it during label generation.</p>
                </div>
              </div>

              <div className="bg-secondary/50 rounded-[12px] p-4">
                <p className="text-xs font-semibold text-foreground mb-2">Example: A file with 5 columns</p>
                <pre className="text-xs text-muted-foreground font-heading bg-card p-3 rounded-[8px] border border-border overflow-x-auto mb-3">
{`Qty,  Location,       Part Number,   Unit, Vendor
4,    101-002-01-01,  4001-PPHT175,  EA,   Acme Corp
990,  101-002-02-04,  4025-CT1,      EA,   Acme Corp
67,   101-002-03-04,  366-P420172,   PK,   Global Inc`}
                </pre>
                <p className="text-xs text-muted-foreground">
                  To use <strong>Part Number</strong> (column 3) as the barcode and show <strong>Location</strong> (column 2) and <strong>Unit</strong> (column 4) as text, set Barcode Column to <strong>3</strong>, then add two text fields: column <strong>2</strong> labeled "Location" and column <strong>4</strong> labeled "Unit".
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="bg-card border border-border rounded-[16px] shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-border">
              <h2 className="font-heading text-base font-semibold text-foreground">Frequently Asked Questions</h2>
            </div>
            <div className="divide-y divide-border">
              {faqs.map((faq, index) => (
                <div key={index}>
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer bg-transparent border-none hover:bg-secondary/30 transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground pr-4">{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Label Template Cards */}
          <div className="bg-card border border-border rounded-[16px] shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-border">
              <h2 className="font-heading text-base font-semibold text-foreground">Available Templates</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Choose the template that matches your label sheets</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {[
                {
                  name: 'Standard 20',
                  size: '1.75" x 1.8"',
                  layout: '20 labels per sheet (5x4)',
                  textLines: 2,
                },
                {
                  name: 'Compatible with Avery 5163',
                  size: '2" x 4"',
                  layout: '10 labels per sheet (5x2)',
                  textLines: 2,
                },
                {
                  name: 'Compatible with Avery 5160',
                  size: '1" x 2 5/8"',
                  layout: '30 labels per sheet (10x3)',
                  textLines: 1,
                },
                {
                  name: 'Compatible with Avery 94233',
                  size: '2 1/2" x 2 1/2"',
                  layout: '12 labels per sheet (4x3)',
                  textLines: 2,
                },
              ].map((tmpl) => (
                <div key={tmpl.name} className="border border-border rounded-[12px] p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-secondary rounded-[8px] flex items-center justify-center">
                      <ScanBarcode className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">{tmpl.name}</h3>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> Label size: {tmpl.size}</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> {tmpl.layout}</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> Up to {tmpl.textLines} text {tmpl.textLines === 1 ? 'field' : 'fields'} per label</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> Code 128 barcode</li>
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Output Specs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card border border-border rounded-[16px] shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-secondary rounded-[12px] flex items-center justify-center">
                  <ScanBarcode className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-sm font-semibold text-foreground">Output Format</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> Format: PDF</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> Barcode: Code 128</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> Paper: 8.5" x 11" (US Letter)</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> Delivered as ZIP download</li>
              </ul>
            </div>
            <div className="bg-card border border-border rounded-[16px] shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-secondary rounded-[12px] flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-sm font-semibold text-foreground">Printing Tips</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> Always print at 100% scale</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> Never use "fit to page"</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> Use highest quality print settings</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> Test scan before large batches</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <footer className="flex flex-wrap items-center justify-between px-6 md:px-20 py-6 border-t border-border gap-4">
        <div className="flex items-center gap-2">
          <ScanBarcode className="w-5 h-5 text-muted-foreground" />
          <span className="font-heading text-sm font-semibold text-muted-foreground">LabelGenius</span>
        </div>
        <p className="text-sm text-muted-foreground">&copy; 2026 LabelGenius. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Help;
