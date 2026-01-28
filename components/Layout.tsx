
import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole, Store, ManualSection, Recipe, ToastSalesData, ToastTimeEntry } from '../types';
import { Coffee, ClipboardCheck, GraduationCap, Users, LogOut, Menu, X, MapPin, ChevronDown, BookOpen, Cloud, CloudOff, Activity, Download, Share, Smartphone, Brain, Send, Sparkles, ChevronRight, Settings, DollarSign, TrendingUp, UserCheck, Clock, LayoutDashboard } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface LayoutProps {
  user: User;
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  stores: Store[];
  currentStoreId: string;
  onStoreChange: (storeId: string) => void;
  onUserStoreChange?: (storeId: string) => void;
  isSyncing?: boolean;
  showInstallBanner?: boolean;
  onInstall?: () => void;
  onDismissInstall?: () => void;
  canNativeInstall?: boolean;
  manual: ManualSection[];
  recipes: Recipe[];
  version: string;
  toastSales?: ToastSalesData | null;
  toastClockedIn?: ToastTimeEntry[];
}

const Layout: React.FC<LayoutProps> = ({
  user, children, activeTab, onTabChange, onLogout,
  stores, currentStoreId, onStoreChange, onUserStoreChange, isSyncing = false,
  showInstallBanner = false, onInstall, onDismissInstall, canNativeInstall = false,
  manual, recipes, version, toastSales, toastClockedIn = []
}) => {
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentStore = stores.find(s => s.id === currentStoreId);

  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard, roles: [UserRole.TRAINEE, UserRole.TRAINER] },
    { id: 'training', label: 'ACADEMY', icon: GraduationCap, roles: [UserRole.TRAINEE, UserRole.TRAINER, UserRole.MANAGER, UserRole.ADMIN] },
    { id: 'ops', label: 'LOGBOOK', icon: ClipboardCheck, roles: [UserRole.TRAINEE, UserRole.TRAINER, UserRole.MANAGER, UserRole.ADMIN] },
    { id: 'recipes', label: 'RECIPES', icon: BookOpen, roles: [UserRole.TRAINEE, UserRole.TRAINER, UserRole.MANAGER, UserRole.ADMIN] },
    { id: 'manager', label: 'MANAGER', icon: Users, roles: [UserRole.MANAGER, UserRole.ADMIN] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(user.role));
  const canSwitchStore = user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  // Format turn time from decimal minutes to "Xm Ys"
  const formatTurnTime = (decimalMinutes: number): { minutes: number, seconds: number, formatted: string, formattedShort: string } => {
    const minutes = Math.floor(decimalMinutes);
    const seconds = Math.round((decimalMinutes - minutes) * 60);
    return {
      minutes,
      seconds,
      formatted: `${minutes}m ${seconds}s`,
      formattedShort: `${minutes}:${seconds.toString().padStart(2, '0')}`
    };
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, chatOpen]);

  const handleSendChat = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const manualContext = manual.map(s => `Section ${s.number}: ${s.title}\n${s.content}`).join('\n\n');
    const recipeContext = recipes.map(r => `Recipe: ${r.title} (${r.category})\nDetails: ${JSON.stringify(r)}`).join('\n\n');

    try {
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: `You are the "Barista Brain," the primary source of truth for Boundaries Coffee staff.
        
Ground your answers ONLY in the provided Operations Manual and Recipe Book context below. 
If an answer isn't in the manual, say you don't know and advise checking with a Shift Lead.

--- MANUAL CONTEXT ---
${manualContext}

--- RECIPE CONTEXT ---
${recipeContext}

User Question: ${userMsg}`,
      });

      let fullResponse = '';
      setChatMessages(prev => [...prev, { role: 'ai', content: '' }]);

      for await (const chunk of responseStream) {
        fullResponse += chunk.text;
        setChatMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content = fullResponse;
          return newMsgs;
        });
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', content: "Network error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAFAFA]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-[#001F3F] text-white fixed h-full shadow-2xl z-30">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white p-2 rounded-xl shadow-lg">
              <Coffee className="text-[#001F3F] w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tighter block leading-none">BOUNDARIES</span>
              <span className="text-[9px] font-bold text-blue-300 tracking-[0.2em] uppercase mt-0.5 block">Coffee & Co.</span>
            </div>
          </div>

          <div className="relative mb-3">
            <div className="text-[10px] font-black text-blue-300/50 uppercase tracking-[0.2em] mb-2 px-1 flex items-center gap-2">
              <MapPin size={10} /> Active Campus
            </div>
            {canSwitchStore ? (
              <div className="relative group">
                <select 
                  value={currentStoreId}
                  onChange={(e) => onStoreChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm font-black appearance-none cursor-pointer hover:bg-white/10 transition-all outline-none focus:ring-2 focus:ring-blue-500/50 pr-10 uppercase tracking-tighter shadow-inner"
                >
                  {stores.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#001F3F] text-white py-2">{s.name.replace('Boundaries ', '')}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-300/50 group-hover:text-blue-300 transition-colors">
                  <ChevronDown size={16} strokeWidth={3} />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-4 bg-white/5 rounded-xl border border-white/10 text-xs font-black uppercase tracking-tighter">
                {currentStore?.name.replace('Boundaries ', '')}
              </div>
            )}
          </div>

          {/* Total Sales Widget */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-xl p-3 border border-green-500/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[8px] font-black uppercase tracking-widest text-green-300/60">
                Today's Sales
              </span>
              <DollarSign size={12} className="text-green-400/40" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-white tracking-tight">
                {toastSales ? `$${toastSales.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}
              </span>
              {toastSales && toastSales.totalOrders > 0 && (
                <span className="text-[8px] font-bold text-green-300/60 uppercase tracking-wider ml-1">
                  {toastSales.totalOrders} orders
                </span>
              )}
            </div>
          </div>

          {/* Clocked In Staff Widget */}
          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 rounded-xl p-3 border border-blue-500/20 mt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[8px] font-black uppercase tracking-widest text-blue-300/60">
                Clocked In
              </span>
              <UserCheck size={12} className="text-blue-400/40" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-white tracking-tight">
                {toastClockedIn.length}
              </span>
              <span className="text-[8px] font-bold text-blue-300/60 uppercase tracking-wider ml-1">
                {toastClockedIn.length === 1 ? 'staff' : 'staff'}
              </span>
            </div>
            {toastClockedIn.length > 0 && (
              <div className="mt-2 space-y-1">
                {toastClockedIn.slice(0, 3).map((entry, i) => (
                  <div key={i} className="text-[8px] text-blue-300/80 font-medium truncate">
                    {entry.employeeName}
                  </div>
                ))}
                {toastClockedIn.length > 3 && (
                  <div className="text-[7px] text-blue-300/60 font-bold">
                    +{toastClockedIn.length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Turn Time Widget */}
          {toastSales && toastSales.averageTurnTime > 0 && (
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-xl p-3 border border-amber-500/20 mt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[8px] font-black uppercase tracking-widest text-amber-300/60">
                  Turn Time
                </span>
                <Clock size={12} className="text-amber-400/40" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-white tracking-tight">
                  {formatTurnTime(toastSales.averageTurnTime).formatted}
                </span>
                <span className="text-[8px] font-bold text-amber-300/60 uppercase tracking-wider ml-1">
                  avg
                </span>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto no-scrollbar">
          {filteredNav.map(item => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all duration-300 group ${
                activeTab === item.id
                  ? 'bg-white text-[#001F3F] font-bold shadow-xl shadow-white/10'
                  : 'text-blue-100/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              <span className="text-xs tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-3 pb-3">
          <button
            onClick={() => setChatOpen(true)}
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 hover:text-white transition-all border border-blue-500/20"
          >
            <Brain size={16} />
            <span className="text-[10px] font-black tracking-widest uppercase">Ask Barista Brain</span>
          </button>
        </div>

        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="px-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold border border-white/10">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold tracking-tight">{user.name}</p>
                <div className="flex items-center gap-1">
                  <p className="text-[9px] text-blue-300 font-bold uppercase tracking-widest">{user.role}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg transition-all ${showSettings ? 'bg-white/20 text-white' : 'text-blue-300/40 hover:text-white hover:bg-white/5'}`}
              title="User Settings"
            >
              <Settings size={12} />
            </button>
          </div>

          {showSettings && (
            <div className="px-2 py-2.5 bg-white/5 rounded-xl border border-white/5 space-y-2 animate-in fade-in slide-in-from-top-2">
              <div>
                <p className="text-[8px] font-black text-blue-300/60 uppercase tracking-[0.2em] mb-1.5">Change Home Store</p>
                <select
                  value={user.storeId}
                  onChange={(e) => onUserStoreChange?.(e.target.value)}
                  className="w-full bg-[#001F3F] border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-white outline-none focus:ring-1 focus:ring-blue-500/50"
                >
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name.replace('Boundaries ', '')}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-blue-200 hover:text-red-400 hover:bg-red-400/5 transition-all duration-300 group"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-bold tracking-widest uppercase">Logout</span>
          </button>
          <div className="text-[7px] text-center text-blue-300/20 font-black uppercase tracking-[0.2em] pt-1">
            App Version {version}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden glass-effect border-b border-neutral-100 p-3 flex flex-col gap-3 sticky top-0 z-50 shadow-sm">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <div className="bg-[#001F3F] p-1.5 rounded-lg">
              <Coffee className="text-white w-4 h-4" />
            </div>
            <span className="font-black tracking-tighter text-[#001F3F] text-sm uppercase leading-none">Boundaries</span>
            <div className={`ml-1.5 w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile Toast Widgets */}
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-lg px-2.5 py-1.5 border border-green-500/20 flex items-center gap-1.5">
                <DollarSign size={12} className="text-green-600" />
                <span className="text-xs font-black text-[#001F3F]">
                  {toastSales ? `$${Math.round(toastSales.totalSales)}` : '--'}
                </span>
              </div>
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 rounded-lg px-2.5 py-1.5 border border-blue-500/20 flex items-center gap-1.5">
                <UserCheck size={12} className="text-blue-600" />
                <span className="text-xs font-black text-[#001F3F]">{toastClockedIn.length}</span>
              </div>
              {toastSales && toastSales.averageTurnTime > 0 && (
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-lg px-2.5 py-1.5 border border-amber-500/20 flex items-center gap-1.5">
                  <Clock size={12} className="text-amber-600" />
                  <span className="text-xs font-black text-[#001F3F]">{formatTurnTime(toastSales.averageTurnTime).formattedShort}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 rounded-full bg-[#001F3F] text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-lg active:scale-90 transition-transform"
            >
              {user.name.charAt(0)}
            </button>
          </div>
        </div>
        
        <div className="px-1">
          {canSwitchStore ? (
            <div className="relative group">
              <select
                value={currentStoreId}
                onChange={(e) => onStoreChange(e.target.value)}
                className="w-full bg-neutral-100 border-none rounded-xl pl-9 pr-9 py-2 text-[10px] font-black uppercase tracking-widest outline-none text-[#001F3F] appearance-none shadow-inner"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name.replace('Boundaries ', '')}</option>
                ))}
              </select>
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400">
                <MapPin size={12} strokeWidth={3} />
              </div>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400">
                <ChevronDown size={12} strokeWidth={3} />
              </div>
            </div>
          ) : (
            <div className="text-[9px] font-black text-[#001F3F] uppercase flex items-center gap-1 bg-neutral-100/50 self-start px-3 py-2 rounded-xl border border-neutral-100 shadow-inner">
              <MapPin size={10} strokeWidth={3} /> {currentStore?.name.replace('Boundaries ', '')}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Profile Overlay */}
      {isProfileOpen && (
        <div className="md:hidden fixed inset-0 bg-[#001F3F]/60 backdrop-blur-md z-[60] p-6 flex flex-col justify-end animate-in fade-in slide-in-from-bottom-10 duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[1.5rem] bg-[#001F3F] text-white flex items-center justify-center text-xl font-black">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#001F3F] tracking-tighter uppercase leading-none">{user.name}</h3>
                  <p className="text-sm font-bold text-neutral-400 mt-2 uppercase tracking-widest">{user.role}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-3 rounded-2xl transition-all ${showSettings ? 'bg-[#001F3F] text-white' : 'bg-neutral-50 text-neutral-400'}`}
              >
                <Settings size={20} />
              </button>
            </div>

            {showSettings && (
              <div className="p-5 bg-neutral-50 rounded-3xl border border-neutral-100 space-y-4 animate-in slide-in-from-top-4">
                <div>
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 block px-1">Update Home Campus</label>
                  <select 
                    value={user.storeId}
                    onChange={(e) => onUserStoreChange?.(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-4 py-3.5 text-sm font-bold text-[#001F3F] outline-none shadow-sm"
                  >
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-red-50 text-red-600 font-black uppercase tracking-widest text-xs active:scale-95 transition-transform"
            >
              <LogOut size={18} /> Logout Session
            </button>
            <div className="text-center pt-4">
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="w-full py-4 text-neutral-400 font-bold uppercase tracking-widest text-[10px]"
              >
                Dismiss
              </button>
              <p className="text-[8px] font-black text-neutral-200 uppercase tracking-[0.3em] mt-2">App Version {version}</p>
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Banner (Mobile Only) */}
      {showInstallBanner && (
        <div className="md:hidden fixed bottom-24 left-4 right-4 z-[55] animate-in slide-in-from-bottom-20 duration-500">
          <div className="bg-[#001F3F] text-white p-6 rounded-[2rem] shadow-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl -mr-16 -mt-16" />
            
            <button 
              onClick={onDismissInstall}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white p-2 rounded-xl">
                <Coffee className="text-[#001F3F] w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-xs uppercase tracking-widest leading-none">Install App</h4>
                <p className="text-[10px] text-blue-200 font-medium mt-1 uppercase tracking-tight">Access Logbook & Recipes Instantly</p>
              </div>
            </div>

            {canNativeInstall ? (
              <button 
                onClick={onInstall}
                className="w-full bg-white text-[#001F3F] font-black py-3 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
              >
                <Download size={14} strokeWidth={3} /> Install on Phone
              </button>
            ) : isIOS ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="bg-blue-500 text-white p-1 rounded">
                    <Share size={10} />
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-tight text-blue-100">
                    1. Tap the <span className="text-white">"Share"</span> button at the bottom
                  </p>
                </div>
                <div className="flex items-start gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="bg-white text-[#001F3F] p-1 rounded">
                    <Smartphone size={10} />
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-tight text-blue-100">
                    2. Select <span className="text-white">"Add to Home Screen"</span>
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 sm:p-6 md:p-12 overflow-x-hidden transition-all">
        <div className="max-w-6xl mx-auto pb-28 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Floating Action Button for Chat */}
      <button
        onClick={() => setChatOpen(true)}
        className="md:hidden fixed bottom-16 right-3 w-12 h-12 bg-[#001F3F] text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform border border-white/10"
      >
        <Brain size={20} />
      </button>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-effect border-t border-neutral-100 px-3 py-2 flex items-center justify-around z-50 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        {filteredNav.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-0.5 transition-all relative ${
                isActive ? 'text-[#001F3F]' : 'text-neutral-300'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all duration-300 ${isActive ? 'bg-blue-50' : 'bg-transparent'}`}>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-[0.1em] transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                {item.label}
              </span>
              {isActive && <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#001F3F] rounded-full" />}
            </button>
          );
        })}
      </nav>

      {/* Barista Brain Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-[#001F3F]/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[80vh] sm:h-[600px] border border-white/20">
            <header className="p-6 bg-[#001F3F] text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Brain size={24} className="text-blue-300" />
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Barista Brain</h3>
                  <p className="text-[8px] font-bold text-blue-300 uppercase tracking-widest">Grounded Source of Truth</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <Sparkles size={40} className="text-blue-100" />
                  <p className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">
                    Ask me about recipes, greeting scripts, or espresso mastery.
                  </p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-medium leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#001F3F] text-white rounded-tr-none' 
                      : 'bg-neutral-100 text-[#001F3F] rounded-tl-none'
                  }`}>
                    {msg.content || (isTyping && <span className="animate-pulse">Consulting Manual...</span>)}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} className="p-4 sm:p-6 bg-neutral-50 border-t border-neutral-100">
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="What is the greeting script?"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="w-full bg-white border border-neutral-100 rounded-2xl pl-4 pr-14 py-4 font-bold text-[#001F3F] outline-none"
                />
                <button type="submit" disabled={isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#001F3F] text-white rounded-xl shadow-lg active:scale-90 transition-all disabled:opacity-50">
                  <Send size={18} strokeWidth={3} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
