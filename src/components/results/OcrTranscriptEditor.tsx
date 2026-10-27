import React, { useState, useEffect } from 'react';
import { FileText, Copy, Check, RefreshCw, Volume2, Info } from 'lucide-react';
import { EvidenceSnippet } from '../../types/notice';
import { speechService } from '../../services/speech/webSpeechService';

interface OcrTranscriptEditorProps {
  ocrText: string;
  ocrConfidence?: number;
  selectedEvidence?: EvidenceSnippet | null;
  onTextChange: (newText: string) => void;
  onReExtract: () => void;
  onCopySuccess: () => void;
}

export const OcrTranscriptEditor: React.FC<OcrTranscriptEditorProps> = ({
  ocrText,
  ocrConfidence,
  selectedEvidence,
  onTextChange,
  onReExtract,
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
    onTextChange(editableText);
    onReExtract();
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
        <mark className="evidence-highlight">{match}</mark>
        {after}
      </>
    );
  };

  return (
    <section
      className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden high-contrast:bg-black high-contrast:border-white"
      aria-labelledby="ocr-transcript-heading"
    >
      {/* Transcript Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 high-contrast:bg-black high-contrast:border-white">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-700 high-contrast:text-yellow-400" />
          <h2 id="ocr-transcript-heading" className="text-base font-bold text-ink-900 high-contrast:text-white">
            Raw OCR Transcript
          </h2>
          {ocrConfidence !== undefined && ocrConfidence > 0 && (
            <span
              className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 high-contrast:bg-yellow-400 high-contrast:text-black font-semibold"
              title="Raw OCR engine character score. Does not guarantee overall factual validity."
            >
              OCR Conf: {Math.round(ocrConfidence)}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSpeakAll}
            aria-label="Read full raw transcript aloud"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 high-contrast:bg-slate-900 high-contrast:border-white high-contrast:text-white"
          >
            <Volume2 className="w-3.5 h-3.5 text-teal-600 high-contrast:text-yellow-400" />
            <span>Read All</span>
          </button>

          <button
            onClick={handleCopy}
            aria-label="Copy recognized text to clipboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 high-contrast:bg-slate-900 high-contrast:border-white high-contrast:text-white"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Transparent Confidence Guidance Note */}
        <div className="mb-4 p-3 rounded-xl bg-teal-50/60 border border-teal-200/80 text-xs text-teal-900 high-contrast:bg-slate-900 high-contrast:border-yellow-400 high-contrast:text-yellow-300 flex items-start gap-2">
          <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5 high-contrast:text-yellow-400" />
          <p className="leading-relaxed">
            <strong>Editable Source:</strong> If Bengali font or low lighting caused an OCR typo, edit the text below and click <strong>Re-extract Details</strong>. NoticeLens will re-derive all dates, deadlines, and summaries.
          </p>
        </div>

        {/* Selected Evidence Highlight Banner */}
        {selectedEvidence && (
          <div className="mb-4 p-2.5 rounded-lg bg-yellow-50 border border-yellow-300 text-xs text-yellow-900 high-contrast:bg-slate-900 high-contrast:border-white high-contrast:text-yellow-300 flex items-center justify-between">
            <span className="font-semibold">
              Highlighted Evidence: "{selectedEvidence.text}"
            </span>
            <span className="text-[10px] font-mono uppercase bg-yellow-200 px-1.5 py-0.5 rounded high-contrast:bg-black high-contrast:text-white">
              CITED SNIPPET
            </span>
          </div>
        )}

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={editableText}
            onChange={(e) => {
              setEditableText(e.target.value);
              setIsEditing(true);
            }}
            rows={12}
            aria-label="Editable OCR recognized text"
            className="w-full p-4 text-xs font-mono leading-relaxed rounded-xl border border-slate-300 bg-slate-50/50 text-ink-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors high-contrast:bg-black high-contrast:border-white high-contrast:text-white"
          />
        </div>

        {/* Highlight Preview display if an evidence snippet is chosen */}
        {selectedEvidence && !isEditing && (
          <div className="mt-3 p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-sans whitespace-pre-line leading-relaxed high-contrast:bg-black high-contrast:border-white high-contrast:text-white">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Live Snippet Highlighting:
            </span>
            {renderHighlightedText()}
          </div>
        )}

        {/* Re-extract Action */}
        {isEditing && (
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setEditableText(ocrText);
                setIsEditing(false);
              }}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 high-contrast:border-white high-contrast:text-white"
            >
              Reset to Original OCR
            </button>
            <button
              onClick={handleApplyChanges}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition-colors shadow-md high-contrast:bg-yellow-400 high-contrast:text-black"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-extract Details from Edited Text</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
