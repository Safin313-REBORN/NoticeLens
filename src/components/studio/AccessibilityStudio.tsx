import React, { useState, useEffect } from 'react';
import { Volume2, Play, Square, Check, Type, Sparkles, Terminal, Shield, RefreshCw } from 'lucide-react';
import { speechService, SpeechStatusState } from '../../services/speech/webSpeechService';
import { UITheme } from '../../types/notice';

interface AccessibilityStudioProps {
  currentTheme: UITheme;
  onThemeChange: (theme: UITheme) => void;
  announcementLog: string[];
  onTestAnnouncement: (msg: string) => void;
}

export const AccessibilityStudio: React.FC<AccessibilityStudioProps> = ({
  currentTheme,
  onThemeChange,
  announcementLog,
  onTestAnnouncement,
}) => {
  const [speechState, setSpeechState] = useState<SpeechStatusState>(speechService.getState());
  const [testText, setTestText] = useState(
    'এতদ্বারা ঢাকা বিশ্ববিদ্যালয়ের সকল শিক্ষার্থীর অবগতির জন্য জানানো যাচ্ছে যে, আগামী ১৫ নভেম্বর ২০২৪ তারিখের মধ্যে রেজিস্ট্রেশন সম্পন্ন করতে হবে।'
  );
  const [rate, setRate] = useState<number>(1.0);

  useEffect(() => {
    const unsub = speechService.subscribe((state) => {
      setSpeechState(state);
    });
    return () => unsub();
  }, []);

  const handleTestSpeech = (lang: 'bn' | 'en') => {
    speechService.setRate(rate);
    const textToSpeak =
      lang === 'bn'
        ? testText
        : 'NoticeLens accessible reader. All extracted fields are anchored to exact source text snippets.';
    speechService.speak(textToSpeak, lang);
    onTestAnnouncement(`Playing test audio: ${textToSpeak.substring(0, 30)}...`);
  };

  const handleStopSpeech = () => {
    speechService.stop();
  };

  const themes: { id: UITheme; name: string; tag: string; description: string; previewBg: string; previewBorder: string; badgeColor: string }[] = [
    {
      id: 'neomorphism',
      name: 'Neumorphism (Soft UI)',
      tag: 'Desktop Default • Tactile',
      description: 'Ultra-clean extruded surfaces, soft dual-light drop shadows, sunken inset wells, and slate typography.',
      previewBg: 'bg-[#EEF2F8]',
      previewBorder: 'border-slate-300',
      badgeColor: 'bg-sky-600 text-white',
    },
    {
      id: 'neobrutalist',
      name: 'Neo-Brutalist Pop',
      tag: 'High Contrast Bold',
      description: 'Bold 3px solid black outlines, canary yellow accents, and hard 4px offset drop shadows.',
      previewBg: 'bg-[#FFFDF0]',
      previewBorder: 'border-black',
      badgeColor: 'bg-yellow-400 text-black',
    },
    {
      id: 'memphis',
      name: 'Memphis Design 80s',
      tag: 'Postmodern • Geometric',
      description: 'Playful repeating dots, hot pink shadows, electric cyan highlights, and tilted retro cards.',
      previewBg: 'bg-[#FFF5F8]',
      previewBorder: 'border-[#18181B]',
      badgeColor: 'bg-[#FF5277] text-white',
    },
    {
      id: 'artdeco',
      name: 'Art Deco Noir & Gold',
      tag: 'Luxury • High Contrast Dark',
      description: 'Midnight obsidian backdrop, metallic brass gold borders, and crisp high-contrast legibility.',
      previewBg: 'bg-[#0E0E10]',
      previewBorder: 'border-[#D4AF37]',
      badgeColor: 'bg-[#D4AF37] text-black',
    },
    {
      id: 'retroterminal',
      name: 'Retro Terminal CRT',
      tag: 'Phosphor Green • Monospace',
      description: 'Classic hacker terminal with emerald green phosphor glow, CRT borders, and monospace font.',
      previewBg: 'bg-[#0A0E0D]',
      previewBorder: 'border-[#22C55E]',
      badgeColor: 'bg-[#22C55E] text-black',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="border-3 border-black bg-white p-6 shadow-brutal high-contrast:bg-black high-contrast:border-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 brutal-badge bg-yellow-400 text-black border-2 border-black -rotate-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Studio & Laboratory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-ink-900 high-contrast:text-white uppercase tracking-tight">
              Voice & Accessibility Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 high-contrast:text-yellow-300 font-medium mt-1">
              Fine-tune the Web Speech synthesis engine, switch avant-garde UI aesthetics, and verify live screen reader announcements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="brutal-badge px-3 py-1.5 bg-neo-mint text-black border-2 border-black flex items-center gap-1.5 font-bold">
              <Shield className="w-4 h-4" />
              <span>WCAG 2.1 AA Compliant</span>
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: UI Theme Selector */}
      <section className="space-y-4" aria-labelledby="theme-section-heading">
        <div className="flex items-center justify-between">
          <h2 id="theme-section-heading" className="text-lg font-black uppercase tracking-tight text-ink-900 high-contrast:text-white flex items-center gap-2">
            <Type className="w-5 h-5 text-black high-contrast:text-yellow-400" />
            <span>Select UI/UX Design System ({themes.length})</span>
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Instant Hot-Swap</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themes.map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => onThemeChange(theme.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onThemeChange(theme.id);
                  }
                }}
                className={`p-5 rounded-none cursor-pointer brutal-card transition-all ${
                  isSelected
                    ? 'border-4 border-black bg-white ring-4 ring-yellow-400 translate-x-[-2px] translate-y-[-2px] shadow-brutal-lg'
                    : 'bg-white hover:bg-slate-50 opacity-90'
                } high-contrast:bg-black high-contrast:border-white`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className={`px-2.5 py-0.5 brutal-badge border-2 border-black ${theme.badgeColor}`}>
                    {theme.tag}
                  </span>
                  {isSelected && (
                    <span className="px-2 py-0.5 brutal-badge bg-black text-white border-2 border-black flex items-center gap-1 text-[10px]">
                      <Check className="w-3 h-3 text-yellow-400" /> Active
                    </span>
                  )}
                </div>

                <h3 className="text-base font-black text-ink-900 high-contrast:text-white mt-1">
                  {theme.name}
                </h3>
                <p className="text-xs text-slate-600 high-contrast:text-slate-300 mt-1 leading-relaxed">
                  {theme.description}
                </p>

                <div className="mt-4 pt-3 border-t-2 border-black flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500 uppercase text-[10px]">Sample Palette:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 border border-black bg-yellow-400 inline-block"></span>
                    <span className="w-4 h-4 border border-black bg-[#05FFA1] inline-block"></span>
                    <span className="w-4 h-4 border border-black bg-[#FF5A5F] inline-block"></span>
                    <span className="w-4 h-4 border border-black bg-black inline-block"></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Speech Reader Audio Lab */}
      <section className="border-3 border-black bg-white p-6 shadow-brutal high-contrast:bg-black high-contrast:border-white space-y-5" aria-labelledby="tts-lab-heading">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-black high-contrast:text-yellow-400" />
            <h2 id="tts-lab-heading" className="text-lg font-black uppercase tracking-tight text-ink-900 high-contrast:text-white">
              Speech Synthesis Test Bench
            </h2>
          </div>
          <span className={`px-2.5 py-0.5 brutal-badge border-2 border-black ${speechState.hasBengaliVoice ? 'bg-neo-mint text-black' : 'bg-yellow-400 text-black'}`}>
            {speechState.hasBengaliVoice ? '✓ Native Bengali Voice Ready' : '⚠ Hardware English Fallback'}
          </span>
        </div>

        <div>
          <label htmlFor="test-tts-textarea" className="block text-xs font-black uppercase tracking-wider text-ink-900 high-contrast:text-white mb-1.5">
            Sample University Notice Sentence:
          </label>
          <textarea
            id="test-tts-textarea"
            rows={3}
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full p-3 text-xs font-mono border-2 border-black bg-slate-50 text-ink-900 focus:bg-white focus:outline-none high-contrast:bg-black high-contrast:border-white high-contrast:text-white"
          />
        </div>

        {/* Speed Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-yellow-50 p-4 border-2 border-black high-contrast:bg-slate-900 high-contrast:border-white">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase text-ink-900 high-contrast:text-white">
              Playback Rate: {rate}x
            </span>
            <div className="flex items-center gap-1.5">
              {[0.75, 1.0, 1.25, 1.5].map((r) => (
                <button
                  key={r}
                  onClick={() => setRate(r)}
                  className={`px-2.5 py-1 text-xs brutal-btn ${rate === r ? 'bg-black text-yellow-400' : 'bg-white text-black'}`}
                >
                  {r}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTestSpeech('bn')}
              disabled={speechState.status === 'playing'}
              className="inline-flex items-center gap-1.5 px-4 py-2 brutal-btn bg-yellow-400 text-black hover:bg-yellow-500 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Speak Bengali</span>
            </button>

            <button
              onClick={() => handleTestSpeech('en')}
              disabled={speechState.status === 'playing'}
              className="inline-flex items-center gap-1.5 px-4 py-2 brutal-btn bg-neo-mint text-black hover:bg-emerald-400 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Speak English</span>
            </button>

            {speechState.status === 'playing' && (
              <button
                onClick={handleStopSpeech}
                className="inline-flex items-center gap-1.5 px-4 py-2 brutal-btn bg-red-600 text-white hover:bg-red-700"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Section 3: Screen Reader Live Region Audit Log */}
      <section className="border-3 border-black bg-white p-6 shadow-brutal high-contrast:bg-black high-contrast:border-white space-y-4" aria-labelledby="live-log-heading">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-black high-contrast:text-yellow-400" />
            <h2 id="live-log-heading" className="text-lg font-black uppercase tracking-tight text-ink-900 high-contrast:text-white">
              Screen Reader Live Region Log
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">aria-live="polite"</span>
        </div>

        <p className="text-xs text-slate-600 high-contrast:text-yellow-300">
          Every critical user event (OCR completion, field updates, calendar downloads, storage saves) triggers a non-intrusive notification broadcast to assistive screen reader hardware (NVDA, JAWS, VoiceOver, TalkBack).
        </p>

        <div className="bg-black text-green-400 p-4 font-mono text-xs max-h-48 overflow-y-auto space-y-1.5 border-2 border-black high-contrast:border-white">
          {announcementLog.length > 0 ? (
            announcementLog.map((entry, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-slate-500">[{idx + 1}]</span>
                <span>{entry}</span>
              </div>
            ))
          ) : (
            <div className="text-slate-500 italic">No broadcast events logged yet. Perform an action to view aria-live activity.</div>
          )}
        </div>
      </section>

      {/* Section 4: Hotkey Reference Table */}
      <section className="border-3 border-black bg-white p-6 shadow-brutal high-contrast:bg-black high-contrast:border-white space-y-4" aria-labelledby="hotkeys-heading">
        <h2 id="hotkeys-heading" className="text-lg font-black uppercase tracking-tight text-ink-900 high-contrast:text-white flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-black high-contrast:text-yellow-400" />
          <span>Keyboard Navigation Shortcuts</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 border-2 border-black bg-slate-50 high-contrast:bg-black flex items-center justify-between">
            <span className="font-semibold text-slate-700 high-contrast:text-white">Scan & Upload Station</span>
            <kbd className="px-2 py-1 bg-black text-white font-mono font-bold brutal-badge text-[11px]">Alt + 1</kbd>
          </div>
          <div className="p-3 border-2 border-black bg-slate-50 high-contrast:bg-black flex items-center justify-between">
            <span className="font-semibold text-slate-700 high-contrast:text-white">Notice Intelligence Workspace</span>
            <kbd className="px-2 py-1 bg-black text-white font-mono font-bold brutal-badge text-[11px]">Alt + 2</kbd>
          </div>
          <div className="p-3 border-2 border-black bg-slate-50 high-contrast:bg-black flex items-center justify-between">
            <span className="font-semibold text-slate-700 high-contrast:text-white">Saved Notices Vault</span>
            <kbd className="px-2 py-1 bg-black text-white font-mono font-bold brutal-badge text-[11px]">Alt + 3</kbd>
          </div>
          <div className="p-3 border-2 border-black bg-slate-50 high-contrast:bg-black flex items-center justify-between">
            <span className="font-semibold text-slate-700 high-contrast:text-white">Voice & A11y Studio</span>
            <kbd className="px-2 py-1 bg-black text-white font-mono font-bold brutal-badge text-[11px]">Alt + 4</kbd>
          </div>
          <div className="p-3 border-2 border-black bg-slate-50 high-contrast:bg-black flex items-center justify-between">
            <span className="font-semibold text-slate-700 high-contrast:text-white">System Architecture Guide</span>
            <kbd className="px-2 py-1 bg-black text-white font-mono font-bold brutal-badge text-[11px]">Alt + 5</kbd>
          </div>
          <div className="p-3 border-2 border-black bg-slate-50 high-contrast:bg-black flex items-center justify-between">
            <span className="font-semibold text-slate-700 high-contrast:text-white">Dismiss Modals / Stop Audio</span>
            <kbd className="px-2 py-1 bg-black text-white font-mono font-bold brutal-badge text-[11px]">Escape</kbd>
          </div>
        </div>
      </section>
    </div>
  );
};
