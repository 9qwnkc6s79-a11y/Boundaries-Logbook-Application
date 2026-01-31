
import React, { useState, useEffect } from 'react';
import { X, Activity, Database, Users, ClipboardList, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface DiagnosticResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  message: string;
  data?: any;
}

const StorageDiagnostic: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const report: DiagnosticResult[] = [];

    // 1. Check API Existence
    const storageApi = (window as any).storage;
    const hasApi = !!(storageApi && typeof storageApi.get === 'function' && typeof storageApi.set === 'function');
    report.push({
      step: 'API Detection',
      status: hasApi ? 'PASS' : 'FAIL',
      message: hasApi ? 'window.storage detected with get/set methods.' : 'window.storage is missing or incomplete.'
    });

    if (hasApi) {
      // 2. Write/Read Test (Shared)
      try {
        const testKey = 'diagnostic_sync_test';
        const testValue = `Diagnostic_Ping_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        await storageApi.set(testKey, testValue, true);
        const retrieved = await storageApi.get(testKey, true);
        const retrievedVal = typeof retrieved === 'string' ? retrieved : retrieved?.value;

        const writeSuccess = retrievedVal === testValue;
        report.push({
          step: 'Shared Write/Read',
          status: writeSuccess ? 'PASS' : 'FAIL',
          message: writeSuccess 
            ? 'Successfully wrote and verified unique value in shared storage.' 
            : `Value mismatch. Sent: ${testValue.substring(0,8)}, Got: ${String(retrievedVal).substring(0,8)}`
        });

        // 3. Inspect Production Data
        const usersKey = 'boundaries_cloud_users_v7';
        const subsKey = 'boundaries_cloud_submissions_v7';

        const rawUsers = await storageApi.get(usersKey, true);
        const rawSubs = await storageApi.get(subsKey, true);

        const parse = (raw: any) => {
          try {
            const str = typeof raw === 'string' ? raw : raw?.value;
            return str ? JSON.parse(str) : [];
          } catch { return []; }
        };

        const users = parse(rawUsers);
        const subs = parse(rawSubs);

        report.push({
          step: 'App Data Inspection',
          status: 'PASS',
          message: `Found ${users.length} Users and ${subs.length} Submissions in shared storage keys.`,
          data: { userCount: users.length, subCount: subs.length }
        });

        // 4. Cross-User Persistence Check
        const registryKey = 'diagnostic_user_registry';
        const rawRegistry = await storageApi.get(registryKey, true);
        const registry = parse(rawRegistry);
        
        const myPing = { time: new Date().toLocaleTimeString(), id: Math.random().toString(36).substring(7) };
        const updatedRegistry = [myPing, ...registry].slice(0, 10);
        await storageApi.set(registryKey, JSON.stringify(updatedRegistry), true);

        report.push({
          step: 'Multi-User Registry',
          status: 'PASS',
          message: `Registry has ${updatedRegistry.length} historical pings. If multiple users run this, you should see different IDs here.`,
          data: updatedRegistry
        });

      } catch (err: any) {
        report.push({
          step: 'Execution Error',
          status: 'FAIL',
          message: err.message || 'An error occurred during storage operations.'
        });
      }
    }

    setResults(report);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-[#0F2B3C] text-white p-6 overflow-y-auto flex flex-col font-sans">
      <div className="max-w-3xl mx-auto w-full space-y-8 pb-20">
        <div className="flex justify-between items-center border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <Activity size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Sync Diagnostic Tool</h2>
              <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest">Environment Verification v1.0</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="grid gap-4">
          {results.map((res, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-[1.5rem] p-6 animate-in slide-in-from-bottom-2">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-black text-blue-200 uppercase tracking-tight flex items-center gap-2">
                  <Database size={16} /> {res.step}
                </h3>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                  res.status === 'PASS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {res.status === 'PASS' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {res.status}
                </span>
              </div>
              <p className="text-sm font-medium text-white/70 leading-relaxed mb-4">{res.message}</p>
              
              {res.data && (
                <div className="bg-black/40 rounded-xl p-4 overflow-hidden">
                  <pre className="text-[10px] text-blue-300/80 font-mono whitespace-pre-wrap break-all">
                    {JSON.stringify(res.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}

          {results.length === 0 && isRunning && (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <RefreshCw className="animate-spin text-blue-400" size={48} />
              <p className="font-black text-sm uppercase tracking-[0.2em] animate-pulse">Running Probes...</p>
            </div>
          )}
        </div>

        <div className="pt-8 flex flex-col items-center gap-4">
          <button 
            onClick={runDiagnostics}
            disabled={isRunning}
            className="px-10 py-5 bg-white text-[#0F2B3C] rounded-xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            <RefreshCw size={18} className={isRunning ? 'animate-spin' : ''} />
            Re-Run Diagnostics
          </button>
          <p className="text-[10px] text-white/40 font-medium text-center max-w-md">
            Tip: Run this on a second device simultaneously. If the "Multi-User Registry" shows the same IDs on both devices, shared storage is working correctly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StorageDiagnostic;
