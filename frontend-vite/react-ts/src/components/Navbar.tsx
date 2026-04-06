import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { ScanBarcode } from 'lucide-react';

function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/status`, { withCredentials: true });
        setIsAuthenticated(res.data.authenticated);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
      setIsAuthenticated(false);
      navigate('/');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <nav className="flex items-center justify-between border-b border-border px-6 md:px-20 h-[72px]">
      <a href="/" className="flex items-center gap-2">
        <ScanBarcode className="w-7 h-7 text-primary" />
        <span className="font-heading text-xl font-bold text-foreground">LabelGenius</span>
      </a>

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center gap-8">
        <a href="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
        <a href="/#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
        <a href="/help" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Help</a>
        {isAuthenticated ? (
          <>
            <a href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
            <button onClick={handleLogout} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">Logout</button>
          </>
        ) : (
          <>
            <a href="/login" className="text-sm font-medium text-foreground hover:text-foreground/80 transition-colors">Log in</a>
            <a href="/signup" className="inline-flex items-center justify-center h-10 px-4 bg-primary text-primary-foreground font-heading text-sm font-medium rounded-full hover:bg-primary/90 transition-colors">
              Get Started
            </a>
          </>
        )}
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden">
        <Menu>
          {({ open }) => (
            <>
              <MenuButton className="p-2 rounded-lg text-foreground hover:bg-secondary transition-colors">
                {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </MenuButton>
              <MenuItems className="absolute right-4 z-50 mt-2 w-64 rounded-[16px] bg-card shadow-lg ring-1 ring-border focus:outline-none">
                <div className="p-3 space-y-1">
                  <MenuItem><a href="/#features" className="block px-3 py-2 text-sm text-foreground rounded-lg hover:bg-secondary">Features</a></MenuItem>
                  <MenuItem><a href="/#how-it-works" className="block px-3 py-2 text-sm text-foreground rounded-lg hover:bg-secondary">How It Works</a></MenuItem>
                  <MenuItem><a href="/help" className="block px-3 py-2 text-sm text-foreground rounded-lg hover:bg-secondary">Help</a></MenuItem>
                  {isAuthenticated ? (
                    <>
                      <MenuItem><a href="/dashboard" className="block px-3 py-2 text-sm text-foreground rounded-lg hover:bg-secondary">Dashboard</a></MenuItem>
                      <MenuItem><button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm text-destructive rounded-lg hover:bg-error">Logout</button></MenuItem>
                    </>
                  ) : (
                    <>
                      <MenuItem><a href="/login" className="block px-3 py-2 text-sm text-foreground rounded-lg hover:bg-secondary">Log in</a></MenuItem>
                      <MenuItem><a href="/signup" className="block px-3 py-2 text-sm font-medium text-center bg-primary text-primary-foreground rounded-full hover:bg-primary/90">Get Started</a></MenuItem>
                    </>
                  )}
                </div>
              </MenuItems>
            </>
          )}
        </Menu>
      </div>
    </nav>
  );
}

export default Navbar;
