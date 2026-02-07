import { useState } from 'react';
import Sidebar from './Sidebar';
import { ChevronDown, Upload, Cpu, Download, ScanBarcode } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: '"Failed to parse file" Error',
    answer: 'Check that you have exactly 4 columns in the correct order (Quantity, Location, Part Number, Unit). Ensure no empty cells in your data. Try saving as CSV if using Excel.',
  },
  {
    question: '"Invalid file format" Error',
    answer: 'Only .csv and .xlsx files are supported. Try re-saving your file and avoid special characters in filenames.',
  },
  {
    question: 'Labels not printing correctly',
    answer: 'Print at 100% scale (never "fit to page"). Use highest quality print settings. Test scan a few labels before printing large batches.',
  },
  {
    question: 'What CSV format is required?',
    answer: 'Your CSV must have exactly 4 columns in this order: Quantity (numbers), Location (warehouse location), Part Number (product ID), Unit (unit type like EA, PK). Headers are optional.',
  },
  {
    question: 'What are the file size limits?',
    answer: 'Maximum file size is 50MB. Supported formats are .csv, .xlsx, and .xls files with UTF-8 encoding.',
  },
  {
    question: 'How long does processing take?',
    answer: 'Processing is fast: 2-5 seconds for 1-50 labels, 5-15 seconds for 51-200 labels, and 15-30 seconds for 201-500 labels.',
  },
];

function Help() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeOverride="/help" />

      <main className="flex-1 min-w-0 p-6 md:p-10">
        <div className="max-w-4xl">
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
                    desc: 'Drag and drop a CSV or Excel file with your product data (Quantity, Location, Part Number, Unit).',
                  },
                  {
                    num: '2',
                    icon: Cpu,
                    title: 'We Process It',
                    desc: 'Our engine generates Code 128 barcodes and arranges them on 4x5 label sheets at 600 DPI.',
                  },
                  {
                    num: '3',
                    icon: Download,
                    title: 'Download Labels',
                    desc: 'Download your print-ready label sheets as a ZIP file. Print at 100% scale on 8.5" x 11" paper.',
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

          {/* CSV Format Card */}
          <div className="bg-card border border-border rounded-[16px] shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-border">
              <h2 className="font-heading text-base font-semibold text-foreground">CSV File Requirements</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Your file must follow this exact column order</p>
            </div>
            <div className="px-6 py-6">
              <div className="flex items-start gap-3 p-3 bg-warning rounded-[12px] mb-5">
                <span className="text-warning-foreground text-sm font-medium">Column order cannot be changed. The system expects data in this exact sequence.</span>
              </div>

              <div className="border border-border rounded-[12px] overflow-hidden mb-5">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Column 1</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Column 2</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Column 3</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Column 4</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-4 py-2.5 text-sm font-medium text-foreground">Quantity</td>
                      <td className="px-4 py-2.5 text-sm font-medium text-foreground">Location</td>
                      <td className="px-4 py-2.5 text-sm font-medium text-foreground">Part Number</td>
                      <td className="px-4 py-2.5 text-sm font-medium text-foreground">Unit</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">Numbers only</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">Warehouse location</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">Part/product ID</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">Unit type (EA, PK)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-secondary/50 rounded-[12px] p-4">
                <p className="text-xs font-semibold text-foreground mb-2">Example CSV Data:</p>
                <pre className="text-xs text-muted-foreground font-heading bg-card p-3 rounded-[8px] border border-border overflow-x-auto">
{`4,101-002-01-01,4001-PPHT175,EA
990,101-002-02-04,4025-CT1,EA
67,101-002-03-04,366-P420172,PK
77,101-002-03-07,380-44302R,EA
118,101-002-04-04,6130-151045,EA`}
                </pre>
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

          {/* Label Specs Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card border border-border rounded-[16px] shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-secondary rounded-[12px] flex items-center justify-center">
                  <ScanBarcode className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-sm font-semibold text-foreground">Individual Labels</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> Size: 2.5" x 2.0"</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> Resolution: 600 DPI</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> Format: PNG images</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> Barcode: Code 128</li>
              </ul>
            </div>
            <div className="bg-card border border-border rounded-[16px] shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-secondary rounded-[12px] flex items-center justify-center">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-sm font-semibold text-foreground">Sheet Layout</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> 20 labels per sheet (5x4 grid)</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> Paper: 8.5" x 11" (US Letter)</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> Multiple sheets for 20+ labels</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" /> Printer-optimized margins</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Help;
