import React, { useState } from 'react';
import { Calendar, Download, Bookmark, Check, AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { ProcessedNotice, NoticeFieldKey } from '../../types/notice';
import { exportNoticeCalendar, buildEventFromNotice } from '../../services/export/icsExporter';
import { extractAllDates } from '../../services/extraction/dateParser';
import { Modal } from '../common/Modal';

interface DeadlineActionCardProps {
  notice: ProcessedNotice;
  onSave: () => void;
  isSaved: boolean;
  hasUnsavedChanges?: boolean;
  onDownloadIcsSuccess: () => void;
  onConfirmDate?: (key: string, correctedValue?: string) => Promise<ProcessedNotice | null> | void;
}

export const DeadlineActionCard: React.FC<DeadlineActionCardProps> = ({
  notice,
  onSave,
  isSaved,
  hasUnsavedChanges = false,
  onDownloadIcsSuccess,
  onConfirmDate,
}) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewReason, setReviewReason] = useState<string>('');
  const [manualDateInput, setManualDateInput] = useState<string>('');
  const [dateInputError, setDateInputError] = useState<string>('');

  const deadlineField = notice.fields.deadline;
  const eventDateField = notice.fields.eventDate;

  const hasDeadline = deadlineField.status !== 'not_found';
  const hasEventDate = eventDateField.status !== 'not_found';
  const targetKey: NoticeFieldKey = hasDeadline ? 'deadline' : 'eventDate';

  const dateValue = hasDeadline ? deadlineField.value : hasEventDate ? eventDateField.value : null;
  const isAmbiguous = hasDeadline ? deadlineField.isAmbiguous : hasEventDate ? eventDateField.isAmbiguous : false;

  const eventCandidate = buildEventFromNotice(notice);
  const hasValidIsoDate = Boolean(eventCandidate && eventCandidate.startDate);

  const handleExportIcs = () => {
    setDateInputError('');
    const outcome = exportNoticeCalendar(notice);
    if (outcome.requiresReview || !hasValidIsoDate) {
      setReviewReason(outcome.reason || (!hasValidIsoDate ? 'Notice lacks a complete calendar year. Please provide the year or date.' : 'Verification required'));
      setManualDateInput(dateValue || '');
      setShowReviewModal(true);
      return;
    }
    if (outcome.success) {
      onDownloadIcsSuccess();
    }
  };

  const handleConfirmAndExport = async () => {
    setDateInputError('');
    let valueToConfirm: string | undefined = undefined;

    if (!hasValidIsoDate) {
      const inputEl = document.querySelector('input[aria-label="Enter confirmed date with year"]') as HTMLInputElement | null;
      const rawInput = inputEl && inputEl.value ? inputEl.value : manualDateInput;
      const trimmed = rawInput.trim();
      if (!trimmed) {
        setDateInputError('Please enter a date with year (e.g. 2024-11-15 or 15/11/2024) to export.');
        return;
      }

      const parsedDates = extractAllDates(trimmed);
      if (!parsedDates.length || !parsedDates[0].isoDate) {
        setDateInputError('Could not parse a valid date and year. Please specify day, month, and year (e.g. 2024-11-15).');
        return;
      }
      valueToConfirm = trimmed;
    }

    let effectiveNotice = notice;
    if (onConfirmDate) {
      const maybeNotice = await onConfirmDate(targetKey, valueToConfirm);
      if (maybeNotice) {
        effectiveNotice = maybeNotice;
      }
    }

    if (valueToConfirm) {
      const updatedFields = { ...effectiveNotice.fields };
      const currentTarget = updatedFields[targetKey];
      updatedFields[targetKey] = {
        ...currentTarget,
        value: valueToConfirm,
        status: 'confirmed',
        isAmbiguous: false,
        provenance: 'user_confirmed',
      };
      effectiveNotice = {
        ...effectiveNotice,
        fields: updatedFields,
      };
    }

    const outcome = exportNoticeCalendar(effectiveNotice, { bypassReview: true });
    if (outcome.success) {
      setShowReviewModal(false);
      onDownloadIcsSuccess();
    } else {
      setDateInputError(outcome.reason || 'Could not form calendar event from specified date.');
    }
  };

  return (
    <>
      <div
        className="neu-card p-6 high-contrast:!bg-black high-contrast:!border-white"
        role="region"
        aria-label="Deadline and Calendar Actions"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 shadow-sm border border-white/60 high-contrast:!bg-yellow-400 high-contrast:!text-black">
              <Calendar className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 high-contrast:text-yellow-300 block">
                {hasDeadline ? 'Application / Submission Deadline' : hasEventDate ? 'Event / Examination Date' : 'Notice Schedule'}
              </span>
              <h3 className="text-xl font-black text-slate-900 high-contrast:text-white mt-0.5 tracking-tight">
                {dateValue || 'No specific date detected'}
              </h3>

              {isAmbiguous && (
                <p className="text-xs font-bold text-amber-700 high-contrast:text-yellow-300 mt-1 flex items-center gap-1">
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
                className="neu-btn inline-flex items-center gap-2 px-4 py-2.5 bg-[#eef2f8] text-slate-800 hover:text-slate-900 text-xs font-bold border border-white/60 high-contrast:!bg-black high-contrast:!border-white high-contrast:!text-white"
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
              className={`neu-btn inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold ${
                hasUnsavedChanges
                  ? 'bg-red-500 text-white hover:bg-red-600 high-contrast:!bg-yellow-400 high-contrast:!text-black'
                  : isSaved
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 high-contrast:!bg-yellow-400 high-contrast:!text-black'
                  : 'bg-sky-600 text-white hover:bg-sky-700 high-contrast:!bg-slate-900 high-contrast:!text-white'
              }`}
            >
              {hasUnsavedChanges ? (
                <>
                  <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Changes</span>
                </>
              ) : isSaved ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5] text-white" />
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
            <div className="p-3.5 neu-inset rounded-xl bg-red-50/50 border border-red-200 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-700">
                  Unverified or Ambiguous Date
                </p>
                <p className="text-xs font-medium text-slate-800 mt-1">
                  The detected schedule is <strong>"{dateValue}"</strong>.
                  {reviewReason ? ` (${reviewReason})` : hasDeadline && deadlineField.explanation ? ` (${deadlineField.explanation})` : ''}
                </p>
              </div>
            </div>

            {!hasValidIsoDate ? (
              <div className="space-y-2 p-3 neu-inset rounded-xl bg-amber-50/60 border border-amber-200">
                <p className="text-xs font-bold text-amber-900">
                  Calendar year or complete date missing
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">
                  NoticeLens never guesses missing years for deadline events. Please provide the confirmed date with year below (e.g. <code>2024-11-15</code> or <code>15/11/2024</code>) before exporting:
                </p>
                <input
                  type="text"
                  value={manualDateInput}
                  onInput={(e) => {
                    setManualDateInput((e.target as HTMLInputElement).value);
                    setDateInputError('');
                  }}
                  onChange={(e) => {
                    setManualDateInput(e.target.value);
                    setDateInputError('');
                  }}
                  placeholder="e.g. 2024-11-15 or 15 November 2024"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 neu-inset bg-white text-slate-800 font-medium"
                  aria-label="Enter confirmed date with year"
                />
                {dateInputError && (
                  <p className="text-xs font-bold text-red-600">{dateInputError}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  NoticeLens does not silently invent missing years or unverified times. Please verify that this date matches your university's official schedule before creating a calendar event.
                </p>
                {dateInputError && (
                  <p className="text-xs font-bold text-red-600">{dateInputError}</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="neu-btn px-4 py-2 bg-[#eef2f8] text-slate-700 text-xs font-bold hover:text-slate-900 border border-white/60"
              >
                Cancel & Review in Workspace
              </button>
              <button
                type="button"
                onClick={handleConfirmAndExport}
                className="neu-btn px-4 py-2 bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 shadow-sm"
              >
                {!hasValidIsoDate ? 'Save Date & Download .ics' : 'Confirm & Download .ics'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
