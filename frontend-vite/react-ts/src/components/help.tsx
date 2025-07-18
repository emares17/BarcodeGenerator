import Header from './header'; 

function Help() {
    return (
    <div className="w-screen min-h-screen bg-white" style={{ fontFamily: 'Inter, Noto Sans, sans-serif' }}>
      <header className="w-full bg-white border-b border-gray-200 shadow-sm">
        <Header />
      </header>
        <div className="w-full max-w-6xl mx-auto px-8 py-10">
            <div className="bg-white rounded-xl shadow-lg p-8">

        {/* Quick Start */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Start</h2>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <p className="text-blue-800">
              Simply upload a properly formatted CSV file, and the system will create professional label sheets ready for printing.
            </p>
          </div>
        </section>

        {/* CSV Requirements */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">CSV File Requirements</h2>
          
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-6">
            <h3 className="font-semibold text-red-800 mb-2">⚠️ Critical: Column Order Cannot Be Changed</h3>
            <p className="text-red-700">
              The system expects data in this exact sequence. Any changes will cause upload failures.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Column 1</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Column 2</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Column 3</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Column 4</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Quantity</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Location</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Part Number</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">Unit</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">Numbers only</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Warehouse location</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Part/product ID</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Unit type</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Example CSV Data:</h4>
            <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-x-auto">
{`4,101-002-01-01,4001-PPHT175,EA
990,101-002-02-04,4025-CT1,EA
67,101-002-03-04,366-P420172,PK
77,101-002-03-07,380-44302R,EA
118,101-002-04-04,6130-151045,EA`}
            </pre>
          </div>
        </section>

        {/* File Format Requirements */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">File Format Requirements</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-green-700 mb-2">✅ Supported</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• .csv files</li>
                <li>• .xlsx files</li>
                <li>• UTF-8 encoding</li>
                <li>• Exactly 4 columns</li>
                <li>• Headers optional</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-red-700 mb-2">❌ Not Supported</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Different column order</li>
                <li>• Missing columns</li>
                <li>• Empty rows in data</li>
                <li>• Files over 16MB</li>
                <li>• Other file formats</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Step by Step */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Step-by-Step Usage</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
              <div>
                <h3 className="font-semibold text-gray-900">Prepare Your CSV File</h3>
                <p className="text-gray-600">Export your inventory data with the 4 required columns in the correct order.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
              <div>
                <h3 className="font-semibold text-gray-900">Upload Your File</h3>
                <p className="text-gray-600">Click "Select File" or drag and drop your CSV/XLSX file.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
              <div>
                <h3 className="font-semibold text-gray-900">Generate Labels</h3>
                <p className="text-gray-600">Click "Generate Label Sheets" and wait for processing (~0.02 seconds per label).</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">4</div>
              <div>
                <h3 className="font-semibold text-gray-900">Download & Print</h3>
                <p className="text-gray-600">Download individual sheets or view them first. Print at 100% scale on 8.5" × 11" paper.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Label Specifications */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Label Specifications</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Individual Labels</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Size: 2.5" × 2.0"</li>
                  <li>• Resolution: 600 DPI</li>
                  <li>• Format: PNG images</li>
                  <li>• Barcode: Code 128</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Sheet Layout</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• 20 labels per sheet (5×4 grid)</li>
                  <li>• Paper: 8.5" × 11" (US Letter)</li>
                  <li>• Multiple sheets for 20+ labels</li>
                  <li>• Printer-optimized margins</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Performance */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Performance Expectations</h2>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-700">2-5s</div>
                <div className="text-sm text-green-600">1-50 labels</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-700">5-15s</div>
                <div className="text-sm text-green-600">51-200 labels</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-700">15-30s</div>
                <div className="text-sm text-green-600">201-500 labels</div>
              </div>
            </div>
          </div>
        </section>

        {/* Troubleshooting */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Common Issues & Solutions</h2>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-700 mb-2">"Failed to parse file" Error</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Check that you have exactly 4 columns</li>
                <li>• Ensure no empty cells in your data</li>
                <li>• Try saving as CSV if using Excel</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-700 mb-2">"Invalid file format" Error</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Only .csv and .xlsx files are supported</li>
                <li>• Try re-saving your file</li>
                <li>• Avoid special characters in filenames</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-700 mb-2">Labels Not Printing Correctly</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Print at 100% scale (never "fit to page")</li>
                <li>• Use highest quality print settings</li>
                <li>• Test scan a few labels before printing large batches</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Sample Template */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sample CSV Template</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 mb-3">Copy this sample data to create your own CSV file:</p>
            <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-x-auto">
{`Quantity,Location,Part Number,Unit
1,101-002-01-01,4001-PPHT175,EA
990,101-002-02-04,4025-CT1,EA
67,101-002-03-04,366-P420172,PK
77,101-002-03-07,380-44302R,EA
118,101-002-04-04,6130-151045,EA
12,101-004-01-04,370-60561,EA
1,101-004-02-01,6130-151045B,EA
15,101-004-02-04,114-OTR800333,EA`}
            </pre>
          </div>
        </section>

        {/* Tips */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Tips for Best Results</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Data Quality</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Keep location codes consistent</li>
                <li>• Use standard unit abbreviations</li>
                <li>• Avoid special characters in part numbers</li>
              </ul>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Workflow</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Process one aisle at a time</li>
                <li>• Print labels immediately after generation</li>
                <li>• Test scan before printing large batches</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Need Additional Help?</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Browser Compatibility</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>✅ Chrome (recommended)</div>
                  <div>✅ Firefox</div>
                  <div>✅ Safari</div>
                  <div>✅ Microsoft Edge</div>
                  <div>❌ Internet Explorer</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">System Requirements</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Modern web browser</li>
                  <li>• Internet connection</li>
                  <li>• User account (must be logged in)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
    </div>
  );
}

export default Help;