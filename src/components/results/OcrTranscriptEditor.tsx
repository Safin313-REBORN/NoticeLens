import React, { useState, useEffect } from 'react';
import { FileText, Copy, Check, RefreshCw, Volume2, Info } from 'lucide-react';
import { EvidenceSnippet } from '../../types/notice';
import { speechService } from '../../services/speech/webSpeechService';

interface OcrTranscriptEditorProps {
  ocrText: string;
  ocrConfidence?: number;
  sourceType?: 'upload' | 'camera' | 'demo' | 'manual';
  selectedEvidence?: EvidenceSnippet | null;
  onApplyTranscriptEdit: (newText: string) => void;
  onCopySuccess: () => void;
}

export const OcrTranscriptEditor: React.FC<OcrTranscriptEditorProps> = ({
  ocrText,
  ocrConfidence,
  sourceType,
  selectedEvidence,
  onApplyTranscriptEdit,
  onCopySuccess,
}) => {
  const [editableText, setEditableText] = useState(ocrText);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditableText(ocrText);
  }, [ocrText]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableText);
      setCopied(true);
      onCopySuccess();
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  const handleSpeakAll = () => {
    speechService.speak(editableText, /[\u0980-\u09FF]/.test(editableText) ? 'bn' : 'en');
  };

  const handleApplyChanges = () => {
    onApplyTranscriptEdit(editableText);
    setIsEditing(false);
  };

  // Render text with evidence snippet highlighted
  const renderHighlightedText = () => {
    if (!selectedEvidence || !selectedEvidence.text) {
      return editableText;
    }

    const target = selectedEvidence.text;
    let start = selectedEvidence.startIndex;
    let end = selectedEvidence.endIndex;

    // Check if the indexed slice directly matches the snippet text
    if (
      typeof start === 'number' &&
      typeof end === 'number' &&
      start >= 0 &&
      end <= editableText.length &&
      editableText.substring(start, end) === target
    ) {
      // Precise indexed match
    } else {
      // Fallback search
      const idx = editableText.indexOf(target);
      if (idx === -1) return editableText;
      start = idx;
      end = idx + target.length;
    }

    const before = editableText.substring(0, start);
    const match = editableText.substring(start, end);
    const after = editableText.substring(end);

    return (
      <>
        {before}
        <mark
          className="bg-[#FFE17D] text-black font-black px-1.5 py-0.5 border-b-2 border-black high-contrast:bg-yellow-400 high-contrast:text-black"
          title={`Supporting evidence for: ${selectedEvidence.matchedKeyword || 'extracted field'}`}
        >
          {match}
        </mark>
        {after}
      </>
    );
  };

  return (
    <section
      className="brutal-card bg-white overflow-hidden high-contrast:bg-black high-contrast:border-white"
      aria-labelledby="ocr-transcript-heading"
    >
      {/* Transcript Header */}
      <div className="border-b-3 border-black bg-neo-mint text-black px-6 py-4 flex flex-wrap items-center justify-between gap-3 high-contrast:bg-black high-contrast:border-b-2 high-contrast:border-white">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-black high-contrast:text-yellow-400 stroke-[2.5]" />
          <h2 id="ocr-transcript-heading" className="text-base font-black uppercase text-ink-900 high-contrast:text-white">
            OCR Document Transcript
          </h2>
          {ocrConfidence !== undefined && ocrConfidence > 0 ? (
            <span
              className="brutal-badge text-[10px] px-2 py-0.5 bg-neo-yellow text-black font-black"
              title="Tesseract engine character confidence estimate. Does not guarantee overall factual validity."
            >
              OCR Conf: {Math.round(ocrConfidence)}%
            </span>
          ) : (
            <span
              className="brutal-badge text-[10px] px-2 py-0.5 bg-slate-200 text-slate-800 font-bold"
              title={sourceType === 'demo' ? 'Pre-bundled sample fixture (live OCR was not executed)' : 'User-edited transcript'}
            >
              {sourceType === 'demo' ? 'Preset Sample (No OCR)' : 'Transcript'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSpeakAll}
            aria-label="Read full raw transcript aloud"
            className="brutal-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-xs font-bold high-contrast:bg-slate-900 high-contrast:border-white high-contrast:text-white"
          >
            <Volume2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Read All</span>
          </button>

          <button
            onClick={handleCopy}
            aria-label="Copy recognized text to clipboard"
            className="brutal-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-bold high-contrast:bg-yellow-400 high-contrast:text-black"
          >
            {copied ? <Check className="w-3.5 h-3.5 stroke-[2.5] text-neo-mint" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Transparent Confidence Guidance Note */}
        <div className="mb-4 p-3 border-2 border-black bg-[#FFFDF0] text-xs text-ink-900 shadow-brutal-sm high-contrast:bg-slate-900 high-contrast:border-yellow-400 high-contrast:text-yellow-300 flex items-start gap-2">
          <Info className="w-4 h-4 text-black shrink-0 mt-0.5 stroke-[2.5] high-contrast:text-yellow-400" />
          <p className="leading-relaxed font-medium">
            <strong>Editable Source:</strong> If Bengali font or low lighting caused an OCR typo, edit the text below and click <strong>Apply Changes & Re-derive</strong>. NoticeLens will synchronously re-derive all dates, deadlines, and summaries.
          </p>
        </div>

        {/* Selected Evidence Highlight Banner */}
        {selectedEvidence && (
          <div className="mb-3 px-3 py-2 bg-neo-yellow/20 border-2 border-black text-xs font-bold text-ink-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-neo-yellow border border-black inline-block"></span>
              <span>
                Highlighting citation for:{' '}
                <strong>{selectedEvidence.matchedKeyword || selectedEvidence.text}</strong>
              </span>
            </span>
            <span className="text-[10px] text-slate-500 font-semibold uppercase">
              Position: {selectedEvidence.startIndex}..{selectedEvidence.endIndex}
            </span>
          </div>
        )}

        {/* Transcript Body: Read-only Citation View vs Editable Textarea */}
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              rows={12}
              className="w-full p-4 text-xs font-mono border-2 border-black bg-white text-ink-900 shadow-brutal-sm focus:outline-none focus:ring-2 focus:ring-black high-contrast:bg-black high-contrast:border-white high-contrast:text-white leading-relaxed"
              aria-label="Editable OCR transcript"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditableText(ocrText);
                  setIsEditing(false);
                }}
                className="brutal-btn px-4 py-2 bg-white text-black text-xs font-bold hover:bg-slate-100 high-contrast:bg-black high-contrast:text-white high-contrast:border-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyChanges}
                className="brutal-btn inline-flex items-center gap-2 px-4 py-2 bg-neo-yellow text-black text-xs font-black hover:bg-yellow-300 shadow-brutal-sm high-contrast:bg-yellow-400 high-contrast:text-black"
              >
                <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Apply Changes & Re-derive</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div
              tabIndex={0}
              role="region"
              aria-label="Recognized notice text with highlighted citation"
              className="w-full p-4 text-xs font-mono bg-slate-50 border-2 border-black max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-brutal-sm focus:outline-none focus:ring-2 focus:ring-black high-contrast:bg-black high-contrast:border-white high-contrast:text-white"
            >
              {renderHighlightedText()}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-500 high-contrast:text-slate-400">
                Found a typo? You can correct any sentence above.
              </p>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="brutal-btn px-4 py-1.5 bg-white text-black text-xs font-black hover:bg-slate-100 shadow-brutal-sm high-contrast:bg-yellow-400 high-contrast:text-black"
              >
                Edit Transcript
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
