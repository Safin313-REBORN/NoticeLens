import React from 'react';
import { ShieldCheck, Eye, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t-4 border-black py-8 mt-auto high-contrast:bg-black high-contrast:border-white shadow-brutal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-800 high-contrast:text-slate-300">
          <div className="brutal-card p-4 bg-[#FFFDF0]">
            <div className="flex items-center gap-2 font-black uppercase tracking-tight text-ink-900 high-contrast:text-white mb-2">
              <Eye className="w-4 h-4 text-black high-contrast:text-yellow-400 stroke-[2.5]" />
              <span>Evidence-Backed Intelligence</span>
            </div>
            <p className="text-xs font-medium leading-relaxed text-slate-600 high-contrast:text-slate-300">
              NoticeLens extracts facts directly with traceable citations from the recognized source text. We never invent missing dates or requirements.
            </p>
          </div>

          <div className="brutal-card p-4 bg-[#FFFDF0]">
            <div className="flex items-center gap-2 font-black uppercase tracking-tight text-ink-900 high-contrast:text-white mb-2">
              <ShieldCheck className="w-4 h-4 text-black high-contrast:text-yellow-400 stroke-[2.5]" />
              <span>100% Private & Local</span>
            </div>
            <p className="text-xs font-medium leading-relaxed text-slate-600 high-contrast:text-slate-300">
              Notice documents are processed locally in your browser. No files are uploaded to external cloud storage or private servers.
            </p>
          </div>

          <div className="brutal-card p-4 bg-[#FFFDF0]">
            <div className="flex items-center gap-2 font-black uppercase tracking-tight text-ink-900 high-contrast:text-white mb-2">
              <Sparkles className="w-4 h-4 text-black high-contrast:text-yellow-400 stroke-[2.5]" />
              <span>Academic Integrity Notice</span>
            </div>
            <p className="text-xs font-medium leading-relaxed text-slate-600 high-contrast:text-slate-300">
              OCR can make mistakes. Always verify critical deadlines against official university boards or original papers.
            </p>
          </div>
        </div>

        <div className="border-t-2 border-black high-contrast:border-white mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-slate-700 high-contrast:text-yellow-300">
          <p>© 2024 NoticeLens • Built for university accessibility in Bangladesh</p>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <span className="brutal-badge px-2 py-0.5 bg-neo-mint text-black">WCAG 2.2 AAA</span>
            <span className="brutal-badge px-2 py-0.5 bg-neo-yellow text-black">100% On-Device</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
