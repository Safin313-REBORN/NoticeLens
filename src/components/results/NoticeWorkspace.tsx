import { useState } from 'react';
import { ProcessedNotice, EvidenceSnippet } from '../../types/notice';
import { AccessibleSummaryCard } from './AccessibleSummaryCard';
import { EvidenceFieldCard } from './EvidenceFieldCard';
import { OcrTranscriptEditor } from './OcrTranscriptEditor';
import { DeadlineActionCard } from './DeadlineActionCard';
import { ActionChecklistCard } from './ActionChecklistCard';
import { DeadlineTimelineCard } from './DeadlineTimelineCard';
import { AccessibleReadingView } from './AccessibleReadingView';
import { Image as ImageIcon, CheckCircle2, AlertTriangle, Layers, BookOpen } from 'lucide-react';

interface NoticeWorkspaceProps {
  notice: ProcessedNotice;
  onUpdateNoticeField: (key: string, newValue: string) => void;
  onApplyTranscriptEdit: (newText: string) => void;
  onSaveNotice: () => void;
  isSaved: boolean;
  hasUnsavedChanges?: boolean;
  onCopySuccess: () => void;
  onDownloadIcsSuccess: () => void;
  onConfirmNoticeField?: (key: string, correctedValue?: string) => Promise<ProcessedNotice | null> | void;
}

export const NoticeWorkspace: React.FC<NoticeWorkspaceProps> = ({
  notice,
  onUpdateNoticeField,
  onApplyTranscriptEdit,
  onSaveNotice,
  isSaved,
  hasUnsavedChanges = false,
  onCopySuccess,
  onDownloadIcsSuccess,
  onConfirmNoticeField,
}) => {
  const [viewMode, setViewMode] = useState<'workspace' | 'reading'>('workspace');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceSnippet | null>(null);
  const [showOriginalImage, setShowOriginalImage] = useState<boolean>(true);
  const [fieldFilter, setFieldFilter] = useState<'all' | 'needs_review' | 'found'>('all');

  const allFields = Object.values(notice.fields);

  const filteredFields = allFields.filter((f) => {
    if (fieldFilter === 'needs_review') return f.status === 'needs_review' || f.isAmbiguous;
    if (fieldFilter === 'found') return f.status !== 'not_found';
    return true;
  });

  const needsReviewCount = allFields.filter((f) => f.status === 'needs_review' || f.isAmbiguous).length;
  const confirmedCount = allFields.filter((f) => f.status === 'confirmed').length;

  if (viewMode === 'reading') {
    return (
      <AccessibleReadingView
        notice={notice}
        onExitReadingMode={() => setViewMode('workspace')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Prominent Historical Demo Notice Disclaimer */}
      {notice.sourceType === 'demo' && (
        <div
          role="region"
          aria-label="Demonstration Notice Disclaimer"
          className="neu-card p-4 bg-amber-50/95 border-2 border-amber-500/80 rounded-2xl flex items-start gap-3.5 high-contrast:!bg-black high-contrast:!border-yellow-400"
        >
          <AlertTriangle className="w-5 h-5 text-amber-700 high-contrast:text-yellow-400 shrink-0 mt-0.5 stroke-[2.5]" />
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-950 high-contrast:text-yellow-300">
              FICTIONAL DEMONSTRATION NOTICE — NOT AN OFFICIAL UNIVERSITY ANNOUNCEMENT
            </h2>
            <p className="text-xs text-amber-900/90 high-contrast:text-white mt-0.5 leading-relaxed">
              This notice contains fictional educational sample data designed strictly for regression verification, accessibility testing, and judging demonstration. Contact details, dates, and circular text are synthetic demonstrations and not authentic institutional announcements.
            </p>
          </div>
        </div>
      )}

      {/* Workspace Subheader Banner */}
      <div className="neu-card flex flex-wrap items-center justify-between gap-4 p-5 high-contrast:!bg-black high-contrast:!border-white">
        <div>
          <span className="neu-badge text-xs px-3 py-1 bg-sky-100 text-sky-800 font-bold inline-block high-contrast:!bg-yellow-400 high-contrast:!text-black">
            {notice.fields.category.value} Notice
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 high-contrast:text-white mt-2 uppercase tracking-tight">
            {notice.title}
          </h1>
          <p className="text-xs font-bold text-slate-500 high-contrast:text-yellow-300 mt-1 uppercase tracking-wider">
            Issued by: {notice.fields.institution.value}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setViewMode('reading')}
            aria-label="Switch to accessible low-vision reading mode"
            className="neu-btn flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-sky-700 high-contrast:!bg-yellow-400 high-contrast:!text-black shadow-sm"
          >
            <BookOpen className="w-4 h-4 stroke-[2.5]" />
            <span>Low-Vision Reading Mode</span>
          </button>

          <div className="neu-badge flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-bold high-contrast:!bg-yellow-400 high-contrast:!text-black">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>{confirmedCount} Confirmed Facts</span>
          </div>

          {needsReviewCount > 0 && (
            <div className="neu-badge flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200/60 font-bold high-contrast:!bg-yellow-400 high-contrast:!text-black">
              <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
              <span>{needsReviewCount} Needs Review</span>
            </div>
          )}
        </div>
      </div>

      {/* Deadline Action Header */}
      <DeadlineActionCard
        notice={notice}
        onSave={onSaveNotice}
        isSaved={isSaved}
        hasUnsavedChanges={hasUnsavedChanges}
        onDownloadIcsSuccess={onDownloadIcsSuccess}
        onConfirmDate={onConfirmNoticeField}
      />

      {/* Comprehensive Date Disambiguation Timeline */}
      <DeadlineTimelineCard
        notice={notice}
        onSelectDateSnippet={(snippet) => setSelectedEvidence({ text: snippet, startIndex: 0, endIndex: snippet.length, confidence: 'high' })}
      />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Plain Summary, Action Checklist & Key Structured Fields */}
        <div className="lg:col-span-7 space-y-6">
          <AccessibleSummaryCard notice={notice} />

          {/* Interactive Notice-to-Action Checklist */}
          <ActionChecklistCard notice={notice} />

          {/* Structured Fields Section */}
          <section
            className="neu-card p-6 high-contrast:!bg-black high-contrast:!border-white"
            aria-labelledby="fields-section-heading"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/80 high-contrast:border-white">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-600 high-contrast:text-yellow-400 stroke-[2.5]" />
                <h2 id="fields-section-heading" className="text-base font-bold uppercase text-slate-900 high-contrast:text-white">
                  Extracted Notice Details ({filteredFields.length})
                </h2>
              </div>

              {/* Filter controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFieldFilter('all')}
                  className={`neu-btn px-3 py-1 text-xs font-bold ${
                    fieldFilter === 'all'
                      ? 'bg-sky-600 text-white high-contrast:!bg-yellow-400 high-contrast:!text-black'
                      : 'text-slate-700 hover:text-slate-900 high-contrast:!text-white'
                  }`}
                >
                  All ({allFields.length})
                </button>
                <button
                  onClick={() => setFieldFilter('needs_review')}
                  className={`neu-btn px-3 py-1 text-xs font-bold ${
                    fieldFilter === 'needs_review'
                      ? 'bg-sky-600 text-white high-contrast:!bg-yellow-400 high-contrast:!text-black'
                      : 'text-slate-700 hover:text-slate-900 high-contrast:!text-white'
                  }`}
                >
                  Review ({needsReviewCount})
                </button>
                <button
                  onClick={() => setFieldFilter('found')}
                  className={`neu-btn px-3 py-1 text-xs font-bold ${
                    fieldFilter === 'found'
                      ? 'bg-sky-600 text-white high-contrast:!bg-yellow-400 high-contrast:!text-black'
                      : 'text-slate-700 hover:text-slate-900 high-contrast:!text-white'
                  }`}
                >
                  Found ({allFields.filter((f) => f.status !== 'not_found').length})
                </button>
              </div>
            </div>

            {/* Field Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredFields.map((field) => (
                <EvidenceFieldCard
                  key={field.key}
                  field={field}
                  onUpdateField={onUpdateNoticeField}
                  onSelectEvidence={(ev) => setSelectedEvidence(ev)}
                  isSelected={selectedEvidence?.text === field.evidence?.text && field.evidence !== null}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (5 cols): Evidence Inspector, OCR Transcript & Document Preview */}
        <div className="lg:col-span-5 space-y-6">
          {/* Document Preview Card if image data exists */}
          {notice.imageDataUrl ? (
            <div className="neu-card overflow-hidden high-contrast:!bg-black high-contrast:!border-white">
              <div className="px-5 py-3 border-b border-slate-200/80 flex items-center justify-between high-contrast:border-white">
                <span className="text-xs font-bold uppercase text-slate-800 high-contrast:text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-sky-600 high-contrast:text-yellow-400 stroke-[2.5]" />
                  <span>Original Document Preview</span>
                </span>
                <button
                  onClick={() => setShowOriginalImage(!showOriginalImage)}
                  className="text-xs font-bold uppercase text-sky-600 hover:underline high-contrast:text-yellow-300"
                >
                  {showOriginalImage ? 'Collapse' : 'Expand'}
                </button>
              </div>
              {showOriginalImage && (
                <div className="p-3 neu-inset m-3 rounded-xl flex items-center justify-center max-h-64 overflow-hidden high-contrast:bg-slate-950">
                  <img
                    src={notice.imageDataUrl}
                    alt="Original scanned notice"
                    className="max-h-60 w-auto object-contain rounded-lg"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="neu-card p-4 high-contrast:!bg-black high-contrast:!border-white text-center">
              <ImageIcon className="w-5 h-5 mx-auto text-slate-500 mb-1" />
              <p className="text-[11px] font-bold text-slate-600 high-contrast:text-slate-300">
                Original image was not stored in fallback storage.
              </p>
              <p className="text-[10px] text-slate-500 high-contrast:text-slate-400">
                All extracted fields, dates, and plain-language summaries remain fully accessible.
              </p>
            </div>
          )}

          {/* OCR Transcript Editor & Evidence Highlighting */}
          <OcrTranscriptEditor
            ocrText={notice.ocrText}
            ocrConfidence={notice.ocrConfidence}
            sourceType={notice.sourceType}
            selectedEvidence={selectedEvidence}
            onApplyTranscriptEdit={onApplyTranscriptEdit}
            onCopySuccess={onCopySuccess}
          />
        </div>
      </div>
    </div>
  );
};
