import Header from '../components/header'; 

function LandingPage() {
  return (
    <div
      className="relative flex w-screen min-h-screen flex-col bg-white overflow-x-hidden"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="w-full bg-white border-b border-gray-200 shadow-sm">
          <Header />
        </header>

        {/* Hero Section */}
        <section className="w-full bg-white py-20 px-6">
          <div className="max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center justify-between gap-10">
          {/* Left: Text Content */}
            <div className="w-full md:w-1/2 text-center md:text-left px-4 md:px-0">
              <h1 className="text-3xl sm:text-3xl md:text-5xl font-black text-[#121517] leading-tight tracking-[-0.033em]">
                Turn Spreadsheets into Barcode Labels Instantly
              </h1>
              <p className="mt-5 text-large sm:text-lg text-[#121517]">
                Upload your inventory spreadsheet and get print-ready barcode labels in seconds. 
                No design skills needed – just your product data and our lightning-fast generator.
              </p>
              <a 
                href="/signup" 
                className="mt-6 inline-flex items-center justify-center h-12 px-6 bg-gradient-to-r font-semibold from-blue-500 to-indigo-500 text-white rounded-lg hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Get Started
              </a>
            </div>

            {/* Right: Image */}
            <div className="w-full md:w-1/2 flex justify-center">
              <img
                src="/spreadsheet.svg"
                alt="Illustration of label creation"
                className="w-full max-w-md"
              />
            </div>
          </div>
        </section>

      <section className="w-full bg-white px-12 md:px-24 py-20">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-12">
          <div>
            <h2 className="text-3xl font-black text-[#121517] tracking-tight max-w-md mx-auto">
              Everything You Need
            </h2>
            <p className="mt-4 text-[#687a82] text-base max-w-2xl leading-relaxed mx-auto">
              Simple tools to transform your data into professional labels quickly and efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 w-full">
            {/* Feature Cards */}
            <div className="flex flex-col items-center rounded-xl border border-[#f1f3f4] p-8 text-center shadow-sm hover:shadow-md transition-shadow bg-[#f9fbfc]">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-bold text-[#121517] mb-3">Multiple Formats</h3>
              <p className="text-sm text-[#687a82] leading-relaxed max-w-xs">
                Works with CSV and Excel files containing your product data. 
                Upload thousands of items at once - we'll handle the rest.
              </p>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-[#f1f3f4] p-8 text-center shadow-sm hover:shadow-md transition-shadow bg-[#f9fbfc]">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-lg font-bold text-[#121517] mb-3">Instant Processing</h3>
              <p className="text-sm text-[#687a82] leading-relaxed max-w-xs">
                Our optimized engine creates barcode labels 80% faster than traditional 
                methods. What used to take minutes now takes seconds.
              </p>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-[#f1f3f4] p-8 text-center shadow-sm hover:shadow-md transition-shadow bg-[#f9fbfc]">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-lg font-bold text-[#121517] mb-3">Professional Output</h3>
              <p className="text-sm text-[#687a82] leading-relaxed max-w-xs">
                Get perfectly formatted Code 128 barcodes arranged 20 per sheet. 
                Compatible with standard label paper and any printer.
              </p>
            </div>
          </div>
        </div>
      </section>

    <section id="how-it-works" className="w-full bg-white px-10 py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Steps */}
          <div className="flex flex-col gap-10">
            <h2 className="text-3xl font-black text-[#121517] tracking-tight text-center lg:text-left max-w-lg mx-auto lg:mx-0">
              How It Works
            </h2>

            {/* Step 1 */}
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#c0ddec] text-[#121517] font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#121517] mb-2">Upload Your File</h3>
                <p className="text-sm text-[#687a82] leading-relaxed max-w-md">
                  Drop in your CSV or Excel file with product codes, descriptions, 
                  and locations. We handle files with thousands of items.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#c0ddec] text-[#121517] font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#121517] mb-2">Process Instantly</h3>
                <p className="text-sm text-[#687a82] leading-relaxed max-w-md">
                  Our system creates Code 128 barcodes for each item and arranges 
                  them on standard label sheets automatically.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#c0ddec] text-[#121517] font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#121517] mb-2">Download & Print</h3>
                <p className="text-sm text-[#687a82] leading-relaxed max-w-md">
                  Get a ZIP file with all your barcode label sheets, ready to print 
                  on 4x5 label paper. 
                </p>
              </div>
            </div>
          </div>

        {/* Illustration */}
        <div className="flex justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="400"
            height="350"
            viewBox="0 0 400 350"
          >
          <defs>
            {/* Define a linear gradient */}
            <linearGradient id="blueIndigoGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />  {/* blue-500 */}
              <stop offset="100%" stopColor="#6366f1" /> {/* indigo-500 */}
            </linearGradient>
          </defs>

          {/* Upload Icon */}
          <circle cx="100" cy="80" r="40" fill="url(#blueIndigoGradient)" opacity="0.1" />
          <path
            d="M100,60 L100,100 M85,75 L100,60 L115,75"
            fill="none"
            stroke="url(#blueIndigoGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Process Icon */}
          <circle cx="200" cy="180" r="40" fill="url(#blueIndigoGradient)" opacity="0.1" />
          <rect
            x="185"
            y="165"
            width="30"
            height="30"
            fill="none"
            stroke="url(#blueIndigoGradient)"
            strokeWidth="2"
            rx="3"
          />
          <path
            d="M190,175 L195,180 L205,170"
            fill="none"
            stroke="url(#blueIndigoGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Download Icon */}
          <circle cx="300" cy="280" r="40" fill="url(#blueIndigoGradient)" opacity="0.1" />
          <path
            d="M300,260 L300,300 M285,285 L300,300 L315,285"
            fill="none"
            stroke="url(#blueIndigoGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Connecting Lines */}
          <path
            d="M140,80 Q170,80 170,140 Q170,180 160,180"
            fill="none"
            stroke="url(#blueIndigoGradient)"
            strokeWidth="2"
            strokeDasharray="5,5"
            opacity="0.6"
          />
          <path
            d="M240,180 Q270,180 270,240 Q270,280 260,280"
            fill="none"
            stroke="url(#blueIndigoGradient)"
            strokeWidth="2"
            strokeDasharray="5,5"
            opacity="0.6"
          />
        </svg>

        </div>
      </div>
    </section>

        <section className="w-full bg-white py-20 text-center" id="cta">
          <div className="max-w-4xl mx-auto px-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Start Creating Barcode Labels in Seconds</h2>
            <a 
              href="/signup" 
              className="inline-flex items-center justify-center py-4 px-8 bg-gradient-to-r font-semibold from-blue-500 to-indigo-500 text-white rounded-lg hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Get Started Free
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};


export default LandingPage;