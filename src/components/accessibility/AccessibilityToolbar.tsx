import React, { useState, useEffect } from 'react';
import { Eye, Type, Volume2, AlertTriangle, Check } from 'lucide-react';
import { speechService } from '../../services/speech/webSpeechService';

export type TextScale = 'normal' | 'large' | 'xlarge';

interface AccessibilityToolbarProps {
  onAnnouncement?: (text: string) => void;
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({ onAnnouncement }) => {
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('noticelens_high_contrast') === 'true';
  });

  const [textScale, setTextScale] = useState<TextScale>(() => {
    return (localStorage.getItem('noticelens_text_scale') as TextScale) || 'normal';
  });

  const [hasBnVoice, setHasBnVoice] = useState<boolean>(false);

  useEffect(() => {
    // Apply High Contrast class to document root & body
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    localStorage.setItem('noticelens_high_contrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    // Apply Text Scale classes
    document.body.classList.remove('text-scale-large', 'text-scale-xlarge');
    if (textScale === 'large') {
      document.body.classList.add('text-scale-large');
    } else if (textScale === 'xlarge') {
      document.body.classList.add('text-scale-xlarge');
    }
    localStorage.setItem('noticelens_text_scale', textScale);
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
      className="bg-ink-800 text-slate-100 px-4 py-2 text-xs font-medium border-b border-ink-700 high-contrast:bg-black high-contrast:border-white"
      aria-label="Accessibility & Display Options"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Visual Assist Controls */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 high-contrast:text-yellow-300 font-semibold uppercase tracking-wider text-[11px] mr-1">
            Display Mode:
          </span>

          <button
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 ${
              highContrast
                ? 'bg-yellow-400 text-black border-yellow-400 font-bold'
                : 'bg-ink-700/80 text-slate-200 border-ink-600 hover:bg-ink-600'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>High Contrast (7:1+)</span>
          </button>

          <button
            onClick={cycleTextScale}
            aria-label={`Adjust reading text size, currently ${textScale}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-ink-700/80 text-slate-200 border-ink-600 hover:bg-ink-600 focus-visible:ring-2 focus-visible:ring-teal-400 high-contrast:border-white high-contrast:text-white"
          >
            <Type className="w-3.5 h-3.5" />
            <span>
              Text Size:{' '}
              <strong className="text-teal-300 high-contrast:text-yellow-300 capitalize">
                {textScale === 'xlarge' ? 'Extra Large (130%)' : textScale === 'large' ? 'Large (115%)' : 'Normal'}
              </strong>
            </span>
          </button>
        </div>

        {/* TTS Device Voice Discovery Indicator */}
        <div className="flex items-center gap-2 text-slate-300 high-contrast:text-white">
          <Volume2 className="w-4 h-4 text-teal-400 high-contrast:text-yellow-300 shrink-0" />
          {hasBnVoice ? (
            <span className="inline-flex items-center gap-1 text-teal-300 font-medium">
              <Check className="w-3.5 h-3.5" /> Bengali Voice Ready
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-amber-300 high-contrast:text-yellow-300"
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
