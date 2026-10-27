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
      className="brutal-card bg-white overflow-hidden high-contrast:bg-black high-contrast:border-white"
      aria-labelledby="ocr-transcript-heading"
    >
      {/* Transcript Header */}
      <div className="border-b-3 border-black bg-neo-mint text-black px-6 py-4 flex flex-wrap items-center justify-between gap-3 high-contrast:bg-black high-contrast:border-b-2 high-contrast:border-white">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-black high-contrast:text-yellow-400 stroke-[2.5]" />
          <h2 id="ocr-transcript-heading" className="text-base font-black uppercase text-ink-900 high-contrast:text-white">
            Raw OCR Transcript
          </h2>
          {ocrConfidence !== undefined && ocrConfidence > 0 && (
            <span
              className="brutal-badge text-[10px] px-2 py-0.5 bg-neo-yellow text-black font-black"
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
            <strong>Editable Source:</strong> If Bengali font or low lighting caused an OCR typo, edit the text below and click <strong>Re-extract Details</strong>. NoticeLens will re-derive all dates, deadlines, and summaries.
          </p>
        </div>

        {/* Selected Evidence Highlight Banner */}
        {selectedEvidence && (
          <div className="mb-4 p-2.5 border-2 border-black bg-[#FFE17D] text-xs text-ink-900 shadow-brutal-sm high-contrast:bg-slate-900 high-contrast:border-white high-contrast:text-yellow-300 flex items-center justify-between">
            <span className="font-bold">
              Highlighted Evidence: "{selectedEvidence.text}"
            </span>
            <span className="brutal-badge text-[9px] bg-black text-white px-1.5 py-0.5">
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
            className="w-full p-4 text-xs font-mono leading-relaxed border-2 border-black bg-[#FFFDF0] text-ink-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black shadow-brutal-sm transition-colors high-contrast:bg-black high-contrast:border-white high-contrast:text-white"
          />
        </div>

        {/* Highlight Preview display if an evidence snippet is chosen */}
        {selectedEvidence && !isEditing && (
          <div className="mt-3 p-3 border-2 border-black bg-white text-xs font-sans whitespace-pre-line leading-relaxed shadow-brutal-sm high-contrast:bg-black high-contrast:border-white high-contrast:text-white">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
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
              className="brutal-btn px-4 py-2 bg-white text-black text-xs font-bold hover:bg-slate-100 high-contrast:border-white high-contrast:text-white"
            >
              Reset to Original OCR
            </button>
            <button
              onClick={handleApplyChanges}
              className="brutal-btn inline-flex items-center gap-1.5 px-4 py-2 bg-neo-yellow text-black text-xs font-black shadow-brutal hover:bg-yellow-300 high-contrast:bg-yellow-400 high-contrast:text-black"
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Re-extract Details from Edited Text</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
