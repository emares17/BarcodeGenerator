import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Upload, AlertCircle, CheckCircle2, Plus, X, ArrowRight,
} from 'lucide-react';
import { usePostHog } from '@posthog/react';
import LabelPreview from './LabelPreview';
import FieldHelp from './FieldHelp';
import ColumnMappingTour from './ColumnMappingTour';
import { BARCODE_COLUMN_HELP, TEXT_FIELDS_HELP, HEADER_ROW_HELP } from './columnMappingHelp';

interface BackendUploadResponse {
  success: boolean;
  user_sheet_id: string;
  files_uploaded: number;
  total_size: number;
  label_count: number;
  sheet_count: number;
  message: string;
}

interface PreviewData {
  preview_pdf: string;
  label_count: number;
  total_sheets: number;
  labels_on_first_sheet: number;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024

function LabelUploader() {
  const navigate = useNavigate();
  const posthog = usePostHog();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('standard_20');
  const [barcodeColumn, setBarcodeColumn] = useState(1);
  const [textColumns, setTextColumns] = useState<{ column: number; label: string }[]>([
    { column: 1, label: '' },
  ]);
  const [hasHeaderRow, setHasHeaderRow] = useState(false);
  const [barcodeType, setBarcodeType] = useState<'code128' | 'qr'>('code128');
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  const templates = [
    { id: 'standard_20', name: 'Standard', desc: '20 labels per sheet', size: '1.75" x 1.8"', grid: '5 x 4', rows: 5, cols: 4, maxTextLines: 2 },
    { id: '5163', name: '5163', desc: 'Compatible with Avery 5163', size: '2" x 4"', grid: '5 x 2', rows: 5, cols: 2, maxTextLines: 2 },
    { id: '5160', name: '5160', desc: 'Compatible with Avery 5160', size: '1" x 2 5/8"', grid: '10 x 3', rows: 10, cols: 3, maxTextLines: 1 },
    { id: '94233', name: '94233', desc: 'Compatible with Avery 94233', size: '2.5" x 2.5"', grid: '4 x 3', rows: 4, cols: 3, maxTextLines: 2 },
  ];

  const currentTemplate = templates.find(t => t.id === selectedTemplate)!;

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId)!;
    setTextColumns(prev => prev.slice(0, template.maxTextLines));
  };

  const addTextColumn = () => {
    if (textColumns.length >= currentTemplate.maxTextLines) return;
    setTextColumns(prev => [...prev, { column: 1, label: '' }]);
  };

  const removeTextColumn = (index: number) => {
    setTextColumns(prev => prev.filter((_, i) => i !== index));
  };

  const updateTextColumn = (index: number, field: 'column' | 'label', value: number | string) => {
    setTextColumns(prev => prev.map((tc, i) => i === index ? { ...tc, [field]: value } : tc));
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(''); setSuccess(''); setUploadProgress(0); setProcessingStatus('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) { setFile(droppedFile); setError(''); setSuccess(''); }
  };

  const handleUpload = async () => {
    const startTime = Date.now();
    if (!file) { setError('Please select a file first.'); return; }
    if (file.size > MAX_FILE_SIZE) { setError('File too large. Maximum size is 50MB.'); return; }
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) { setError('Invalid file type. Please upload a CSV or Excel file.'); return; }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('template_id', selectedTemplate);
    formData.append('column_mapping', JSON.stringify({ barcode_column: barcodeColumn, text_columns: textColumns, has_header_row: hasHeaderRow }));
    formData.append('barcode_type', barcodeType);

    setLoading(true); setError(''); setSuccess(''); setUploadProgress(0); setProcessingStatus('Uploading file...');

    try {
      const response = await axios.post<BackendUploadResponse>(`${API_URL}/upload`, formData, {
        withCredentials: true,
        onUploadProgress: (e) => {
          if (e.total) { setUploadProgress(Math.round((e.loaded * 100) / e.total)); setProcessingStatus('Uploading file...'); }
        },
      });
      setProcessingStatus('Processing complete!');
      setUploadProgress(100);
      setSuccess(response.data.message);
      posthog.capture('label_generation_completed', {
        duration_ms: Date.now() - startTime,
        label_count: response.data.label_count,
        sheet_count: response.data.sheet_count,
        total_size_bytes: response.data.total_size,
        template_id: selectedTemplate,
        barcode_type: barcodeType,
        file_size_bytes: file.size,
      });
      setFile(null); setPreviewData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadProgress(0); setProcessingStatus('');
    } catch (err) {
      setUploadProgress(0); setProcessingStatus('');
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) setError('Authentication failed. Please log in again.');
        else if (err.response?.status === 400) setError(err.response.data?.error || 'Invalid file format.');
        else if (err.response?.status === 413) setError('File too large. Please try a smaller file.');
        else if (err.response?.status === 429) setError('Too many requests. Please wait a moment and try again.');
        else if (err.response?.status && err.response.status >= 500) setError('Server error. Please try again later.');
        else setError(err.response?.data?.error || 'Failed to process the file.');
      } else {
        setError('An unexpected error occurred. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!file) { setError('Please select a file first.'); return; }
    if (file.size > MAX_FILE_SIZE) { setError('File too large. Maximum size is 50MB.'); return; }
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) { setError('Invalid file type. Please upload a CSV or Excel file.'); return; }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('template_id', selectedTemplate);
    formData.append('column_mapping', JSON.stringify({ barcode_column: barcodeColumn, text_columns: textColumns, has_header_row: hasHeaderRow }));
    formData.append('barcode_type', barcodeType);

    setPreviewing(true); setPreviewData(null); setError(''); setSuccess('');
    try {
      const response = await axios.post<PreviewData>(`${API_URL}/preview`, formData, { withCredentials: true });
      setPreviewData(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.status === 429 ? 'Preview limit reached. Please wait before trying again.' : err.response?.data?.error || 'Failed to generate preview.');
      } else {
        setError('An error occurred generating the preview.');
      }
    } finally {
      setPreviewing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`p-6 md:p-10 ${previewData ? 'flex gap-6 max-w-none' : 'max-w-5xl'}`}>
      <div className={previewData ? 'w-[580px] flex-shrink-0' : ''}>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">Generate Labels</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload your CSV or Excel file to generate barcode label sheets</p>
        </div>

        {/* Upload Card */}
        <div className="bg-card border border-border rounded-[16px] shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="font-heading text-base font-semibold text-foreground">Upload File</h2>
          </div>
          <div className="px-6 py-6">
            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center gap-4 rounded-[16px] border-2 border-dashed px-6 py-12 transition-colors ${isDragOver ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30'}`}
            >
              <div className="w-12 h-12 rounded-[16px] bg-secondary flex items-center justify-center">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Drag and drop your file here</p>
                <p className="text-xs text-muted-foreground mt-1">CSV, Excel (.xlsx, .xls) up to 50MB</p>
              </div>
              <div className="relative">
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} disabled={loading} className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                <button className="h-10 px-5 bg-card text-foreground font-heading text-sm font-medium rounded-full border border-border shadow-sm hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" disabled={loading}>
                  {file ? file.name : 'Browse Files'}
                </button>
              </div>
              {file && <p className="text-xs text-muted-foreground">Selected: {file.name} ({formatFileSize(file.size)})</p>}
            </div>

            {loading && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{processingStatus}</span><span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-3 p-3 bg-error rounded-[12px]">
                <AlertCircle className="w-4 h-4 text-error-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-error-foreground">{error}</p>
              </div>
            )}

            {success && (
              <div className="mt-4 flex items-start justify-between gap-3 p-3 bg-success rounded-[12px]">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-success-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-success-foreground">{success}</p>
                </div>
                <button
                  onClick={() => navigate('/inventory')}
                  className="flex-shrink-0 flex items-center gap-1.5 text-sm font-medium text-success-foreground hover:opacity-80 transition-opacity bg-transparent border-none cursor-pointer whitespace-nowrap"
                >
                  View in Inventory <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Template Selector */}
          <div className="px-6 py-5 border-t border-border">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-1">Select Label Template</h3>
            <p className="text-xs text-muted-foreground mb-4">Choose a template that matches your label sheets</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {templates.map((t) => (
                <button key={t.id} onClick={() => handleTemplateChange(t.id)} className={`relative flex flex-col items-start p-3 rounded-[16px] border-2 transition-all cursor-pointer bg-card text-left ${selectedTemplate === t.id ? 'border-primary shadow-sm' : 'border-border hover:border-muted-foreground/30'}`}>
                  {selectedTemplate === t.id && <span className="absolute top-2 right-2 bg-primary text-primary-foreground font-heading text-[9px] font-semibold px-2 py-0.5 rounded-full tracking-wide">DEFAULT</span>}
                  <span className="font-heading text-xs font-semibold text-foreground">{t.name}</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</span>
                  <div className="w-full mt-2 bg-secondary/50 rounded-[12px] p-2 aspect-[4/3]">
                    <div className="w-full h-full grid gap-[3px]" style={{ gridTemplateRows: `repeat(${Math.min(t.rows, 6)}, 1fr)`, gridTemplateColumns: `repeat(${t.cols}, 1fr)` }}>
                      {Array.from({ length: Math.min(t.rows, 6) * t.cols }).map((_, i) => (
                        <div key={i} className={`rounded-[2px] ${selectedTemplate === t.id ? 'bg-primary/15 border border-primary/30' : 'bg-secondary border border-border'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between w-full mt-2">
                    <span className="text-[10px] text-muted-foreground">{t.size}</span>
                    <span className={`font-heading text-[10px] font-medium ${selectedTemplate === t.id ? 'text-primary' : 'text-muted-foreground'}`}>{t.grid}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Barcode Type */}
          <div className="px-6 py-5 border-t border-border">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-1">Barcode Type</h3>
            <p className="text-xs text-muted-foreground mb-4">Choose the barcode format to generate</p>
            <div className="flex gap-3">
              {([{ id: 'code128', label: 'Code 128', desc: 'Standard linear barcode' }, { id: 'qr', label: 'QR Code', desc: '2D matrix barcode' }] as const).map((bt) => (
                <button key={bt.id} onClick={() => setBarcodeType(bt.id)} className={`flex flex-col items-start p-3 rounded-[16px] border-2 transition-all cursor-pointer bg-card text-left flex-1 ${barcodeType === bt.id ? 'border-primary shadow-sm' : 'border-border hover:border-muted-foreground/30'}`}>
                  <span className="font-heading text-xs font-semibold text-foreground">{bt.label}</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">{bt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Column Mapping */}
          <div className="px-6 py-5 border-t border-border">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-1">Column Mapping</h3>
            <p className="text-xs text-muted-foreground mb-4">Tell us which columns in your file contain the barcode value and text to display</p>
            <div className="mb-4">
              <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1.5">Barcode Column <span className="text-destructive">*</span> <FieldHelp {...BARCODE_COLUMN_HELP} fieldName="barcode_column" /></label>
              <input type="number" min={1} max={26} value={barcodeColumn} onChange={(e) => setBarcodeColumn(Math.max(1, Math.min(26, parseInt(e.target.value) || 1)))} className="h-9 w-20 px-3 rounded-[10px] border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              <span className="text-xs text-muted-foreground ml-2">Which column has the barcode value?</span>
            </div>
            <div className="mb-3">
              <label className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">Text Fields {currentTemplate.maxTextLines > 0 && <span className="text-muted-foreground font-normal">(max {currentTemplate.maxTextLines})</span>} <FieldHelp {...TEXT_FIELDS_HELP} fieldName="text_fields" /></label>
              <p className="text-xs text-muted-foreground mb-2">Optional — adds lines of text to each label. Leave empty for barcode-only labels.</p>
              <div className="flex flex-col gap-2">
                {textColumns.map((tc, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground w-8">Col</span>
                      <input type="number" min={1} max={26} value={tc.column} onChange={(e) => updateTextColumn(index, 'column', Math.max(1, Math.min(26, parseInt(e.target.value) || 1)))} className="h-9 w-20 px-3 rounded-[10px] border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-xs text-muted-foreground w-10">Label</span>
                      <input type="text" value={tc.label} onChange={(e) => updateTextColumn(index, 'label', e.target.value)} placeholder="e.g. Location, Size, SKU..." maxLength={50} className="h-9 flex-1 px-3 rounded-[10px] border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/50" />
                    </div>
                    <button onClick={() => removeTextColumn(index)} className="p-2 rounded-[10px] text-muted-foreground hover:text-destructive hover:bg-error/50 transition-colors cursor-pointer bg-transparent border-none" title="Remove field">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {textColumns.length < currentTemplate.maxTextLines && (
                <button onClick={addTextColumn} className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer bg-transparent border-none">
                  <Plus className="w-3.5 h-3.5" />Add text field
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
              <button onClick={() => setHasHeaderRow(!hasHeaderRow)} className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer ${hasHeaderRow ? 'border-primary bg-primary' : 'border-muted-foreground/40 bg-card'}`}>
                {hasHeaderRow && <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </button>
              <span className="text-xs text-foreground">First row is headers</span>
              <span className="text-xs text-muted-foreground">(skip first row when processing)</span>
              <FieldHelp {...HEADER_ROW_HELP} fieldName="header_row" />
            </div>
          </div>

          {/* Upload Action */}
          <div className="px-6 py-4 border-t border-border flex items-center gap-3">
            <button onClick={handlePreview} disabled={previewing || loading || !file} className="h-11 px-6 bg-card text-foreground font-heading text-sm font-medium rounded-full border border-border shadow-sm hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {previewing ? 'Generating Preview...' : 'Preview First Sheet'}
            </button>
            <button onClick={handleUpload} disabled={loading || previewing || !file} className="h-11 px-6 bg-primary text-primary-foreground font-heading text-sm font-medium rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {loading ? 'Generating...' : 'Generate Label Sheets'}
            </button>
          </div>
        </div>

      </div>

      <ColumnMappingTour />

      {/* Preview Panel */}
      {previewData && (
        <div className="flex-1 min-w-0 sticky top-6" style={{ height: 'calc(100vh - 6rem)' }}>
          <LabelPreview
            pdfBase64={previewData.preview_pdf}
            labelCount={previewData.label_count}
            totalSheets={previewData.total_sheets}
            labelsOnFirstSheet={previewData.labels_on_first_sheet}
            onGenerateAll={handleUpload}
            onClose={() => setPreviewData(null)}
          />
        </div>
      )}
    </div>
  );
}

export default LabelUploader;
