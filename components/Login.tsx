
import React, { useState, useEffect } from 'react';
import { Coffee, ArrowRight, Lock, Mail, User as UserIcon, MapPin, Key, ShieldCheck, ChevronLeft } from 'lucide-react';
import { User, UserRole, Store, Organization } from '../types';

interface LoginProps {
  onLogin: (email: string, pass: string) => Promise<User>;
  onSignup: (user: User) => Promise<void>;
  onPasswordReset: (email: string, newPassword: string) => Promise<void>;
  users: User[];
  stores: Store[];
  version: string;
  org?: Organization | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSignup, onPasswordReset, users, stores, version, org }) => {
  const orgName = org?.name || 'BOUNDARIES';
  const primaryColor = org?.primaryColor || '#001F3F';
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
  const [recoveryStep, setRecoveryStep] = useState<'EMAIL' | 'NEW_PASSWORD' | 'SUCCESS'>('EMAIL');
  const [newPassword, setNewPassword] = useState('');

  // Load remembered email on mount (password is never stored)
  useEffect(() => {
    const savedEmail = localStorage.getItem('boundaries_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    // Clean up any legacy plaintext password storage
    localStorage.removeItem('boundaries_remembered_pass');
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
        }

        await onSignup(newUser);
      } else {
        await onLogin(email, password);
        
        // Handle Remember Me — only store email, never password
        if (rememberMe) {
          localStorage.setItem('boundaries_remembered_email', email);
        } else {
          localStorage.removeItem('boundaries_remembered_email');
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
        // Skip code step — go directly to new password
        setRecoveryStep('NEW_PASSWORD');
        setLoading(false);
      }
    }, 1000);
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden text-white" style={{ backgroundColor: primaryColor }}>
      <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-900/20 skew-x-12 transform translate-x-1/2 -z-0" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-[120px] -z-0" />

      <div className="max-w-md w-full relative z-10 flex flex-col items-center">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          {org?.logo ? (
            <div className="inline-flex p-3 rounded-xl bg-white mb-8 shadow-lg rotate-3">
              <img src={org.logo} alt={orgName} className="w-12 h-12 object-contain" />
            </div>
          ) : (
            <div className="inline-flex p-5 rounded-xl bg-white mb-8 shadow-lg rotate-3">
              <Coffee size={48} strokeWidth={2.5} style={{ color: primaryColor }} />
            </div>
          )}
          <h1 className="text-5xl font-[900] text-white tracking-tighter mb-2 uppercase">{orgName}</h1>
          <p className="text-blue-300 font-bold tracking-[0.3em] uppercase text-xs">Operations Platform</p>
        </div>

        <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg border border-white/10 text-[#001F3F] animate-in zoom-in-95 duration-500 w-full">
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
                  {recoveryStep === 'EMAIL' && "Enter your email to verify your account."}
                  {recoveryStep === 'NEW_PASSWORD' && "Set a new secure password for your account."}
                  {recoveryStep === 'SUCCESS' && "Password updated. Redirecting..."}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-xs font-bold border border-red-100 animate-in shake duration-300">
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
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-lg pl-12 pr-4 py-4 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-medium"
                      placeholder="Email address"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white font-black py-3.5 rounded-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-md"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {loading ? 'Verifying...' : 'Verify Account'}
                    {!loading && <Key size={18} strokeWidth={3} />}
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
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-lg pl-12 pr-4 py-4 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-medium"
                      placeholder="New password"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full text-white font-black py-3.5 rounded-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-md"
                    style={{ backgroundColor: primaryColor }}
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
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-xs font-bold border border-red-100 animate-in shake duration-300">
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
                          className="w-full bg-neutral-50 border border-neutral-100 rounded-lg pl-12 pr-4 py-4 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-medium"
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
                          className="w-full bg-neutral-50 border border-neutral-100 rounded-lg pl-12 pr-4 py-4 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-bold appearance-none"
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
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-lg pl-12 pr-4 py-4 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-medium"
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
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-lg pl-12 pr-4 py-4 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-medium"
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
                    Remember email
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-black py-3.5 rounded-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-md disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
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
        
        <div className="mt-8 text-center text-blue-200/20 text-[9px] font-black uppercase tracking-[0.4em]">
          App Version {version}
        </div>
      </div>
    </div>
  );
};

export default Login;
