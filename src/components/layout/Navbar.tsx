import React from 'react';
import { Scan, Bookmark, Sparkles, BookOpen, Volume2, ShieldCheck, Palette } from 'lucide-react';
import { UITheme } from '../../types/notice';

export type ActiveTab = 'scan' | 'workspace' | 'saved' | 'studio' | 'transparency';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  savedCount: number;
  hasActiveNotice: boolean;
  onOpenSampleModal: () => void;
  currentTheme?: UITheme;
  onThemeChange?: (theme: UITheme) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  savedCount,
  hasActiveNotice,
  onOpenSampleModal,
  currentTheme = 'neobrutalist',
  onThemeChange,
}) => {
  const pages: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'scan', label: 'Scan & Ingest', icon: Scan },
    ...(hasActiveNotice ? [{ id: 'workspace' as ActiveTab, label: 'Notice Workspace', icon: BookOpen }] : []),
    { id: 'saved', label: 'Notice Vault', icon: Bookmark, badge: savedCount },
    { id: 'studio', label: 'A11y Studio', icon: Volume2 },
    { id: 'transparency', label: 'Architecture', icon: ShieldCheck },
  ];

  return (
    <header className="border-b-4 border-black bg-white sticky top-0 z-40 shadow-brutal high-contrast:bg-black high-contrast:border-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('scan')}
              className="flex items-center gap-2.5 text-left group p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              aria-label="NoticeLens Home"
            >
              <div className="w-10 h-10 border-2 border-black bg-yellow-400 flex items-center justify-center text-black font-black shadow-brutal-sm group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] transition-transform high-contrast:bg-yellow-400 high-contrast:text-black">
                <Scan className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xl font-black uppercase tracking-tight text-ink-900 high-contrast:text-white flex items-center gap-2">
                  NoticeLens
                  <span className="text-[10px] font-black px-1.5 py-0.5 brutal-badge bg-[#05FFA1] text-black border-2 border-black -rotate-2">
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
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1" aria-label="Multipage Navigation">
            {pages.map((p) => {
              const Icon = p.icon;
              const isActive = activeTab === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveTab(p.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap transition-all border-2 border-black ${
                    isActive
                      ? 'bg-yellow-400 text-black shadow-brutal-sm translate-x-[-1px] translate-y-[-1px]'
                      : 'bg-white text-slate-800 hover:bg-slate-100 hover:shadow-brutal-sm'
                  } high-contrast:border-white high-contrast:bg-black high-contrast:text-white ${
                    isActive ? 'high-contrast:!bg-yellow-400 high-contrast:!text-black' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{p.label}</span>
                  <span className="md:hidden">{p.label.split(' ')[0]}</span>
                  {p.badge !== undefined && p.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono font-black border border-black bg-black text-white high-contrast:bg-white high-contrast:text-black">
                      {p.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Fictional Sample Notices Button */}
            <button
              onClick={onOpenSampleModal}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase tracking-wider border-2 border-black bg-[#FF71CE] text-black hover:bg-pink-300 shadow-brutal-sm transition-all"
              title="Inspect bundled test notice samples"
            >
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span>Samples</span>
            </button>

            {/* Quick Theme Selector Dropdown */}
            {onThemeChange && (
              <div className="hidden sm:flex items-center gap-1 ml-1 pl-2 border-l-2 border-black">
                <Palette className="w-3.5 h-3.5 text-black high-contrast:text-yellow-400" />
                <select
                  value={currentTheme}
                  onChange={(e) => onThemeChange(e.target.value as UITheme)}
                  aria-label="Select UI/UX Design System"
                  className="text-[11px] font-black uppercase px-2 py-1.5 border-2 border-black bg-yellow-50 text-black focus:outline-none high-contrast:bg-black high-contrast:text-white high-contrast:border-white"
                >
                  <option value="neobrutalist">Neo-Brutalist</option>
                  <option value="memphis">Memphis 80s</option>
                  <option value="artdeco">Art Deco</option>
                  <option value="retroterminal">Retro CRT</option>
                </select>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
