import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ScanBarcode,
  LayoutDashboard,
  Upload,
  HelpCircle,
  LogOut,
  User,
} from 'lucide-react';

interface SidebarProps {
  activeOverride?: string;
}

function Sidebar({ activeOverride }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const currentPath = activeOverride || location.pathname;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/status`, { withCredentials: true });
        if (res.data.authenticated && res.data.email) {
          setUserEmail(res.data.email);
        }
      } catch {
        // ignore
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
      navigate('/');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Upload Labels', icon: Upload, path: '/upload' },
    { label: 'Help', icon: HelpCircle, path: '/help' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-[260px] bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-[64px] border-b border-sidebar-border">
        <ScanBarcode className="w-6 h-6 text-primary" />
        <span className="font-heading text-base font-bold text-foreground">LabelGenius</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        <span className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Menu
        </span>
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <a
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
            <User className="w-4 h-4 text-sidebar-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {userEmail || 'User'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors cursor-pointer bg-transparent border-none"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
