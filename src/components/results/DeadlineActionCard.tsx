import React from 'react';
import { Calendar, Download, Bookmark, Check, AlertCircle } from 'lucide-react';
import { ProcessedNotice } from '../../types/notice';
import { buildEventFromNotice, downloadIcsFile } from '../../services/export/icsExporter';

interface DeadlineActionCardProps {
  notice: ProcessedNotice;
  onSave: () => void;
  isSaved: boolean;
  onDownloadIcsSuccess: () => void;
}

export const DeadlineActionCard: React.FC<DeadlineActionCardProps> = ({
  notice,
  onSave,
  isSaved,
  onDownloadIcsSuccess,
}) => {
  const deadlineField = notice.fields.deadline;
  const eventDateField = notice.fields.eventDate;

  const hasDeadline = deadlineField.status !== 'not_found';
  const hasEventDate = eventDateField.status !== 'not_found';

  const dateValue = hasDeadline ? deadlineField.value : hasEventDate ? eventDateField.value : null;
  const isAmbiguous = hasDeadline ? deadlineField.isAmbiguous : hasEventDate ? eventDateField.isAmbiguous : false;

  const handleExportIcs = () => {
    const eventData = buildEventFromNotice(notice);
    if (eventData) {
      downloadIcsFile(eventData, `${notice.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}_deadline.ics`);
      onDownloadIcsSuccess();
    }
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 high-contrast:bg-black high-contrast:border-white"
      role="region"
      aria-label="Deadline and Calendar Actions"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 high-contrast:bg-yellow-400 high-contrast:text-black">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 high-contrast:text-yellow-300 block">
              {hasDeadline ? 'Application / Submission Deadline' : hasEventDate ? 'Event / Examination Date' : 'Notice Schedule'}
            </span>
            <h3 className="text-xl font-extrabold text-ink-900 high-contrast:text-white mt-0.5">
              {dateValue || 'No specific date detected'}
            </h3>

            {isAmbiguous && (
              <p className="text-xs text-amber-800 high-contrast:text-yellow-300 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Requires verification against original text before calendar entry.</span>
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {dateValue && (
            <button
              onClick={handleExportIcs}
              aria-label="Export deadline to calendar ICS file"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500 high-contrast:bg-yellow-400 high-contrast:text-black"
            >
              <Download className="w-4 h-4 text-teal-400 high-contrast:text-black" />
              <span>Export Calendar (.ICS)</span>
            </button>
          )}

          <button
            onClick={onSave}
            aria-label={isSaved ? 'Notice saved in private local storage' : 'Save notice to private local storage'}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-teal-500 ${
              isSaved
                ? 'bg-teal-50 text-teal-800 border border-teal-300 high-contrast:bg-yellow-400 high-contrast:text-black'
                : 'bg-teal-700 text-white hover:bg-teal-800 high-contrast:bg-slate-900 high-contrast:text-white high-contrast:border-white high-contrast:border'
            }`}
          >
            {isSaved ? <Check className="w-4 h-4 text-teal-600 high-contrast:text-black" /> : <Bookmark className="w-4 h-4" />}
            <span>{isSaved ? 'Notice Saved' : 'Save Notice'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
