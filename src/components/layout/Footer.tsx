import React from 'react';
import { ShieldCheck, Eye, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#eef2f8] border-t border-slate-300/80 py-8 mt-auto high-contrast:!bg-black high-contrast:!border-white high-contrast:!border-t-4 shadow-[0_-4px_20px_rgba(200,211,226,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-800 high-contrast:text-slate-300">
          <div className="neu-card p-5 bg-[#eef2f8] high-contrast:!bg-black high-contrast:!border-white">
            <div className="flex items-center gap-2 font-bold uppercase tracking-tight text-slate-900 high-contrast:text-white mb-2">
              <Eye className="w-4 h-4 text-sky-600 high-contrast:text-yellow-400 stroke-[2.5]" />
              <span>Evidence-Backed Intelligence</span>
            </div>
            <p className="text-xs font-medium leading-relaxed text-slate-600 high-contrast:text-slate-300">
              NoticeLens extracts facts directly with traceable citations from the recognized source text. We never invent missing dates or requirements.
            </p>
          </div>

          <div className="neu-card p-5 bg-[#eef2f8] high-contrast:!bg-black high-contrast:!border-white">
            <div className="flex items-center gap-2 font-bold uppercase tracking-tight text-slate-900 high-contrast:text-white mb-2">
              <ShieldCheck className="w-4 h-4 text-sky-600 high-contrast:text-yellow-400 stroke-[2.5]" />
              <span>100% Private & Local</span>
            </div>
            <p className="text-xs font-medium leading-relaxed text-slate-600 high-contrast:text-slate-300">
              Notice documents are processed locally in your browser. No files are uploaded to external cloud storage or private servers.
            </p>
          </div>

          <div className="neu-card p-5 bg-[#eef2f8] high-contrast:!bg-black high-contrast:!border-white">
            <div className="flex items-center gap-2 font-bold uppercase tracking-tight text-slate-900 high-contrast:text-white mb-2">
              <Sparkles className="w-4 h-4 text-sky-600 high-contrast:text-yellow-400 stroke-[2.5]" />
              <span>Academic Integrity Notice</span>
            </div>
            <p className="text-xs font-medium leading-relaxed text-slate-600 high-contrast:text-slate-300">
              OCR can make mistakes. Always verify critical deadlines against official university boards or original papers.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-300/80 high-contrast:border-white mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-slate-600 high-contrast:text-yellow-300">
          <p>© 2024 NoticeLens • Built for university accessibility in Bangladesh</p>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <span className="neu-badge px-3 py-1 bg-emerald-100 text-emerald-800">WCAG 2.2 AA Aligned</span>
            <span className="neu-badge px-3 py-1 bg-sky-100 text-sky-800">100% On-Device</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
