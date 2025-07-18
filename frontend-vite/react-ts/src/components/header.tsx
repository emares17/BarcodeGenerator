import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get('http://localhost:5000/auth/status', {
          withCredentials: true
        });
        setIsAuthenticated(response.data.authenticated);
      } catch (err) {
        setIsAuthenticated(false);
      }
    }

    checkAuthStatus();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/auth/logout', {}, {
        withCredentials: true
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-6 h-6">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" />
                </svg>
              </div>
              <a href="/login" className="text-xl font-bold tracking-tight text-gray-900">LabelGenius</a>
            </div>
            <div className="flex items-center gap-8">
              <nav className="flex gap-8 text-sm font-medium">
                {isAuthenticated ? (
                  <>
                    <a href="/dashboard" className="text-gray-900 hover:text-gray-700 font-bold transition-colors px-3 py-2">Dashboard</a>
                    <a href="#" className="text-gray-900 hover:text-gray-700 font-bold transition-colors px-3 py-2">Settings</a>
                    <a href="/help" className="text-gray-900 hover:text-gray-700 font-bold transition-colors px-3 py-2">Help</a>
                    <button 
                      onClick={handleLogout}
                      className="text-gray-900 hover:text-gray-700 font-bold transition-colors px-3 py-2 bg-transparent border-none cursor-pointer"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <a href="/help" className="text-gray-900 hover:text-gray-700 font-bold transition-colors px-3 py-2">Help</a>
                )}
              </nav>
            </div>
          </div>
        </div>
      </header>
  );
}

export default Header;
