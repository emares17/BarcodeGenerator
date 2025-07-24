import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { 
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  Cog6ToothIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Header = () => {

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/status`, {
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
      await axios.post(`${API_URL}/auth/logout`, {}, {
        withCredentials: true
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm relative z-50">
      <div className="w-full px-6 md:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4">
               <div className="w-6 h-6">
                 <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path fillRule="evenodd" clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" />
                 </svg>
              </div>
               <a href="/login" className="text-xl font-bold tracking-tight text-gray-900">LabelGenius</a>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <a href="/dashboard" className="text-gray-900 hover:text-gray-700 font-bold px-3 py-2">Dashboard</a>
                <a href="#" className="text-gray-900 hover:text-gray-700 font-bold px-3 py-2">Settings</a>
                <a href="/help" className="text-gray-900 hover:text-gray-700 font-bold px-3 py-2">Help</a>
                <button onClick={handleLogout} className="text-gray-900 hover:text-gray-700 font-bold px-3 py-2 bg-transparent border-none">
                    Logout
                </button>
              </>
            ) : (
              <>
                <>
                  <a href="/login" className="block text-gray-900 hover:text-gray-700 font-bold">Login</a>
                  <a href="/help" className="block text-gray-900 hover:text-gray-700 font-bold">Help</a>
                </>
                <a 
                  href="/signup" 
                  className="bg-gradient-to-r font-semibold from-blue-500 to-indigo-500 text-white px-5 py-2 rounded-lg font-medium hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Get Started
                </a>
              </>
            )}
          </nav>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Menu>
              {({ open }) => (
                <>
                  <MenuButton className="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors">
                    <span className="sr-only">Open menu</span>
                    {open ? (
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                    )}
                  </MenuButton>

                  <MenuItems
                    transition
                    anchor="bottom end"
                    className="absolute right-0 z-50 mt-2 w-72 origin-top-right divide-y divide-gray-100 rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in"
                  >
                    {isAuthenticated ? (
                      <>
                        <div className="p-3">
                          <MenuItem>
                            
                              <a href="/dashboard"
                              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 data-[focus]:bg-gray-50 data-[focus]:text-gray-900 transition-colors"
                              >
                              <ChartBarIcon className="h-5 w-5 text-gray-400 group-data-[focus]:text-gray-600" />
                              Dashboard
                            </a>
                          </MenuItem>
                          <MenuItem>
                            
                            <a  href="/settings"
                              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 data-[focus]:bg-gray-50 data-[focus]:text-gray-900 transition-colors"
                            >
                              <Cog6ToothIcon className="h-5 w-5 text-gray-400 group-data-[focus]:text-gray-600" />
                              Settings
                            </a>
                          </MenuItem>
                          <MenuItem>
                            
                            <a  href="/help"
                              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 data-[focus]:bg-gray-50 data-[focus]:text-gray-900 transition-colors"
                            >
                              <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400 group-data-[focus]:text-gray-600" />
                              Help 
                            </a>
                          </MenuItem>
                        </div>
                        <div className="p-3">
                          <MenuItem>
                            <button
                              onClick={handleLogout}
                              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-red-600 data-[focus]:bg-red-50 transition-colors"
                            >
                              <ArrowRightOnRectangleIcon className="h-5 w-5 text-red-500 group-data-[focus]:text-red-600" />
                              Sign out
                            </button>
                          </MenuItem>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-3">
                          <MenuItem>
                            
                            <a  href="/"
                              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 data-[focus]:bg-gray-50 data-[focus]:text-gray-900 transition-colors"
                            >
                              <HomeIcon className="h-5 w-5 text-gray-400 group-data-[focus]:text-gray-600" />
                              Home
                            </a>
                          </MenuItem>
                          <MenuItem>
                            
                            <a  href="/help"
                              className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-gray-700 data-[focus]:bg-gray-50 data-[focus]:text-gray-900 transition-colors"
                            >
                              <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400 group-data-[focus]:text-gray-600" />
                              Help 
                            </a>
                          </MenuItem>
                        </div>
                        <div className="p-3 space-y-2">
                          <MenuItem>
                            
                            <a  href="/login"
                              className="group flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 border border-gray-300 text-gray-700 data-[focus]:bg-gray-50 data-[focus]:text-gray-900 transition-colors font-medium"
                            >
                              <UserIcon className="h-5 w-5 text-gray-400 group-data-[focus]:text-gray-600" />
                              Sign in
                            </a>
                          </MenuItem>
                          <MenuItem>
                            
                            <a  href="/signup"
                              className="group flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium hover:shadow-md data-[focus]:shadow-md transition-all"
                            >
                              Get Started Free
                            </a>
                          </MenuItem>
                        </div>
                      </>
                    )}
                  </MenuItems>
                </>
              )}
            </Menu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
