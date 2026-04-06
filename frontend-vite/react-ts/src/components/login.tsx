import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ScanBarcode, ArrowLeft } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/status`, { withCredentials: true });
        if (response.data.authenticated) {
          navigate('/dashboard', { replace: true });
        } else {
          setAuthLoading(false);
        }
      } catch {
        setAuthLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const handleLogin = async () => {
    setLoginLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password }, { withCredentials: true });
      if (response.data.success) {
        navigate('/dashboard');
      }
    } catch (err) {
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Visual Panel */}
      <div className="hidden lg:flex flex-1 bg-foreground flex-col justify-end p-16 gap-6">
        <h2 className="font-heading text-4xl font-bold text-background leading-tight">
          Turn your spreadsheets<br />into barcode labels
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Professional label generation for businesses of any size.
        </p>
        <a href="/" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors self-start">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </a>
      </div>

      {/* Right Form Panel */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[560px] px-8 lg:px-20 bg-background">
        <div className="w-full max-w-sm flex flex-col items-center gap-8">
          <div className="flex items-center gap-2">
            <ScanBarcode className="w-8 h-8 text-primary" />
            <span className="font-heading text-2xl font-bold text-foreground">LabelGenius</span>
          </div>

          <div className="w-full bg-card border border-border rounded-[16px] shadow-sm overflow-hidden">
            <div className="px-6 py-6 border-b border-border">
              <h1 className="font-heading text-xl font-semibold text-foreground">Welcome back</h1>
              <p className="text-sm text-muted-foreground mt-1">Enter your credentials to access your account</p>
            </div>

            <div className="px-6 py-6 flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-error rounded-[16px]">
                  <p className="text-sm text-error-foreground">{error}</p>
                </div>
              )}

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Email</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 px-4 rounded-full border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Password</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="h-10 px-4 rounded-full border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>

              <p className="text-[13px] font-medium text-primary text-right cursor-pointer hover:underline">
                Forgot password?
              </p>
            </div>

            <div className="px-6 py-6 border-t border-border">
              <button
                onClick={handleLogin}
                disabled={loginLoading}
                className="w-full h-12 bg-primary text-primary-foreground font-heading text-sm font-medium rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loginLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <a href="/signup" className="font-semibold text-primary hover:underline">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
