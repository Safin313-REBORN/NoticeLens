import React, { useState, useEffect } from 'react';
import { Volume2, Edit3, Check, X, Quote, AlertCircle } from 'lucide-react';
import { ExtractedField, EvidenceSnippet } from '../../types/notice';
import { speechService } from '../../services/speech/webSpeechService';

interface EvidenceFieldCardProps {
  field: ExtractedField;
  onUpdateField: (key: string, newValue: string) => void;
  onSelectEvidence?: (evidence: EvidenceSnippet) => void;
  isSelected?: boolean;
}

export const EvidenceFieldCard: React.FC<EvidenceFieldCardProps> = ({
  field,
  onUpdateField,
  onSelectEvidence,
  isSelected,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.value);

  useEffect(() => {
    setEditValue(field.value);
  }, [field.value]);

  const handleSave = () => {
    onUpdateField(field.key, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(field.value);
    setIsEditing(false);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    speechService.speak(`${field.label}: ${field.value}`, /[\u0980-\u09FF]/.test(field.value) ? 'bn' : 'en');
  };

  const isNotFound = field.status === 'not_found';
  const needsReview = field.status === 'needs_review' || field.isAmbiguous;
  const isUserEdited = field.status === 'user_edited';

  const [touchFeedback, setTouchFeedback] = useState<string | null>(null);
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = React.useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // Double-tap detection (< 300ms between taps)
    const now = Date.now();
    if (now - lastTapRef.current < 300 && !isEditing && !isNotFound) {
      setEditValue(field.value);
      setIsEditing(true);
      setTouchFeedback('Edit Mode Activated');
      setTimeout(() => setTouchFeedback(null), 1500);
    }
    lastTapRef.current = now;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const duration = Date.now() - touchStartRef.current.time;

    // Fast horizontal swipe (< 600ms, dx > 50px, horizontal dominates vertical)
    if (duration < 600 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      if (dx > 0) {
        // Swipe Right -> Speak aloud
        speechService.speak(`${field.label}: ${field.value}`, /[\u0980-\u09FF]/.test(field.value) ? 'bn' : 'en');
        setTouchFeedback('🔊 Reading Aloud');
        setTimeout(() => setTouchFeedback(null), 1500);
      } else {
        // Swipe Left -> Copy to clipboard
        try {
          navigator.clipboard.writeText(field.value);
          setTouchFeedback('📋 Copied to Clipboard');
          setTimeout(() => setTouchFeedback(null), 1500);
        } catch {
          // fallback
        }
      }
    }
    touchStartRef.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`p-4 transition-all relative select-none rounded-2xl ${
        isSelected
          ? 'border-2 border-sky-500 bg-sky-50 shadow-[6px_6px_14px_#c5d0e0,-6px_-6px_14px_#ffffff] ring-2 ring-sky-500 high-contrast:!bg-slate-900 high-contrast:!border-yellow-400 high-contrast:!ring-yellow-400'
          : isNotFound
          ? 'bg-slate-100/70 opacity-75 border border-slate-200 high-contrast:!bg-black high-contrast:!border-white/50'
          : 'bg-[#eef2f8] shadow-[5px_5px_12px_#c5d0e0,-5px_-5px_12px_#ffffff] hover:shadow-[7px_7px_16px_#b8c4d6,-7px_-7px_16px_#ffffff] border border-white/70 high-contrast:!bg-black high-contrast:!border-white'
      }`}
    >
      {/* Mobile Gesture Action Toast Badge */}
      {touchFeedback && (
        <div className="absolute top-2 right-2 z-20 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black shadow-lg animate-bounce high-contrast:bg-yellow-400 high-contrast:text-black">
          {touchFeedback}
        </div>
      )}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className="text-xs font-black uppercase text-ink-900 high-contrast:text-white flex items-center gap-1.5">
            {field.label}
            <span className="text-[11px] font-bold text-slate-500 high-contrast:text-yellow-300">
              ({field.labelBn})
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Status Badge */}
          <span
            className={`brutal-badge px-2 py-0.5 text-[10px] ${
              isUserEdited
                ? 'bg-neo-purple text-white high-contrast:bg-yellow-400 high-contrast:text-black'
                : needsReview
                ? 'bg-neo-coral text-white high-contrast:bg-yellow-400 high-contrast:text-black'
                : isNotFound
                ? 'bg-slate-200 text-slate-800 high-contrast:bg-slate-800 high-contrast:text-white'
                : 'bg-neo-mint text-black high-contrast:bg-yellow-400 high-contrast:text-black'
            }`}
          >
            {isUserEdited
              ? 'User Edited'
              : needsReview
              ? 'Review'
              : isNotFound
              ? 'Not Found'
              : 'Confirmed'}
          </span>

          {!isNotFound && !isEditing && (
            <button
              onClick={handleSpeak}
              aria-label={`Listen to ${field.label}`}
              className="p-1 border border-black bg-white hover:bg-neo-yellow text-black shadow-brutal-sm high-contrast:text-white"
            >
              <Volume2 className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          )}

          {!isEditing ? (
            <button
              onClick={() => {
                setEditValue(field.value);
                setIsEditing(true);
              }}
              aria-label={`Edit ${field.label}`}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500 high-contrast:text-white"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Field Value Display or Inline Edit */}
      {isEditing ? (
        <div className="mt-2 space-y-2">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={2}
            className="w-full p-2 text-xs font-semibold rounded-lg border border-teal-400 bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-teal-500 high-contrast:bg-black high-contrast:border-white high-contrast:text-white"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 high-contrast:border-white high-contrast:text-white"
            >
              <X className="w-3 h-3" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-md bg-teal-700 text-white hover:bg-teal-800 high-contrast:bg-yellow-400 high-contrast:text-black"
            >
              <Check className="w-3 h-3" />
              <span>Save Correction</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-1">
          <p
            className={`text-sm ${
              isNotFound
                ? 'text-slate-400 italic high-contrast:text-slate-400'
                : 'font-semibold text-ink-900 high-contrast:text-white'
            } whitespace-pre-line`}
          >
            {field.value}
          </p>

          {/* Uncertainty or Ambiguity Explanation */}
          {field.explanation && (
            <div className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-800 high-contrast:text-yellow-300">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 high-contrast:text-yellow-400" />
              <span className="leading-tight">{field.explanation}</span>
            </div>
          )}

          {/* User Override Indicator */}
          {isUserEdited && (
            <div className="mt-2 px-2 py-1 bg-purple-50 border border-purple-200 text-[11px] text-purple-900 font-medium high-contrast:bg-black high-contrast:border-yellow-400 high-contrast:text-yellow-300">
              <span className="font-bold">User Override:</span> Manually corrected value (overrides machine extraction).
            </div>
          )}

          {/* Supporting Evidence Snippet Pill */}
          {field.evidence && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 high-contrast:border-white/20">
              <button
                type="button"
                onClick={() => onSelectEvidence && onSelectEvidence(field.evidence!)}
                aria-label={`Highlight evidence in OCR text: ${field.evidence.text}`}
                className="text-left w-full group/ev flex items-start gap-1.5 text-[11px] text-slate-500 high-contrast:text-slate-300 hover:text-teal-800 transition-colors"
              >
                <Quote className="w-3 h-3 text-teal-600 shrink-0 mt-0.5 high-contrast:text-yellow-400" />
                <span className="line-clamp-2 italic group-hover/ev:underline">
                  {isUserEdited ? 'Original OCR Snippet: ' : 'Source: '}"{field.evidence.text}"
                  {isUserEdited && <span className="font-semibold text-slate-400 not-italic ml-1">(superseded)</span>}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mobile Pattern Gesture Legend Hint */}
      {!isNotFound && (
        <div className="md:hidden mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 high-contrast:text-yellow-300 select-none">
          <span>📱 Swipe 👉 speak</span>
          <span>•</span>
          <span>👈 copy</span>
          <span>•</span>
          <span>Tap 2x edit</span>
        </div>
      )}
    </div>
  );
};
