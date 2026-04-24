import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import axios from 'axios';
import {
  Upload, Download, Trash2, RefreshCw, FileSpreadsheet,
  AlertCircle, CheckCircle2, Plus, X,
  ChevronDown, ChevronRight, Search, Printer,
} from 'lucide-react';
import LabelPreview from './LabelPreview';

interface BackendUploadResponse {
  success: boolean;
  user_sheet_id: string;
  files_uploaded: number;
  total_size: number;
  label_count: number;
  sheet_count: number;
  message: string;
}

interface UserSheet {
  id: string;
  original_filename: string;
  label_count: number;
  sheet_count: number;
  total_size_bytes: number;
  created_at: string;
  template_id?: string;
  barcode_type?: string;
}

interface LabelItem {
  id: string;
  user_sheet_id: string;
  original_filename: string;
  label_index: number;
  sheet_number: number;
  position_on_sheet: number;
  barcode_value: string;
  text_fields: { label: string; value: string }[];
  barcode_type: string;
  template_id: string;
  created_at: string;
}

interface PreviewData {
  preview_pdf: string;
  label_count: number;
  total_sheets: number;
  labels_on_first_sheet: number;
}

function LabelUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [userSheets, setUserSheets] = useState<UserSheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSheets, setFetchingSheets] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('standard_20');
  const [barcodeColumn, setBarcodeColumn] = useState(1);
  const [textColumns, setTextColumns] = useState<{ column: number; label: string }[]>([
    { column: 1, label: 'Location' },
    { column: 4, label: 'Unit' },
  ]);
  const [hasHeaderRow, setHasHeaderRow] = useState(false);
  const [barcodeType, setBarcodeType] = useState<'code128' | 'qr'>('code128');
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  // Sheet expansion + selective download state
  const [expandedSheetId, setExpandedSheetId] = useState<string | null>(null);
  const [selectedSheets, setSelectedSheets] = useState<{ [sheetId: string]: Set<number> }>({});
  const [singleSheetDownloadStates, setSingleSheetDownloadStates] = useState<{ [key: string]: 'idle' | 'downloading' }>({});
  const [selectedDownloadStates, setSelectedDownloadStates] = useState<{ [sheetId: string]: 'idle' | 'downloading' }>({});

  // History filter
  const [filterFilename, setFilterFilename] = useState('');

  // Label search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LabelItem[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOffset, setSearchOffset] = useState(0);
  const [reprintStates, setReprintStates] = useState<{ [labelId: string]: 'idle' | 'downloading' }>({});
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SEARCH_LIMIT = 50;

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

  const [sheetStates, setSheetStates] = useState<{
    [sheetId: string]: {
      downloadStatus: 'idle' | 'downloading' | 'downloaded';
      deleteStatus: 'idle' | 'deleting';
    }
  }>(() => {
    const saved = localStorage.getItem('sheetStates');
    if (saved && saved !== 'undefined') {
      try { return JSON.parse(saved); } catch { return {}; }
    }
    return {};
  });

  useEffect(() => { fetchUserSheets(); }, []);

  useEffect(() => {
    localStorage.setItem('sheetStates', JSON.stringify(sheetStates));
  }, [sheetStates]);

  const fetchUserSheets = async () => {
    try {
      const response = await axios.get(`${API_URL}/my-sheets`, { withCredentials: true });
      setUserSheets(response.data.sheets);
      const currentIds = new Set(response.data.sheets.map((s: UserSheet) => s.id));
      setSheetStates(prev => Object.fromEntries(Object.entries(prev).filter(([id]) => currentIds.has(id))));
    } catch (err) {
      console.error('Error fetching sheets:', err);
      setError('Failed to load your saved sheets');
    } finally {
      setFetchingSheets(false);
    }
  };

  // ── Blob download helper ──────────────────────────────────────────────
  const triggerBlobDownload = (data: BlobPart, type: string, filename: string) => {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // ── Full ZIP download ────────────────────────────────────────────────
  const downloadSheet = async (userSheetId: string, filename: string) => {
    setSheetStates(prev => ({ ...prev, [userSheetId]: { ...prev[userSheetId], downloadStatus: 'downloading' } }));
    try {
      const response = await axios.get(`${API_URL}/download-sheet/${userSheetId}`, {
        withCredentials: true, responseType: 'blob',
      });
      triggerBlobDownload(response.data, 'application/zip', `${filename.split('.')[0]}_labels.zip`);
      setSheetStates(prev => ({ ...prev, [userSheetId]: { ...prev[userSheetId], downloadStatus: 'downloaded' } }));
    } catch {
      setError('Failed to download sheet');
      setTimeout(() => setError(''), 5000);
      setSheetStates(prev => ({ ...prev, [userSheetId]: { ...prev[userSheetId], downloadStatus: 'idle' } }));
    }
  };

  // ── Single sheet download ────────────────────────────────────────────
  const downloadSingleSheet = async (userSheetId: string, sheetNumber: number, filename: string) => {
    const key = `${userSheetId}_${sheetNumber}`;
    setSingleSheetDownloadStates(prev => ({ ...prev, [key]: 'downloading' }));
    try {
      const response = await axios.get(
        `${API_URL}/download-sheet/${userSheetId}/sheet/${sheetNumber}`,
        { withCredentials: true, responseType: 'blob' },
      );
      triggerBlobDownload(response.data, 'application/pdf', `${filename.split('.')[0]}_sheet_${sheetNumber}.pdf`);
    } catch {
      setError('Failed to download sheet');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSingleSheetDownloadStates(prev => ({ ...prev, [key]: 'idle' }));
    }
  };

  // ── Selected sheets download ─────────────────────────────────────────
  const downloadSelectedSheets = async (userSheetId: string, filename: string) => {
    const selected = selectedSheets[userSheetId];
    if (!selected || selected.size === 0) return;
    setSelectedDownloadStates(prev => ({ ...prev, [userSheetId]: 'downloading' }));
    try {
      const response = await axios.post(
        `${API_URL}/download-sheet/${userSheetId}/selected`,
        { sheet_numbers: Array.from(selected) },
        { withCredentials: true, responseType: 'blob' },
      );
      triggerBlobDownload(response.data, 'application/zip', `${filename.split('.')[0]}_selected_sheets.zip`);
    } catch {
      setError('Failed to download selected sheets');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSelectedDownloadStates(prev => ({ ...prev, [userSheetId]: 'idle' }));
    }
  };

  // ── Expand / collapse ────────────────────────────────────────────────
  const toggleExpand = (sheetId: string) => {
    if (expandedSheetId === sheetId) {
      setExpandedSheetId(null);
      setSelectedSheets(prev => { const n = { ...prev }; delete n[sheetId]; return n; });
    } else {
      setExpandedSheetId(sheetId);
    }
  };

  const toggleSheetSelection = (sheetId: string, sheetNum: number) => {
    setSelectedSheets(prev => {
      const current = new Set(prev[sheetId] || []);
      current.has(sheetNum) ? current.delete(sheetNum) : current.add(sheetNum);
      return { ...prev, [sheetId]: current };
    });
  };

  const getLabelRange = (sheet: UserSheet, sheetNum: number): string => {
    if (!sheet.template_id) return '';
    const tmpl = templates.find(t => t.id === sheet.template_id);
    if (!tmpl) return '';
    const lps = tmpl.rows * tmpl.cols;
    const start = (sheetNum - 1) * lps + 1;
    const end = Math.min(sheetNum * lps, sheet.label_count);
    return `labels ${start}–${end}`;
  };

  // ── Label search ─────────────────────────────────────────────────────
  const searchLabels = async (query: string, offset = 0) => {
    if (!query.trim()) { setSearchResults([]); setSearchTotal(0); return; }
    setSearchLoading(true);
    try {
      const response = await axios.get(`${API_URL}/labels/search`, {
        params: { q: query, limit: SEARCH_LIMIT, offset },
        withCredentials: true,
      });
      if (offset === 0) {
        setSearchResults(response.data.results);
      } else {
        setSearchResults(prev => [...prev, ...response.data.results]);
      }
      setSearchTotal(response.data.total);
      setSearchOffset(offset);
    } catch {
      setError('Label search failed');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!value.trim()) { setSearchResults([]); setSearchTotal(0); return; }
    searchTimeoutRef.current = setTimeout(() => searchLabels(value.trim(), 0), 300);
  };

  // ── Reprint ──────────────────────────────────────────────────────────
  const reprintLabel = async (labelId: string) => {
    setReprintStates(prev => ({ ...prev, [labelId]: 'downloading' }));
    try {
      const response = await axios.get(`${API_URL}/labels/${labelId}/reprint`, {
        withCredentials: true, responseType: 'blob',
      });
      triggerBlobDownload(response.data, 'application/pdf', `reprint_${labelId.slice(0, 8)}.pdf`);
    } catch {
      setError('Failed to generate reprint');
      setTimeout(() => setError(''), 5000);
    } finally {
      setReprintStates(prev => ({ ...prev, [labelId]: 'idle' }));
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────
  const deleteSheet = async (userSheetId: string) => {
    if (!confirm('Are you sure you want to delete this sheet? This cannot be undone.')) return;
    setSheetStates(prev => ({ ...prev, [userSheetId]: { ...prev[userSheetId], deleteStatus: 'deleting' } }));
    try {
      await axios.delete(`${API_URL}/delete-sheet/${userSheetId}`, { withCredentials: true });
      setUserSheets(userSheets.filter(s => s.id !== userSheetId));
      setSheetStates(prev => { const n = { ...prev }; delete n[userSheetId]; return n; });
      if (expandedSheetId === userSheetId) setExpandedSheetId(null);
      setSuccess('Sheet deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to delete sheet');
      setTimeout(() => setError(''), 5000);
      setSheetStates(prev => ({ ...prev, [userSheetId]: { ...prev[userSheetId], deleteStatus: 'idle' } }));
    }
  };

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
    if (file.size > 50 * 1024 * 1024) { setError('File too large. Maximum size is 50MB.'); return; }
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
      await fetchUserSheets();
      console.log(`Total time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
      setFile(null); setPreviewData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => { setSuccess(''); setUploadProgress(0); setProcessingStatus(''); }, 5000);
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
    if (file.size > 50 * 1024 * 1024) { setError('File too large. Maximum size is 50MB.'); return; }
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

  const formatDate = (d: string) => new Date(d).toLocaleString();

  const filteredSheets = filterFilename
    ? userSheets.filter(s => s.original_filename.toLowerCase().includes(filterFilename.toLowerCase()))
    : userSheets;

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
              <div className="mt-4 flex items-start gap-3 p-3 bg-success rounded-[12px]">
                <CheckCircle2 className="w-4 h-4 text-success-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-success-foreground">{success}</p>
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
              <label className="block text-xs font-medium text-foreground mb-1.5">Barcode Column <span className="text-destructive">*</span></label>
              <input type="number" min={1} max={26} value={barcodeColumn} onChange={(e) => setBarcodeColumn(Math.max(1, Math.min(26, parseInt(e.target.value) || 1)))} className="h-9 w-20 px-3 rounded-[10px] border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              <span className="text-xs text-muted-foreground ml-2">Which column has the barcode value?</span>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium text-foreground mb-1.5">Text Fields {currentTemplate.maxTextLines > 0 && <span className="text-muted-foreground font-normal">(max {currentTemplate.maxTextLines})</span>}</label>
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

        {/* Sheet History */}
        <div className="bg-card border border-border rounded-[16px] shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-border flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">Sheet History</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {fetchingSheets ? 'Loading...' : `${filteredSheets.length} of ${userSheets.length} sheet${userSheets.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter by filename..."
                  value={filterFilename}
                  onChange={e => setFilterFilename(e.target.value)}
                  className="h-9 w-full pl-8 pr-3 rounded-[10px] border border-border bg-card text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/50"
                />
              </div>
              <button onClick={fetchUserSheets} className="p-2 rounded-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer bg-transparent border-none flex-shrink-0" title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {fetchingSheets ? (
            <div className="px-6 py-12 flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">Loading your sheets...</p>
            </div>
          ) : filteredSheets.length > 0 ? (
            <div className={userSheets.length > 10 ? 'max-h-[600px] overflow-y-auto' : ''}>
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-secondary/50">
                    <th className="px-4 py-3 w-6" />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filename</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Labels</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sheets</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Created</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredSheets.map((sheet) => {
                    const downloadStatus = sheetStates[sheet.id]?.downloadStatus || 'idle';
                    const deleteStatus = sheetStates[sheet.id]?.deleteStatus || 'idle';
                    const isExpanded = expandedSheetId === sheet.id;
                    const numSelected = selectedSheets[sheet.id]?.size ?? 0;

                    return (
                      <>
                        <tr key={sheet.id} className="hover:bg-secondary/30 transition-colors">
                          {/* Expand chevron */}
                          <td className="px-4 py-3.5">
                            <button onClick={() => toggleExpand(sheet.id)} className="p-1 rounded-[6px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer bg-transparent border-none">
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-foreground font-medium">
                            <div className="flex items-center gap-2.5">
                              <FileSpreadsheet className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate max-w-[180px]">{sheet.original_filename}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground">{sheet.label_count}</td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground">{sheet.sheet_count}</td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground">{formatFileSize(sheet.total_size_bytes)}</td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground hidden md:table-cell">{formatDate(sheet.created_at)}</td>
                          <td className="px-4 py-3.5 text-sm text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => downloadSheet(sheet.id, sheet.original_filename)}
                                disabled={downloadStatus === 'downloading' || deleteStatus === 'deleting'}
                                title={downloadStatus === 'downloading' ? 'Downloading...' : downloadStatus === 'downloaded' ? 'Downloaded' : 'Download all'}
                                className={`p-2 rounded-[10px] transition-colors cursor-pointer bg-transparent border-none ${downloadStatus === 'downloading' ? 'text-muted-foreground cursor-not-allowed' : downloadStatus === 'downloaded' ? 'text-success-foreground hover:bg-success' : 'text-primary hover:bg-primary/10'}`}
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteSheet(sheet.id)}
                                disabled={deleteStatus === 'deleting' || downloadStatus === 'downloading'}
                                title={deleteStatus === 'deleting' ? 'Deleting...' : 'Delete'}
                                className={`p-2 rounded-[10px] transition-colors cursor-pointer bg-transparent border-none ${deleteStatus === 'deleting' ? 'text-muted-foreground cursor-not-allowed' : 'text-destructive hover:bg-error'}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded individual sheets */}
                        {isExpanded && (
                          <tr key={`${sheet.id}-expanded`}>
                            <td colSpan={7} className="bg-secondary/20 border-b border-border">
                              <div className="px-8 py-3">
                                <div className="flex flex-col gap-0.5">
                                  {Array.from({ length: sheet.sheet_count }, (_, i) => i + 1).map(sheetNum => {
                                    const key = `${sheet.id}_${sheetNum}`;
                                    const isDownloading = singleSheetDownloadStates[key] === 'downloading';
                                    const isSelected = selectedSheets[sheet.id]?.has(sheetNum) ?? false;
                                    const range = getLabelRange(sheet, sheetNum);
                                    return (
                                      <div key={sheetNum} className="flex items-center gap-3 py-1.5 px-3 rounded-[10px] hover:bg-secondary/40 transition-colors group">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => toggleSheetSelection(sheet.id, sheetNum)}
                                          className="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer"
                                        />
                                        <span className="text-xs text-foreground flex-1">
                                          Sheet {sheetNum}
                                          {range && <span className="text-muted-foreground ml-2">{range}</span>}
                                        </span>
                                        <button
                                          onClick={() => downloadSingleSheet(sheet.id, sheetNum, sheet.original_filename)}
                                          disabled={isDownloading}
                                          title={isDownloading ? 'Downloading...' : 'Download PDF'}
                                          className="p-1.5 rounded-[8px] text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer bg-transparent border-none opacity-0 group-hover:opacity-100 disabled:cursor-not-allowed"
                                        >
                                          {isDownloading
                                            ? <div className="w-3.5 h-3.5 border border-primary border-t-transparent rounded-full animate-spin" />
                                            : <Download className="w-3.5 h-3.5" />}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>

                                {numSelected > 0 && (
                                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{numSelected} sheet{numSelected !== 1 ? 's' : ''} selected</span>
                                    <button
                                      onClick={() => downloadSelectedSheets(sheet.id, sheet.original_filename)}
                                      disabled={selectedDownloadStates[sheet.id] === 'downloading'}
                                      className="h-8 px-4 bg-primary text-primary-foreground font-heading text-xs font-medium rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                      {selectedDownloadStates[sheet.id] === 'downloading' ? 'Downloading...' : `Download Selected (${numSelected})`}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-[16px] bg-secondary flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {filterFilename ? 'No sheets match your filter.' : 'No sheets generated yet. Upload a file to get started.'}
              </p>
            </div>
          )}
        </div>

        {/* Label Search */}
        <div className="bg-card border border-border rounded-[16px] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="font-heading text-base font-semibold text-foreground">Label Search</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Find and reprint any label by barcode value</p>
          </div>
          <div className="px-6 py-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search by barcode value..."
                value={searchQuery}
                onChange={e => handleSearchInput(e.target.value)}
                className="h-10 w-full pl-10 pr-4 rounded-[10px] border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/50"
              />
            </div>

            {searchLoading && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                Searching...
              </div>
            )}

            {!searchLoading && searchQuery && searchResults.length === 0 && (
              <p className="mt-4 text-sm text-muted-foreground text-center py-6">No labels found for "{searchQuery}"</p>
            )}

            {searchResults.length > 0 && (
              <div className="mt-4 flex flex-col gap-0.5">
                {searchResults.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-2.5 px-3 rounded-[10px] hover:bg-secondary/30 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.barcode_value}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.text_fields.map(tf => `${tf.label}: ${tf.value}`).join(' · ')}
                        {item.text_fields.length > 0 && ' · '}
                        {item.original_filename} · Sheet {item.sheet_number}
                      </p>
                    </div>
                    <button
                      onClick={() => reprintLabel(item.id)}
                      disabled={reprintStates[item.id] === 'downloading'}
                      title="Reprint this label"
                      className="flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer bg-transparent border border-border hover:border-primary/30 opacity-0 group-hover:opacity-100 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      {reprintStates[item.id] === 'downloading'
                        ? <div className="w-3.5 h-3.5 border border-primary border-t-transparent rounded-full animate-spin" />
                        : <Printer className="w-3.5 h-3.5" />}
                      Reprint
                    </button>
                  </div>
                ))}

                {searchResults.length < searchTotal && (
                  <div className="mt-3 flex justify-center">
                    <button
                      onClick={() => searchLabels(searchQuery, searchOffset + SEARCH_LIMIT)}
                      disabled={searchLoading}
                      className="h-8 px-4 bg-card text-foreground font-heading text-xs font-medium rounded-full border border-border hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Load more ({searchTotal - searchResults.length} remaining)
                    </button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center mt-2">
                  Showing {searchResults.length} of {searchTotal} result{searchTotal !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

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
