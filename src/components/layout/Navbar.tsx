import React from 'react';
import { Scan, Bookmark, Sparkles, BookOpen, Volume2, ShieldCheck } from 'lucide-react';

export type ActiveTab = 'scan' | 'workspace' | 'saved' | 'studio' | 'transparency';

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
  const pages: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'scan', label: 'Scan & Ingest', icon: Scan },
    ...(hasActiveNotice ? [{ id: 'workspace' as ActiveTab, label: 'Notice Workspace', icon: BookOpen }] : []),
    { id: 'saved', label: 'Notice Vault', icon: Bookmark, badge: savedCount },
    { id: 'studio', label: 'A11y Studio', icon: Volume2 },
    { id: 'transparency', label: 'Architecture', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 transition-all bg-[#eef2f8] border-b border-slate-200/80 shadow-[0_4px_20px_rgba(200,211,226,0.5)] high-contrast:!bg-black high-contrast:!border-white high-contrast:!border-b-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('scan')}
              className="flex items-center gap-2.5 text-left group p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-xl"
              aria-label="NoticeLens Home"
            >
              <div className="w-10 h-10 flex items-center justify-center font-black transition-all rounded-xl bg-[#eef2f8] text-sky-600 shadow-[4px_4px_10px_#c5d0e0,-4px_-4px_10px_#ffffff] border border-white/60 high-contrast:!bg-yellow-400 high-contrast:!text-black high-contrast:!border-2 high-contrast:!border-black">
                <Scan className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xl font-black uppercase tracking-tight text-slate-900 high-contrast:text-white flex items-center gap-2">
                  NoticeLens
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 shadow-[2px_2px_5px_#c5d0e0,-2px_-2px_5px_#ffffff] high-contrast:!bg-yellow-400 high-contrast:!text-black high-contrast:!border-2">
                    A11Y
                  </span>
                </span>
                <span className="block text-[11px] text-slate-500 font-bold tracking-tight high-contrast:text-yellow-300">
                  Read the notice. Know what to do.
                </span>
              </div>
            </button>
          </div>

          {/* Multipage Navigation UI Bar */}
          <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1" aria-label="Multipage Navigation">
            {pages.map((p) => {
              const Icon = p.icon;
              const isActive = activeTab === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveTab(p.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    isActive
                      ? 'rounded-xl bg-sky-600 text-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.25),0_2px_8px_rgba(2,132,199,0.35)]'
                      : 'rounded-xl bg-[#eef2f8] text-slate-700 shadow-[4px_4px_8px_#c5d0e0,-4px_-4px_8px_#ffffff] hover:shadow-[6px_6px_12px_#b8c4d6,-6px_-6px_12px_#ffffff]'
                  } high-contrast:!border-white high-contrast:!border-2 high-contrast:!bg-black high-contrast:!text-white ${
                    isActive ? 'high-contrast:!bg-yellow-400 high-contrast:!text-black' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{p.label}</span>
                  <span className="md:hidden">{p.label.split(' ')[0]}</span>
                  {p.badge !== undefined && p.badge > 0 && (
                    <span className={`ml-1 px-1.5 py-0.2 text-[10px] font-mono font-black ${
                      isActive
                        ? 'bg-white text-sky-700 rounded-full'
                        : 'bg-sky-600 text-white rounded-full'
                    } high-contrast:!bg-white high-contrast:!text-black`}>
                      {p.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Fictional Sample Notices Button */}
            <button
              onClick={onOpenSampleModal}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase tracking-wider transition-all rounded-xl bg-[#eef2f8] text-pink-600 shadow-[4px_4px_8px_#c5d0e0,-4px_-4px_8px_#ffffff] hover:shadow-[6px_6px_12px_#b8c4d6,-6px_-6px_12px_#ffffff] hover:text-pink-700 high-contrast:!bg-yellow-400 high-contrast:!text-black high-contrast:!border-2 high-contrast:!border-black"
              title="Inspect bundled test notice samples"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Samples</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
