import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { User, UserRole, Store, ToastSyncEmployee } from '../types';
import { db } from '../services/db';
import { hashPassword } from '../utils/passwordUtils';
import { toastAPI } from '../services/toast';
import {
  Search, Plus, Edit3, X, Copy, Check,
  ShieldCheck, Users, Mail, MapPin, Key, AlertTriangle,
  UserX, UserCheck, RefreshCw, Eye, EyeOff, ChevronDown, ChevronUp,
  Download, UserPlus, Briefcase, Clock
} from 'lucide-react';

interface TeamManagementProps {
  allUsers: User[];
  currentUser: User;
  stores: Store[];
  currentStoreId: string;
  onUserUpdated: () => void;
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  [UserRole.ADMIN]: 'bg-purple-100 text-purple-700 border-purple-200',
  [UserRole.MANAGER]: 'bg-blue-100 text-blue-700 border-blue-200',
  [UserRole.TRAINER]: 'bg-green-100 text-green-700 border-green-200',
  [UserRole.TRAINEE]: 'bg-amber-100 text-amber-700 border-amber-200',
};

const ROLE_OPTIONS = [
  { value: UserRole.ADMIN, label: 'Admin' },
  { value: UserRole.MANAGER, label: 'Manager' },
  { value: UserRole.TRAINER, label: 'Trainer' },
  { value: UserRole.TRAINEE, label: 'Trainee' },
];

const TeamManagement: React.FC<TeamManagementProps> = ({
  allUsers, currentUser, stores, currentStoreId, onUserUpdated
}) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStore, setFilterStore] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showDeactivated, setShowDeactivated] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showInvite, setShowInvite] = useState<{ email: string; password: string; name: string } | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<User | null>(null);

  // Form state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Add User Form
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    role: UserRole.TRAINEE as UserRole,
    storeId: currentStoreId,
    password: '',
  });

  // Edit User Form
  const [editForm, setEditForm] = useState({
    name: '',
    role: UserRole.TRAINEE as UserRole,
    storeId: '',
    resetPassword: false,
    newPassword: '',
  });

  // Toast Sync State
  const [toastEmployees, setToastEmployees] = useState<ToastSyncEmployee[]>([]);
  const [toastSyncing, setToastSyncing] = useState(false);
  const [toastSyncError, setToastSyncError] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [showToastSync, setShowToastSync] = useState(true);
  const syncCacheRef = useRef<{ employees: ToastSyncEmployee[]; timestamp: number } | null>(null);
  const hasSyncedOnMount = useRef(false);

  // Pre-fill add modal from Toast
  const [toastPrefill, setToastPrefill] = useState<ToastSyncEmployee | null>(null);

  // --- Toast Sync Logic ---

  const SYNC_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const guessRoleFromJobTitle = (jobTitle: string): UserRole => {
    const lower = jobTitle.toLowerCase();
    if (lower.includes('manager') || lower.includes('gm') || lower.includes('general manager') || lower.includes('agm') || lower.includes('assistant general manager')) {
      return UserRole.MANAGER;
    }
    if (lower.includes('team lead') || lower.includes('shift lead') || lower.includes('shift supervisor') || lower.includes('trainer')) {
      return UserRole.TRAINER;
    }
    return UserRole.TRAINEE;
  };

  const syncFromToast = useCallback(async (force = false) => {
    // Check cache
    if (!force && syncCacheRef.current) {
      const age = Date.now() - syncCacheRef.current.timestamp;
      if (age < SYNC_CACHE_TTL) {
        setToastEmployees(syncCacheRef.current.employees);
        setLastSyncTime(syncCacheRef.current.timestamp);
        return;
      }
    }

    setToastSyncing(true);
    setToastSyncError('');
    try {
      const employees = await toastAPI.getEmployees(); // Both locations
      setToastEmployees(employees);
      const now = Date.now();
      setLastSyncTime(now);
      syncCacheRef.current = { employees, timestamp: now };
    } catch (err: any) {
      setToastSyncError(err.message || 'Failed to sync from Toast');
    } finally {
      setToastSyncing(false);
    }
  }, []);

  // Auto-sync on mount (with cache)
  useEffect(() => {
    if (!hasSyncedOnMount.current) {
      hasSyncedOnMount.current = true;
      syncFromToast(false);
    }
  }, [syncFromToast]);

  // Fuzzy name matching
  const nameMatches = (toastName: string, appName: string): boolean => {
    const t = toastName.toLowerCase().trim();
    const a = appName.toLowerCase().trim();
    if (t === a) return true;
    // Check if first name matches
    const tFirst = t.split(' ')[0];
    const aFirst = a.split(' ')[0];
    if (tFirst === aFirst && tFirst.length > 2) return true;
    // Check if Toast name is short form (e.g., "Kendall M" matches "Kendall Matthews")
    const tParts = t.split(' ');
    const aParts = a.split(' ');
    if (tParts.length >= 2 && aParts.length >= 2) {
      if (tParts[0] === aParts[0] && aParts[1].startsWith(tParts[1])) return true;
      if (aParts[0] === tParts[0] && tParts[1].startsWith(aParts[1])) return true;
    }
    // Check if one contains the other
    if (t.includes(a) || a.includes(t)) return true;
    return false;
  };

  const unmatchedToastEmployees = useMemo(() => {
    if (toastEmployees.length === 0) return [];
    return toastEmployees.filter(emp => {
      // Match by Toast GUID stored on user
      if (allUsers.some(u => u.toastEmployeeGuid === emp.guid)) return false;
      // Match by email
      if (emp.email && allUsers.some(u => u.email.toLowerCase() === emp.email.toLowerCase())) return false;
      // Fuzzy name match
      if (allUsers.some(u => nameMatches(emp.name, u.name))) return false;
      return true;
    });
  }, [toastEmployees, allUsers]);

  const handleAddFromToast = (emp: ToastSyncEmployee) => {
    setToastPrefill(emp);
    const role = guessRoleFromJobTitle(emp.jobTitle);
    setAddForm({
      name: emp.name,
      email: emp.email || '',
      role,
      storeId: emp.storeId,
      password: '',
    });
    setShowAddModal(true);
  };

  const formatSyncAge = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // --- Derived Data ---

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const matchesSearch = searchQuery === '' ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStore = filterStore === 'all' || u.storeId === filterStore;
      const matchesRole = filterRole === 'all' || u.role === filterRole;
      return matchesSearch && matchesStore && matchesRole;
    });
  }, [allUsers, searchQuery, filterStore, filterRole]);

  const activeUsers = useMemo(() => filteredUsers.filter(u => u.active !== false), [filteredUsers]);
  const deactivatedUsers = useMemo(() => filteredUsers.filter(u => u.active === false), [filteredUsers]);

  // --- Helpers ---

  const getStoreName = (storeId: string) => stores.find(s => s.id === storeId)?.name || storeId;

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const resetAddForm = () => {
    setAddForm({ name: '', email: '', role: UserRole.TRAINEE, storeId: currentStoreId, password: '' });
    setError('');
    setShowPassword(false);
  };

  // --- Handlers ---

  const handleAddUser = async () => {
    setError('');

    if (!addForm.name.trim()) { setError('Name is required.'); return; }
    if (!addForm.email.trim()) { setError('Email is required.'); return; }
    if (!addForm.password.trim()) { setError('A temporary password is required.'); return; }
    if (addForm.password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    const emailLower = addForm.email.toLowerCase().trim();
    if (allUsers.some(u => u.email.toLowerCase() === emailLower)) {
      setError('A user with this email already exists.');
      return;
    }

    setSaving(true);
    try {
      const hashedPw = await hashPassword(addForm.password);
      const newUser: User = {
        id: `u-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: addForm.name.trim(),
        email: emailLower,
        password: hashedPw,
        role: addForm.role,
        storeId: addForm.storeId,
        active: true,
        ...(toastPrefill ? { toastEmployeeGuid: toastPrefill.guid } : {}),
      };

      await db.syncUser(newUser);
      onUserUpdated();

      // Show invite/credentials modal
      setShowInvite({ email: emailLower, password: addForm.password, name: addForm.name.trim() });
      setShowAddModal(false);
      setToastPrefill(null);
      resetAddForm();
    } catch (err: any) {
      setError(err.message || 'Failed to add user.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    setError('');

    if (!editForm.name.trim()) { setError('Name is required.'); return; }
    if (editForm.resetPassword && editForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      const updatedUser: User = {
        ...editingUser,
        name: editForm.name.trim(),
        role: editForm.role,
        storeId: editForm.storeId,
      };

      if (editForm.resetPassword && editForm.newPassword) {
        updatedUser.password = await hashPassword(editForm.newPassword);
      }

      await db.syncUser(updatedUser);
      onUserUpdated();

      // If password was reset, show credentials
      if (editForm.resetPassword && editForm.newPassword) {
        setShowInvite({ email: editingUser.email, password: editForm.newPassword, name: editForm.name.trim() });
      }

      setEditingUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    const isCurrentlyActive = user.active !== false;
    try {
      const updatedUser: User = { ...user, active: !isCurrentlyActive };
      await db.syncUser(updatedUser);
      onUserUpdated();
      setConfirmDeactivate(null);
    } catch (err: any) {
      alert('Failed to update user status: ' + (err.message || 'Unknown error'));
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      role: user.role,
      storeId: user.storeId,
      resetPassword: false,
      newPassword: '',
    });
    setError('');
    setShowPassword(false);
  };

  const copyCredentials = () => {
    if (!showInvite) return;
    const text = `Boundaries Coffee Login\n\nEmail: ${showInvite.email}\nPassword: ${showInvite.password}\n\nLog in at the Boundaries app to get started.`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isSelf = (user: User) => user.id === currentUser.id || user.email.toLowerCase() === currentUser.email.toLowerCase();

  // --- User Card ---

  const UserCard: React.FC<{ user: User; isDeactivated?: boolean }> = ({ user, isDeactivated }) => (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
      isDeactivated ? 'border-red-100 opacity-70' : 'border-neutral-100 hover:shadow-md'
    }`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0 ${
            isDeactivated ? 'bg-neutral-200 text-neutral-400' : 'bg-[#0F2B3C] text-white'
          }`}>
            {user.name.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-sm text-[#0F2B3C] uppercase tracking-tight truncate">{user.name}</h3>
              {isSelf(user) && (
                <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-widest">You</span>
              )}
            </div>
            <p className="text-[11px] text-neutral-500 font-medium truncate mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${ROLE_BADGE_COLORS[user.role] || 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>
                {user.role}
              </span>
              <span className="text-[9px] font-bold text-neutral-400 flex items-center gap-1">
                <MapPin size={10} />
                {getStoreName(user.storeId)}
              </span>
              {isDeactivated && (
                <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-200">
                  Deactivated
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-50">
          {!isDeactivated && (
            <button
              onClick={() => openEditModal(user)}
              className="flex-1 py-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-1.5"
            >
              <Edit3 size={12} /> Edit
            </button>
          )}
          {!isSelf(user) && (
            <button
              onClick={() => {
                if (isDeactivated) {
                  handleToggleActive(user);
                } else {
                  setConfirmDeactivate(user);
                }
              }}
              className={`flex-1 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                isDeactivated
                  ? 'bg-green-50 hover:bg-green-100 text-green-600'
                  : 'bg-red-50 hover:bg-red-100 text-red-600'
              }`}
            >
              {isDeactivated ? <><UserCheck size={12} /> Reactivate</> : <><UserX size={12} /> Deactivate</>}
            </button>
          )}
          {isDeactivated && (
            <button
              onClick={() => openEditModal(user)}
              className="flex-1 py-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-1.5"
            >
              <Edit3 size={12} /> Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Invite/Credentials Modal ── */}
      {showInvite && (
        <div className="fixed inset-0 z-[110] bg-[#0F2B3C]/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl border border-neutral-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-black text-[#0F2B3C] uppercase tracking-tight">Account Created</h3>
              <p className="text-neutral-400 text-sm font-medium mt-1">Share these credentials with {showInvite.name}</p>
            </div>

            <div className="bg-neutral-50 rounded-xl p-5 border border-neutral-100 space-y-3 mb-6">
              <div>
                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Email</p>
                <p className="text-sm font-bold text-[#0F2B3C] break-all">{showInvite.email}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Temporary Password</p>
                <p className="text-sm font-bold text-[#0F2B3C] font-mono bg-white px-3 py-2 rounded-lg border border-neutral-200">{showInvite.password}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium">This password is shown only once. Make sure to share it with the team member before closing this dialog.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyCredentials}
                className={`flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${
                  copied ? 'bg-green-600 text-white' : 'bg-[#0F2B3C] text-white hover:bg-blue-900'
                }`}
              >
                {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Credentials</>}
              </button>
              <button
                onClick={() => { setShowInvite(null); setCopied(false); }}
                className="px-6 py-4 bg-neutral-100 text-neutral-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-neutral-200 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deactivation Confirmation Modal ── */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-[110] bg-[#0F2B3C]/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg border border-neutral-100">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-red-50 text-red-500">
              <UserX size={32} />
            </div>
            <h3 className="text-2xl font-black text-[#0F2B3C] uppercase tracking-tight leading-tight mb-2">
              Deactivate Account?
            </h3>
            <p className="text-neutral-500 text-sm font-medium mb-2 leading-relaxed">
              <span className="font-black text-[#0F2B3C]">{confirmDeactivate.name}</span> will no longer be able to log in. Their data will be preserved and you can reactivate them at any time.
            </p>
            <p className="text-[10px] font-bold text-neutral-400 mb-6">{confirmDeactivate.email}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeactivate(null)}
                className="flex-1 py-4 bg-neutral-100 text-neutral-400 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleActive(confirmDeactivate)}
                className="flex-1 py-4 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg active:scale-95 hover:bg-red-700 transition-all"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add User Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[110] bg-[#0F2B3C]/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-2xl border border-neutral-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-[#0F2B3C] uppercase tracking-tight">Add Team Member</h3>
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-1">Create a new staff account</p>
              </div>
              <button onClick={() => { setShowAddModal(false); setToastPrefill(null); resetAddForm(); }} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
                <X size={20} className="text-neutral-400" />
              </button>
            </div>

            {/* Toast pre-fill indicator */}
            {toastPrefill && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <Download size={16} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-indigo-700 uppercase tracking-widest">Imported from Toast POS</p>
                  <p className="text-[11px] text-indigo-600 font-medium mt-1">{toastPrefill.jobTitle} • {toastPrefill.location === 'littleelm' ? 'Little Elm' : 'Prosper'}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 mb-6 animate-in shake duration-300">
                {error}
              </div>
            )}

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Full Name</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Alex Johnson"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-4 focus:ring-[#0F2B3C]/10 focus:border-[#0F2B3C] transition-all outline-none font-medium"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-xl pl-11 pr-4 py-3.5 focus:bg-white focus:ring-4 focus:ring-[#0F2B3C]/10 focus:border-[#0F2B3C] transition-all outline-none font-medium"
                  />
                </div>
              </div>

              {/* Role + Store */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Role</label>
                  <select
                    value={addForm.role}
                    onChange={e => setAddForm({ ...addForm, role: e.target.value as UserRole })}
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-4 focus:ring-[#0F2B3C]/10 focus:border-[#0F2B3C] transition-all outline-none font-bold text-sm appearance-none"
                  >
                    {ROLE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Store</label>
                  <select
                    value={addForm.storeId}
                    onChange={e => setAddForm({ ...addForm, storeId: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-4 focus:ring-[#0F2B3C]/10 focus:border-[#0F2B3C] transition-all outline-none font-bold text-sm appearance-none"
                  >
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Temporary Password</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={addForm.password}
                      onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                      placeholder="Min 6 characters"
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-xl pl-11 pr-11 py-3.5 focus:bg-white focus:ring-4 focus:ring-[#0F2B3C]/10 focus:border-[#0F2B3C] transition-all outline-none font-medium font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAddForm({ ...addForm, password: generateTempPassword() }); setShowPassword(true); }}
                    className="px-4 py-3.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-blue-100 transition-all whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => { setShowAddModal(false); setToastPrefill(null); resetAddForm(); }}
                className="flex-1 py-4 bg-neutral-100 text-neutral-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-neutral-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={saving}
                className="flex-1 py-4 bg-[#0F2B3C] text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-900 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : <><Plus size={14} /> Add User</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {editingUser && (
        <div className="fixed inset-0 z-[110] bg-[#0F2B3C]/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full shadow-2xl border border-neutral-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-[#0F2B3C] uppercase tracking-tight">Edit Team Member</h3>
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-1">{editingUser.email}</p>
              </div>
              <button onClick={() => { setEditingUser(null); setError(''); }} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
                <X size={20} className="text-neutral-400" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 mb-6 animate-in shake duration-300">
                {error}
              </div>
            )}

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-4 focus:ring-[#0F2B3C]/10 focus:border-[#0F2B3C] transition-all outline-none font-medium"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Email (Cannot Be Changed)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                  <input
                    type="email"
                    value={editingUser.email}
                    readOnly
                    className="w-full bg-neutral-100 border border-neutral-100 rounded-xl pl-11 pr-4 py-3.5 font-medium text-neutral-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Role + Store */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Role</label>
                  {isSelf(editingUser) ? (
                    <div className="w-full bg-neutral-100 border border-neutral-100 rounded-xl px-4 py-3.5 font-bold text-sm text-neutral-400">
                      {editingUser.role}
                      <p className="text-[8px] font-bold text-amber-500 mt-1">Can't edit own role</p>
                    </div>
                  ) : (
                    <select
                      value={editForm.role}
                      onChange={e => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-4 focus:ring-[#0F2B3C]/10 focus:border-[#0F2B3C] transition-all outline-none font-bold text-sm appearance-none"
                    >
                      {ROLE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1 mb-2 block">Store</label>
                  <select
                    value={editForm.storeId}
                    onChange={e => setEditForm({ ...editForm, storeId: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-4 focus:ring-[#0F2B3C]/10 focus:border-[#0F2B3C] transition-all outline-none font-bold text-sm appearance-none"
                  >
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password Reset */}
              <div className="border border-neutral-100 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, resetPassword: !editForm.resetPassword, newPassword: '' })}
                  className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Key size={16} className="text-neutral-400" />
                    <span className="text-xs font-black text-neutral-600 uppercase tracking-widest">Reset Password</span>
                  </div>
                  {editForm.resetPassword ? <ChevronUp size={16} className="text-neutral-400" /> : <ChevronDown size={16} className="text-neutral-400" />}
                </button>
                {editForm.resetPassword && (
                  <div className="p-4 border-t border-neutral-100">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={editForm.newPassword}
                          onChange={e => setEditForm({ ...editForm, newPassword: e.target.value })}
                          placeholder="New password (min 6 chars)"
                          className="w-full bg-white border border-neutral-200 rounded-xl px-4 pr-11 py-3.5 focus:ring-4 focus:ring-[#0F2B3C]/10 focus:border-[#0F2B3C] transition-all outline-none font-medium font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500 transition-colors"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setEditForm({ ...editForm, newPassword: generateTempPassword() }); setShowPassword(true); }}
                        className="px-4 py-3.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-blue-100 transition-all whitespace-nowrap"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => { setEditingUser(null); setError(''); }}
                className="flex-1 py-4 bg-neutral-100 text-neutral-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-neutral-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEditUser}
                disabled={saving}
                className="flex-1 py-4 bg-[#0F2B3C] text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-900 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : <><Check size={14} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-neutral-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg"><ShieldCheck size={14} /></div>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Admin Only</p>
          </div>
          <h2 className="text-2xl font-black text-[#0F2B3C] uppercase tracking-tight">Team Management</h2>
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-1">{allUsers.length} total accounts • {allUsers.filter(u => u.active !== false).length} active</p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); resetAddForm(); }}
          className="px-8 py-4 bg-[#0F2B3C] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-900 transition-all shadow-lg flex items-center gap-2 active:scale-95"
        >
          <Plus size={18} /> Add Team Member
        </button>
      </div>

      {/* ── Toast POS Employee Sync ── */}
      <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
        {/* Sync Header */}
        <button
          onClick={() => setShowToastSync(!showToastSync)}
          className="w-full flex items-center justify-between p-5 hover:bg-indigo-50/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <Download size={16} />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-black text-[#0F2B3C] uppercase tracking-widest">Toast POS Sync</h3>
              <p className="text-[10px] text-neutral-400 font-bold mt-0.5">
                {toastSyncing ? 'Syncing...' :
                  lastSyncTime ? `Last synced ${formatSyncAge(lastSyncTime)}` :
                  'Sync employees from Toast POS'}
                {unmatchedToastEmployees.length > 0 && (
                  <span className="ml-2 text-indigo-600">• {unmatchedToastEmployees.length} new</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); syncFromToast(true); }}
              disabled={toastSyncing}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {toastSyncing ? (
                <><RefreshCw size={12} className="animate-spin" /> Syncing</>
              ) : (
                <><RefreshCw size={12} /> Sync</>
              )}
            </button>
            {showToastSync ? <ChevronUp size={16} className="text-neutral-400" /> : <ChevronDown size={16} className="text-neutral-400" />}
          </div>
        </button>

        {/* Sync Content */}
        {showToastSync && (
          <div className="border-t border-indigo-50 p-5">
            {toastSyncError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 mb-4">
                {toastSyncError}
              </div>
            )}

            {toastSyncing && toastEmployees.length === 0 && (
              <div className="flex items-center justify-center py-8 gap-3">
                <RefreshCw size={20} className="text-indigo-400 animate-spin" />
                <p className="text-sm font-bold text-neutral-400">Fetching employees from Toast POS...</p>
              </div>
            )}

            {!toastSyncing && toastEmployees.length === 0 && !toastSyncError && (
              <div className="text-center py-8">
                <Download size={32} className="text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-400 font-bold text-xs uppercase tracking-widest">Click Sync to fetch employees from Toast</p>
              </div>
            )}

            {toastEmployees.length > 0 && unmatchedToastEmployees.length === 0 && (
              <div className="flex items-center gap-3 py-6 justify-center">
                <div className="p-2 bg-green-100 text-green-600 rounded-full">
                  <Check size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-green-700">All synced!</p>
                  <p className="text-[10px] font-bold text-neutral-400">{toastEmployees.length} Toast employees matched to app accounts</p>
                </div>
              </div>
            )}

            {unmatchedToastEmployees.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus size={14} className="text-indigo-500" />
                  <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                    New from Toast ({unmatchedToastEmployees.length})
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unmatchedToastEmployees.map(emp => (
                    <div key={emp.guid} className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 hover:border-indigo-200 transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-sm text-[#0F2B3C] uppercase tracking-tight truncate">{emp.name}</h4>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600">
                              <Briefcase size={10} />
                              {emp.jobTitle}
                            </span>
                            <span className="text-neutral-300">•</span>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-400">
                              <MapPin size={10} />
                              {emp.location === 'littleelm' ? 'Little Elm' : 'Prosper'}
                            </span>
                          </div>
                          {emp.email && (
                            <p className="text-[10px] text-neutral-400 font-medium mt-1 truncate">{emp.email}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddFromToast(emp)}
                        className="mt-3 w-full py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-indigo-700 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <UserPlus size={12} /> Add to App
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Search & Filters ── */}
      <div className="bg-white p-5 rounded-xl border border-neutral-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-neutral-50 border border-neutral-100 rounded-xl pl-11 pr-4 py-3 focus:bg-white focus:ring-4 focus:ring-[#0F2B3C]/10 focus:border-[#0F2B3C] transition-all outline-none font-medium text-sm"
            />
          </div>

          {/* Store Filter */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300" size={14} />
            <select
              value={filterStore}
              onChange={e => setFilterStore(e.target.value)}
              className="bg-neutral-50 border border-neutral-100 rounded-xl pl-9 pr-8 py-3 font-bold text-xs uppercase tracking-widest text-neutral-600 appearance-none outline-none focus:ring-4 focus:ring-[#0F2B3C]/10 focus:border-[#0F2B3C] transition-all"
            >
              <option value="all">All Stores</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300" size={14} />
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="bg-neutral-50 border border-neutral-100 rounded-xl pl-9 pr-8 py-3 font-bold text-xs uppercase tracking-widest text-neutral-600 appearance-none outline-none focus:ring-4 focus:ring-[#0F2B3C]/10 focus:border-[#0F2B3C] transition-all"
            >
              <option value="all">All Roles</option>
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Active Users ── */}
      {activeUsers.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-4 px-1">
            <UserCheck size={16} className="text-green-500" />
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest">Active Team Members ({activeUsers.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeUsers.map(user => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center border-2 border-dashed border-neutral-200 rounded-xl">
          <Users size={48} className="text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-400 font-bold uppercase text-xs tracking-widest">
            {searchQuery || filterStore !== 'all' || filterRole !== 'all'
              ? 'No active users match your filters'
              : 'No active users found'}
          </p>
        </div>
      )}

      {/* ── Deactivated Users ── */}
      {deactivatedUsers.length > 0 && (
        <div>
          <button
            onClick={() => setShowDeactivated(!showDeactivated)}
            className="flex items-center gap-2 mb-4 px-1 group"
          >
            <UserX size={16} className="text-red-400" />
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest group-hover:text-neutral-600 transition-colors">
              Deactivated Accounts ({deactivatedUsers.length})
            </h3>
            {showDeactivated ? <ChevronUp size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
          </button>
          {showDeactivated && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-300">
              {deactivatedUsers.map(user => (
                <UserCard key={user.id} user={user} isDeactivated />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
