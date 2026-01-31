import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './header';
import { supabase } from '../config/config';


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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
      if (error.message.includes('User already registered')) {
        setError('An account with this email already exists. Please try logging in instead.');
      } else if (error.message.includes('already registered')) {
        setError('This email is already registered. Please use a different email or try logging in.');
      } else if (error.message.includes('Invalid email')) {
        setError('Please enter a valid email address');
      } else if (error.message.includes('Password should be at least')) {
        setError('Password must be at least 6 characters long');
      } else {
        setError(error.message || 'Sign up failed');
      }
      return;
    }

      if (data.user) {
        // Check if email confirmation is required
        if (!data.session) {
          setError('Please check your email for a confirmation link');
        } else {
          // User is signed up and logged in
          const token = data.session.access_token;
          if (token) {
            localStorage.setItem('token', token);
          }
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      console.error('Sign up failed:', err);
      setError(err.message || 'Sign up failed');
    } finally {
      setSignupLoading(false);
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
              Create Account
            </h2>

            {error && (
            <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            )}

            <div className="flex flex-wrap gap-4 px-4 py-3">
              <label className="flex flex-col w-full">
                <p className="text-[#121416] text-base font-medium pb-2">Email</p>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input w-full rounded-xl border border-[#dde1e3] bg-white h-14 p-[15px] text-base text-[#121416] placeholder-[#6a7681] focus:outline-none focus:ring-0"
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
                  className="form-input w-full rounded-xl border border-[#dde1e3] bg-white h-14 p-[15px] text-base text-[#121416] placeholder-[#6a7681] focus:outline-none focus:ring-0"
                />
              </label>
              <label className="flex flex-col w-full">
                <p className="text-[#121416] text-base font-medium pb-2">Verify Password</p>
                <input
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input w-full rounded-xl border border-[#dde1e3] bg-white h-14 p-[15px] text-base text-[#121416] placeholder-[#6a7681] focus:outline-none focus:ring-0"
                />
              </label>
            </div>

            <div className="px-4 py-3">
              <button
                onClick={handleSignUp}
                disabled={signupLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-4 rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signupLoading ? 'Signing Up...' : 'Sign Up'}  
              </button>
            </div>

            <p className="text-[#6a7681] text-sm text-center underline pt-1 px-4">
              Already have an account? <a href="/login" className="text-blue-500 hover:text-blue-700">Login</a>
            </p>
          </div>
        </div>
    </div>
  );
}

export default SignUp;