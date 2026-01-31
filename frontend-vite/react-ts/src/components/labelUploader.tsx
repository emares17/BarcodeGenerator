import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import axios from 'axios';

// Updated interface to match new backend response
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
      [userSheetId]: {
        ...prev[userSheetId],
        downloadStatus: 'downloading'
      }
    }));

    try {
      const response = await axios.get(
        `${API_URL}/download-sheet/${userSheetId}`,
        { 
          withCredentials: true,
          responseType: 'blob' 
        }
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
        [userSheetId]: {
          ...prev[userSheetId],
          downloadStatus: 'downloaded'
        }
      }));

    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download sheet');
      setTimeout(() => setError(''), 5000);

      setSheetStates(prev => ({
        ...prev,
        [userSheetId]: {
          ...prev[userSheetId],
          downloadStatus: 'idle'
        }
      }));
    }
  };

  const deleteSheet = async (userSheetId: string) => {
    if (!confirm('Are you sure you want to delete this sheet? This cannot be undone.')) {
      return;
    }

    setSheetStates(prev => ({
      ...prev,
      [userSheetId]: {
        ...prev[userSheetId],
        deleteStatus: 'deleting'
      }
    }));

    try {
      await axios.delete(`${API_URL}/delete-sheet/${userSheetId}`, {
        withCredentials: true
      });
      
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
        [userSheetId]: {
          ...prev[userSheetId],
          deleteStatus: 'idle'
        }
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

  const handleUpload = async () => {
    const startTime = Date.now();

    if (!file) {
      setError('Please select a file first.');
      return;
    }

    // Validate file on frontend before sending
    const maxSize = 50 * 1024 * 1024; // 50MB
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
      console.log('Sending file to backend for processing and upload...');
      
      // Single API call - backend handles everything
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
      console.log('Backend processing and upload complete:', result);

      setProcessingStatus('Processing complete!');
      setUploadProgress(100);
      setSuccess(result.message);
      
      // Refresh the sheets list to show the new upload
      await fetchUserSheets();

      const totalTime = (Date.now() - startTime) / 1000;
      console.log(`🕒 Total processing time: ${totalTime.toFixed(2)} seconds`);
      
      // Clear file input
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Clear success message and progress after 5 seconds
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
    <div className="w-full flex justify-center py-10">
      <div className="w-full max-w-4xl px-8">
        <h1 className="text-3xl text-[#121517] font-bold mb-6 text-center">Generate Labels</h1>
        
        <div className="flex flex-col items-center gap-6 rounded-lg border-2 border-dashed border-gray-300 px-6 py-14 mb-6 bg-gray-50">
          <div className="text-center">
            <p className="text-lg text-[#121517] font-bold">Drag and drop or browse files</p>
            <p className="text-sm text-gray-600 mt-1">Supported formats: CSV, Excel (.xlsx, .xls). Maximum size: 50MB.</p>
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
              className="bg-white hover:bg-gray-50 transition-colors text-sm text-[#121517] font-bold px-8 py-3 rounded-lg border-2 border-gray-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {file ? file.name : 'Select File'}
            </button>
          </div>
          
          {file && (
            <div className="text-sm text-gray-600 text-center">
              Selected: {file.name} ({formatFileSize(file.size)})
            </div>
          )}
        </div>

        <button 
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold cursor-pointer py-4 rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Label Sheets'}
        </button>

        {/* Progress Indicator */}
        {loading && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{processingStatus}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
            <p className="text-green-700 font-medium">{success}</p>
          </div>
        )}

        {fetchingSheets ? (
          <div className="mt-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading your sheets...</p>
          </div>
        ) : userSheets.length > 0 ? (
          <div className="mt-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Your Generated Sheets ({userSheets.length})</h2>
              <button
                onClick={fetchUserSheets}
                className="px-4 py-2 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>
            <div className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg ${userSheets.length > 10 ? 'max-h-150 overflow-y-auto' : ''}`}>
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Filename</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Labels</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Sheets</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Size</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Created</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userSheets.map((sheet) => {
                    const downloadStatus = sheetStates[sheet.id]?.downloadStatus || 'idle';
                    const deleteStatus = sheetStates[sheet.id]?.deleteStatus || 'idle';
                    
                    return (
                      <tr key={sheet.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                          {sheet.original_filename}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {sheet.label_count}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {sheet.sheet_count}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatFileSize(sheet.total_size_bytes)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(sheet.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-3">
                            <button
                              onClick={() => downloadSheet(sheet.id, sheet.original_filename)}
                              disabled={downloadStatus === 'downloading' || deleteStatus === 'deleting'}
                              className={`font-semibold underline transition-colors bg-transparent border-none cursor-pointer ${
                                downloadStatus === 'downloading'
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : downloadStatus === 'downloaded'
                                  ? 'text-green-600 hover:text-green-800'
                                  : 'text-blue-600 hover:text-blue-800'
                              }`}
                            >
                              {downloadStatus === 'downloading'
                                ? 'Downloading...'
                                : downloadStatus === 'downloaded'
                                ? 'Downloaded'
                                : 'Download'
                              }
                            </button>
                            
                            <button
                              onClick={() => deleteSheet(sheet.id)}
                              disabled={deleteStatus === 'deleting' || downloadStatus === 'downloading'}
                              className={`font-semibold underline transition-colors bg-transparent border-none cursor-pointer ${
                                deleteStatus === 'deleting'
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-800'
                              }`}
                            >
                              {deleteStatus === 'deleting' ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-10 text-center text-gray-500 py-8">
            <p>No sheets generated yet. Upload a CSV file to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LabelUploader;