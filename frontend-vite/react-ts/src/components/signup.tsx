import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/config';
import { ScanBarcode } from 'lucide-react';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [signupLoading, setSignupLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/dashboard', { replace: true });
      } else {
        setAuthLoading(false);
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async () => {
    setError('');
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setSignupLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        if (error.message.includes('already registered')) {
          setError('An account with this email already exists.');
        } else if (error.message.includes('Invalid email')) {
          setError('Please enter a valid email address');
        } else {
          setError(error.message || 'Sign up failed');
        }
        return;
      }
      if (data.user) {
        if (!data.session) {
          setError('Please check your email for a confirmation link');
        } else {
          const token = data.session.access_token;
          if (token) localStorage.setItem('token', token);
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setSignupLoading(false);
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
          Start generating<br />labels in minutes
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          No credit card required. Free to get started.
        </p>
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
              <h1 className="font-heading text-xl font-semibold text-foreground">Create your account</h1>
              <p className="text-sm text-muted-foreground mt-1">Fill in your details to get started</p>
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
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 px-4 rounded-full border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Confirm Password</span>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                  className="h-10 px-4 rounded-full border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
            </div>

            <div className="px-6 py-6 border-t border-border">
              <button
                onClick={handleSignUp}
                disabled={signupLoading}
                className="w-full h-12 bg-primary text-primary-foreground font-heading text-sm font-medium rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {signupLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/login" className="font-semibold text-primary hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
