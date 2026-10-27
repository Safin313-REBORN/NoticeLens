import React, { useState } from 'react';
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

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isSelected
          ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-400 high-contrast:bg-slate-900 high-contrast:border-yellow-400 high-contrast:ring-yellow-400'
          : isNotFound
          ? 'border-slate-200 bg-slate-50/60 opacity-80 high-contrast:bg-black high-contrast:border-white/30'
          : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm high-contrast:bg-black high-contrast:border-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className="text-xs font-bold text-ink-900 high-contrast:text-white flex items-center gap-1.5">
            {field.label}
            <span className="text-[11px] font-normal text-slate-500 high-contrast:text-yellow-300">
              ({field.labelBn})
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Status Badge */}
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              isUserEdited
                ? 'bg-blue-100 text-blue-800 border border-blue-200 high-contrast:bg-yellow-400 high-contrast:text-black'
                : needsReview
                ? 'bg-amber-100 text-amber-900 border border-amber-300 high-contrast:bg-yellow-400 high-contrast:text-black'
                : isNotFound
                ? 'bg-slate-200 text-slate-700 border border-slate-300 high-contrast:bg-slate-800 high-contrast:text-white'
                : 'bg-teal-100 text-teal-800 border border-teal-200 high-contrast:bg-yellow-400 high-contrast:text-black'
            }`}
          >
            {isUserEdited
              ? 'User Edited'
              : needsReview
              ? 'Needs Review'
              : isNotFound
              ? 'Not Found'
              : 'Confirmed'}
          </span>

          {!isNotFound && !isEditing && (
            <button
              onClick={handleSpeak}
              aria-label={`Listen to ${field.label}`}
              className="p-1 rounded text-slate-400 hover:text-teal-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500 high-contrast:text-white"
            >
              <Volume2 className="w-3.5 h-3.5" />
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
                  Source: "{field.evidence.text}"
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
