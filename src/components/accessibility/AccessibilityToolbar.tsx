import React, { useState, useEffect } from 'react';
import { Eye, Type, Volume2, AlertTriangle, Check } from 'lucide-react';
import { speechService } from '../../services/speech/webSpeechService';

export type TextScale = 'normal' | 'large' | 'xlarge';

interface AccessibilityToolbarProps {
  onAnnouncement?: (text: string) => void;
}

function safeGetStorage(key: string, fallback: string | null = null): string | null {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function safeSetStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore restricted storage environments
  }
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({
  onAnnouncement,
}) => {
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return safeGetStorage('noticelens_high_contrast') === 'true';
  });

  const [textScale, setTextScale] = useState<TextScale>(() => {
    return (safeGetStorage('noticelens_text_scale') as TextScale) || 'normal';
  });

  const [hasBnVoice, setHasBnVoice] = useState<boolean>(false);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
      document.body.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
      document.body.classList.remove('high-contrast');
    }
    safeSetStorage('noticelens_high_contrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    document.body.classList.remove('text-scale-large', 'text-scale-xlarge');
    if (textScale === 'large') {
      document.body.classList.add('text-scale-large');
    } else if (textScale === 'xlarge') {
      document.body.classList.add('text-scale-xlarge');
    }
    safeSetStorage('noticelens_text_scale', textScale);
  }, [textScale]);

  useEffect(() => {
    const updateVoiceStatus = () => {
      setHasBnVoice(speechService.hasBengaliVoice());
    };
    updateVoiceStatus();
    const unsub = speechService.subscribe(() => {
      updateVoiceStatus();
    });
    return () => unsub();
  }, []);

  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    if (onAnnouncement) {
      onAnnouncement(next ? 'High contrast mode enabled' : 'Standard contrast mode restored');
    }
  };

  const cycleTextScale = () => {
    let next: TextScale = 'normal';
    if (textScale === 'normal') next = 'large';
    else if (textScale === 'large') next = 'xlarge';
    else next = 'normal';

    setTextScale(next);
    if (onAnnouncement) {
      onAnnouncement(`Text size adjusted to ${next === 'xlarge' ? 'Extra Large' : next === 'large' ? 'Large' : 'Normal'}`);
    }
  };

  return (
    <aside
      className="bg-slate-900 text-slate-100 px-4 py-2 text-xs font-medium border-b border-slate-800 high-contrast:!bg-black high-contrast:!border-white"
      aria-label="Accessibility & Display Options"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Visual Assist Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sky-400 font-bold uppercase tracking-wider text-[11px] mr-1 high-contrast:text-yellow-400">
            Display Engine:
          </span>

          <button
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              highContrast
                ? 'bg-yellow-400 text-black border-2 border-white'
                : 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>High Contrast Mode</span>
          </button>

          <button
            onClick={cycleTextScale}
            aria-label={`Adjust reading text size, currently ${textScale}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 transition-all"
          >
            <Type className="w-3.5 h-3.5" />
            <span>
              Scale:{' '}
              <strong className="text-sky-400 high-contrast:text-yellow-400">
                {textScale === 'xlarge' ? '130%' : textScale === 'large' ? '115%' : '100%'}
              </strong>
            </span>
          </button>
        </div>

        {/* TTS Device Voice Discovery Indicator */}
        <div className="flex items-center gap-2 text-white">
          <Volume2 className="w-4 h-4 text-sky-400 high-contrast:text-yellow-400 shrink-0" />
          {hasBnVoice ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
              <Check className="w-3.5 h-3.5 stroke-[3]" /> Bengali TTS Ready
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-amber-300 font-bold"
              title="This device does not have an installed Bengali speech engine; english fallback voice will be used."
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Bengali Voice: Hardware Fallback</span>
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
