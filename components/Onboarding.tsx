import React, { useState } from 'react';
import {
  Coffee, ArrowRight, ArrowLeft, Check, Plus, X, MapPin,
  Mail, Lock, User as UserIcon, Building2, Palette, Package,
  Sparkles, Store, Rocket, Eye, EyeOff
} from 'lucide-react';
import { STARTER_PACK_OPTIONS } from '../data/starterPacks';

export interface OnboardingData {
  user: { name: string; email: string; password: string };
  orgName: string;
  stores: { id: string; name: string }[];
  packId: string;
  branding: { primaryColor: string; accentColor: string; logo?: string };
}

interface OnboardingProps {
  onComplete: (data: OnboardingData) => Promise<void>;
  onBack: () => void;
}

const STEPS = [
  { label: 'Account', icon: UserIcon },
  { label: 'Locations', icon: MapPin },
  { label: 'Starter Pack', icon: Package },
  { label: 'Branding', icon: Palette },
  { label: 'Launch', icon: Rocket },
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Account
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Locations
  const [stores, setStores] = useState<{ id: string; name: string }[]>([
    { id: `store-${Date.now()}`, name: '' }
  ]);

  // Step 3: Starter Pack
  const [selectedPack, setSelectedPack] = useState('essentials');

  // Step 4: Branding
  const [primaryColor, setPrimaryColor] = useState('#0F2B3C');
  const [accentColor, setAccentColor] = useState('#C77B3C');
  const [logoUrl, setLogoUrl] = useState('');

  const validateStep = (): boolean => {
    setError('');
    switch (step) {
      case 0: {
        if (!name.trim() || name.trim().length < 2) {
          setError('Please enter your full name.');
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          setError('Please enter a valid email address.');
          return false;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          return false;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          return false;
        }
        if (!orgName.trim() || orgName.trim().length < 2) {
          setError('Please enter your organization/shop name.');
          return false;
        }
        return true;
      }
      case 1: {
        const validStores = stores.filter(s => s.name.trim().length > 0);
        if (validStores.length === 0) {
          setError('Please add at least one location.');
          return false;
        }
        return true;
      }
      case 2:
        return true; // Pack always has a default selection
      case 3:
        return true; // Branding has defaults
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(s => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const handlePrev = () => {
    setError('');
    setStep(s => Math.max(s - 1, 0));
  };

  const handleAddStore = () => {
    setStores(prev => [...prev, { id: `store-${Date.now()}`, name: '' }]);
  };

  const handleRemoveStore = (idx: number) => {
    if (stores.length <= 1) return;
    setStores(prev => prev.filter((_, i) => i !== idx));
  };

  const handleStoreNameChange = (idx: number, value: string) => {
    setStores(prev => prev.map((s, i) => i === idx ? { ...s, name: value } : s));
  };

  const handleLaunch = async () => {
    setLoading(true);
    setError('');
    try {
      const validStores = stores
        .filter(s => s.name.trim().length > 0)
        .map(s => ({
          id: 'store-' + s.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          name: s.name.trim(),
        }));

      await onComplete({
        user: { name: name.trim(), email: email.trim().toLowerCase(), password },
        orgName: orgName.trim(),
        stores: validStores,
        packId: selectedPack,
        branding: {
          primaryColor,
          accentColor,
          logo: logoUrl.trim() || undefined,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const displayOrgName = orgName.trim().toUpperCase() || 'YOUR SHOP';

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 sm:p-6 relative overflow-hidden text-white" style={{ backgroundColor: step === 3 ? primaryColor : '#0F2B3C' }}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-900/20 skew-x-12 transform translate-x-1/2 -z-0" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-[120px] -z-0" />

      <div className="max-w-lg w-full relative z-10 flex flex-col items-center py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex p-4 rounded-xl bg-white mb-4 shadow-lg rotate-3">
            <Coffee size={36} strokeWidth={2.5} style={{ color: step === 3 ? primaryColor : '#0F2B3C' }} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-[900] text-white tracking-tighter uppercase">Set Up Your Shop</h1>
          <p className="text-blue-300 font-bold tracking-[0.2em] uppercase text-[10px] mt-1">Step {step + 1} of {STEPS.length}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 sm:gap-2 mb-6 w-full max-w-sm justify-center">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isCompleted = i < step;
            return (
              <div key={i} className="flex items-center gap-1 sm:gap-2">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? 'bg-white text-[#0F2B3C] shadow-lg scale-110'
                      : isCompleted
                        ? 'bg-white/30 text-white'
                        : 'bg-white/10 text-white/30'
                  }`}
                >
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : <Icon size={14} strokeWidth={2.5} />}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-4 sm:w-6 h-0.5 rounded transition-all duration-300 ${
                    isCompleted ? 'bg-white/40' : 'bg-white/10'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content Card */}
        <div className="bg-white rounded-xl p-5 sm:p-7 shadow-lg border border-white/10 text-[#0F2B3C] animate-in fade-in duration-300 w-full">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-bold border border-red-100 mb-5 animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {/* ── Step 1: Create Account ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Create Your Account</h2>
                <p className="text-neutral-400 text-sm font-medium mt-0.5">You'll be the admin of your new shop.</p>
              </div>

              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-1.5 block">Your Name</label>
                <div className="relative group">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-blue-900 transition-colors" size={16} />
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-lg pl-11 pr-4 py-3.5 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-medium"
                    placeholder="e.g. Alex Johnson"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-1.5 block">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-blue-900 transition-colors" size={16} />
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-lg pl-11 pr-4 py-3.5 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-medium"
                    placeholder="you@yourshop.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-1.5 block">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-blue-900 transition-colors" size={16} />
                    <input
                      type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-lg pl-11 pr-10 py-3.5 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-medium"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-1.5 block">Confirm</label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-blue-900 transition-colors" size={16} />
                    <input
                      type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-lg pl-11 pr-4 py-3.5 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-1.5 block">Organization / Shop Name</label>
                <div className="relative group">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-blue-900 transition-colors" size={16} />
                  <input
                    type="text" required value={orgName} onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-lg pl-11 pr-4 py-3.5 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-medium"
                    placeholder="e.g. Joe's Coffee"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Locations ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Set Up Your Locations</h2>
                <p className="text-neutral-400 text-sm font-medium mt-0.5">Add your store locations. You can always add more later.</p>
              </div>

              <div className="space-y-3">
                {stores.map((store, idx) => (
                  <div key={store.id} className="flex items-center gap-2 group">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Store size={14} className="text-blue-900" />
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={store.name}
                        onChange={(e) => handleStoreNameChange(idx, e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-medium"
                        placeholder={`Location ${idx + 1} name (e.g. Downtown, Main St)`}
                        autoFocus={idx === stores.length - 1}
                      />
                    </div>
                    {stores.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStore(idx)}
                        className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddStore}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-900 font-bold text-xs uppercase tracking-widest transition-colors py-2"
              >
                <Plus size={14} strokeWidth={3} /> Add Another Location
              </button>

              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-[10px] font-bold text-blue-900/60 uppercase tracking-widest">
                  💡 Locations help organize checklists and team assignments. Even if you have one shop, give it a name!
                </p>
              </div>
            </div>
          )}

          {/* ── Step 3: Starter Pack ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Choose Your Starter Pack</h2>
                <p className="text-neutral-400 text-sm font-medium mt-0.5">Pre-built templates to get you running fast. You can customize everything later.</p>
              </div>

              <div className="space-y-3">
                {STARTER_PACK_OPTIONS.map((pack) => (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => setSelectedPack(pack.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedPack === pack.id
                        ? 'border-blue-900 bg-blue-50 shadow-md'
                        : 'border-neutral-100 bg-neutral-50 hover:border-neutral-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`text-2xl flex-shrink-0 mt-0.5 ${selectedPack === pack.id ? 'scale-110' : ''} transition-transform`}>
                        {pack.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm uppercase tracking-tight">{pack.name}</span>
                          {selectedPack === pack.id && (
                            <Check size={14} className="text-blue-900" strokeWidth={3} />
                          )}
                        </div>
                        <p className="text-neutral-500 text-xs font-medium mt-0.5 leading-relaxed">{pack.description}</p>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1.5">{pack.details}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Branding ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Customize Your Branding</h2>
                <p className="text-neutral-400 text-sm font-medium mt-0.5">Make it yours. These settings apply across the entire platform.</p>
              </div>

              {/* Org Name (pre-filled) */}
              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-1.5 block">Organization Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 transition-all outline-none font-bold text-lg uppercase tracking-tight"
                  placeholder="Your Organization Name"
                />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-1.5 block">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-12 rounded-xl border-2 border-neutral-200 cursor-pointer flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-3 focus:bg-white focus:ring-4 focus:ring-blue-900/10 transition-all outline-none font-mono font-bold text-sm"
                      placeholder="#0F2B3C"
                    />
                  </div>
                  <p className="text-[9px] text-neutral-400 mt-1 ml-1">Sidebar, nav, buttons</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-1.5 block">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-12 h-12 rounded-xl border-2 border-neutral-200 cursor-pointer flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-3 focus:bg-white focus:ring-4 focus:ring-blue-900/10 transition-all outline-none font-mono font-bold text-sm"
                      placeholder="#C77B3C"
                    />
                  </div>
                  <p className="text-[9px] text-neutral-400 mt-1 ml-1">Alerts, highlights</p>
                </div>
              </div>

              {/* Logo URL */}
              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-1.5 block">Logo URL (optional)</label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-4 py-3 focus:bg-white focus:ring-4 focus:ring-blue-900/10 transition-all outline-none font-medium text-sm"
                  placeholder="https://example.com/your-logo.png"
                />
                <p className="text-[9px] text-neutral-400 mt-1 ml-1">Paste a link to your logo image — you can change this anytime</p>
              </div>

              {/* Live Preview */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-4 py-2.5 bg-neutral-50 border-b border-neutral-200">Live Preview</div>
                <div className="p-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl text-white" style={{ backgroundColor: primaryColor }}>
                    {logoUrl ? (
                      <div className="bg-white p-1.5 rounded-lg">
                        <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    ) : (
                      <div className="bg-white p-1.5 rounded-lg">
                        <Coffee style={{ color: primaryColor }} className="w-7 h-7" />
                      </div>
                    )}
                    <div>
                      <span className="font-extrabold text-base tracking-tighter block">{displayOrgName}</span>
                      <span className="text-[8px] font-bold text-blue-300 tracking-[0.2em] uppercase">Operations Platform</span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="px-4 py-2 text-white rounded-lg font-black text-[10px] uppercase tracking-widest" style={{ backgroundColor: primaryColor }}>
                      Primary
                    </button>
                    <button className="px-4 py-2 text-white rounded-lg font-black text-[10px] uppercase tracking-widest" style={{ backgroundColor: accentColor }}>
                      Accent
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: Launch ── */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center pt-2">
                <div className="inline-flex p-4 rounded-full bg-green-50 mb-4">
                  <Sparkles size={32} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">You're All Set!</h2>
                <p className="text-neutral-400 text-sm font-medium mt-1">Here's a summary of your new shop.</p>
              </div>

              <div className="space-y-3">
                {/* Org Summary */}
                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                      {logoUrl ? (
                        <img src={logoUrl} alt="" className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <Coffee size={18} />
                      )}
                    </div>
                    <div>
                      <p className="font-black text-lg uppercase tracking-tight">{displayOrgName}</p>
                      <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Organization</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white rounded-lg p-3 border border-neutral-100">
                      <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Locations</p>
                      {stores.filter(s => s.name.trim()).map((s, i) => (
                        <p key={i} className="font-bold text-[#0F2B3C] flex items-center gap-1.5">
                          <MapPin size={10} /> {s.name.trim()}
                        </p>
                      ))}
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-neutral-100">
                      <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Starter Pack</p>
                      <p className="font-bold text-[#0F2B3C]">
                        {STARTER_PACK_OPTIONS.find(p => p.id === selectedPack)?.icon}{' '}
                        {STARTER_PACK_OPTIONS.find(p => p.id === selectedPack)?.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin Credentials */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-[10px] font-black text-blue-900/60 uppercase tracking-widest mb-2">Your Admin Login</p>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
                      <Mail size={12} /> {email.trim().toLowerCase()}
                    </p>
                    <p className="text-sm font-medium text-blue-900 flex items-center gap-2">
                      <Lock size={12} /> ••••••••
                    </p>
                  </div>
                  <p className="text-[9px] text-blue-600 font-bold mt-2">Save these credentials — you'll use them to log in.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-5 w-full">
          {step === 0 ? (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} strokeWidth={3} /> Back to Login
            </button>
          ) : step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} strokeWidth={3} /> Back
            </button>
          ) : null}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest bg-white text-[#0F2B3C] hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
            >
              Next <ArrowRight size={14} strokeWidth={3} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLaunch}
              disabled={loading}
              className="flex-1 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest bg-white text-[#0F2B3C] hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0F2B3C] border-t-transparent rounded-full animate-spin" />
                  Creating Your Shop...
                </>
              ) : (
                <>
                  <Rocket size={14} strokeWidth={3} /> Launch Dashboard
                </>
              )}
            </button>
          )}
        </div>

        <div className="mt-6 text-center text-blue-200/20 text-[9px] font-black uppercase tracking-[0.4em]">
          Powered by Brewshift
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
