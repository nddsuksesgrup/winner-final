import React, { useState } from 'react';
import { Globe, Key, User, CheckCircle2, Loader2, Info } from 'lucide-react';

export function SettingsView() {
  const [wpUrl, setWpUrl] = useState('');
  const [wpUser, setWpUser] = useState('');
  const [wpAppPassword, setWpAppPassword] = useState('');
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult('idle');
    // Simulate API call
    setTimeout(() => {
      setIsTesting(false);
      setTestResult('success');
    }, 2000);
  };

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h2 className="text-3xl font-black italic tracking-tighter mb-8 text-white uppercase">Pengaturan</h2>
      
      <div className="glass-panel rounded-[2rem] p-10">
        <header className="mb-8 border-b border-white/10 pb-6">
          <h3 className="text-xl font-black text-white flex items-center gap-3">
            <Globe className="w-6 h-6 text-primary" /> 
            Integrasi WordPress (CMS)
          </h3>
          <p className="text-sm text-text-muted mt-2">
            Hubungkan agen LangGraph langsung ke website Anda untuk publikasi artikel otomatis setelah Anda klik Approve.
          </p>
        </header>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">URL Website</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="url"
                  placeholder="https://domainanda.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                  value={wpUrl}
                  onChange={e => setWpUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Username WordPress</label>
              <div className="relative">
                <User className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="admin"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                  value={wpUser}
                  onChange={e => setWpUser(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1 flex items-center justify-between">
              <span>Application Password</span>
              <a href="#" className="text-primary hover:underline flex items-center gap-1">
                <Info className="w-3 h-3" /> Cara mendapatkan password ini
              </a>
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="password"
                placeholder="xxxx xxxx xxxx xxxx"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                value={wpAppPassword}
                onChange={e => setWpAppPassword(e.target.value)}
              />
            </div>
            <p className="text-xs text-text-muted mt-2">
              Peringatan: Jangan gunakan password login asli Anda. Gunakan fitur Application Passwords di menu Users &gt; Profile WordPress Anda.
            </p>
          </div>

          <div className="pt-6 mt-6 border-t border-white/10 flex items-center gap-4">
            <button 
              onClick={handleTestConnection}
              disabled={isTesting || !wpUrl || !wpUser || !wpAppPassword}
              className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isTesting ? 'Menghubungi...' : 'Test Koneksi'}
            </button>
            <button className="px-8 py-3 bg-primary text-bg rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,242,254,0.2)] hover:shadow-[0_0_30px_rgba(0,242,254,0.4)] transition-all">
              Simpan Pengaturan
            </button>
          </div>

          {testResult === 'success' && (
            <div className="mt-4 p-4 bg-success/10 border border-success/20 rounded-xl flex items-center gap-3 text-success text-sm font-medium">
              <CheckCircle2 className="w-5 h-5" />
              Berhasil! Agen LangGraph sukses terhubung dengan WordPress Anda via REST API.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
