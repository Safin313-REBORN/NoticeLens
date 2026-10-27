import React, { useState } from 'react';
import { Calendar, Download, Bookmark, Check, AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { ProcessedNotice } from '../../types/notice';
import { buildEventFromNotice, downloadIcsFile, generateSafeCalendarFilename } from '../../services/export/icsExporter';
import { Modal } from '../common/Modal';

interface DeadlineActionCardProps {
  notice: ProcessedNotice;
  onSave: () => void;
  isSaved: boolean;
  hasUnsavedChanges?: boolean;
  onDownloadIcsSuccess: () => void;
}

export const DeadlineActionCard: React.FC<DeadlineActionCardProps> = ({
  notice,
  onSave,
  isSaved,
  hasUnsavedChanges = false,
  onDownloadIcsSuccess,
}) => {
  const [showReviewModal, setShowReviewModal] = useState(false);

  const deadlineField = notice.fields.deadline;
  const eventDateField = notice.fields.eventDate;

  const hasDeadline = deadlineField.status !== 'not_found';
  const hasEventDate = eventDateField.status !== 'not_found';

  const dateValue = hasDeadline ? deadlineField.value : hasEventDate ? eventDateField.value : null;
  const isAmbiguous = hasDeadline ? deadlineField.isAmbiguous : hasEventDate ? eventDateField.isAmbiguous : false;
  const needsReview = hasDeadline ? deadlineField.status === 'needs_review' : hasEventDate ? eventDateField.status === 'needs_review' : false;

  const doExport = () => {
    const eventData = buildEventFromNotice(notice);
    if (eventData) {
      downloadIcsFile(eventData, generateSafeCalendarFilename(notice.title, 'deadline'));
      onDownloadIcsSuccess();
    }
  };

  const handleExportIcs = () => {
    // Calendar review gate: require explicit confirmation if ambiguous or unverified
    if (isAmbiguous || needsReview) {
      setShowReviewModal(true);
      return;
    }
    doExport();
  };

  return (
    <>
      <div
        className="brutal-card bg-white p-6 high-contrast:bg-black high-contrast:border-white"
        role="region"
        aria-label="Deadline and Calendar Actions"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 border-2 border-black bg-neo-yellow flex items-center justify-center text-black shrink-0 shadow-brutal-sm high-contrast:bg-yellow-400 high-contrast:text-black">
              <Calendar className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 high-contrast:text-yellow-300 block">
                {hasDeadline ? 'Application / Submission Deadline' : hasEventDate ? 'Event / Examination Date' : 'Notice Schedule'}
              </span>
              <h3 className="text-xl font-black text-ink-900 high-contrast:text-white mt-0.5 tracking-tight">
                {dateValue || 'No specific date detected'}
              </h3>

              {isAmbiguous && (
                <p className="text-xs font-bold text-amber-900 high-contrast:text-yellow-300 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Requires verification against original text before calendar entry.</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Calendar Export Button */}
            {(hasDeadline || hasEventDate) && (
              <button
                onClick={handleExportIcs}
                className="brutal-btn inline-flex items-center gap-2 px-4 py-2.5 bg-white text-ink-900 hover:bg-neo-yellow text-xs font-black shadow-brutal transition-colors high-contrast:bg-black high-contrast:border-white high-contrast:text-white"
                aria-label={`Export ${notice.title} date to calendar`}
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Export to Calendar (.ics)</span>
              </button>
            )}

            {/* Save Notice Button */}
            <button
              onClick={onSave}
              aria-label={
                hasUnsavedChanges
                  ? 'Save your changes to private local storage'
                  : isSaved
                  ? 'Notice saved in private local storage'
                  : 'Save notice to private local storage'
              }
              className={`brutal-btn inline-flex items-center gap-2 px-4 py-2.5 text-xs ${
                hasUnsavedChanges
                  ? 'bg-neo-coral text-white hover:bg-red-600 high-contrast:bg-yellow-400 high-contrast:text-black'
                  : isSaved
                  ? 'bg-neo-mint text-black hover:bg-emerald-300 high-contrast:bg-yellow-400 high-contrast:text-black'
                  : 'bg-neo-yellow text-black hover:bg-yellow-300 high-contrast:bg-slate-900 high-contrast:text-white high-contrast:border-white'
              }`}
            >
              {hasUnsavedChanges ? (
                <>
                  <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Changes</span>
                </>
              ) : isSaved ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5] text-black" />
                  <span>Notice Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Notice</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Review Gate Modal */}
      {showReviewModal && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          title="Calendar Export Review Gate"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-neo-coral/10 border-2 border-black flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-red-700">
                  Unverified or Ambiguous Date
                </p>
                <p className="text-xs font-bold text-ink-900 mt-1">
                  The detected schedule is <strong>"{dateValue}"</strong>.
                  {hasDeadline && deadlineField.explanation ? ` (${deadlineField.explanation})` : ''}
                </p>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-700 leading-relaxed">
              NoticeLens does not silently invent missing years or unverified times. Please verify that this date matches your university's official schedule before creating a calendar event.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="brutal-btn px-4 py-2 bg-white text-ink-900 text-xs font-bold hover:bg-slate-100"
              >
                Cancel & Review in Workspace
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReviewModal(false);
                  doExport();
                }}
                className="brutal-btn px-4 py-2 bg-neo-yellow text-black text-xs font-black hover:bg-yellow-300 shadow-brutal-sm"
              >
                Confirm & Download .ics
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
