import { useState, useRef, useCallback } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Zap, Download, ArrowRight } from 'lucide-react';

type BarcodeFormat = 'CODE128' | 'CODE39' | 'EAN13' | 'UPC' | 'QR';

interface FormatOption {
  value: BarcodeFormat;
  label: string;
  placeholder: string;
  validate: (value: string) => string | null;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: 'CODE128',
    label: 'Code 128',
    placeholder: 'Enter text or number...',
    validate: (v) => {
      if (!v.trim()) return 'Please enter a value';
      if (v.length > 80) return 'Maximum 80 characters';
      if (!/^[\x20-\x7E]+$/.test(v)) return 'Only ASCII characters allowed';
      return null;
    },
  },
  {
    value: 'CODE39',
    label: 'Code 39',
    placeholder: 'Enter text (A-Z, 0-9)...',
    validate: (v) => {
      if (!v.trim()) return 'Please enter a value';
      if (!/^[A-Z0-9\-. $/+%]+$/i.test(v)) return 'Only A-Z, 0-9, and - . $ / + % allowed';
      return null;
    },
  },
  {
    value: 'EAN13',
    label: 'EAN-13',
    placeholder: 'Enter 12 or 13 digits...',
    validate: (v) => {
      if (!v.trim()) return 'Please enter a value';
      if (!/^\d{12,13}$/.test(v)) return 'Must be exactly 12 or 13 digits';
      return null;
    },
  },
  {
    value: 'UPC',
    label: 'UPC-A',
    placeholder: 'Enter 11 or 12 digits...',
    validate: (v) => {
      if (!v.trim()) return 'Please enter a value';
      if (!/^\d{11,12}$/.test(v)) return 'Must be exactly 11 or 12 digits';
      return null;
    },
  },
  {
    value: 'QR',
    label: 'QR Code',
    placeholder: 'Enter text, URL, or number...',
    validate: (v) => {
      if (!v.trim()) return 'Please enter a value';
      if (v.length > 2048) return 'Maximum 2048 characters';
      return null;
    },
  },
];

export default function BarcodeWidget() {
  const [format, setFormat] = useState<BarcodeFormat>('CODE128');
  const [value, setValue] = useState('');
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentFormat = FORMAT_OPTIONS.find((f) => f.value === format)!;

  const handleGenerate = useCallback(async () => {
    const validationError = currentFormat.validate(value);
    if (validationError) {
      setError(validationError);
      setBarcodeDataUrl(null);
      return;
    }
    setError(null);

    try {
      if (format === 'QR') {
        const dataUrl = await QRCode.toDataURL(value, {
          width: 300,
          margin: 2,
          color: { dark: '#111111', light: '#FFFFFF' },
        });
        setBarcodeDataUrl(dataUrl);
      } else {
        const canvas = canvasRef.current;
        if (!canvas) return;
        JsBarcode(canvas, value, {
          format,
          width: 2,
          height: 100,
          displayValue: true,
          font: 'JetBrains Mono',
          fontSize: 14,
          margin: 10,
          background: '#FFFFFF',
          lineColor: '#111111',
        });
        setBarcodeDataUrl(canvas.toDataURL('image/png'));
      }
    } catch {
      setError('Failed to generate barcode. Check your input for the selected format.');
      setBarcodeDataUrl(null);
    }
  }, [format, value, currentFormat]);

  const handleDownload = useCallback(() => {
    if (!barcodeDataUrl) return;
    const link = document.createElement('a');
    link.download = `barcode-${format.toLowerCase()}-${Date.now()}.png`;
    link.href = barcodeDataUrl;
    link.click();
  }, [barcodeDataUrl, format, value]);

  const handleFormatChange = (newFormat: BarcodeFormat) => {
    setFormat(newFormat);
    setBarcodeDataUrl(null);
    setError(null);
  };

  return (
    <div className="w-full max-w-[520px] mx-auto">
      <div className="bg-card border border-border rounded-[16px] p-6 shadow-sm flex flex-col gap-4">
        {/* Form Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Format Selector */}
          <div className="flex flex-col gap-1.5 w-full sm:w-[160px]">
            <label className="text-[13px] font-semibold text-foreground">Format</label>
            <select
              value={format}
              onChange={(e) => handleFormatChange(e.target.value as BarcodeFormat)}
              className="h-11 bg-background border border-border rounded-[12px] px-3.5 text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Value Input */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[13px] font-semibold text-foreground">Barcode Value</label>
            <input
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder={currentFormat.placeholder}
              className="h-11 bg-background border border-border rounded-[12px] px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Validation Error */}
        {error && (
          <p className="text-sm text-destructive -mt-2">{error}</p>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          className="w-full h-12 bg-primary text-primary-foreground font-heading text-sm font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <Zap className="w-[18px] h-[18px]" />
          Generate Barcode
        </button>

        {/* Barcode Preview Area */}
        <div className="w-full min-h-[140px] bg-background border border-dashed border-border rounded-[12px] flex flex-col items-center justify-center gap-2 p-3">
          {barcodeDataUrl ? (
            <img
              src={barcodeDataUrl}
              alt={`Generated ${format} barcode`}
              className="max-w-full h-auto"
            />
          ) : (
            <p className="text-sm text-muted-foreground font-body">
              Your barcode will appear here
            </p>
          )}
        </div>

        {/* Hidden canvas for JsBarcode rendering */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Download Button */}
        {barcodeDataUrl && (
          <button
            onClick={handleDownload}
            className="w-full h-11 bg-background border border-border text-foreground font-heading text-[13px] font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-secondary transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
        )}

        {/* Divider + CTA */}
        <div className="border-t border-border pt-4 flex flex-col items-center gap-1.5">
          <p className="text-sm text-muted-foreground text-center">
            Need to generate hundreds of barcodes from a spreadsheet?
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-1.5 text-sm font-heading font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Sign up free
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
