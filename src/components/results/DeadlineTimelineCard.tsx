import React from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { ProcessedNotice } from '../../types/notice';
import { extractAllDates, ParsedDateResult } from '../../services/extraction/dateParser';

interface DeadlineTimelineCardProps {
  notice: ProcessedNotice;
  onSelectDateSnippet?: (snippet: string) => void;
}

export const DeadlineTimelineCard: React.FC<DeadlineTimelineCardProps> = ({
  notice,
  onSelectDateSnippet,
}) => {
  const allDates = extractAllDates(notice.ocrText);

  // Group dates by type
  const deadlines = allDates.filter((d) => d.dateType === 'deadline');
  const eventDates = allDates.filter((d) => d.dateType === 'event');
  const pubDates = allDates.filter((d) => d.dateType === 'publication');
  const generalDates = allDates.filter((d) => d.dateType === 'general');

  if (allDates.length === 0) {
    return (
      <div className="neu-card p-5 high-contrast:!bg-black high-contrast:!border-white">
        <div className="flex items-center gap-2 text-slate-700 high-contrast:text-white">
          <Calendar className="w-5 h-5 text-slate-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Date & Timeline Intelligence</h3>
        </div>
        <p className="text-xs text-slate-500 high-contrast:text-slate-300 mt-2">
          No explicit calendar dates were detected in the raw notice text.
        </p>
      </div>
    );
  }

  const renderDateItem = (dateRes: ParsedDateResult, categoryLabel: string, index: number) => {
    const isYearless = dateRes.year === null;
    const isHistorical = dateRes.year !== null && dateRes.year < new Date().getFullYear();

    return (
      <div
        key={`${dateRes.rawSnippet}_${dateRes.normalizedDate}_${dateRes.dateType}_${index}`}
        onClick={() => onSelectDateSnippet && onSelectDateSnippet(dateRes.rawSnippet)}
        className="neu-inset p-3.5 rounded-xl bg-white/70 high-contrast:!bg-black border border-slate-200/80 high-contrast:!border-white hover:border-sky-400 transition-all cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`${categoryLabel}: ${dateRes.normalizedDate}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-100 text-sky-800 high-contrast:bg-yellow-400 high-contrast:text-black">
            {categoryLabel}
          </span>

          <div className="flex items-center gap-1.5">
            {isYearless ? (
              <span className="text-[10px] font-bold text-amber-700 high-contrast:text-yellow-300 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                Missing Year (Needs Review)
              </span>
            ) : isHistorical ? (
              <span className="text-[10px] font-bold text-slate-600 high-contrast:text-slate-300 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                <Info className="w-3 h-3 stroke-[2.5]" />
                Historical Record ({dateRes.year})
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-700 high-contrast:text-yellow-300 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle className="w-3 h-3 stroke-[2.5]" />
                Verified Calendar Date
              </span>
            )}
          </div>
        </div>

        <div className="text-base font-black text-slate-900 high-contrast:text-white mt-1">
          {dateRes.normalizedDate}
        </div>

        <p className="text-xs text-slate-600 high-contrast:text-slate-300 mt-1 italic line-clamp-2">
          &ldquo;{dateRes.contextSnippet}&rdquo;
        </p>
      </div>
    );
  };

  return (
    <section
      className="neu-card p-6 high-contrast:!bg-black high-contrast:!border-white space-y-5"
      aria-labelledby="timeline-heading"
    >
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/80 high-contrast:border-white">
        <Clock className="w-5 h-5 text-sky-600 high-contrast:text-yellow-400 stroke-[2.5]" />
        <div>
          <h2 id="timeline-heading" className="text-base font-bold uppercase text-slate-900 high-contrast:text-white">
            Date & Timeline Disambiguation
          </h2>
          <p className="text-xs text-slate-500 high-contrast:text-slate-300">
            Distinguishes submission deadlines from exam dates and issue dates with source evidence.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* 1. Deadlines */}
        {deadlines.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 high-contrast:text-yellow-300 mb-2 flex items-center gap-1.5">
              <span>Critical Deadlines ({deadlines.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {deadlines.map((d, idx) => renderDateItem(d, 'Application / Submission Deadline', idx))}
            </div>
          </div>
        )}

        {/* 2. Events & Examinations */}
        {eventDates.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-700 high-contrast:text-yellow-300 mb-2 flex items-center gap-1.5">
              <span>Examination & Event Schedules ({eventDates.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {eventDates.map((d, idx) => renderDateItem(d, 'Examination / Event Date', idx))}
            </div>
          </div>
        )}

        {/* 3. Issue / Publication Date */}
        {pubDates.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 high-contrast:text-slate-400 mb-2 flex items-center gap-1.5">
              <span>Notice Publication Headers ({pubDates.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pubDates.map((d, idx) => renderDateItem(d, 'Notice Publication Date', idx))}
            </div>
          </div>
        )}

        {/* 4. General Mentions */}
        {generalDates.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 high-contrast:text-slate-400 mb-2">
              <span>Other Mentioned Dates ({generalDates.length})</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {generalDates.map((d, idx) => renderDateItem(d, 'Mentioned Date', idx))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
