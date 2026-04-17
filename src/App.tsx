import React, { useState } from 'react';
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
import { cn } from './lib/utils';
import { 
  AgentStatus, 
  WorkflowState, 
} from './types';
import { geminiService } from './services/geminiService';

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

export default function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'history' | 'settings' | 'login' | 'signup'>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [state, setState] = useState<WorkflowState>({
    currentStep: 0,
    niche: '',
    targetMarket: '',
    results: {},
    statuses: Array(8).fill(AgentStatus.IDLE),
  });

  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = (stepIndex: number, status: AgentStatus) => {
    setState(prev => {
      const newStatuses = [...prev.statuses];
      newStatuses[stepIndex] = status;
      return { ...prev, statuses: newStatuses };
    });
  };

  const runWorkflow = async () => {
    if (!state.niche || !state.targetMarket) {
      setError('Mohon isi Niche dan Target Market terlebih dahulu.');
      return;
    }

    setError(null);
    setIsStarted(true);
    setState(prev => ({ ...prev, currentStep: 1 }));

    try {
      // Step 1: Keyword Agent
      updateStatus(0, AgentStatus.RUNNING);
      const keyword = await geminiService.runKeywordAgent(state.niche, state.targetMarket);
      setState(prev => ({ ...prev, results: { ...prev.results, keyword }, currentStep: 2 }));
      updateStatus(0, AgentStatus.COMPLETED);

      // Step 2: Strategy Agent
      updateStatus(1, AgentStatus.RUNNING);
      const strategy = await geminiService.runStrategyAgent(keyword);
      setState(prev => ({ ...prev, results: { ...prev.results, strategy }, currentStep: 3 }));
      updateStatus(1, AgentStatus.COMPLETED);

      // Step 3: Writing Agent
      updateStatus(2, AgentStatus.RUNNING);
      const writing = await geminiService.runWritingAgent(strategy);
      setState(prev => ({ ...prev, results: { ...prev.results, writing }, currentStep: 4 }));
      updateStatus(2, AgentStatus.COMPLETED);

      // Step 4: Image Agent
      updateStatus(3, AgentStatus.RUNNING);
      const image = await geminiService.runImageAgent(writing);
      setState(prev => ({ ...prev, results: { ...prev.results, image }, currentStep: 5 }));
      updateStatus(3, AgentStatus.COMPLETED);

      // Step 5: Revision Agent
      updateStatus(4, AgentStatus.RUNNING);
      const revision = await geminiService.runRevisionAgent(writing, image);
      setState(prev => ({ ...prev, results: { ...prev.results, revision }, currentStep: 6 }));
      updateStatus(4, AgentStatus.COMPLETED);

      // Step 6: SEO Agent
      updateStatus(5, AgentStatus.RUNNING);
      const seo = await geminiService.runSEOAgent(writing);
      setState(prev => ({ ...prev, results: { ...prev.results, seo }, currentStep: 7 }));
      updateStatus(5, AgentStatus.COMPLETED);

      // Step 7: Publish Agent
      updateStatus(6, AgentStatus.RUNNING);
      const publish = await geminiService.runPublishAgent({ writing, image, seo });
      setState(prev => ({ ...prev, results: { ...prev.results, publish }, currentStep: 8 }));
      updateStatus(6, AgentStatus.COMPLETED);

      // Step 8: Rating Agent
      updateStatus(7, AgentStatus.RUNNING);
      const rating = await geminiService.runRatingAgent({ writing, image, seo, publish });
      setState(prev => ({ ...prev, results: { ...prev.results, rating } }));
      updateStatus(7, AgentStatus.COMPLETED);

    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan saat menjalankan agent. Silakan coba lagi.');
      setIsStarted(false);
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
    <div className="min-h-screen bg-bg text-text-main font-sans selection:bg-primary/30">
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
            <button className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-white transition-all">Profile</button>
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
            <div className="glass-panel rounded-3xl p-20 text-center">
              <History className="w-16 h-16 text-white/20 mx-auto mb-6" />
              <p className="text-text-muted font-medium">Belum ada riwayat artikel. Mulai buat artikel pertama Anda!</p>
            </div>
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
                    {renderStepOutput(state)}
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
                    <strong>Suggestion:</strong> {state.results.rating.improvementSuggestions[0]}
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
      {/* Background Decorative Elements */}
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

          <div className="flex items-center gap-8 text-white/40 text-[11px] font-black uppercase tracking-widest">
            <div className="flex flex-col gap-1"><span>01</span><div className="w-8 h-0.5 bg-primary" /></div>
            <div className="flex flex-col gap-1"><span>02</span><div className="w-8 h-0.5 bg-white/10" /></div>
            <div className="flex flex-col gap-1"><span>03</span><div className="w-8 h-0.5 bg-white/10" /></div>
            <div className="flex flex-col gap-1"><span>04</span><div className="w-8 h-0.5 bg-white/10" /></div>
          </div>
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

          {/* Floating 3D-like elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent rounded-full blur-[80px] opacity-50" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary rounded-full blur-[100px] opacity-50" />
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({ label }: { label: string }) {
  return (
    <div className="p-4 bg-slate-800/20 rounded-2xl border border-slate-800/50 text-sm font-medium text-slate-400">
      {label}
    </div>
  );
}

function renderStepOutput(state: WorkflowState) {
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
            {k.recommendedTitles.map((t, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded border border-border text-xs text-text-main">
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
            {s.painPoints.map((p, i) => (
              <span key={i} className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded text-[10px] font-bold">
                {p}
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3 block">Struktur Artikel</label>
          <div className="space-y-2">
            {s.structure.map((st, i) => (
              <div key={i} className="flex items-center gap-3 text-xs text-text-muted">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-text-main">{i + 1}</div>
                {st}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 3 && results.writing) {
    const w = results.writing;
    return (
      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
        <h4 className="text-xl font-bold text-text-main">{w.title}</h4>
        <p className="text-text-muted text-sm leading-relaxed italic border-l-2 border-primary pl-4">{w.intro}</p>
        <div className="space-y-8">
          {w.sections.map((sec, i) => (
            <div key={i} className="space-y-3">
              <h5 className="text-base font-bold text-text-main">{sec.heading}</h5>
              <div className="text-text-muted text-sm leading-relaxed space-y-4">
                {sec.content.split('\n').map((p, pi) => (
                  <p key={pi}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 bg-primary/5 border border-primary/10 rounded-lg">
          <p className="text-text-main text-sm mb-4">{w.closing}</p>
          <button className="px-6 py-2 bg-primary text-white rounded font-bold text-xs shadow-md shadow-primary/10">
            {w.cta}
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 4 && results.image) {
    const img = results.image;
    return (
      <div className="space-y-6">
        <div className="p-4 bg-slate-50 rounded border border-border">
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-2 block">Featured Image Prompt</label>
          <p className="text-xs text-text-main leading-relaxed">{img.featuredImagePrompt}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <DataBox label="SEO Filename" value={img.seo.filename} />
          <DataBox label="Alt Text" value={img.seo.altText} />
        </div>
        <div>
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3 block">Section Image Prompts</label>
          <div className="space-y-3">
            {img.sectionImagePrompts.map((p, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded border border-border text-[11px] text-text-muted">
                <span className="font-bold text-primary mr-2">Section {i + 1}:</span> {p}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 5 && results.revision) {
    const r = results.revision;
    return (
      <div className="space-y-8">
        <div className={cn(
          "p-6 rounded-lg border flex items-center justify-between",
          r.status === 'LULUS' ? "bg-success/5 border-success/20" : "bg-red-50 border-red-100"
        )}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Status Akhir</p>
            <h4 className={cn("text-2xl font-black", r.status === 'LULUS' ? "text-success" : "text-red-600")}>
              {r.status}
            </h4>
          </div>
          {r.status === 'LULUS' ? <CheckCircle2 className="w-10 h-10 text-success" /> : <RefreshCw className="w-10 h-10 text-red-500" />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <CheckItem label="Grammar & Spelling" checked={r.checklist.grammar} />
          <CheckItem label="Flow & Readability" checked={r.checklist.flow} />
          <CheckItem label="Natural Tone" checked={r.checklist.natural} />
          <CheckItem label="Clear CTA" checked={r.checklist.ctaClear} />
          <CheckItem label="Human-like Content" checked={r.checklist.notTooAI} />
        </div>

        {r.feedback && (
          <div className="p-4 bg-slate-50 rounded border border-border">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-2 block">Agent Feedback</label>
            <p className="text-xs text-text-muted italic">"{r.feedback}"</p>
          </div>
        )}
      </div>
    );
  }

  if (currentStep === 6 && results.seo) {
    const s = results.seo;
    return (
      <div className="space-y-6">
        <DataBox label="Meta Title" value={s.metaTitle} />
        <DataBox label="Meta Description" value={s.metaDescription} />
        <DataBox label="Slug URL" value={s.slug} />
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3 block">Keyword Placement</label>
            <div className="space-y-2">
              {s.keywordPlacement.map((k, i) => (
                <div key={i} className="text-[11px] text-text-muted flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {k}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-3 block">Internal Link Suggestions</label>
            <div className="space-y-2">
              {s.internalLinkSuggestions.map((l, i) => (
                <div key={i} className="text-[11px] text-text-muted flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 7 && results.publish) {
    const p = results.publish;
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 text-center py-12">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
          <Rocket className="w-8 h-8 text-success" />
        </div>
        <div>
          <h4 className="text-2xl font-bold text-text-main mb-2">Artikel Berhasil Dipublish!</h4>
          <p className="text-text-muted text-sm">Semua sistem berjalan normal dan artikel telah online.</p>
        </div>
        <div className="w-full max-w-md space-y-1">
          <CheckItem label="Article Uploaded" checked={p.checklist.uploaded} />
          <CheckItem label="Images Optimized" checked={p.checklist.imagesWebp} />
          <CheckItem label="Links Validated" checked={p.checklist.linksActive} />
          <CheckItem label="Metadata Set" checked={p.checklist.tagsSet} />
        </div>
        <button className="px-6 py-3 bg-text-main hover:bg-slate-800 text-white rounded font-bold text-xs transition-colors">
          Lihat Artikel Live
        </button>
      </div>
    );
  }

  if (currentStep === 8 && results.rating) {
    const r = results.rating;
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-3 gap-4">
          <ScoreCard label="SEO Score" score={r.seoScore} color="text-primary" />
          <ScoreCard label="Readability" score={r.readabilityScore} color="text-success" />
          <ScoreCard label="Conversion" score={r.conversionScore} color="text-accent" />
        </div>

        <div>
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-4 block">Improvement Suggestions</label>
          <div className="space-y-3">
            {r.improvementSuggestions.map((s, i) => (
              <div key={i} className="p-4 bg-amber-50 border border-amber-100 rounded flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900">{s}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 flex gap-4">
          <button className="flex-1 py-3 bg-primary text-white rounded font-bold text-xs shadow-lg shadow-primary/10">
            Download PDF Report
          </button>
          <button className="flex-1 py-3 bg-text-main text-white rounded font-bold text-xs">
            Mulai Sesi Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
      <div className="relative">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
      <div>
        <h4 className="text-base font-bold text-text-main mb-1">Agent Sedang Bekerja</h4>
        <p className="text-text-muted text-xs max-w-xs mx-auto">Mohon tunggu sebentar, sistem sedang memproses data untuk langkah ini.</p>
      </div>
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

function CheckItem({ label, checked }: { label: string, checked: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div className={cn("w-5 h-5 rounded-lg flex items-center justify-center text-[10px] border transition-all", 
        checked ? "bg-success border-success text-bg shadow-[0_0_10px_rgba(0,245,212,0.3)]" : "border-white/10 text-white/20")}>
        {checked ? '✓' : '○'}
      </div>
      <span className={cn("text-[11px] font-bold uppercase tracking-widest", checked ? "text-white" : "text-text-muted")}>{label}</span>
    </div>
  );
}

function ScoreCard({ label, score, color }: { label: string, score: number, color: string }) {
  return (
    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 relative z-10">{label}</p>
      <div className={cn("text-4xl font-black italic tracking-tighter mb-4 relative z-10", color)}>{score}</div>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative z-10">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          className={cn("h-full shadow-[0_0_10px_rgba(255,255,255,0.3)]", color.replace('text-', 'bg-'))} 
        />
      </div>
    </div>
  );
}

function LoginView({ onLogin, onSwitchToSignup }: { onLogin: () => void, onSwitchToSignup: () => void }) {
  return (
    <div className="min-h-[calc(100vh-70px)] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-panel rounded-[2.5rem] p-10 relative z-10 space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase">Welcome Back</h2>
          <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Login to your WINNER account</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Email Address</label>
            <input 
              type="email" 
              placeholder="name@company.com"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary transition-all placeholder:text-white/10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary transition-all placeholder:text-white/10"
            />
          </div>
        </div>

        <button 
          onClick={onLogin}
          className="w-full py-4 bg-primary text-bg font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(0,242,254,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Sign In
        </button>

        <div className="text-center">
          <button 
            onClick={onSwitchToSignup}
            className="text-[10px] font-bold text-text-muted hover:text-primary uppercase tracking-widest transition-colors"
          >
            Don't have an account? <span className="text-primary underline">Sign Up</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SignupView({ onSignup, onSwitchToLogin }: { onSignup: () => void, onSwitchToLogin: () => void }) {
  return (
    <div className="min-h-[calc(100vh-70px)] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 blur-[150px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-panel rounded-[2.5rem] p-10 relative z-10 space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase">Create Account</h2>
          <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Join the WINNER ecosystem</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Full Name</label>
            <input 
              type="text" 
              placeholder="John Doe"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary transition-all placeholder:text-white/10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Email Address</label>
            <input 
              type="email" 
              placeholder="name@company.com"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary transition-all placeholder:text-white/10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary transition-all placeholder:text-white/10"
            />
          </div>
        </div>

        <button 
          onClick={onSignup}
          className="w-full py-4 bg-accent text-bg font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(240,147,251,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Create Account
        </button>

        <div className="text-center">
          <button 
            onClick={onSwitchToLogin}
            className="text-[10px] font-bold text-text-muted hover:text-accent uppercase tracking-widest transition-colors"
          >
            Already have an account? <span className="text-accent underline">Login</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
