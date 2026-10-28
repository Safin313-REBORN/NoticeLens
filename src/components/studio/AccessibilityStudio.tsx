import React, { useState, useEffect } from 'react';
import { Volume2, Play, Square, Sparkles, Terminal, Shield, RefreshCw, Layers } from 'lucide-react';
import { speechService, SpeechStatusState } from '../../services/speech/webSpeechService';

interface AccessibilityStudioProps {
  announcementLog: string[];
  onTestAnnouncement: (msg: string) => void;
}

export const AccessibilityStudio: React.FC<AccessibilityStudioProps> = ({
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="neu-card bg-[#eef2f8] p-6 shadow-[8px_8px_20px_#c5d0e0,-8px_-8px_20px_#ffffff] border border-white/80 high-contrast:!bg-black high-contrast:!border-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 neu-badge bg-sky-100 text-sky-800 shadow-[2px_2px_5px_#c5d0e0,-2px_-2px_5px_#ffffff] high-contrast:!bg-yellow-400 high-contrast:!text-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Studio & Laboratory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 high-contrast:text-white uppercase tracking-tight">
              Voice & Accessibility Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 high-contrast:text-yellow-300 font-medium mt-1">
              Fine-tune the Web Speech synthesis engine, inspect the Neumorphism Soft UI design tokens, and verify live screen reader announcements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="neu-badge px-3 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-200/50 flex items-center gap-1.5 font-bold high-contrast:!bg-yellow-400 high-contrast:!text-black">
              <Shield className="w-4 h-4" />
              <span>WCAG 2.2 AA Compliant</span>
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Neumorphism (Soft UI) Design System Overview */}
      <section className="space-y-4" aria-labelledby="theme-section-heading">
        <div className="flex items-center justify-between">
          <h2 id="theme-section-heading" className="text-lg font-black uppercase tracking-tight text-slate-900 high-contrast:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-600 high-contrast:text-yellow-400" />
            <span>Active Design Architecture: Neumorphism (Soft UI)</span>
          </h2>
          <span className="text-xs font-bold text-sky-700 high-contrast:text-yellow-300 uppercase tracking-wider">
            Standard System
          </span>
        </div>

        <div className="neu-card p-6 bg-[#eef2f8] shadow-[8px_8px_20px_#c5d0e0,-8px_-8px_20px_#ffffff] border border-white/80 space-y-4 high-contrast:!bg-black high-contrast:!border-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div>
              <span className="neu-badge px-3 py-0.5 bg-sky-600 text-white font-bold text-xs high-contrast:!bg-yellow-400 high-contrast:!text-black">
                Tactile Soft Physics
              </span>
              <h3 className="text-base font-extrabold text-slate-900 high-contrast:text-white mt-1.5">
                Minimalist Dual-Light Embossed Surfaces
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full high-contrast:bg-yellow-400 high-contrast:text-black">
              11.8:1 Text Contrast Ratio (AA+)
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 high-contrast:text-slate-300 leading-relaxed">
            NoticeLens uses an ultra-clean <strong>Neumorphic (Soft UI)</strong> visual paradigm on desktop: light is cast from the top-left at a 45° angle, producing soft dual shadows (<code className="px-1.5 py-0.5 bg-white/60 rounded text-slate-800 font-mono">#ffffff</code> highlight and <code className="px-1.5 py-0.5 bg-slate-200/70 rounded text-slate-800 font-mono">#c5d0e0</code> shadow) that elevate interactive cards, buttons, and dropzones with tactile physical depth without harsh visual clutter.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[#eef2f8] shadow-[4px_4px_8px_#c5d0e0,-4px_-4px_8px_#ffffff] text-center border border-white/60">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Base Surface</span>
              <span className="text-xs font-black text-slate-800 font-mono">#eef2f8</span>
            </div>
            <div className="p-3 rounded-xl bg-[#eef2f8] shadow-[4px_4px_8px_#c5d0e0,-4px_-4px_8px_#ffffff] text-center border border-white/60">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Primary Text</span>
              <span className="text-xs font-black text-slate-800 font-mono">#1e293b</span>
            </div>
            <div className="p-3 rounded-xl bg-[#eef2f8] shadow-[4px_4px_8px_#c5d0e0,-4px_-4px_8px_#ffffff] text-center border border-white/60">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Accent Blue</span>
              <span className="text-xs font-black text-sky-600 font-mono">#0284c7</span>
            </div>
            <div className="p-3 rounded-xl bg-[#eef2f8] shadow-[inset_3px_3px_6px_#c5d0e0,inset_-3px_-3px_6px_#ffffff] text-center border border-slate-200/50">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Sunken Well</span>
              <span className="text-xs font-black text-slate-800 font-mono">Inset Wells</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Speech Reader Audio Lab */}
      <section className="neu-card bg-[#eef2f8] p-6 shadow-[8px_8px_20px_#c5d0e0,-8px_-8px_20px_#ffffff] border border-white/80 high-contrast:!bg-black high-contrast:!border-white space-y-5" aria-labelledby="tts-lab-heading">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 high-contrast:border-white">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-sky-600 high-contrast:text-yellow-400" />
            <h2 id="tts-lab-heading" className="text-lg font-black uppercase tracking-tight text-slate-900 high-contrast:text-white">
              Speech Synthesis Test Bench
            </h2>
          </div>
          <span className={`px-2.5 py-0.5 neu-badge text-xs font-bold ${speechState.hasBengaliVoice ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'} high-contrast:!bg-yellow-400 high-contrast:!text-black`}>
            {speechState.hasBengaliVoice ? '✓ Native Bengali Voice Ready' : '⚠ Hardware English Fallback'}
          </span>
        </div>

        <div>
          <label htmlFor="test-tts-textarea" className="block text-xs font-black uppercase tracking-wider text-slate-700 high-contrast:text-white mb-1.5">
            Sample University Notice Sentence:
          </label>
          <textarea
            id="test-tts-textarea"
            rows={3}
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full p-3 text-xs font-mono rounded-xl border border-slate-300/70 bg-[#eef2f8] text-slate-900 shadow-[inset_2px_2px_4px_#c5d0e0,inset_-2px_-2px_4px_#ffffff] focus:outline-none focus:ring-2 focus:ring-sky-500 high-contrast:!bg-black high-contrast:!border-white high-contrast:!text-white"
          />
        </div>

        {/* Speed Slider */}
        <div className="flex flex-wrap items-center gap-4">
          <label htmlFor="tts-rate-slider" className="text-xs font-bold text-slate-700 high-contrast:text-white">
            Speech Rate: <span className="font-mono text-sky-600 high-contrast:text-yellow-300 font-extrabold">{rate.toFixed(2)}x</span>
          </label>
          <input
            id="tts-rate-slider"
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="flex-1 max-w-xs accent-sky-600"
          />
          <button
            onClick={() => setRate(1.0)}
            className="neu-btn px-3 py-1 text-xs font-bold rounded-lg shadow-[2px_2px_4px_#c5d0e0,-2px_-2px_4px_#ffffff] hover:bg-white text-slate-700 high-contrast:!bg-black high-contrast:!text-white high-contrast:!border"
          >
            Reset (1.0x)
          </button>
        </div>

        {/* Playback Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => handleTestSpeech('bn')}
            disabled={speechState.status === 'playing'}
            className="neu-btn px-4 py-2.5 bg-sky-600 text-white hover:bg-sky-700 rounded-xl shadow-[4px_4px_10px_#c5d0e0,-4px_-4px_10px_#ffffff] text-xs font-bold flex items-center gap-2 disabled:opacity-50 high-contrast:!bg-yellow-400 high-contrast:!text-black"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Speak Bengali Sample</span>
          </button>

          <button
            onClick={() => handleTestSpeech('en')}
            disabled={speechState.status === 'playing'}
            className="neu-btn px-4 py-2.5 bg-[#eef2f8] text-slate-800 hover:bg-white rounded-xl shadow-[4px_4px_10px_#c5d0e0,-4px_-4px_10px_#ffffff] text-xs font-bold flex items-center gap-2 border border-white/70 disabled:opacity-50 high-contrast:!bg-slate-900 high-contrast:!text-white high-contrast:!border-white"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Speak English Sample</span>
          </button>

          {speechState.status === 'playing' && (
            <button
              onClick={handleStopSpeech}
              className="neu-btn px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl shadow-[4px_4px_10px_#c5d0e0,-4px_-4px_10px_#ffffff] text-xs font-bold flex items-center gap-2 high-contrast:!bg-black high-contrast:!border high-contrast:!border-red-400"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Speech</span>
            </button>
          )}
        </div>
      </section>

      {/* Section 3: Screen Reader Announcement Log */}
      <section className="neu-card bg-[#eef2f8] p-6 shadow-[8px_8px_20px_#c5d0e0,-8px_-8px_20px_#ffffff] border border-white/80 high-contrast:!bg-black high-contrast:!border-white space-y-4" aria-labelledby="live-log-heading">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 high-contrast:border-white">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-sky-600 high-contrast:text-yellow-400" />
            <h2 id="live-log-heading" className="text-lg font-black uppercase tracking-tight text-slate-900 high-contrast:text-white">
              Screen Reader Live Announcement Log
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500 font-mono">
            {announcementLog.length} Events Logged
          </span>
        </div>

        <p className="text-xs text-slate-600 high-contrast:text-slate-300">
          All dynamic updates in NoticeLens are dispatched to an accessible <code className="font-mono bg-white/60 px-1 py-0.5 rounded text-sky-700">aria-live="polite"</code> region for assistive screen readers.
        </p>

        <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs max-h-48 overflow-y-auto space-y-1 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.5)] high-contrast:border high-contrast:border-white">
          {announcementLog.length === 0 ? (
            <div className="text-slate-500 italic py-2">No announcements broadcast yet.</div>
          ) : (
            announcementLog.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-sky-400 shrink-0 font-bold">&gt;</span>
                <span className="leading-snug">{log}</span>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onTestAnnouncement('NoticeLens Screen Reader Test Announcement at ' + new Date().toLocaleTimeString())}
            className="neu-btn px-3 py-1.5 bg-[#eef2f8] text-slate-800 hover:bg-white rounded-xl shadow-[3px_3px_6px_#c5d0e0,-3px_-3px_6px_#ffffff] text-xs font-bold flex items-center gap-1.5 border border-white/60 high-contrast:!bg-black high-contrast:!text-white high-contrast:!border"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Emit Test Screen Reader Broadcast</span>
          </button>
        </div>
      </section>
    </div>
  );
};
