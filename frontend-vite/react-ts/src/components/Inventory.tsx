import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Download, Trash2, RefreshCw, FileSpreadsheet,
  AlertCircle, CheckCircle2,
  ChevronDown, ChevronRight, Search, Printer,
} from 'lucide-react';

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

const templates = [
  { id: 'standard_20', rows: 5, cols: 4 },
  { id: '5163', rows: 5, cols: 2 },
  { id: '5160', rows: 10, cols: 3 },
  { id: '94233', rows: 4, cols: 3 },
];

function Inventory() {
  // Sheets
  const [userSheets, setUserSheets] = useState<UserSheet[]>([]);
  const [fetchingSheets, setFetchingSheets] = useState(true);
  const [filterFilename, setFilterFilename] = useState('');
  const [expandedSheetId, setExpandedSheetId] = useState<string | null>(null);
  const [selectedSheets, setSelectedSheets] = useState<{ [sheetId: string]: Set<number> }>({});
  const [sheetStates, setSheetStates] = useState<{
    [id: string]: { downloadStatus: 'idle' | 'downloading' | 'downloaded'; deleteStatus: 'idle' | 'deleting' };
  }>({});
  const [singleSheetDownloadStates, setSingleSheetDownloadStates] = useState<{ [key: string]: 'idle' | 'downloading' }>({});
  const [selectedDownloadStates, setSelectedDownloadStates] = useState<{ [id: string]: 'idle' | 'downloading' }>({});

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LabelItem[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOffset, setSearchOffset] = useState(0);
  const [reprintStates, setReprintStates] = useState<{ [id: string]: 'idle' | 'downloading' }>({});
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const SEARCH_LIMIT = 20;

  // Handler stubs 
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
  
  const triggerBlobDownload = (_data: BlobPart, _type: string, _filename: string) => {
    const blob = new Blob([_data], { type: _type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = _filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };
  
  const downloadSheet = async (_userSheetId: string, _filename: string) => {
    setSheetStates(prev => ({ ...prev, [_userSheetId]: { ...prev[_userSheetId], downloadStatus: 'downloading' } }));
      try {
        const response = await axios.get(`${API_URL}/download-sheet/${_userSheetId}`, {
          withCredentials: true, responseType: 'blob',
        });
        triggerBlobDownload(response.data, 'application/zip', `${_filename.split('.')[0]}_labels.zip`);
        setSheetStates(prev => ({ ...prev, [_userSheetId]: { ...prev[_userSheetId], downloadStatus: 'downloaded' } }));
      } catch {
        setError('Failed to download sheet');
        setTimeout(() => setError(''), 5000);
        setSheetStates(prev => ({ ...prev, [_userSheetId]: { ...prev[_userSheetId], downloadStatus: 'idle' } }));
      }
  };
  
  const downloadSingleSheet = async (_userSheetId: string, _sheetNumber: number, _filename: string) => {
    const key = `${_userSheetId}_${_sheetNumber}`;
    setSingleSheetDownloadStates(prev => ({ ...prev, [key]: 'downloading' }));

    try {
      const response = await axios.get(
        `${API_URL}/download-sheet/${_userSheetId}/sheet/${_sheetNumber}`,
        { withCredentials: true, responseType: 'blob' },
      );
      triggerBlobDownload(response.data, 'application/pdf', `${_filename.split('.')[0]}_sheet_${_sheetNumber}.pdf`);
    } catch {
      setError('Failed to download sheet');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSingleSheetDownloadStates(prev => ({ ...prev, [key]: 'idle' }));
    }

  };
  
  const downloadSelectedSheets = async (_userSheetId: string, _filename: string) => {
    const selected = selectedSheets[_userSheetId];
    if (!selected || selected.size === 0) return;
    setSelectedDownloadStates(prev => ({ ...prev, [_userSheetId]: 'downloading' }));
    try {
      const response = await axios.post(
        `${API_URL}/download-sheet/${_userSheetId}/selected`,
        { sheet_numbers: Array.from(selected) },
        { withCredentials: true, responseType: 'blob' },
      );
      triggerBlobDownload(response.data, 'application/zip', `${_filename.split('.')[0]}_selected_sheets.zip`);
    } catch {
      setError('Failed to download selected sheets');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSelectedDownloadStates(prev => ({ ...prev, [_userSheetId]: 'idle' }));
    }
  };
  
  const deleteSheet = async (_userSheetId: string) => {
    if (!confirm('Are you sure you want to delete this sheet? This cannot be undone.')) return;
    setSheetStates(prev => ({ ...prev, [_userSheetId]: { ...prev[_userSheetId], deleteStatus: 'deleting' } }));
    try {
      await axios.delete(`${API_URL}/delete-sheet/${_userSheetId}`, { withCredentials: true });
      setUserSheets(userSheets.filter(s => s.id !== _userSheetId));
      setSheetStates(prev => { const n = { ...prev }; delete n[_userSheetId]; return n; });
      if (expandedSheetId === _userSheetId) setExpandedSheetId(null);
    } catch {
      setError('Failed to delete sheet');
      setTimeout(() => setError(''), 5000);
      setSheetStates(prev => ({ ...prev, [_userSheetId]: { ...prev[_userSheetId], deleteStatus: 'idle' } }));
    }
  };
  
  const toggleExpand = (_sheetId: string) => {
    if (expandedSheetId === _sheetId) {
      setExpandedSheetId(null);
      setSelectedSheets(prev => { const n = { ...prev }; delete n[_sheetId]; return n; });
    } else {
      setExpandedSheetId(_sheetId);
    }
  };
  
  const toggleSheetSelection = (_sheetId: string, _sheetNum: number) => {
    setSelectedSheets(prev => {
      const current = new Set(prev[_sheetId] || []);
      current.has(_sheetNum) ? current.delete(_sheetNum) : current.add(_sheetNum);
      return { ...prev, [_sheetId]: current };
    });
  };
  
  const getLabelRange = (_sheet: UserSheet, _sheetNum: number): string => {
    if (!_sheet.template_id) return '';
    const tmpl = templates.find(t => t.id === _sheet.template_id);
    if (!tmpl) return '';
    const lps = tmpl.rows * tmpl.cols;
    const start = (_sheetNum - 1) * lps + 1;
    const end = Math.min(_sheetNum * lps, _sheet.label_count);
    return `labels ${start}–${end}`;
  };
  
  const handleSearchInput = (_value: string) => {
    setSearchQuery(_value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!_value.trim()) { setSearchResults([]); setSearchTotal(0); return; }
    searchTimeoutRef.current = setTimeout(() => searchLabels(_value.trim(), 0), 300);
  };
  
  const searchLabels = async (_query: string, _offset: number) => {
    if (!_query.trim()) { setSearchResults([]); setSearchTotal(0); return; }
    setSearchLoading(true);
    try {
      const response = await axios.get(`${API_URL}/labels/search`, {
        params: { q: _query, limit: SEARCH_LIMIT, _offset },
        withCredentials: true,
      });
      if (_offset === 0) {
        setSearchResults(response.data.results);
      } else {
        setSearchResults(prev => [...prev, ...response.data.results]);
      }
      setSearchTotal(response.data.total);
      setSearchOffset(_offset);
    } catch {
      setError('Label search failed');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSearchLoading(false);
    }
  };
  
  const reprintLabel = async (_labelId: string) => {
    setReprintStates(prev => ({ ...prev, [_labelId]: 'downloading' }));
    try {
      const response = await axios.get(`${API_URL}/labels/${_labelId}/reprint`, {
        withCredentials: true, responseType: 'blob',
      });
      triggerBlobDownload(response.data, 'application/pdf', `reprint_${_labelId.slice(0, 8)}.pdf`);
    } catch {
      setError('Failed to generate reprint');
      setTimeout(() => setError(''), 5000);
    } finally {
      setReprintStates(prev => ({ ...prev, [_labelId]: 'idle' }));
    }
  };

  useEffect(() => { fetchUserSheets(); }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (d: string) => new Date(d).toLocaleString();

  const filteredSheets = filterFilename
    ? userSheets.filter(s => s.original_filename.toLowerCase().includes(filterFilename.toLowerCase()))
    : userSheets;

  // Suppress unused-variable warnings on stubs until user implements them
  void setUserSheets; void setFetchingSheets; void setExpandedSheetId;
  void setSelectedSheets; void setSheetStates; void setSingleSheetDownloadStates;
  void setSelectedDownloadStates; void setSearchResults; void setSearchTotal;
  void setSearchLoading; void setSearchOffset; void setReprintStates;
  void setError; void setSuccess; void searchTimeoutRef; void triggerBlobDownload;
  void templates;

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Inventory</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage and search your generated label sheets</p>
      </div>

      {/* Error / Success banners */}
      {error && (
        <div className="mb-6 flex items-start gap-3 p-3 bg-error rounded-[12px]">
          <AlertCircle className="w-4 h-4 text-error-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-error-foreground">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 flex items-start gap-3 p-3 bg-success rounded-[12px]">
          <CheckCircle2 className="w-4 h-4 text-success-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-success-foreground">{success}</p>
        </div>
      )}

      {/* Label Search Card */}
      <div className="bg-card border border-border rounded-[16px] shadow-sm overflow-hidden mb-8">
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

      {/* Sheet History Card */}
      <div className="bg-card border border-border rounded-[16px] shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">Sheet History</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fetchingSheets ? 'Loading...' : filterFilename
                ? `${filteredSheets.length} of ${userSheets.length} sheet${userSheets.length !== 1 ? 's' : ''}`
                : `${userSheets.length} generated sheet${userSheets.length !== 1 ? 's' : ''}`}
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
            <button
              onClick={fetchUserSheets}
              className="p-2 rounded-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer bg-transparent border-none flex-shrink-0"
              title="Refresh"
            >
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
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => toggleExpand(sheet.id)}
                            className="p-1 rounded-[6px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer bg-transparent border-none"
                          >
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
                              className={`p-2 rounded-[10px] transition-colors cursor-pointer bg-transparent border-none ${
                                downloadStatus === 'downloading' ? 'text-muted-foreground cursor-not-allowed'
                                : downloadStatus === 'downloaded' ? 'text-success-foreground hover:bg-success'
                                : 'text-primary hover:bg-primary/10'
                              }`}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteSheet(sheet.id)}
                              disabled={deleteStatus === 'deleting' || downloadStatus === 'downloading'}
                              title={deleteStatus === 'deleting' ? 'Deleting...' : 'Delete'}
                              className={`p-2 rounded-[10px] transition-colors cursor-pointer bg-transparent border-none ${
                                deleteStatus === 'deleting' ? 'text-muted-foreground cursor-not-allowed' : 'text-destructive hover:bg-error'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

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
    </div>
  );
}

export default Inventory;
