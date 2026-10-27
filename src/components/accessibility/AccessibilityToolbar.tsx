import React, { useState, useEffect } from 'react';
import { Eye, Type, Volume2, AlertTriangle, Check, Palette } from 'lucide-react';
import { speechService } from '../../services/speech/webSpeechService';
import { UITheme } from '../../types/notice';

export type TextScale = 'normal' | 'large' | 'xlarge';

interface AccessibilityToolbarProps {
  onAnnouncement?: (text: string) => void;
  currentTheme?: UITheme;
  onThemeChange?: (theme: UITheme) => void;
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
  currentTheme = 'neobrutalist',
  onThemeChange,
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
      className="bg-black text-white px-4 py-2 text-xs font-bold border-b-2 border-black high-contrast:bg-black high-contrast:border-white"
      aria-label="Accessibility & Display Options"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Visual Assist Controls */}
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 font-black uppercase tracking-wider text-[11px] mr-1">
            Display Engine:
          </span>

          <button
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase brutal-btn ${
              highContrast
                ? 'bg-yellow-400 text-black border-2 border-white'
                : 'bg-zinc-800 text-white border-2 border-white/50 hover:bg-zinc-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>High Contrast Mode</span>
          </button>

          <button
            onClick={cycleTextScale}
            aria-label={`Adjust reading text size, currently ${textScale}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase brutal-btn bg-zinc-800 text-white border-2 border-white/50 hover:bg-zinc-700"
          >
            <Type className="w-3.5 h-3.5" />
            <span>
              Scale:{' '}
              <strong className="text-yellow-400">
                {textScale === 'xlarge' ? '130%' : textScale === 'large' ? '115%' : '100%'}
              </strong>
            </span>
          </button>

          {onThemeChange && (
            <div className="hidden md:flex items-center gap-1 ml-2 pl-2 border-l border-zinc-700">
              <Palette className="w-3.5 h-3.5 text-yellow-400 mr-1" />
              {(['neobrutalist', 'memphis', 'artdeco', 'retroterminal'] as UITheme[]).map((thm) => (
                <button
                  key={thm}
                  onClick={() => onThemeChange(thm)}
                  className={`px-2 py-0.5 text-[10px] font-black uppercase brutal-badge border ${
                    currentTheme === thm
                      ? 'bg-yellow-400 text-black border-white'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-white'
                  }`}
                >
                  {thm === 'neobrutalist' ? 'Neo-Brutal' : thm === 'memphis' ? 'Memphis' : thm === 'artdeco' ? 'Art Deco' : 'Terminal'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TTS Device Voice Discovery Indicator */}
        <div className="flex items-center gap-2 text-white">
          <Volume2 className="w-4 h-4 text-yellow-400 shrink-0" />
          {hasBnVoice ? (
            <span className="inline-flex items-center gap-1 text-neo-mint font-bold">
              <Check className="w-3.5 h-3.5 stroke-[3]" /> Bengali TTS Ready
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-yellow-300 font-bold"
              title="This device does not have an installed Bengali speech engine; english fallback voice will be used."
            >
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span>Bengali Voice: Hardware Fallback</span>
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
