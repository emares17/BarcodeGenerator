import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import axios from 'axios';
import { Upload, Download, Trash2, RefreshCw, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';

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
