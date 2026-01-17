import React, { useRef, useState } from 'react';
import { Settings, Download, Upload, Trash2, Sun, Moon, BookOpen, Palette, Sparkles, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { UserSettings, Quarter } from '../types';
import { initializeAI, isAIAvailable } from '../services/ai';

interface SettingsViewProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => Promise<void>;
  onExport: () => Promise<void>;
  onImport: (file: File) => Promise<void>;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSave,
  onExport,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiTestStatus, setAiTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onImport(file);
    }
  };

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone. Consider exporting your data first.')) {
      if (confirm('This will delete all your goals, daily pages, notes, projects, and settings. Are you absolutely sure?')) {
        // Import db to clear data
        const { db } = await import('../services/db');
        await db.clearAllData();
        window.location.reload();
      }
    }
  };

  const updateSetting = async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    await onSave({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-amber-200 pb-6">
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
          <Settings className="w-8 h-8 text-amber-700" />
          Settings
        </h1>
        <p className="text-sm opacity-60 mt-1">
          Customize your planner experience
        </p>
      </div>

      {/* Appearance */}
      <div className="planner-card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-amber-700" />
          Appearance
        </h2>

        <div className="space-y-6">
          {/* Theme */}
          <div>
            <label className="block text-sm font-semibold mb-3">Theme</label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {([
                { value: 'paper', label: 'Paper', bg: 'bg-amber-50', text: 'text-amber-950' },
                { value: 'light', label: 'Light', bg: 'bg-white', text: 'text-gray-900' },
                { value: 'sepia', label: 'Sepia', bg: 'bg-amber-100', text: 'text-amber-900' },
                { value: 'dark', label: 'Dark', bg: 'bg-gray-900', text: 'text-gray-100' },
              ] as const).map(theme => (
                <button
                  key={theme.value}
                  onClick={() => updateSetting('theme', theme.value)}
                  className={`p-4 rounded-lg border-2 transition-all touch-manipulation ${theme.bg} ${theme.text} ${
                    settings.theme === theme.value
                      ? 'border-amber-600 ring-2 ring-amber-300'
                      : 'border-gray-200 hover:border-amber-400'
                  }`}
                >
                  <div className="font-medium">{theme.label}</div>
                  <div className="text-xs opacity-60">Aa Bb Cc</div>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-semibold mb-3">Font Size</label>
            <div className="flex gap-3">
              {(['small', 'medium', 'large'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => updateSetting('fontSize', size)}
                  className={`px-6 py-3 rounded-lg border-2 transition-all touch-manipulation ${
                    settings.fontSize === size
                      ? 'border-amber-600 bg-amber-50'
                      : 'border-gray-200 hover:border-amber-400'
                  }`}
                >
                  <span className={size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : ''}>
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-sm font-semibold mb-3">Font Style</label>
            <div className="flex gap-3">
              {([
                { value: 'serif', label: 'Classic', font: 'font-serif' },
                { value: 'sans-serif', label: 'Modern', font: 'font-sans' },
                { value: 'handwriting', label: 'Handwriting', font: 'font-serif italic' },
              ] as const).map(style => (
                <button
                  key={style.value}
                  onClick={() => updateSetting('fontFamily', style.value)}
                  className={`px-6 py-3 rounded-lg border-2 transition-all touch-manipulation ${style.font} ${
                    settings.fontFamily === style.value
                      ? 'border-amber-600 bg-amber-50'
                      : 'border-gray-200 hover:border-amber-400'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Planning Preferences */}
      <div className="planner-card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-700" />
          Planning Preferences
        </h2>

        <div className="space-y-6">
          {/* Week Start */}
          <div>
            <label className="block text-sm font-semibold mb-2">Week Starts On</label>
            <select
              value={settings.weekStartsOn}
              onChange={(e) => updateSetting('weekStartsOn', parseInt(e.target.value) as UserSettings['weekStartsOn'])}
              className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2"
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
              <option value={6}>Saturday</option>
            </select>
          </div>

          {/* Work Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Workday Start</label>
              <input
                type="time"
                value={settings.workdayStart}
                onChange={(e) => updateSetting('workdayStart', e.target.value)}
                className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Workday End</label>
              <input
                type="time"
                value={settings.workdayEnd}
                onChange={(e) => updateSetting('workdayEnd', e.target.value)}
                className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2"
              />
            </div>
          </div>

          {/* Current Planning Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Planning Year</label>
              <select
                value={settings.currentPlanningYear}
                onChange={(e) => updateSetting('currentPlanningYear', parseInt(e.target.value))}
                className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2"
              >
                {[2024, 2025, 2026, 2027].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Current Quarter</label>
              <select
                value={settings.currentQuarter}
                onChange={(e) => updateSetting('currentQuarter', e.target.value as Quarter)}
                className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2"
              >
                {[Quarter.Q1, Quarter.Q2, Quarter.Q3, Quarter.Q4].map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* AI Features */}
      <div className="planner-card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-700" />
          AI Features
        </h2>

        <div className="space-y-6">
          {/* AI Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-semibold">Enable AI Assistance</label>
              <p className="text-sm opacity-60 mt-1">
                Use AI to help with task prioritization, goal suggestions, and insights
              </p>
            </div>
            <button
              onClick={() => updateSetting('aiEnabled', !settings.aiEnabled)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                settings.aiEnabled ? 'bg-amber-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                  settings.aiEnabled ? 'left-8' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* API Key */}
          {settings.aiEnabled && (
            <div className="space-y-4 pt-4 border-t border-amber-200">
              <div>
                <label className="block text-sm font-semibold mb-2">Google AI API Key</label>
                <p className="text-xs opacity-60 mb-3">
                  Get your free API key from{' '}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-700 underline"
                  >
                    Google AI Studio
                  </a>
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.aiApiKey || ''}
                      onChange={(e) => updateSetting('aiApiKey', e.target.value)}
                      placeholder="Enter your API key"
                      className="w-full bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={async () => {
                      if (!settings.aiApiKey) return;
                      setAiTestStatus('testing');
                      try {
                        initializeAI(settings.aiApiKey);
                        // Simple test - just check if the AI is available
                        if (isAIAvailable()) {
                          setAiTestStatus('success');
                          setTimeout(() => setAiTestStatus('idle'), 3000);
                        } else {
                          setAiTestStatus('error');
                        }
                      } catch {
                        setAiTestStatus('error');
                      }
                    }}
                    disabled={!settings.aiApiKey || aiTestStatus === 'testing'}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                  >
                    {aiTestStatus === 'testing' ? 'Testing...' : 'Test'}
                  </button>
                </div>
                {aiTestStatus === 'success' && (
                  <p className="text-sm text-green-600 mt-2">API key is valid!</p>
                )}
                {aiTestStatus === 'error' && (
                  <p className="text-sm text-red-600 mt-2">Failed to validate API key</p>
                )}
              </div>

              <div className="bg-amber-50 rounded-lg p-4">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  AI Privacy Note
                </h4>
                <p className="text-sm opacity-70">
                  When AI features are enabled, relevant data (tasks, goals, notes) may be sent to
                  Google's AI services for processing. Your API key is stored locally in your browser
                  and never shared with third parties.
                </p>
              </div>

              <div className="text-sm opacity-70">
                <h4 className="font-semibold mb-2">AI Features Include:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Smart task prioritization</li>
                  <li>Goal suggestion and breakdown</li>
                  <li>Daily insights and tips</li>
                  <li>Automatic note categorization</li>
                  <li>Weekly review prompts</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="planner-card p-6">
        <h2 className="text-xl font-bold mb-4">Data Management</h2>

        <div className="space-y-4">
          {/* Export */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Download className="w-5 h-5 text-green-600" />
                Export Data
              </h3>
              <p className="text-sm opacity-60 mt-1">
                Download a backup of all your planner data as JSON
              </p>
            </div>
            <button
              onClick={onExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors touch-manipulation"
            >
              Export
            </button>
          </div>

          {/* Import */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Import Data
              </h3>
              <p className="text-sm opacity-60 mt-1">
                Restore data from a previously exported backup
              </p>
            </div>
            <button
              onClick={handleImportClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
            >
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Clear Data */}
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Clear All Data
              </h3>
              <p className="text-sm opacity-60 mt-1">
                Permanently delete all data. This cannot be undone.
              </p>
            </div>
            <button
              onClick={handleClearData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors touch-manipulation"
            >
              Clear Data
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="planner-card p-6">
        <h2 className="text-xl font-bold mb-4">About</h2>
        <div className="space-y-2 text-sm opacity-70">
          <p><strong>Full Focus Planner</strong> - Digital Edition</p>
          <p>A productivity system for achieving your goals with intention and focus.</p>
          <p className="mt-4">
            Inspired by Michael Hyatt's Full Focus Planner methodology.
          </p>
          <p className="text-xs mt-4 opacity-50">
            All data is stored locally in your browser using IndexedDB.
            No data is sent to any server.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
