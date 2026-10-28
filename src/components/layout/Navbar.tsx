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

  const isNeumorphism = currentTheme === 'neomorphism';

  return (
    <header className={`sticky top-0 z-40 transition-all ${
      isNeumorphism
        ? 'bg-[#eef2f8] border-b border-slate-200/80 shadow-[0_4px_20px_rgba(200,211,226,0.5)]'
        : 'border-b-4 border-black bg-white shadow-brutal'
    } high-contrast:!bg-black high-contrast:!border-white high-contrast:!border-b-4`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('scan')}
              className="flex items-center gap-2.5 text-left group p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              aria-label="NoticeLens Home"
            >
              <div className={`w-10 h-10 flex items-center justify-center font-black transition-all ${
                isNeumorphism
                  ? 'rounded-xl bg-[#eef2f8] text-sky-600 shadow-[4px_4px_10px_#c5d0e0,-4px_-4px_10px_#ffffff] border border-white/60'
                  : 'border-2 border-black bg-yellow-400 text-black shadow-brutal-sm group-hover:translate-x-[-1px] group-hover:translate-y-[-1px]'
              } high-contrast:!bg-yellow-400 high-contrast:!text-black high-contrast:!border-2 high-contrast:!border-black`}>
                <Scan className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xl font-black uppercase tracking-tight text-slate-900 high-contrast:text-white flex items-center gap-2">
                  NoticeLens
                  <span className={`text-[10px] font-black px-1.5 py-0.5 ${
                    isNeumorphism
                      ? 'rounded-full bg-sky-100 text-sky-800 shadow-[2px_2px_5px_#c5d0e0,-2px_-2px_5px_#ffffff]'
                      : 'brutal-badge bg-[#05FFA1] text-black border-2 border-black -rotate-2'
                  } high-contrast:!bg-yellow-400 high-contrast:!text-black high-contrast:!border-2`}>
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
                  className={`px-3 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    isNeumorphism
                      ? isActive
                        ? 'rounded-xl bg-sky-600 text-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.25),0_2px_8px_rgba(2,132,199,0.35)]'
                        : 'rounded-xl bg-[#eef2f8] text-slate-700 shadow-[4px_4px_8px_#c5d0e0,-4px_-4px_8px_#ffffff] hover:shadow-[6px_6px_12px_#b8c4d6,-6px_-6px_12px_#ffffff]'
                      : isActive
                        ? 'border-2 border-black bg-yellow-400 text-black shadow-brutal-sm translate-x-[-1px] translate-y-[-1px]'
                        : 'border-2 border-black bg-white text-slate-800 hover:bg-slate-100 hover:shadow-brutal-sm'
                  } high-contrast:!border-white high-contrast:!border-2 high-contrast:!bg-black high-contrast:!text-white ${
                    isActive ? 'high-contrast:!bg-yellow-400 high-contrast:!text-black' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{p.label}</span>
                  <span className="md:hidden">{p.label.split(' ')[0]}</span>
                  {p.badge !== undefined && p.badge > 0 && (
                    <span className={`ml-1 px-1.5 py-0.2 text-[10px] font-mono font-black ${
                      isNeumorphism
                        ? isActive
                          ? 'bg-white text-sky-700 rounded-full'
                          : 'bg-sky-600 text-white rounded-full'
                        : 'border border-black bg-black text-white'
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
              className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                isNeumorphism
                  ? 'rounded-xl bg-[#eef2f8] text-pink-600 shadow-[4px_4px_8px_#c5d0e0,-4px_-4px_8px_#ffffff] hover:shadow-[6px_6px_12px_#b8c4d6,-6px_-6px_12px_#ffffff] hover:text-pink-700'
                  : 'border-2 border-black bg-[#FF71CE] text-black hover:bg-pink-300 shadow-brutal-sm'
              } high-contrast:!bg-yellow-400 high-contrast:!text-black high-contrast:!border-2 high-contrast:!border-black`}
              title="Inspect bundled test notice samples"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Samples</span>
            </button>

            {/* Quick Theme Selector Dropdown */}
            {onThemeChange && (
              <div className={`hidden sm:flex items-center gap-1 ml-1 pl-2 ${
                isNeumorphism ? 'border-l border-slate-300' : 'border-l-2 border-black'
              } high-contrast:border-white`}>
                <Palette className="w-3.5 h-3.5 text-slate-700 high-contrast:text-yellow-400" />
                <select
                  value={currentTheme}
                  onChange={(e) => onThemeChange(e.target.value as UITheme)}
                  aria-label="Select UI/UX Design System"
                  className={`text-[11px] font-black uppercase px-2.5 py-1.5 focus:outline-none ${
                    isNeumorphism
                      ? 'rounded-lg bg-[#eef2f8] text-slate-800 shadow-[inset_2px_2px_4px_#c5d0e0,inset_-2px_-2px_4px_#ffffff] border border-slate-200/50'
                      : 'border-2 border-black bg-yellow-50 text-black'
                  } high-contrast:!bg-black high-contrast:!text-white high-contrast:!border-white high-contrast:!border-2`}
                >
                  <option value="neomorphism">Neomorphism (Soft UI)</option>
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
