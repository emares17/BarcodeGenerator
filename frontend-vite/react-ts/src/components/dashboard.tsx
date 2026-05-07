import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileSpreadsheet, Download, Trash2, ArrowRight, AlertCircle } from 'lucide-react';

interface UserSheet {
  id: string;
  original_filename: string;
  label_count: number;
  sheet_count: number;
  created_at: string;
}

function Dashboard() {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState<UserSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sheetsRes = await axios.get(`${API_URL}/my-sheets`, { withCredentials: true });
        setSheets(sheetsRes.data.sheets || []);
      } catch {
        setError('Failed to load your sheets.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalLabels = useMemo(() => sheets.reduce((sum, s) => sum + s.label_count, 0), [sheets]);
  const recentSheets = useMemo(
    () =>
      [...sheets]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [sheets]
  );

  const handleDownload = async (sheetId: string, filename: string) => {
    try {
      const response = await axios.get(`${API_URL}/download-sheet/${sheetId}`, {
        withCredentials: true,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download sheet.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDelete = async (sheetId: string) => {
    if (!window.confirm('Delete this sheet? This cannot be undone.')) return;
    setDeletingId(sheetId);
    try {
      await axios.delete(`${API_URL}/delete-sheet/${sheetId}`, { withCredentials: true });
      setSheets(prev => prev.filter(s => s.id !== sheetId));
    } catch {
      setError('Failed to delete sheet.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-8 md:p-10 max-w-5xl">
      {/* Welcome Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <h1 className="font-heading text-2xl font-bold text-foreground mt-0.5">Welcome back</h1>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="flex items-center gap-2 h-11 px-6 bg-primary text-primary-foreground font-heading text-sm font-medium rounded-full hover:bg-primary/90 transition-colors cursor-pointer border-none"
        >
          Create Labels <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-8">
        <div className="bg-card border border-border rounded-[16px] px-6 py-5 min-w-[180px]">
          <p className="text-3xl font-bold text-foreground font-heading">{loading ? '—' : sheets.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Sheets Generated</p>
        </div>
        <div className="bg-card border border-border rounded-[16px] px-6 py-5 min-w-[180px]">
          <p className="text-3xl font-bold text-primary font-heading">{loading ? '—' : totalLabels.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-1">Total Labels</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 p-3 bg-error rounded-[12px]">
          <AlertCircle className="w-4 h-4 text-error-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-error-foreground">{error}</p>
        </div>
      )}

      {/* Recent Sheets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-base font-semibold text-foreground">Recent Sheets</h2>
          {sheets.length > 0 && (
            <button
              onClick={() => navigate('/inventory')}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-transparent border-none cursor-pointer"
            >
              View All →
            </button>
          )}
        </div>

        <div className="bg-card border border-border rounded-[16px] overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading...</div>
          ) : recentSheets.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground mb-3">No sheets yet.</p>
              <button
                onClick={() => navigate('/upload')}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-transparent border-none cursor-pointer"
              >
                Create your first labels →
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">File</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-28">Labels</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-24">Sheets</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-36">Created</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentSheets.map((sheet) => (
                  <tr key={sheet.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <FileSpreadsheet className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate max-w-[280px]">
                          {sheet.original_filename}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">{sheet.label_count}</td>
                    <td className="px-4 py-4 text-sm text-foreground">{sheet.sheet_count}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{formatDate(sheet.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(sheet.id, sheet.original_filename)}
                          className="w-8 h-8 rounded-[8px] bg-secondary flex items-center justify-center hover:bg-border transition-colors cursor-pointer border-none"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(sheet.id)}
                          disabled={deletingId === sheet.id}
                          className="w-8 h-8 rounded-[8px] bg-secondary flex items-center justify-center hover:bg-error/40 transition-colors cursor-pointer border-none disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
