
import React, { useState, useEffect } from 'react';
import { Coffee, ArrowRight, Lock, Mail, User as UserIcon, MapPin, Key, ShieldCheck, ChevronLeft } from 'lucide-react';
import { User, UserRole, Store } from '../types';

interface LoginProps {
  onLogin: (email: string, pass: string) => Promise<User>;
  onSignup: (user: User) => Promise<void>;
  onPasswordReset: (email: string, newPassword: string) => Promise<void>;
  users: User[];
  stores: Store[];
}

const Login: React.FC<LoginProps> = ({ onLogin, onSignup, onPasswordReset, users, stores }) => {
  const [view, setView] = useState<'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id || '');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password flow states
  const [resetEmail, setResetEmail] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'EMAIL' | 'CODE' | 'NEW_PASSWORD' | 'SUCCESS'>('EMAIL');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Load remembered credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('boundaries_remembered_email');
    const savedPass = localStorage.getItem('boundaries_remembered_pass');
    if (savedEmail && savedPass) {
      setEmail(savedEmail);
      setPassword(savedPass);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (view === 'SIGNUP') {
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase().trim())) {
          throw new Error('An account with this email already exists.');
        }

        if (name.trim().length < 2) {
          throw new Error('Please enter your full name.');
        }

        const assignedRole = email.toLowerCase().endsWith('@boundariescoffee.com') 
          ? UserRole.MANAGER 
          : UserRole.TRAINEE;

        const newUser: User = {
          id: `u-${Date.now()}`,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
          role: assignedRole,
          storeId: selectedStoreId
        };

        if (rememberMe) {
          localStorage.setItem('boundaries_remembered_email', newUser.email);
          localStorage.setItem('boundaries_remembered_pass', password);
        }

        await onSignup(newUser);
      } else {
        await onLogin(email, password);
        
        // Handle Remember Me after successful login
        if (rememberMe) {
          localStorage.setItem('boundaries_remembered_email', email);
          localStorage.setItem('boundaries_remembered_pass', password);
        } else {
          localStorage.removeItem('boundaries_remembered_email');
          localStorage.removeItem('boundaries_remembered_pass');
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check connection.");
      setLoading(false);
    }
  };

  const handleStartRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    setTimeout(() => {
      const userExists = users.some(u => u.email.toLowerCase() === resetEmail.toLowerCase().trim());
      if (!userExists) {
        setError("We couldn't find an account with that email.");
        setLoading(false);
      } else {
        setRecoveryStep('CODE');
        setLoading(false);
      }
    }, 1000);
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryCode === '1234') { 
      setRecoveryStep('NEW_PASSWORD');
      setError('');
    } else {
      setError('Invalid code. For testing, use 1234.');
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    
    try {
      await onPasswordReset(resetEmail, newPassword);
      setRecoveryStep('SUCCESS');
      
      // Auto-login after success
      setTimeout(() => {
        setView('LOGIN');
        setEmail(resetEmail);
        setPassword(newPassword);
        setRecoveryStep('EMAIL');
      }, 2000);
    } catch (err) {
      setError("Failed to reset password.");
    }
  };

  return (
    <div className="min-h-screen bg-[#001F3F] flex items-center justify-center p-6 relative overflow-hidden text-white">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-900/20 skew-x-12 transform translate-x-1/2 -z-0" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-[120px] -z-0" />

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex p-5 rounded-[2rem] bg-white mb-8 shadow-2xl rotate-3">
            <Coffee size={48} strokeWidth={2.5} className="text-[#001F3F]" />
          </div>
          <h1 className="text-5xl font-[900] text-white tracking-tighter mb-2 uppercase">BOUNDARIES</h1>
          <p className="text-blue-300 font-bold tracking-[0.3em] uppercase text-xs">Coffee & Co. Operations</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl border border-white/10 text-[#001F3F] animate-in zoom-in-95 duration-500">
          {view === 'FORGOT_PASSWORD' ? (
            <div className="space-y-6">
              <button 
                onClick={() => { setView('LOGIN'); setRecoveryStep('EMAIL'); setError(''); }}
                className="flex items-center gap-2 text-neutral-400 font-bold text-xs uppercase tracking-widest hover:text-[#001F3F] transition-colors"
              >
                <ChevronLeft size={14} /> Back to Login
              </button>

              <div className="mb-2">
                <h2 className="text-2xl font-black text-[#001F3F] tracking-tight uppercase">Account Recovery</h2>
                <p className="text-neutral-400 text-sm font-medium mt-1">
                  {recoveryStep === 'EMAIL' && "Enter your email to receive a recovery code."}
                  {recoveryStep === 'CODE' && "Enter the 4-digit code sent to your device."}
                  {recoveryStep === 'NEW_PASSWORD' && "Set a new secure password for your account."}
                  {recoveryStep === 'SUCCESS' && "Identity verified. Updating access..."}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 animate-in shake duration-300">
                  {error}
                </div>
              )}

              {recoveryStep === 'EMAIL' && (
                <form onSubmit={handleStartRecovery} className="space-y-6">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-blue-900 transition-colors" size={18} />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl pl-12 pr-4 py-4 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-medium"
                      placeholder="Email address"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#001F3F] text-white font-black py-5 rounded-2xl hover:bg-blue-900 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl"
                  >
                    {loading ? 'Verifying...' : 'Send Recovery Code'}
                    {!loading && <Key size={18} strokeWidth={3} />}
                  </button>
                </form>
              )}

              {recoveryStep === 'CODE' && (
                <form onSubmit={handleVerifyCode} className="space-y-6">
                   <div className="relative group text-center">
                    <input
                      type="text"
                      maxLength={4}
                      required
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-6 text-center text-3xl font-black tracking-[1em] focus:bg-white focus:ring-4 focus:ring-blue-900/10 outline-none"
                      placeholder="----"
                    />
                  </div>
                  <p className="text-[10px] text-center font-bold text-neutral-400 uppercase tracking-widest">Universal Reset Code: 1234</p>
                  <button
                    type="submit"
                    className="w-full bg-[#001F3F] text-white font-black py-5 rounded-2xl hover:bg-blue-900 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl"
                  >
                    Verify Code
                  </button>
                </form>
              )}

              {recoveryStep === 'NEW_PASSWORD' && (
                <form onSubmit={handleSetNewPassword} className="space-y-6">
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-blue-900 transition-colors" size={18} />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl pl-12 pr-4 py-4 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-medium"
                      placeholder="New password"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#001F3F] text-white font-black py-5 rounded-2xl hover:bg-blue-900 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl"
                  >
                    Update Password
                  </button>
                </form>
              )}

              {recoveryStep === 'SUCCESS' && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center border border-green-100">
                    <ShieldCheck size={40} />
                  </div>
                  <h3 className="text-xl font-black text-green-600 uppercase tracking-tight">Identity Verified</h3>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="mb-2">
                <h2 className="text-2xl font-black text-[#001F3F] tracking-tight uppercase">
                  {view === 'SIGNUP' ? 'Create Account' : 'Staff Login'}
                </h2>
                <p className="text-neutral-400 text-sm font-medium">
                  {view === 'SIGNUP' ? 'Join the Boundaries roster.' : 'Access operational standards.'}
                </p>
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 animate-in shake duration-300">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {view === 'SIGNUP' && (
                  <>
                    <div>
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Full Name</label>
                      <div className="relative group">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-blue-900 transition-colors" size={18} />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl pl-12 pr-4 py-4 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-medium"
                          placeholder="e.g. Alex Johnson"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Home Store</label>
                      <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-blue-900 transition-colors" size={18} />
                        <select
                          value={selectedStoreId}
                          onChange={(e) => setSelectedStoreId(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl pl-12 pr-4 py-4 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-bold appearance-none"
                        >
                          {stores.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-blue-900 transition-colors" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl pl-12 pr-4 py-4 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-medium"
                      placeholder="Email"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 px-1">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Password</label>
                    {view === 'LOGIN' && (
                      <button 
                        type="button"
                        onClick={() => { setView('FORGOT_PASSWORD'); setError(''); }}
                        className="text-[10px] font-bold text-blue-600 hover:text-[#001F3F] transition-colors uppercase tracking-widest"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-blue-900 transition-colors" size={18} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl pl-12 pr-4 py-4 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 px-1">
                  <input 
                    type="checkbox" 
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 text-[#001F3F] focus:ring-[#001F3F]"
                  />
                  <label htmlFor="rememberMe" className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest cursor-pointer select-none">
                    Remember credentials
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#001F3F] text-white font-black py-5 rounded-2xl hover:bg-blue-900 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : (view === 'SIGNUP' ? 'Create Account' : 'Sign In')}
                {!loading && <ArrowRight size={18} strokeWidth={3} />}
              </button>
              
              <div className="text-center pt-2">
                <button 
                  type="button"
                  onClick={() => { setView(view === 'LOGIN' ? 'SIGNUP' : 'LOGIN'); setError(''); }}
                  className="text-neutral-500 font-bold hover:text-[#001F3F] transition-colors text-[10px] tracking-widest uppercase"
                >
                  {view === 'SIGNUP' ? 'Existing Staff? Log In' : "New Recruit? Register"}
                </button>
              </div>
            </form>
          )}
        </div>
        
        <div className="mt-8 text-center text-blue-200/40 text-[9px] font-black uppercase tracking-[0.4em]">
          Secure Infrastructure System v2.6
        </div>
      </div>
    </div>
  );
};

export default Login;
