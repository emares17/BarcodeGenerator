import {
  ScanBarcode,
  FileSpreadsheet,
  Zap,
  Download,
  Upload,
  Cpu,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BarcodeWidget from '../components/BarcodeWidget';
import Navbar from '../components/Navbar';

function LandingPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/status`, { withCredentials: true });
        if (response.data.authenticated) {
          navigate('/dashboard', { replace: true });
        } else {
          setAuthLoading(false);
        }
      } catch {
        setAuthLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="px-6 md:px-20 py-10 md:py-20">
        <div className="max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1 flex flex-col gap-6">
            <span className="inline-flex items-center gap-2 bg-secondary text-primary font-body text-[13px] font-semibold rounded-full px-4 py-1.5 w-fit">
              <Zap className="w-3.5 h-3.5" />
              Transform spreadsheets into barcode labels
            </span>
            <h1 className="font-heading text-4xl md:text-[48px] font-extrabold text-foreground leading-[1.1]">
              Generate Professional<br />Barcode Labels in Seconds
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              Upload your CSV or Excel file, and LabelGenius instantly creates print-ready
              Code 128 or QR code labels using your chosen professional label template.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a href="/signup" className="inline-flex items-center justify-center h-12 px-6 bg-primary text-primary-foreground font-heading text-sm font-medium rounded-full hover:bg-primary/90 transition-colors">
                Get Started Free
              </a>
              <a href="#how-it-works" className="inline-flex items-center justify-center h-12 px-6 bg-card text-foreground font-heading text-sm font-medium rounded-full border border-border shadow-sm hover:bg-secondary transition-colors">
                See How It Works
              </a>
            </div>
          </div>
          <div className="flex-shrink-0 w-full md:w-[560px] h-[220px] md:h-[400px]">
            <svg
              viewBox="0 0 560 400"
              className="w-full h-full select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
                  <feOffset dx="0" dy="6" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.35" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <style dangerouslySetInnerHTML={{ __html: `
                  @keyframes flowLines {
                    from { stroke-dashoffset: 30; }
                    to { stroke-dashoffset: 0; }
                  }
                  .animate-flow {
                    stroke-dasharray: 10, 5;
                    animation: flowLines 2s linear infinite;
                  }
                `}} />
              </defs>

              {/* Global Isometric Transform - centered in 560x400 viewBox */}
              <g transform="translate(310, 235) scale(0.7, 0.42) rotate(-45)">

                {/* SPREADSHEET LAYER */}
                <g transform="translate(-220, -180)">
                  <rect width="440" height="340" rx="8" fill="#FFFFFF" stroke="#CBCCC9" strokeWidth="1" />

                  {/* Header Row */}
                  <rect width="440" height="40" rx="4" fill="#F2F3F0" />
                  <text x="15" y="26" fill="#666" fontFamily="'JetBrains Mono', monospace" fontSize="12" fontWeight="bold">ID</text>
                  <text x="60" y="26" fill="#666" fontFamily="'JetBrains Mono', monospace" fontSize="12" fontWeight="bold">SOURCE_DATA</text>
                  <text x="240" y="26" fill="#666" fontFamily="'JetBrains Mono', monospace" fontSize="12" fontWeight="bold">SKU_REF</text>
                  <text x="360" y="26" fill="#666" fontFamily="'JetBrains Mono', monospace" fontSize="12" fontWeight="bold">STATUS</text>

                  {/* Data Rows */}
                  {[
                    { id: '01', source: 'INV_CSV_A', sku: 'SKU-8821', status: 'READY' },
                    { id: '02', source: 'API_PUSH_X', sku: 'SKU-4439', status: 'READY' },
                    { id: '03', source: 'DB_SYNC_09', sku: 'SKU-1102', status: 'READY' },
                    { id: '04', source: 'MANUAL_IN', sku: 'SKU-9905', status: 'READY' },
                    { id: '05', source: 'INV_CSV_B', sku: 'SKU-7723', status: 'READY' },
                  ].map((row, i) => (
                    <g key={i} transform={`translate(0, ${40 + (i * 50)})`}>
                      <rect width="440" height="45" fill="#FF8400" opacity="0.04" />
                      <text x="15" y="28" fill="#666" fontFamily="'JetBrains Mono', monospace" fontSize="11">{row.id}</text>
                      <text x="60" y="28" fill="#FF8400" fontFamily="'JetBrains Mono', monospace" fontSize="11">{row.source}</text>
                      <text x="240" y="28" fill="#111" fontFamily="'JetBrains Mono', monospace" fontSize="11">{row.sku}</text>
                      <circle cx="365" cy="24" r="3" fill="#FF8400" />
                      <text x="375" y="28" fill="#FF8400" fontFamily="'JetBrains Mono', monospace" fontSize="10" fontWeight="bold">{row.status}</text>
                      <line x1="0" y1="45" x2="440" y2="45" stroke="#CBCCC9" strokeWidth="1" />
                    </g>
                  ))}
                </g>

                {/* CONNECTIONS & CARDS */}
                <g transform="translate(-180, -420)">
                  {[
                    { id: 'LBL-01', prod: 'Indus. Widget', y: 65, cardX: 340, cardY: -20 },
                    { id: 'LBL-02', prod: 'Nano Gear', y: 115, cardX: 370, cardY: 40 },
                    { id: 'LBL-03', prod: 'Heavy Clamp', y: 165, cardX: 400, cardY: 100 },
                    { id: 'LBL-04', prod: 'Flex Pipe', y: 215, cardX: 430, cardY: 160 },
                    { id: 'LBL-05', prod: 'Steel Bolt', y: 265, cardX: 460, cardY: 220 },
                  ].map((item, i) => (
                    <g key={i}>
                      {/* Connection Line */}
                      <path
                        d={`M 20 ${item.y} C 120 ${item.y - 40}, 240 ${item.cardY + 80}, ${item.cardX} ${item.cardY + 35}`}
                        fill="none"
                        stroke="#FF8400"
                        className="animate-flow"
                        strokeWidth="2.5"
                        opacity="0.8"
                      />

                      {/* Source Dot */}
                      <circle cx="20" cy={item.y} r="5" fill="#FF8400" />

                      {/* Barcode Label Card */}
                      <g transform={`translate(${item.cardX}, ${item.cardY})`} filter="url(#cardShadow)">
                        <rect width="110" height="75" rx="8" fill="#FFFFFF" />

                        {/* Label Header */}
                        <text x="10" y="20" fill="#111" fontFamily="'Inter', sans-serif" fontSize="11" fontWeight="800">{item.id}</text>
                        <text x="100" y="20" fill="#999" fontFamily="'JetBrains Mono', monospace" fontSize="8" textAnchor="end">v2.0</text>

                        {/* Barcode Visual */}
                        <g transform="translate(10, 28)">
                          {[3, 1, 4, 2, 6, 1, 3, 5, 2, 4, 2].map((w, idx) => {
                            const xPos = [3, 1, 4, 2, 6, 1, 3, 5, 2, 4, 2].slice(0, idx).reduce((a, b) => a + b + 2, 0);
                            return <rect key={idx} x={xPos} y="0" width={w} height="28" fill="#111" />;
                          })}
                        </g>

                        {/* Label Footer */}
                        <text x="10" y="66" fill="#666" fontFamily="'Inter', sans-serif" fontSize="9" fontWeight="600">{item.prod}</text>
                      </g>
                    </g>
                  ))}
                </g>
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* Try It Now Section */}
      <section id="try-it" className="px-6 md:px-20 py-12 md:py-16">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
          <div className="text-center max-w-xl">
            <span className="inline-flex items-center gap-2 bg-secondary text-primary font-body text-[13px] font-semibold rounded-full px-4 py-1.5 mb-3">
              <ScanBarcode className="w-3.5 h-3.5" />
              Free Tool
            </span>
            <h2 className="font-heading text-2xl md:text-[32px] font-bold text-foreground leading-tight">
              Try It Now — Generate a Barcode Instantly
            </h2>
            <p className="mt-3 text-base text-muted-foreground leading-relaxed">
              Free, no signup required. Generate and download barcodes in seconds.
            </p>
          </div>
          <BarcodeWidget />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 md:px-20 py-16 md:py-20">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-12">
          <div className="text-center max-w-xl">
            <p className="font-heading text-sm font-semibold text-primary mb-3">Features</p>
            <h2 className="font-heading text-2xl md:text-[32px] font-bold text-foreground leading-tight">
              Everything you need to create barcode labels
            </h2>
            <p className="mt-3 text-base text-muted-foreground leading-relaxed">
              From file upload to print-ready labels, LabelGenius handles it all with speed and precision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {[
              { icon: FileSpreadsheet, title: 'Multiple Formats', desc: 'Upload CSV or Excel files. We automatically detect your data columns and generate labels.' },
              { icon: Zap, title: 'Instant Processing', desc: 'Multi-threaded barcode generation processes hundreds of labels in seconds.' },
              { icon: Download, title: 'Print-Ready Output', desc: 'Download perfectly arranged label sheets as high-quality PDFs, ready for professional printing.' },
            ].map((feat) => (
              <div key={feat.title} className="bg-card border border-border rounded-[16px] p-6 shadow-sm">
                <div className="w-12 h-12 bg-secondary rounded-[16px] flex items-center justify-center mb-4">
                  <feat.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-6 md:px-20 py-16 md:py-20 bg-secondary">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-12">
          <div className="text-center max-w-xl">
            <p className="font-heading text-sm font-semibold text-primary mb-3">How It Works</p>
            <h2 className="font-heading text-2xl md:text-[32px] font-bold text-foreground leading-tight">
              Three simple steps to your labels
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
            {[
              { num: '1', icon: Upload, title: 'Upload Your File', desc: 'Drag and drop your CSV or Excel file containing product data.' },
              { num: '2', icon: Cpu, title: 'We Process It', desc: 'Our engine generates Code 128 or QR code barcodes and arranges them on your chosen label template.' },
              { num: '3', icon: Download, title: 'Download Labels', desc: "Download your print-ready label sheets as a ZIP file. It's that easy." },
            ].map((step) => (
              <div key={step.num} className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
                  <span className="font-heading text-2xl font-bold text-primary-foreground">{step.num}</span>
                </div>
                <step.icon className="w-8 h-8 text-foreground" />
                <h3 className="font-heading text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 md:px-20 py-16 md:py-20 bg-foreground">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-background leading-tight">
            Ready to streamline your labeling?
          </h2>
          <p className="text-base text-muted-foreground max-w-lg leading-relaxed">
            Join thousands of businesses using LabelGenius to generate professional barcode labels. Start free today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="/signup" className="inline-flex items-center justify-center h-12 px-6 bg-primary text-primary-foreground font-heading text-sm font-medium rounded-full hover:bg-primary/90 transition-colors">
              Get Started Free
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
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

export default LandingPage;
