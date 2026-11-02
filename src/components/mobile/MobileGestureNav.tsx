import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Volume2,
  Calendar,
  Contrast,
  X,
  Scan,
  BookOpen,
  Bookmark,
  ShieldCheck,
  Fingerprint,
} from 'lucide-react';
import { ActiveTab } from '../layout/Navbar';
import { ProcessedNotice } from '../../types/notice';
import { speechService } from '../../services/speech/webSpeechService';
import { exportNoticeCalendar } from '../../services/export/icsExporter';
import { ToastType } from '../common/Toast';

interface MobileGestureNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  hasActiveNotice: boolean;
  activeNotice: ProcessedNotice | null;
  savedCount: number;
  onOpenSampleModal: () => void;
  onShowToast: (msg: string, type?: ToastType) => void;
}

export const MobileGestureNav: React.FC<MobileGestureNavProps> = ({
  activeTab,
  onTabChange,
  hasActiveNotice,
  activeNotice,
  savedCount,
  onOpenSampleModal,
  onShowToast,
}) => {
  const [quickSheetOpen, setQuickSheetOpen] = useState(false);

  // Tab sequence for swipe gesture navigation
  const tabSequence: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'scan', label: 'Scan', icon: Scan },
    ...(hasActiveNotice ? [{ id: 'workspace' as ActiveTab, label: 'Workspace', icon: BookOpen }] : []),
    { id: 'saved', label: 'Vault', icon: Bookmark },
    { id: 'studio', label: 'Studio', icon: Volume2 },
    { id: 'transparency', label: 'Architecture', icon: ShieldCheck },
  ];

  const currentIndex = tabSequence.findIndex((t) => t.id === activeTab);
  const prevTab = currentIndex > 0 ? tabSequence[currentIndex - 1] : null;
  const nextTab = currentIndex < tabSequence.length - 1 ? tabSequence[currentIndex + 1] : null;

  const handlePrev = () => {
    if (prevTab) {
      onTabChange(prevTab.id);
    }
  };

  const handleNext = () => {
    if (nextTab) {
      onTabChange(nextTab.id);
    }
  };

  const handleQuickAudioReadout = () => {
    if (!activeNotice) {
      onShowToast('Ingest or select a notice to read aloud', 'info');
      return;
    }
    const overview = activeNotice.summary.overview || activeNotice.title;
    speechService.speak(overview, activeNotice.summary.language === 'en' ? 'en' : 'bn');
    onShowToast('Reading notice aloud...', 'info');
    setQuickSheetOpen(false);
  };

  const handleQuickCalendarExport = () => {
    if (!activeNotice) {
      onShowToast('No active notice deadline to export', 'info');
      return;
    }
    const outcome = exportNoticeCalendar(activeNotice);
    if (outcome.requiresReview) {
      onShowToast('Notice date requires review in Workspace before calendar export', 'info');
      onTabChange('workspace');
      setQuickSheetOpen(false);
      return;
    }
    if (outcome.success) {
      onShowToast('Calendar event downloaded (.ics)', 'success');
    } else {
      onShowToast(outcome.reason || 'No verified date found in notice', 'info');
    }
    setQuickSheetOpen(false);
  };

  const handleToggleHighContrast = () => {
    const isHc = document.documentElement.classList.toggle('high-contrast');
    document.body.classList.toggle('high-contrast', isHc);
    onShowToast(`High contrast ${isHc ? 'enabled' : 'disabled'}`, 'info');
  };

  return (
    <>
      {/* Mobile Pinned Gesture Nav Bar */}
      <nav
        aria-label="Mobile Gesture Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#eef2f8]/95 backdrop-blur-md border-t border-slate-300/80 shadow-[0_-6px_20px_rgba(200,211,226,0.6)] px-3 pt-2 pb-5 high-contrast:!bg-black high-contrast:!border-white high-contrast:!border-t-3"
      >
        {/* Top Tactile Gesture Handle Indicator */}
        <div className="flex items-center justify-center mb-1.5 cursor-grab active:cursor-grabbing">
          <div className="gesture-pill-handle" />
        </div>

        {/* Gesture Pattern Interactive Track */}
        <div className="flex items-center justify-between gap-1 max-w-sm mx-auto">
          {/* Previous Touch Trigger */}
          <button
            onClick={handlePrev}
            disabled={!prevTab}
            aria-label={prevTab ? `Swipe left to ${prevTab.label}` : 'At start'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              prevTab
                ? 'bg-[#eef2f8] text-slate-700 shadow-[3px_3px_6px_#c5d0e0,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_4px_#c5d0e0,inset_-2px_-2px_4px_#ffffff]'
                : 'text-slate-300 opacity-40 cursor-not-allowed'
            } high-contrast:!border-white high-contrast:!border high-contrast:!bg-black high-contrast:!text-white`}
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Connected Pattern Nodes */}
          <div className="flex-1 flex items-center justify-center gap-2 px-1 relative">
            <div className="absolute left-4 right-4 h-0.5 bg-slate-300 high-contrast:bg-white -z-0" />
            {tabSequence.map((tab, idx) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  aria-label={`Go to ${tab.label} (Screen ${idx + 1} of ${tabSequence.length})`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] gesture-node transition-all ${
                    isActive
                      ? 'bg-sky-600 text-white gesture-node-active shadow-[0_0_12px_rgba(2,132,199,0.8)] scale-125'
                      : 'bg-[#eef2f8] text-slate-600 shadow-[2px_2px_5px_#c5d0e0,-2px_-2px_5px_#ffffff] hover:scale-110'
                  } high-contrast:!border-white high-contrast:!border-2 high-contrast:!bg-black high-contrast:!text-white ${
                    isActive ? 'high-contrast:!bg-yellow-400 high-contrast:!text-black' : ''
                  }`}
                >
                  <span>{idx + 1}</span>
                </button>
              );
            })}
          </div>

          {/* Next Touch Trigger */}
          <button
            onClick={handleNext}
            disabled={!nextTab}
            aria-label={nextTab ? `Swipe right to ${nextTab.label}` : 'At end'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              nextTab
                ? 'bg-[#eef2f8] text-slate-700 shadow-[3px_3px_6px_#c5d0e0,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_4px_#c5d0e0,inset_-2px_-2px_4px_#ffffff]'
                : 'text-slate-300 opacity-40 cursor-not-allowed'
            } high-contrast:!border-white high-contrast:!border high-contrast:!bg-black high-contrast:!text-white`}
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Quick Gesture Actions Pattern Diamond */}
          <button
            onClick={() => setQuickSheetOpen(true)}
            aria-label="Open mobile gesture quick actions"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-100 text-sky-800 shadow-[3px_3px_6px_#c5d0e0,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_4px_#c5d0e0,inset_-2px_-2px_4px_#ffffff] border border-sky-300 high-contrast:!bg-yellow-400 high-contrast:!text-black high-contrast:!border-white"
          >
            <Fingerprint className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Current Active Tab & Gesture Hint */}
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 high-contrast:text-yellow-300 mt-2 px-2 max-w-sm mx-auto">
          <span className="text-slate-800 high-contrast:text-white font-extrabold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping inline-block high-contrast:bg-yellow-400" />
            {tabSequence.find((t) => t.id === activeTab)?.label}
          </span>
          <span className="tracking-tight text-[10px] text-slate-400 high-contrast:text-slate-300">
            ⇄ Swipe left/right
          </span>
        </div>
      </nav>

      {/* Pattern Gesture Quick Action Bottom Sheet */}
      {quickSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Gesture Quick Actions"
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fade-in"
          onClick={() => setQuickSheetOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#eef2f8] rounded-t-3xl p-5 shadow-[0_-10px_30px_rgba(0,0,0,0.25)] border-t border-white/60 space-y-4 animate-slide-up high-contrast:!bg-black high-contrast:!border-white high-contrast:!border-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 high-contrast:border-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-sm high-contrast:bg-yellow-400 high-contrast:text-black">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 high-contrast:text-white uppercase tracking-tight">
                    Gesture Quick Actions
                  </h3>
                  <p className="text-[11px] text-slate-500 high-contrast:text-yellow-300">
                    Fast one-tap touch operations
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickSheetOpen(false)}
                aria-label="Close gesture sheet"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 high-contrast:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Touch Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setQuickSheetOpen(false);
                  onOpenSampleModal();
                }}
                className="neu-btn p-3.5 flex flex-col items-center justify-center gap-1.5 text-center bg-[#eef2f8] hover:bg-white text-slate-800 rounded-2xl shadow-[4px_4px_8px_#c5d0e0,-4px_-4px_8px_#ffffff] border border-white/70 high-contrast:!bg-black high-contrast:!border-white high-contrast:!border-2 high-contrast:!text-white"
              >
                <Sparkles className="w-5 h-5 text-pink-600 high-contrast:text-yellow-400" />
                <span className="text-xs font-bold">Sample Notices</span>
                <span className="text-[10px] text-slate-500 high-contrast:text-slate-300">Test with sample</span>
              </button>

              <button
                onClick={handleQuickAudioReadout}
                className="neu-btn p-3.5 flex flex-col items-center justify-center gap-1.5 text-center bg-[#eef2f8] hover:bg-white text-slate-800 rounded-2xl shadow-[4px_4px_8px_#c5d0e0,-4px_-4px_8px_#ffffff] border border-white/70 high-contrast:!bg-black high-contrast:!border-white high-contrast:!border-2 high-contrast:!text-white"
              >
                <Volume2 className="w-5 h-5 text-sky-600 high-contrast:text-yellow-400" />
                <span className="text-xs font-bold">Listen Aloud</span>
                <span className="text-[10px] text-slate-500 high-contrast:text-slate-300">Voice speech</span>
              </button>

              <button
                onClick={handleQuickCalendarExport}
                className="neu-btn p-3.5 flex flex-col items-center justify-center gap-1.5 text-center bg-[#eef2f8] hover:bg-white text-slate-800 rounded-2xl shadow-[4px_4px_8px_#c5d0e0,-4px_-4px_8px_#ffffff] border border-white/70 high-contrast:!bg-black high-contrast:!border-white high-contrast:!border-2 high-contrast:!text-white"
              >
                <Calendar className="w-5 h-5 text-amber-600 high-contrast:text-yellow-400" />
                <span className="text-xs font-bold">Add to Calendar</span>
                <span className="text-[10px] text-slate-500 high-contrast:text-slate-300">Download .ics</span>
              </button>

              <button
                onClick={handleToggleHighContrast}
                className="neu-btn p-3.5 flex flex-col items-center justify-center gap-1.5 text-center bg-[#eef2f8] hover:bg-white text-slate-800 rounded-2xl shadow-[4px_4px_8px_#c5d0e0,-4px_-4px_8px_#ffffff] border border-white/70 high-contrast:!bg-black high-contrast:!border-white high-contrast:!border-2 high-contrast:!text-white"
              >
                <Contrast className="w-5 h-5 text-purple-600 high-contrast:text-yellow-400" />
                <span className="text-xs font-bold">High Contrast</span>
                <span className="text-[10px] text-slate-500 high-contrast:text-slate-300">Toggle dark / light</span>
              </button>
            </div>

            {/* Direct Screen Quick Jump */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-400 high-contrast:text-yellow-300 block mb-2 uppercase">
                Jump to Screen
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {tabSequence.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onTabChange(tab.id);
                      setQuickSheetOpen(false);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'bg-[#eef2f8] text-slate-700 shadow-[2px_2px_4px_#c5d0e0,-2px_-2px_4px_#ffffff]'
                    } high-contrast:!border-white high-contrast:!border high-contrast:!bg-black high-contrast:!text-white`}
                  >
                    {tab.label}
                    {tab.id === 'saved' && savedCount > 0 && ` (${savedCount})`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
