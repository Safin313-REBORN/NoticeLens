import React from 'react';
import { Scan, Bookmark, Sparkles, BookOpen } from 'lucide-react';

export type ActiveTab = 'scan' | 'workspace' | 'saved';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  savedCount: number;
  hasActiveNotice: boolean;
  onOpenSampleModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  hasActiveNotice,
  onOpenSampleModal,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm high-contrast:bg-black high-contrast:border-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('scan')}
              className="flex items-center gap-2.5 text-left group focus-visible:ring-2 focus-visible:ring-teal-600 rounded-lg p-1"
              aria-label="NoticeLens Home"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform high-contrast:bg-yellow-400 high-contrast:text-black">
                <Scan className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-ink-900 high-contrast:text-white flex items-center gap-1.5">
                  NoticeLens
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200 uppercase tracking-wider high-contrast:bg-yellow-400 high-contrast:text-black">
                    A11y
                  </span>
                </span>
                <span className="block text-xs text-slate-500 high-contrast:text-yellow-300 font-medium">
                  Read the notice. Know what to do.
                </span>
              </div>
            </button>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main Navigation">
            <button
              onClick={() => setActiveTab('scan')}
              aria-current={activeTab === 'scan' ? 'page' : undefined}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-teal-600 ${
                activeTab === 'scan'
                  ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm high-contrast:bg-yellow-400 high-contrast:text-black high-contrast:border-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 high-contrast:text-white high-contrast:hover:bg-slate-900'
              }`}
            >
              <Scan className="w-4 h-4" />
              <span>Scan Notice</span>
            </button>

            {hasActiveNotice && (
              <button
                onClick={() => setActiveTab('workspace')}
                aria-current={activeTab === 'workspace' ? 'page' : undefined}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-teal-600 ${
                  activeTab === 'workspace'
                    ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm high-contrast:bg-yellow-400 high-contrast:text-black high-contrast:border-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 high-contrast:text-white high-contrast:hover:bg-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Notice Workspace</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('saved')}
              aria-current={activeTab === 'saved' ? 'page' : undefined}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-teal-600 ${
                activeTab === 'saved'
                  ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-sm high-contrast:bg-yellow-400 high-contrast:text-black high-contrast:border-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 high-contrast:text-white high-contrast:hover:bg-slate-900'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Saved Notices</span>
              {savedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-teal-600 text-white high-contrast:bg-yellow-400 high-contrast:text-black">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenSampleModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors high-contrast:bg-slate-900 high-contrast:text-yellow-300 high-contrast:border-yellow-400 ml-2"
              title="Inspect bundled test samples"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 high-contrast:text-yellow-300" />
              <span>Sample Notices</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
