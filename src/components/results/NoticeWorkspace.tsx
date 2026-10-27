import { useState } from 'react';
import { ProcessedNotice, EvidenceSnippet } from '../../types/notice';
import { AccessibleSummaryCard } from './AccessibleSummaryCard';
import { EvidenceFieldCard } from './EvidenceFieldCard';
import { OcrTranscriptEditor } from './OcrTranscriptEditor';
import { DeadlineActionCard } from './DeadlineActionCard';
import { Image as ImageIcon, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface NoticeWorkspaceProps {
  notice: ProcessedNotice;
  onUpdateNoticeField: (key: string, newValue: string) => void;
  onUpdateOcrText: (newText: string) => void;
  onReExtract: () => void;
  onSaveNotice: () => void;
  isSaved: boolean;
  hasUnsavedChanges?: boolean;
  onCopySuccess: () => void;
  onDownloadIcsSuccess: () => void;
}

export const NoticeWorkspace: React.FC<NoticeWorkspaceProps> = ({
  notice,
  onUpdateNoticeField,
  onUpdateOcrText,
  onReExtract,
  onSaveNotice,
  isSaved,
  hasUnsavedChanges = false,
  onCopySuccess,
  onDownloadIcsSuccess,
}) => {
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

  return (
    <div className="space-y-6">
      {/* Workspace Subheader Banner */}
      {/* Workspace Subheader Banner */}
      <div className="brutal-card flex flex-wrap items-center justify-between gap-4 bg-white p-5 high-contrast:bg-black high-contrast:border-white">
        <div>
          <span className="brutal-badge text-xs px-2.5 py-1 bg-neo-yellow text-black -rotate-1 inline-block shadow-brutal-sm">
            {notice.fields.category.value} Notice
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-ink-900 high-contrast:text-white mt-2 uppercase tracking-tight">
            {notice.title}
          </h1>
          <p className="text-xs font-bold text-slate-600 high-contrast:text-yellow-300 mt-1 uppercase tracking-wider">
            Issued by: {notice.fields.institution.value}
          </p>
        </div>

        {/* Verification Stats Pills */}
        <div className="flex items-center gap-2.5">
          <div className="brutal-badge flex items-center gap-1.5 px-3 py-1.5 bg-neo-mint text-black shadow-brutal-sm">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>{confirmedCount} Confirmed Facts</span>
          </div>

          {needsReviewCount > 0 && (
            <div className="brutal-badge flex items-center gap-1.5 px-3 py-1.5 bg-neo-coral text-white shadow-brutal-sm">
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
      />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Plain Summary & Key Structured Fields */}
        <div className="lg:col-span-7 space-y-6">
          <AccessibleSummaryCard notice={notice} />

          {/* Structured Fields Section */}
          <section
            className="brutal-card bg-white p-6 high-contrast:bg-black high-contrast:border-white"
            aria-labelledby="fields-section-heading"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b-2 border-black high-contrast:border-white">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-black high-contrast:text-yellow-400 stroke-[2.5]" />
                <h2 id="fields-section-heading" className="text-base font-black uppercase text-ink-900 high-contrast:text-white">
                  Extracted Notice Details ({filteredFields.length})
                </h2>
              </div>

              {/* Filter controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFieldFilter('all')}
                  aria-pressed={fieldFilter === 'all'}
                  className={`brutal-btn px-2.5 py-1 text-xs ${
                    fieldFilter === 'all'
                      ? 'bg-neo-yellow text-black font-black'
                      : 'bg-white text-ink-900 hover:bg-neutral-100 font-bold'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFieldFilter('found')}
                  aria-pressed={fieldFilter === 'found'}
                  className={`brutal-btn px-2.5 py-1 text-xs ${
                    fieldFilter === 'found'
                      ? 'bg-neo-mint text-black font-black'
                      : 'bg-white text-ink-900 hover:bg-neutral-100 font-bold'
                  }`}
                >
                  Found
                </button>
                <button
                  onClick={() => setFieldFilter('needs_review')}
                  aria-pressed={fieldFilter === 'needs_review'}
                  className={`brutal-btn px-2.5 py-1 text-xs ${
                    fieldFilter === 'needs_review'
                      ? 'bg-neo-coral text-white font-black'
                      : 'bg-white text-ink-900 hover:bg-neutral-100 font-bold'
                  }`}
                >
                  Review ({needsReviewCount})
                </button>
              </div>
            </div>

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
          {notice.imageDataUrl && (
            <div className="brutal-card bg-white overflow-hidden high-contrast:bg-black high-contrast:border-white">
              <div className="px-5 py-3 border-b-2 border-black flex items-center justify-between high-contrast:border-white">
                <span className="text-xs font-black uppercase text-ink-900 high-contrast:text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-black high-contrast:text-yellow-400 stroke-[2.5]" />
                  <span>Original Document Preview</span>
                </span>
                <button
                  onClick={() => setShowOriginalImage(!showOriginalImage)}
                  className="text-xs font-black uppercase text-slate-800 hover:underline high-contrast:text-yellow-300"
                >
                  {showOriginalImage ? 'Collapse' : 'Expand'}
                </button>
              </div>
              {showOriginalImage && (
                <div className="p-3 bg-slate-100 flex items-center justify-center max-h-64 overflow-hidden high-contrast:bg-slate-950">
                  <img
                    src={notice.imageDataUrl}
                    alt="Original scanned notice"
                    className="max-h-60 w-auto object-contain border-2 border-black"
                  />
                </div>
              )}
            </div>
          )}

          {/* OCR Transcript Editor & Evidence Highlighting */}
          <OcrTranscriptEditor
            ocrText={notice.ocrText}
            ocrConfidence={notice.ocrConfidence}
            selectedEvidence={selectedEvidence}
            onTextChange={onUpdateOcrText}
            onReExtract={onReExtract}
            onCopySuccess={onCopySuccess}
          />
        </div>
      </div>
    </div>
  );
};
