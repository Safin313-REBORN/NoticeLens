import React from 'react';
import { ShieldCheck, Eye, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 py-8 mt-auto high-contrast:bg-black high-contrast:border-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-600 high-contrast:text-slate-300">
          <div>
            <div className="flex items-center gap-2 font-bold text-ink-900 high-contrast:text-white mb-2">
              <Eye className="w-4 h-4 text-teal-600 high-contrast:text-yellow-400" />
              <span>Evidence-Backed Notice Intelligence</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 high-contrast:text-slate-300">
              NoticeLens extracts facts directly with traceable citations from the recognized source text. We never invent missing dates or requirements.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 font-bold text-ink-900 high-contrast:text-white mb-2">
              <ShieldCheck className="w-4 h-4 text-teal-600 high-contrast:text-yellow-400" />
              <span>100% Private & Local</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 high-contrast:text-slate-300">
              Notice documents are processed locally in your browser. No files are uploaded to external cloud storage or private servers.
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 font-bold text-ink-900 high-contrast:text-white mb-2">
              <Sparkles className="w-4 h-4 text-teal-600 high-contrast:text-yellow-400" />
              <span>Academic Integrity Notice</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 high-contrast:text-slate-300">
              OCR can make mistakes. Always verify critical deadlines against official university boards or original papers.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 high-contrast:border-white/20 mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 high-contrast:text-yellow-300">
          <p>© 2024 NoticeLens • Built for university accessibility in Bangladesh</p>
          <p className="mt-1 sm:mt-0 font-medium">Accessible WCAG 2.2 AA Compliant</p>
        </div>
      </div>
    </footer>
  );
};
