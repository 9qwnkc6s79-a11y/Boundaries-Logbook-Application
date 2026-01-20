
import React, { useState, useEffect } from 'react';
import { X, Activity, Database, Users, ClipboardList, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, Cloud, Server } from 'lucide-react';

declare const firebase: any;

interface DiagnosticResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  message: string;
  data?: any;
}

const firebaseConfig = {
  apiKey: "AIzaSyDbOuTQGRW2LtQUpRFHmcXj782Zp4tEKvQ",
  authDomain: "boundaries-logbook-app.firebaseapp.com",
  projectId: "boundaries-logbook-app",
  storageBucket: "boundaries-logbook-app.firebasestorage.app",
  messagingSenderId: "240460663130",
  appId: "1:240460663130:web:8976e8a967f8a101898b63"
};

const FirebaseDiagnostic: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const report: DiagnosticResult[] = [];

    try {
      // 1. Check if firebase is available on window
      if (typeof firebase === 'undefined') {
        throw new Error('Global "firebase" object is not defined. Check index.html script tags.');
      }

      // 2. Initialize/Retrieve Firebase Instance
      const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
      const firestore = app.firestore();
      
      report.push({
        step: 'Global API Check',
        status: 'PASS',
        message: 'Global Firebase object detected and initialized.'
      });

      // 3. Write Test Document
      const testId = `test_${Date.now()}`;
      const testDocRef = firestore.collection('diagnostics').doc(testId);
      const testPayload = { 
        timestamp: new Date().toISOString(), 
        ping: 'pong', 
        source: 'Global SDK Diagnostic' 
      };
      
      try {
        await testDocRef.set(testPayload);
        report.push({
          step: 'Cloud Write Access',
          status: 'PASS',
          message: 'Successfully wrote test document to Firestore.'
        });
      } catch (e: any) {
        report.push({
          step: 'Cloud Write Access',
          status: 'FAIL',
          message: `Firestore Write Failed: ${e.message}`
        });
        throw e;
      }

      // 4. Read Test Document Back
      const readSnap = await testDocRef.get();
      if (readSnap.exists && readSnap.data()?.ping === 'pong') {
        report.push({
          step: 'Cloud Read Access',
          status: 'PASS',
          message: 'Successfully retrieved test document back from Firestore.'
        });
      } else {
        report.push({
          step: 'Cloud Read Access',
          status: 'FAIL',
          message: 'Document read failed or data mismatch.'
        });
      }

      // 5. Check Production Documents
      const usersSnap = await firestore.collection('appData').doc('users').get();
      const userList = usersSnap.exists ? (usersSnap.data()?.data || []) : [];
      
      report.push({
        step: 'Users Registry Check',
        status: usersSnap.exists ? 'PASS' : 'PENDING',
        message: usersSnap.exists 
          ? `Found ${userList.length} users in "appData/users".` 
          : 'No users document found in "appData/users".',
        data: { count: userList.length }
      });

      const subsSnap = await firestore.collection('appData').doc('submissions').get();
      const subList = subsSnap.exists ? (subsSnap.data()?.data || []) : [];
      
      report.push({
        step: 'Submissions Audit',
        status: subsSnap.exists ? 'PASS' : 'PENDING',
        message: subsSnap.exists 
          ? `Found ${subList.length} total shift submissions.` 
          : 'No submissions document found in "appData/submissions".',
        data: { count: subList.length }
      });

    } catch (err: any) {
      report.push({
        step: 'Critical Error',
        status: 'FAIL',
        message: `Diagnostics aborted: ${err.message}`
      });
    }

    setResults(report);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-[#001F3F]/95 backdrop-blur-xl text-white p-6 overflow-y-auto flex flex-col font-sans">
      <div className="max-w-3xl mx-auto w-full space-y-8 pb-20">
        <div className="flex justify-between items-center border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-2xl shadow-lg">
              <Cloud size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Firebase Sync Health</h2>
              <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest">Global SDK Architecture Audit</p>
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
                  <Server size={16} /> {res.step}
                </h3>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                  res.status === 'PASS' ? 'bg-green-500/20 text-green-400' : res.status === 'FAIL' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {res.status === 'PASS' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {res.status}
                </span>
              </div>
              <p className="text-sm font-medium text-white/70 leading-relaxed mb-2">{res.message}</p>
              
              {res.data && (
                <div className="bg-black/40 rounded-xl p-4 overflow-hidden">
                  <pre className="text-[12px] text-blue-300 font-mono">
                    {JSON.stringify(res.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}

          {results.length === 0 && isRunning && (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <RefreshCw className="animate-spin text-blue-400" size={48} />
              <p className="font-black text-sm uppercase tracking-[0.2em] animate-pulse">Connecting to Firebase...</p>
            </div>
          )}
        </div>

        <div className="pt-8 flex flex-col items-center gap-4">
          <button 
            onClick={runDiagnostics}
            disabled={isRunning}
            className="px-10 py-5 bg-white text-[#001F3F] rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            <RefreshCw size={18} className={isRunning ? 'animate-spin' : ''} />
            Re-Run Firebase Probes
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirebaseDiagnostic;
