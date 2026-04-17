"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Brain, 
  PenTool, 
  Image as ImageIcon, 
  RefreshCw, 
  Rocket, 
  CheckCircle2, 
  Star, 
  Loader2, 
  LayoutDashboard, 
  Settings, 
  History,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  AgentStatus, 
  WorkflowState, 
} from '../types';
import { geminiService } from '../services/geminiService';
import { supabase } from '../lib/supabase';
import { wahaService } from '../services/wahaService';
import { agentService } from '../services/agentService';

const STEPS = [
  { id: 1, name: 'Keyword Agent', icon: Search, color: 'text-blue-600' },
  { id: 2, name: 'Strategy Output', icon: Brain, color: 'text-purple-600' },
  { id: 3, name: 'Writing Agent', icon: PenTool, color: 'text-emerald-600' },
  { id: 4, name: 'Image Agent', icon: ImageIcon, color: 'text-orange-600' },
  { id: 5, name: 'Revision Agent', icon: RefreshCw, color: 'text-pink-600' },
  { id: 6, name: 'SEO Optimization', icon: Rocket, color: 'text-indigo-600' },
  { id: 7, name: 'Publish Agent', icon: CheckCircle2, color: 'text-cyan-600' },
  { id: 8, name: 'Rating Agent', icon: Star, color: 'text-yellow-600' },
];

// JSON Helper untuk LangGraph VPS
const parseAgentOutput = (raw: string | undefined | null, stepName: string) => {
  if (!raw) return undefined;
  if (typeof raw !== 'string') return raw;
  try {
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn(`Failed to parse ${stepName} output JSON. Falling back to raw text.`);
    // Jika gagal di-parse, berarti LLM membalas dengan teks biasa (bukan JSON)
    // Kita bungkus teks biasa tersebut ke dalam struktur yang aman untuk ditampilkan
    if (stepName === 'writing') {
      return {
        title: "Draf Artikel (Raw Text)",
        intro: "",
        sections: [{ heading: "Konten", content: raw }],
        closing: "",
        cta: ""
      };
    } else if (stepName === 'strategy') {
      return { goal: "Raw Output", painPoints: [], uniqueAngle: "Raw Output", ctaDirection: "", structure: [raw] };
    } else if (stepName === 'keyword') {
      return { primaryKeyword: "Raw Keyword", secondaryKeywords: [], searchIntent: "", targetAudience: "", keywordAngle: "", recommendedTitles: [raw] };
    }
    return { raw };
  }
};

export default function Home() {
  const [activeView, setActiveView] = useState<'dashboard' | 'history' | 'settings' | 'login' | 'signup'>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [state, setState] = useState<WorkflowState>({
    currentStep: 0,
    niche: '',
    targetMarket: '',
    results: {},
    statuses: Array(8).fill(AgentStatus.IDLE),
  });
  const [history, setHistory] = useState<any[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) fetchHistory();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) fetchHistory();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setHistory(data);
    if (error) console.error('Error fetching history:', error);
  };

  const updateStatus = (stepIndex: number, status: AgentStatus) => {
    setState(prev => {
      const newStatuses = [...prev.statuses];
      newStatuses[stepIndex] = status;
      return { ...prev, statuses: newStatuses };
    });
  };

  const processAgentResponse = async (response: any, phone: string | undefined) => {
    if (response && response.state) {
      const parsedResults = {
        keyword: parseAgentOutput(response.state.results.keyword, 'keyword'),
        strategy: parseAgentOutput(response.state.results.strategy, 'strategy'),
        writing: parseAgentOutput(response.state.results.writing, 'writing'),
        image: parseAgentOutput(response.state.results.image, 'image'),
        revision: parseAgentOutput(response.state.results.revision, 'revision'),
        seo: parseAgentOutput(response.state.results.seo, 'seo'),
        publish: parseAgentOutput(response.state.results.publish, 'publish'),
        rating: parseAgentOutput(response.state.results.rating, 'rating'),
      };

      const currentStepStr = response.state.current_step;
      const stepMapping: Record<string, number> = {
        "keyword": 1, "strategy": 2, "writing": 3, "image": 4, 
        "revision": 5, "seo": 6, "publish": 7, "rating": 8, "end": 8
      };
      // Jika di-pause setelah writing, kita ada di step 3
      let newStep = stepMapping[currentStepStr] || 8;
      if (response.is_paused) {
        newStep = 3; // Menyesuaikan dengan pause point di main.py (setelah writing)
      }

      setState(prev => ({
        ...prev,
        results: parsedResults,
        statuses: Array(8).fill(AgentStatus.IDLE).map((_, i) => i < newStep ? AgentStatus.COMPLETED : AgentStatus.IDLE),
        currentStep: newStep,
        thread_id: response.thread_id,
        isPaused: response.is_paused
      }));

      if (!response.is_paused && phone && parsedResults.writing) {
        try {
          await wahaService.sendNotification(phone, `✅ Artikel Berhasil Dihasilkan: ${parsedResults.writing.title}`);
        } catch (e) {
          console.warn("Gagal mengirim notifikasi WA akhir...", e);
        }
      }

      // Save to Supabase History jika sudah selesai
      if (!response.is_paused) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && parsedResults.writing) {
          await supabase.from('articles').insert({
            user_id: user.id,
            title: parsedResults.writing.title,
            niche: state.niche,
            content: parsedResults.writing,
            seo_data: parsedResults.seo || {},
            status: 'published'
          });
          fetchHistory();
        }
      }
    } else {
      throw new Error("Invalid response from agent");
    }
  };

  const runWorkflow = async () => {
    if (!state.niche || !state.targetMarket) {
      setError('Mohon isi Niche dan Target Market terlebih dahulu.');
      return;
    }

    setError(null);
    setIsStarted(true);
    setLoading(true);
    setState(prev => ({ ...prev, currentStep: 1, isPaused: false }));

    try {
      const phone = process.env.NEXT_PUBLIC_NOTIFICATION_PHONE;
      if (phone) {
        try {
          await wahaService.sendNotification(phone, `🚀 Memulai Workflow WINNER via LangGraph VPS\nNiche: ${state.niche}\nTarget: ${state.targetMarket}`);
        } catch (e) {
          console.warn("Gagal mengirim notifikasi WA awal, lanjut proses...", e);
        }
      }

      setState(prev => ({ 
        ...prev, 
        statuses: prev.statuses.map((_, i) => i === 0 ? AgentStatus.RUNNING : AgentStatus.IDLE) 
      }));

      const response = await agentService.runLangGraphAgent("start", {
        niche: state.niche,
        target_market: state.targetMarket
      });

      await processAgentResponse(response, phone);

    } catch (err: any) {
      console.error('Workflow Error:', err);
      setError(`Terjadi kesalahan pada VPS: ${err.message || 'Unknown Error'}`);
      setIsStarted(false);
    } finally {
      setLoading(false);
    }
  };

  const resumeWorkflow = async (action: 'APPROVE' | 'REVISE') => {
    if (!state.thread_id) return;
    setError(null);
    setLoading(true);
    setState(prev => ({ ...prev, isPaused: false })); // Hilangkan pause sementara

    try {
      const phone = process.env.NEXT_PUBLIC_NOTIFICATION_PHONE;
      const response = await agentService.runLangGraphAgent("resume", {
        thread_id: state.thread_id,
        user_action: action,
        feedback: feedback
      });
      setFeedback(''); // reset
      await processAgentResponse(response, phone);
    } catch (err: any) {
      console.error('Resume Error:', err);
      setError(`Gagal melanjutkan agen: ${err.message || 'Unknown Error'}`);
    } finally {
      setLoading(false);
    }
  };


  const handleStart = () => {
    if (!isAuthenticated) {
      setActiveView('signup');
      return;
    }
    runWorkflow();
  };

  return (
    <div className="min-h-screen font-sans selection:bg-primary/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-[70px] bg-panel/20 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/50">
            <Rocket className="w-6 h-6 text-bg" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white italic">WINNER</h1>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-text-muted">
          <button 
            onClick={() => {
              setActiveView('dashboard');
              if (!isAuthenticated) setIsStarted(false);
            }}
            className={cn(activeView === 'dashboard' ? "text-primary border-b-2 border-primary pb-1" : "hover:text-white transition-colors")}
          >
            Home
          </button>
          <button className="hover:text-white transition-colors">What We Do</button>
          <button className="hover:text-white transition-colors">Services</button>
          <button className="hover:text-white transition-colors">Portfolio</button>
          <button className="hover:text-white transition-colors">Contact</button>
        </nav>
        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <>
              <button 
                onClick={() => setActiveView('login')}
                className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white transition-colors"
              >
                Login
              </button>
              <button 
                onClick={() => setActiveView('signup')}
                className="px-5 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary transition-all"
              >
                Sign Up
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <button 
                onClick={async () => {
                  await supabase.auth.signOut();
                  setIsAuthenticated(false);
                  setActiveView('dashboard');
                  setIsStarted(false);
                }}
                className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-red-400 transition-colors"
              >
                Logout
              </button>
              <button className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-white transition-all">Profile</button>
            </div>
          )}
        </div>
      </header>

      {/* Sidebar */}
      {isAuthenticated && (
        <aside className="fixed left-0 top-[70px] h-[calc(100vh-70px)] w-[240px] bg-panel/10 backdrop-blur-md border-r border-white/10 py-6 hidden lg:flex flex-col">
          <div className="px-4 mb-8">
            <nav className="space-y-2">
              <NavItem 
                icon={LayoutDashboard} 
                label="Dashboard" 
                active={activeView === 'dashboard'} 
                onClick={() => setActiveView('dashboard')}
              />
              <NavItem 
                icon={History} 
                label="History" 
                active={activeView === 'history'} 
                onClick={() => setActiveView('history')}
              />
              <NavItem 
                icon={Settings} 
                label="Settings" 
                active={activeView === 'settings'} 
                onClick={() => setActiveView('settings')}
              />
            </nav>
          </div>

          <div className="px-4 mb-4">
            <p className="px-4 text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Workflow Steps</p>
          </div>
          <nav className="flex-1 overflow-y-auto custom-scrollbar px-2">
            {STEPS.map((step, idx) => (
              <StepItem 
                key={step.id}
                step={step}
                status={state.statuses[idx]}
                active={state.currentStep === step.id && activeView === 'dashboard'}
                onClick={() => {
                  setActiveView('dashboard');
                  setState(s => ({ ...s, currentStep: step.id }));
                }}
              />
            ))}
          </nav>

          <div className="px-6 py-6 border-t border-white/10">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex justify-between items-end mb-2">
                <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold">System Load</p>
                <p className="text-[9px] text-primary font-bold">32%</p>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '32%' }}
                  className="h-full bg-primary shadow-[0_0_10px_rgba(0,242,254,0.5)]" 
                />
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={cn("pt-[70px] min-h-screen", isAuthenticated && "lg:ml-[240px]")}>
        {activeView === 'login' ? (
          <LoginView 
            onLogin={() => { setIsAuthenticated(true); setActiveView('dashboard'); }} 
            onSwitchToSignup={() => setActiveView('signup')}
          />
        ) : activeView === 'signup' ? (
          <SignupView 
            onSignup={() => { setIsAuthenticated(true); setActiveView('dashboard'); }} 
            onSwitchToLogin={() => setActiveView('login')}
          />
        ) : activeView === 'history' ? (
          <div className="p-10 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black italic tracking-tighter mb-8 text-primary">ARTICLE HISTORY</h2>
            {history.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {history.map((art) => (
                  <div key={art.id} className="glass-panel rounded-3xl p-6 border border-white/10 hover:border-primary/50 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{art.niche}</p>
                        <h3 className="text-lg font-bold text-white leading-tight">{art.title}</h3>
                      </div>
                      <span className="px-3 py-1 bg-success/10 text-success text-[9px] font-black uppercase rounded-full border border-success/20">
                        {art.status}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mb-6 line-clamp-3">{art.content?.intro}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-[9px] font-bold text-white/20 uppercase">{new Date(art.created_at).toLocaleDateString()}</span>
                      <button className="text-[10px] font-black text-primary uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-2">
                        View Article <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-20 text-center">
                <History className="w-16 h-16 text-white/20 mx-auto mb-6" />
                <p className="text-text-muted font-medium">Belum ada riwayat artikel. Mulai buat artikel pertama Anda!</p>
              </div>
            )}
          </div>
        ) : activeView === 'settings' ? (
          <div className="p-10 max-w-5xl mx-auto">
            <h2 className="text-3xl font-black italic tracking-tighter mb-8 text-primary">SETTINGS</h2>
            <div className="glass-panel rounded-3xl p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block">AI Model Preference</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors">
                    <option className="bg-bg">Gemini 1.5 Pro (Writing)</option>
                    <option className="bg-bg">Gemini 1.5 Flash (Analysis)</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block">Default Language</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors">
                    <option className="bg-bg">Bahasa Indonesia</option>
                    <option className="bg-bg">English</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ) : !isStarted ? (
          <LandingView 
            niche={state.niche}
            targetMarket={state.targetMarket}
            setNiche={(v: string) => setState(s => ({ ...s, niche: v }))}
            setTargetMarket={(v: string) => setState(s => ({ ...s, targetMarket: v }))}
            onStart={handleStart}
            error={error}
          />
        ) : (
          <div className="p-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            {/* Agent Output */}
            <div className="space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={state.currentStep}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="glass-panel rounded-[2.5rem] p-10 shadow-2xl min-h-[600px] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32" />
                  
                  <header className="flex items-center justify-between mb-10 pb-6 border-b border-white/10 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 shadow-inner", STEPS[state.currentStep - 1]?.color.replace('text-', 'text-'))}>
                        {(() => {
                          const Icon = STEPS[state.currentStep - 1]?.icon || Rocket;
                          return <Icon className="w-6 h-6" />;
                        })()}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Step {state.currentStep}</p>
                        <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">
                          {STEPS[state.currentStep - 1]?.name}
                        </h2>
                      </div>
                    </div>
                    {state.statuses[state.currentStep - 1] === AgentStatus.RUNNING && (
                      <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full text-[10px] font-black text-primary uppercase tracking-widest border border-primary/20">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Processing
                      </div>
                    )}
                  </header>

                  <div className="space-y-6">
                    {renderStepOutput(state, feedback, setFeedback, resumeWorkflow)}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Panel */}
            <div className="space-y-6">
              <div className="bg-panel rounded-lg border border-border p-6 shadow-sm text-center">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Global Status</h3>
                <div className="w-20 h-20 rounded-full border-[6px] border-success flex items-center justify-center mx-auto mb-2 text-xl font-extrabold text-success">
                  {state.results.rating?.seoScore || 82}%
                </div>
                <p className="text-[10px] text-text-muted font-medium">System Performance Score</p>
              </div>

              {state.results.rating && (
                <div className="bg-panel rounded-lg border border-border p-6 shadow-sm">
                  <header className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                    <Star className="w-4 h-4 text-accent" />
                    <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">Rating Feedback</h2>
                  </header>
                  <ul className="space-y-2">
                    <li className="flex items-center justify-between text-xs py-1 border-b border-border">
                      <span className="text-text-muted">SEO Score</span>
                      <span className="font-bold text-success">{state.results.rating.seoScore}/100</span>
                    </li>
                    <li className="flex items-center justify-between text-xs py-1 border-b border-border">
                      <span className="text-text-muted">Readability</span>
                      <span className="font-bold text-success">High</span>
                    </li>
                    <li className="flex items-center justify-between text-xs py-1 border-b border-border">
                      <span className="text-text-muted">Conversion</span>
                      <span className="font-bold text-success">Found</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-3 bg-amber-50 rounded border border-amber-100 text-[11px] text-amber-800">
                    <strong>Suggestion:</strong> {state.results.rating.improvementSuggestions?.[0] || 'Keep up the good work!'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Sub-components
interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavItem({ icon: Icon, label, active = false, onClick }: NavItemProps) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
        active ? "bg-primary text-bg shadow-[0_0_20px_rgba(0,242,254,0.3)]" : "text-text-muted hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className={cn("w-4 h-4 relative z-10", active ? "text-bg" : "text-slate-500 group-hover:text-primary")} />
      <span className="text-[11px] font-black uppercase tracking-widest relative z-10">{label}</span>
      {active && <motion.div layoutId="nav-active" className="absolute inset-0 bg-primary" />}
    </button>
  );
}

interface StepItemProps {
  step: { id: number; name: string; icon: React.ElementType; color: string };
  status: AgentStatus;
  active: boolean;
  onClick: () => void;
}

const StepItem: React.FC<StepItemProps> = ({ step, status, active, onClick }) => {
  const Icon = step.icon;
  const idx = STEPS.findIndex(s => s.id === step.id) + 1;
  
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-6 py-3 text-left transition-all duration-300 border-l-4 group",
        active 
          ? "bg-primary/10 border-primary text-primary" 
          : "bg-transparent border-transparent text-text-muted hover:bg-white/5 hover:text-white"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-xl border flex items-center justify-center text-[11px] font-black shrink-0 transition-all",
        status === AgentStatus.COMPLETED 
          ? "bg-success border-success text-bg shadow-[0_0_15px_rgba(0,245,212,0.4)]" 
          : active 
            ? "border-primary text-primary shadow-[0_0_10px_rgba(0,242,254,0.3)]" 
            : "border-white/10 text-text-muted group-hover:border-primary/50"
      )}>
        {status === AgentStatus.COMPLETED ? <CheckCircle2 className="w-4 h-4" /> : idx}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black uppercase tracking-widest truncate">{step.name}</p>
      </div>
      {status === AgentStatus.RUNNING && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
    </button>
  );
}

function LandingView({ niche, targetMarket, setNiche, setTargetMarket, onStart, error }: any) {
  return (
    <div className="relative min-h-[calc(100vh-70px)] flex items-center justify-center overflow-hidden py-20 px-6">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/20 blur-[150px] rounded-full animate-pulse delay-700" />
      
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-left space-y-8"
        >
          <div className="space-y-2">
            <p className="text-[12px] font-black text-primary uppercase tracking-[0.4em]">Boost your own awesome website</p>
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white leading-[0.9] uppercase">
              Be Seen. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Be Chosen !</span>
            </h1>
          </div>
          
          <p className="text-lg text-text-muted max-w-lg leading-relaxed font-medium">
            Platform multi-agent profesional untuk menghasilkan, mereview, dan mempublikasikan artikel SEO berkualitas tinggi secara otomatis.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative"
        >
          <div className="glass-panel rounded-[3rem] p-10 shadow-2xl relative z-10 space-y-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block ml-1">Niche Artikel</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Desain Interior Cafe"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-white/20"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] block ml-1">Target Market</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Owner Cafe, Developer"
                  value={targetMarket}
                  onChange={(e) => setTargetMarket(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-white/20"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 text-red-400 text-xs bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-center pt-4">
              <button 
                onClick={onStart}
                className="w-32 h-32 rounded-full bg-success text-bg font-black text-xl uppercase tracking-tighter shadow-[0_0_40px_rgba(0,245,212,0.4)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center group relative"
              >
                <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" />
                Start
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function renderStepOutput(
  state: WorkflowState, 
  feedback: string, 
  setFeedback: (v: string) => void, 
  resumeWorkflow: (action: 'APPROVE' | 'REVISE') => void
) {
  const { currentStep, results } = state;

  if (currentStep === 1 && results.keyword) {
    const k = results.keyword;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <DataBox label="Primary Keyword" value={k.primaryKeyword} />
          <DataBox label="Search Intent" value={k.searchIntent} />
        </div>
        <DataBox label="Target Audience" value={k.targetAudience} />
        <DataBox label="Keyword Angle" value={k.keywordAngle} />
        <div>
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3 block">Recommended Titles</label>
          <div className="space-y-2">
            {k.recommendedTitles?.map((t: string, i: number) => (
              <div key={i} className="p-3 bg-white/5 rounded border border-white/10 text-xs text-white">
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 2 && results.strategy) {
    const s = results.strategy;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <DataBox label="Goal Artikel" value={s.goal} />
          <DataBox label="Unique Angle" value={s.uniqueAngle} />
        </div>
        <DataBox label="CTA Direction" value={s.ctaDirection} />
        <div>
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3 block">Pain Points</label>
          <div className="flex flex-wrap gap-2">
            {s.painPoints?.map((p: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[10px] font-bold">
                {p}
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3 block">Struktur Artikel</label>
          <div className="space-y-2">
            {s.structure?.map((st: string, i: number) => (
              <div key={i} className="flex items-center gap-3 text-xs text-text-muted">
                <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-white">{i + 1}</div>
                {st}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentStep >= 3 && results.writing) {
    const w = results.writing;
    return (
      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
        <h4 className="text-xl font-bold text-white">{w.title}</h4>
        <p className="text-text-muted text-sm leading-relaxed italic border-l-2 border-primary pl-4">{w.intro}</p>
        <div className="space-y-8">
          {w.sections?.map((sec: any, i: number) => (
            <div key={i} className="space-y-3">
              <h5 className="text-base font-bold text-white">{sec.heading}</h5>
              <div className="text-text-muted text-sm leading-relaxed space-y-4">
                {sec.content?.split('\n')?.map((p: string, pi: number) => (
                  <p key={pi}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 bg-primary/5 border border-primary/10 rounded-lg">
          <p className="text-white text-sm mb-4">{w.closing}</p>
          <button className="px-6 py-2 bg-primary text-bg rounded font-bold text-xs shadow-md shadow-primary/10">
            {w.cta}
          </button>
        </div>

        {/* Human in the loop Pause UI */}
        {state.isPaused && (
          <div className="mt-8 p-6 bg-white/5 border-2 border-primary/50 rounded-2xl">
            <h3 className="text-primary font-bold text-lg mb-2">Tinjauan Manual Diperlukan</h3>
            <p className="text-text-muted text-sm mb-4">Agen telah selesai menulis draf awal. Silakan review artikel di atas. Apakah Anda ingin melanjutkan publikasi atau merevisi?</p>
            <div className="space-y-4">
              <textarea 
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50"
                placeholder="Catatan revisi (opsional)... misal: 'Tolong buat paragraf pertama lebih panjang'"
                rows={3}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              />
              <div className="flex gap-4">
                <button 
                  onClick={() => resumeWorkflow('REVISE')}
                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-bold hover:bg-white/10 transition"
                >
                  Revisi
                </button>
                <button 
                  onClick={() => resumeWorkflow('APPROVE')}
                  className="flex-1 py-3 bg-primary text-bg rounded-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition"
                >
                  Approve & Lanjut
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-10 text-center space-y-4">
      <CheckCircle2 className="w-16 h-16 text-success opacity-50" />
      <p className="text-text-muted font-medium">Proses agen selesai. Data tersimpan di database.</p>
    </div>
  );
}


function DataBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
      <label className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-2 block">{label}</label>
      <p className="text-xs text-white font-bold leading-relaxed">{value}</p>
    </div>
  );
}

function LoginView({ onLogin, onSwitchToSignup }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else onLogin();
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-70px)] flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-panel rounded-[2.5rem] p-10 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase">Welcome Back</h2>
          <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Login to your WINNER account</p>
        </div>
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white"
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white"
          />
        </div>
        {error && <p className="text-red-400 text-[10px] font-bold uppercase text-center">{error}</p>}
        <button 
          onClick={handleLogin} 
          disabled={loading}
          className="w-full py-4 bg-primary text-bg font-black uppercase tracking-widest rounded-2xl"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
        <div className="text-center">
          <button onClick={onSwitchToSignup} className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Don't have an account? <span className="text-primary underline">Sign Up</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SignupView({ onSignup, onSwitchToLogin }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { full_name: fullName } }
    });
    if (error) setError(error.message);
    else onSignup();
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-70px)] flex items-center justify-center p-6">
      <div className="max-w-md w-full glass-panel rounded-[2.5rem] p-10 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase">Create Account</h2>
          <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Join the WINNER ecosystem</p>
        </div>
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Full Name" 
            value={fullName} 
            onChange={e => setFullName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white"
          />
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white"
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white"
          />
        </div>
        {error && <p className="text-red-400 text-[10px] font-bold uppercase text-center">{error}</p>}
        <button 
          onClick={handleSignup} 
          disabled={loading}
          className="w-full py-4 bg-accent text-bg font-black uppercase tracking-widest rounded-2xl"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
        <div className="text-center">
          <button onClick={onSwitchToLogin} className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Already have an account? <span className="text-accent underline">Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
