import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Target, Star } from 'lucide-react';

interface RevisionViewProps {
  content: string;
  feedback: string;
  setFeedback: (v: string) => void;
  onResume: (action: 'APPROVE' | 'REVISE') => void;
  seoScore?: number;
}

export function RevisionView({ content, feedback, setFeedback, onResume, seoScore = 85 }: RevisionViewProps) {
  // Strip out the ```markdown and ``` from the content if the agent wrapped it
  const cleanContent = content.replace(/^```(markdown|html)?\n/i, '').replace(/\n```$/i, '');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[600px]">
      {/* Left Panel: Preview Article */}
      <div className="bg-panel/40 border border-white/5 rounded-2xl flex flex-col overflow-hidden">
        <header className="p-4 border-b border-white/5 bg-black/20 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Article Preview</h3>
            <p className="text-[10px] text-text-muted">Draft siap dipublikasi</p>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="prose prose-invert prose-sm md:prose-base prose-primary max-w-none 
                          prose-headings:text-white prose-a:text-primary 
                          prose-strong:text-primary prose-code:text-accent">
            <ReactMarkdown>{cleanContent}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Right Panel: Controls & Feedback */}
      <div className="flex flex-col gap-6">
        {/* SEO Score Card */}
        <div className="bg-panel border border-white/10 rounded-2xl p-6 flex items-start gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-success flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-black text-success">{seoScore}</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-1 flex items-center gap-2">
              <Star className="w-4 h-4 text-accent" /> Prediksi SEO Rank Math
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Skor ini diprediksi berdasarkan kepadatan kata kunci, struktur heading (H2/H3), dan keterbacaan paragraf. 
              Draft ini sudah optimal untuk WordPress.
            </p>
          </div>
        </div>

        {/* Revision Form */}
        <div className="bg-panel/40 border border-white/10 rounded-2xl flex-1 flex flex-col overflow-hidden">
          <header className="p-4 border-b border-white/5 bg-black/20">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Tinjauan Manual</h3>
            <p className="text-[10px] text-text-muted mt-1">Berikan instruksi revisi atau setujui draft ini.</p>
          </header>
          <div className="p-6 flex-1 flex flex-col gap-4">
            <textarea 
              className="w-full flex-1 bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-white 
                         placeholder:text-white/20 focus:outline-none focus:border-primary/50 custom-scrollbar resize-none"
              placeholder="Catatan revisi (opsional)... misal: 'Tolong buat paragraf pertama lebih panjang dan persuasif'"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
            />
            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => onResume('REVISE')}
                className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition"
              >
                Revisi Draft
              </button>
              <button 
                onClick={() => onResume('APPROVE')}
                className="flex-1 py-4 bg-primary text-bg rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:shadow-[0_0_30px_rgba(0,242,254,0.5)] transition"
              >
                Approve & Lanjut
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
