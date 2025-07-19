import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './header';
import axios from 'axios';


function Login() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [_loginSuccessful, setLoginSuccessful] = useState(false);
  const [_error, setError] = useState('');
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/status`, {
          withCredentials: true
        });
      
        if (response.data.authenticated) {
          navigate('/dashboard', { replace: true });
        } else {
          setAuthLoading(false);
        }
      } catch (err) {
          setAuthLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      }, {
        withCredentials: true 
      });

      if (response.data.success) {
        setLoginSuccessful(true)
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login failed:', err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Login failed');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  if (authLoading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
    );
  }

  return (
    <div
      className="w-screen min-h-screen bg-white"
      style={{ fontFamily: 'Inter, Noto Sans, sans-serif' }}
    >
    <header className="w-full bg-white border-b border-gray-200 shadow-sm">
        <Header/>
    </header>

        <div className="px-4 sm:px-10 md:px-40 flex flex-1 justify-center py-5">
          <div className="flex flex-col w-full max-w-[512px] py-5">
            <h2 className="text-[#121416] text-[28px] font-bold leading-tight text-center pb-3 pt-5">
              Welcome back
            </h2>

            <div className="flex flex-wrap gap-4 px-4 py-3">
              <label className="flex flex-col w-full">
                <p className="text-[#121416] text-base font-medium pb-2">Username</p>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input w-full rounded-xl border border-[#dde1e3] bg-white h-14 p-[15px] text-base placeholder-[#6a7681] focus:outline-none focus:ring-0"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-4 px-4 py-3">
              <label className="flex flex-col w-full">
                <p className="text-[#121416] text-base font-medium pb-2">Password</p>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input w-full rounded-xl border border-[#dde1e3] bg-white h-14 p-[15px] text-base placeholder-[#6a7681] focus:outline-none focus:ring-0"
                />
              </label>
            </div>

            <div className="px-4 py-3">
              <button
                onClick={handleLogin}
                disabled={loginLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-4 rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginLoading ? 'Logging in...' : 'Login'}  
              </button>
            </div>

            <p className="text-[#6a7681] text-sm text-center underline pt-1 px-4">
              Forgot Password?
            </p>
            <p className="text-[#6a7681] text-sm text-center underline pt-1 px-4">
              Need an account? <a href="/signup" className="text-blue-500">Sign Up</a>
            </p>
          </div>
        </div>
    </div>
  );
}

export default Login;

