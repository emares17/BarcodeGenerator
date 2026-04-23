import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface LabelPreviewProps {
  pdfBase64: string;
  labelCount: number;
  totalSheets: number;
  labelsOnFirstSheet: number;
  onGenerateAll: () => void;
  onClose: () => void;
}

function LabelPreview({ pdfBase64, labelCount, totalSheets, labelsOnFirstSheet, onGenerateAll, onClose }: LabelPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const activeUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setLoaded(false);
    const bytes = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    activeUrlRef.current = url;
    setPdfUrl(url);

    return () => {
      URL.revokeObjectURL(url);
      activeUrlRef.current = null;
    };
  }, [pdfBase64]);

  const sheetLabel = totalSheets === 1 ? 'sheet' : 'sheets';
  const labelLabel = labelCount === 1 ? 'label' : 'labels';

  return (
    <div className="flex flex-col bg-card border border-border rounded-[16px] overflow-hidden" style={{ height: 'calc(100vh - 6rem)' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="font-heading text-sm font-semibold text-foreground">First Sheet Preview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {labelsOnFirstSheet} of {labelCount} {labelLabel} · {totalSheets} {sheetLabel} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onGenerateAll}
            className="h-9 px-5 bg-primary text-primary-foreground font-heading text-sm font-medium rounded-full hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Generate All
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer bg-transparent border-none"
            title="Close preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 bg-[#3A3A3A] flex items-center justify-center p-6 relative overflow-hidden">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
          </div>
        )}
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            title="Label Preview"
            className={`w-full h-full rounded shadow-2xl transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ border: 'none' }}
            onLoad={() => setLoaded(true)}
          />
        )}
      </div>
    </div>
  );
}

export default LabelPreview;
