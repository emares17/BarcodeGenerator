import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import axios from 'axios';
import { Upload, Download, Trash2, RefreshCw, FileSpreadsheet, AlertCircle, CheckCircle2, Plus, X } from 'lucide-react';

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
    // Trim text columns to fit template's max
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
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing saved sheet states:', error);
        return {};
      }
    }
    return {};
  });

  useEffect(() => {
    fetchUserSheets();
  }, []);

  useEffect(() => {
    localStorage.setItem('sheetStates', JSON.stringify(sheetStates));
  }, [sheetStates]);

  const fetchUserSheets = async () => {
    try {
      const response = await axios.get(`${API_URL}/my-sheets`, {
        withCredentials: true
      });
      setUserSheets(response.data.sheets);

      const currentSheetIds = new Set(response.data.sheets.map((sheet: UserSheet) => sheet.id));
      setSheetStates(prev => {
        const cleaned = Object.fromEntries(
          Object.entries(prev).filter(([sheetId]) => currentSheetIds.has(sheetId))
        );
        return cleaned;
      });
    } catch (err) {
      console.error('Error fetching sheets:', err);
      setError('Failed to load your saved sheets');
    } finally {
      setFetchingSheets(false);
    }
  };

  const downloadSheet = async (userSheetId: string, filename: string) => {
    setSheetStates(prev => ({
      ...prev,
      [userSheetId]: { ...prev[userSheetId], downloadStatus: 'downloading' }
    }));

    try {
      const response = await axios.get(
        `${API_URL}/download-sheet/${userSheetId}`,
        { withCredentials: true, responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${filename.split('.')[0]}_labels.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSheetStates(prev => ({
        ...prev,
        [userSheetId]: { ...prev[userSheetId], downloadStatus: 'downloaded' }
      }));
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download sheet');
      setTimeout(() => setError(''), 5000);
      setSheetStates(prev => ({
        ...prev,
        [userSheetId]: { ...prev[userSheetId], downloadStatus: 'idle' }
      }));
    }
  };

  const deleteSheet = async (userSheetId: string) => {
    if (!confirm('Are you sure you want to delete this sheet? This cannot be undone.')) return;

    setSheetStates(prev => ({
      ...prev,
      [userSheetId]: { ...prev[userSheetId], deleteStatus: 'deleting' }
    }));

    try {
      await axios.delete(`${API_URL}/delete-sheet/${userSheetId}`, { withCredentials: true });
      setUserSheets(userSheets.filter(sheet => sheet.id !== userSheetId));
      setSheetStates(prev => {
        const newStates = { ...prev };
        delete newStates[userSheetId];
        return newStates;
      });
      setSuccess('Sheet deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete sheet');
      setTimeout(() => setError(''), 5000);
      setSheetStates(prev => ({
        ...prev,
        [userSheetId]: { ...prev[userSheetId], deleteStatus: 'idle' }
      }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError('');
    setSuccess('');
    setUploadProgress(0);
    setProcessingStatus('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async () => {
    const startTime = Date.now();

    if (!file) {
      setError('Please select a file first.');
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 50MB.');
      return;
    }

    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a CSV or Excel file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('template_id', selectedTemplate);
    formData.append('column_mapping', JSON.stringify({
      barcode_column: barcodeColumn,
      text_columns: textColumns,
      has_header_row: hasHeaderRow,
    }));
    formData.append('barcode_type', barcodeType);

    setLoading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);
    setProcessingStatus('Uploading file...');

    try {
      const response = await axios.post<BackendUploadResponse>(
        `${API_URL}/upload`,
        formData,
        {
          withCredentials: true,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
              setProcessingStatus('Uploading file...');
            }
          }
        }
      );

      const result = response.data;
      setProcessingStatus('Processing complete!');
      setUploadProgress(100);
      setSuccess(result.message);
      await fetchUserSheets();

      const totalTime = (Date.now() - startTime) / 1000;
      console.log(`Total processing time: ${totalTime.toFixed(2)} seconds`);

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setTimeout(() => {
        setSuccess('');
        setUploadProgress(0);
        setProcessingStatus('');
      }, 5000);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadProgress(0);
      setProcessingStatus('');

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response?.status === 400) {
          setError(err.response.data?.error || 'Invalid file format.');
        } else if (err.response?.status === 413) {
          setError('File too large. Please try a smaller file.');
        } else if (err.response?.status === 429) {
          setError('Too many requests. Please wait a moment and try again.');
        } else if (err.response?.status && err.response.status >= 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(err.response?.data?.error || 'Failed to process the file.');
        }
      } else {
        setError('An unexpected error occurred. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl">
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
            className={`flex flex-col items-center gap-4 rounded-[16px] border-2 border-dashed px-6 py-12 transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-border bg-secondary/30'
            }`}
          >
            <div className="w-12 h-12 rounded-[16px] bg-secondary flex items-center justify-center">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Drag and drop your file here</p>
              <p className="text-xs text-muted-foreground mt-1">CSV, Excel (.xlsx, .xls) up to 50MB</p>
            </div>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={loading}
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <button
                className="h-10 px-5 bg-card text-foreground font-heading text-sm font-medium rounded-full border border-border shadow-sm hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={loading}
              >
                {file ? file.name : 'Browse Files'}
              </button>
            </div>
            {file && (
              <p className="text-xs text-muted-foreground">
                Selected: {file.name} ({formatFileSize(file.size)})
              </p>
            )}
          </div>

          {/* Progress */}
          {loading && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{processingStatus}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-start gap-3 p-3 bg-error rounded-[12px]">
              <AlertCircle className="w-4 h-4 text-error-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-error-foreground">{error}</p>
            </div>
          )}

          {/* Success */}
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
              <button
                key={t.id}
                onClick={() => handleTemplateChange(t.id)}
                className={`relative flex flex-col items-start p-3 rounded-[16px] border-2 transition-all cursor-pointer bg-card text-left ${
                  selectedTemplate === t.id
                    ? 'border-primary shadow-sm'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                {selectedTemplate === t.id && (
                  <span className="absolute top-2 right-2 bg-primary text-primary-foreground font-heading text-[9px] font-semibold px-2 py-0.5 rounded-full tracking-wide">
                    DEFAULT
                  </span>
                )}
                <span className="font-heading text-xs font-semibold text-foreground">{t.name}</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</span>

                {/* Grid Preview */}
                <div className="w-full mt-2 bg-secondary/50 rounded-[12px] p-2 aspect-[4/3]">
                  <div className="w-full h-full grid gap-[3px]" style={{ gridTemplateRows: `repeat(${Math.min(t.rows, 6)}, 1fr)`, gridTemplateColumns: `repeat(${t.cols}, 1fr)` }}>
                    {Array.from({ length: Math.min(t.rows, 6) * t.cols }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-[2px] ${
                          selectedTemplate === t.id
                            ? 'bg-primary/15 border border-primary/30'
                            : 'bg-secondary border border-border'
                        }`}
                      />
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
            {([
              { id: 'code128', label: 'Code 128', desc: 'Standard linear barcode' },
              { id: 'qr', label: 'QR Code', desc: '2D matrix barcode' },
            ] as const).map((bt) => (
              <button
                key={bt.id}
                onClick={() => setBarcodeType(bt.id)}
                className={`flex flex-col items-start p-3 rounded-[16px] border-2 transition-all cursor-pointer bg-card text-left flex-1 ${
                  barcodeType === bt.id
                    ? 'border-primary shadow-sm'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
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

          {/* Barcode Column */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-foreground mb-1.5">Barcode Column <span className="text-destructive">*</span></label>
            <input
              type="number"
              min={1}
              max={26}
              value={barcodeColumn}
              onChange={(e) => setBarcodeColumn(Math.max(1, Math.min(26, parseInt(e.target.value) || 1)))}
              className="h-9 w-20 px-3 rounded-[10px] border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <span className="text-xs text-muted-foreground ml-2">Which column has the barcode value?</span>
          </div>

          {/* Text Columns */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Text Fields {currentTemplate.maxTextLines > 0 && <span className="text-muted-foreground font-normal">(max {currentTemplate.maxTextLines})</span>}
            </label>
            <div className="flex flex-col gap-2">
              {textColumns.map((tc, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground w-8">Col</span>
                    <input
                      type="number"
                      min={1}
                      max={26}
                      value={tc.column}
                      onChange={(e) => updateTextColumn(index, 'column', Math.max(1, Math.min(26, parseInt(e.target.value) || 1)))}
                      className="h-9 w-20 px-3 rounded-[10px] border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-xs text-muted-foreground w-10">Label</span>
                    <input
                      type="text"
                      value={tc.label}
                      onChange={(e) => updateTextColumn(index, 'label', e.target.value)}
                      placeholder="e.g. Location, Size, SKU..."
                      maxLength={50}
                      className="h-9 flex-1 px-3 rounded-[10px] border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <button
                    onClick={() => removeTextColumn(index)}
                    className="p-2 rounded-[10px] text-muted-foreground hover:text-destructive hover:bg-error/50 transition-colors cursor-pointer bg-transparent border-none"
                    title="Remove field"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {textColumns.length < currentTemplate.maxTextLines && (
              <button
                onClick={addTextColumn}
                className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer bg-transparent border-none"
              >
                <Plus className="w-3.5 h-3.5" />
                Add text field
              </button>
            )}
          </div>

          {/* Header Row Toggle */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
            <button
              onClick={() => setHasHeaderRow(!hasHeaderRow)}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer ${
                hasHeaderRow ? 'border-primary bg-primary' : 'border-muted-foreground/40 bg-card'
              }`}
            >
              {hasHeaderRow && (
                <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className="text-xs text-foreground">First row is headers</span>
            <span className="text-xs text-muted-foreground">(skip first row when processing)</span>
          </div>
        </div>

        {/* Upload Action */}
        <div className="px-6 py-4 border-t border-border">
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="h-11 px-6 bg-primary text-primary-foreground font-heading text-sm font-medium rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'Generating...' : 'Generate Label Sheets'}
          </button>
        </div>
      </div>

      {/* Sheet History */}
      <div className="bg-card border border-border rounded-[16px] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">Sheet History</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fetchingSheets ? 'Loading...' : `${userSheets.length} generated sheet${userSheets.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={fetchUserSheets}
            className="p-2 rounded-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer bg-transparent border-none"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {fetchingSheets ? (
          <div className="px-6 py-12 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Loading your sheets...</p>
          </div>
        ) : userSheets.length > 0 ? (
          <div className={userSheets.length > 10 ? 'max-h-[500px] overflow-y-auto' : ''}>
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="bg-secondary/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filename</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Labels</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sheets</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {userSheets.map((sheet) => {
                  const downloadStatus = sheetStates[sheet.id]?.downloadStatus || 'idle';
                  const deleteStatus = sheetStates[sheet.id]?.deleteStatus || 'idle';

                  return (
                    <tr key={sheet.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-3.5 text-sm text-foreground font-medium">
                        <div className="flex items-center gap-2.5">
                          <FileSpreadsheet className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{sheet.original_filename}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">{sheet.label_count}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">{sheet.sheet_count}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground">{formatFileSize(sheet.total_size_bytes)}</td>
                      <td className="px-6 py-3.5 text-sm text-muted-foreground hidden md:table-cell">{formatDate(sheet.created_at)}</td>
                      <td className="px-6 py-3.5 text-sm text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => downloadSheet(sheet.id, sheet.original_filename)}
                            disabled={downloadStatus === 'downloading' || deleteStatus === 'deleting'}
                            className={`p-2 rounded-[10px] transition-colors cursor-pointer bg-transparent border-none ${
                              downloadStatus === 'downloading'
                                ? 'text-muted-foreground cursor-not-allowed'
                                : downloadStatus === 'downloaded'
                                ? 'text-success-foreground hover:bg-success'
                                : 'text-primary hover:bg-primary/10'
                            }`}
                            title={
                              downloadStatus === 'downloading' ? 'Downloading...'
                                : downloadStatus === 'downloaded' ? 'Downloaded'
                                : 'Download'
                            }
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteSheet(sheet.id)}
                            disabled={deleteStatus === 'deleting' || downloadStatus === 'downloading'}
                            className={`p-2 rounded-[10px] transition-colors cursor-pointer bg-transparent border-none ${
                              deleteStatus === 'deleting'
                                ? 'text-muted-foreground cursor-not-allowed'
                                : 'text-destructive hover:bg-error'
                            }`}
                            title={deleteStatus === 'deleting' ? 'Deleting...' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
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
            <p className="text-sm text-muted-foreground">No sheets generated yet. Upload a file to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LabelUploader;
