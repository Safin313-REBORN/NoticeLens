import React from 'react';
import { Volume2, Calendar, MapPin, CheckSquare, FileText, AlertTriangle, Sparkles } from 'lucide-react';
import { ProcessedNotice } from '../../types/notice';
import { speechService } from '../../services/speech/webSpeechService';

interface AccessibleSummaryCardProps {
  notice: ProcessedNotice;
}

export const AccessibleSummaryCard: React.FC<AccessibleSummaryCardProps> = ({ notice }) => {
  const { summary } = notice;

  const handleReadSummary = () => {
    const textToRead = [
      `Notice Summary.`,
      summary.overview,
      summary.criticalDeadline ? `Critical Deadline: ${summary.criticalDeadline}` : '',
      summary.venueAndTime ? `Event schedule and location: ${summary.venueAndTime}` : '',
      summary.actionItems.length > 0 ? `Action items: ${summary.actionItems.join('. ')}` : '',
      summary.requiredDocs.length > 0 ? `Required documents: ${summary.requiredDocs.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    speechService.speak(textToRead, summary.language === 'bn' ? 'bn' : 'en');
  };

  return (
    <section
      className="neu-card overflow-hidden high-contrast:!bg-black high-contrast:!border-white"
      aria-labelledby="summary-heading"
    >
      {/* Header */}
      <div className="border-b border-slate-200/80 bg-[#eef2f8] px-6 py-4 flex items-center justify-between high-contrast:!bg-black high-contrast:!border-b-2 high-contrast:!border-white">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-sky-600 high-contrast:text-yellow-400 stroke-[2.5]" />
          <h2 id="summary-heading" className="text-base sm:text-lg font-bold uppercase tracking-tight text-slate-900 high-contrast:text-white">
            Accessible Plain-Language Summary
          </h2>
        </div>

        <button
          onClick={handleReadSummary}
          aria-label="Listen to accessible notice summary"
          className="neu-btn inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 text-white hover:bg-sky-700 text-xs font-semibold shadow-sm high-contrast:!bg-yellow-400 high-contrast:!text-black"
        >
          <Volume2 className="w-4 h-4 stroke-[2.5]" />
          <span>Listen to Summary</span>
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* 1. What the notice is about */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 high-contrast:text-yellow-300 mb-1.5">
            What this notice is about
          </h3>
          <p className="text-base text-slate-800 high-contrast:text-white font-medium leading-relaxed">
            {summary.overview}
          </p>
        </div>

        {/* 2. Most important deadline / date */}
        {summary.criticalDeadline && (
          <div className="p-4 neu-inset rounded-2xl text-slate-800 high-contrast:!bg-slate-900 high-contrast:!border-yellow-400 high-contrast:!text-yellow-300">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 shadow-sm border border-white/60 high-contrast:bg-yellow-400 high-contrast:text-black">
                <Calendar className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wide block text-slate-500 high-contrast:text-yellow-300">
                  Critical Timeline
                </span>
                <span className="text-base font-extrabold block mt-0.5 text-slate-900 high-contrast:text-white">
                  {summary.criticalDeadline}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Where and when */}
        {summary.venueAndTime && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 high-contrast:text-yellow-300 mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-sky-600 high-contrast:text-yellow-400 stroke-[2.5]" />
              <span>Location & Time Schedule</span>
            </h3>
            <p className="text-sm font-semibold text-slate-800 high-contrast:text-white neu-inset p-3.5 rounded-xl">
              {summary.venueAndTime}
            </p>
          </div>
        )}

        {/* 4. Required actions */}
        {summary.actionItems.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 high-contrast:text-yellow-300 mb-2 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-sky-600 high-contrast:text-yellow-400 stroke-[2.5]" />
              <span>What You Need to Do (Action Items)</span>
            </h3>
            <ul className="space-y-2">
              {summary.actionItems.map((action, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm font-medium text-slate-800 high-contrast:text-white"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 5. Required documents */}
        {summary.requiredDocs.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 high-contrast:text-yellow-300 mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-600 high-contrast:text-yellow-400 stroke-[2.5]" />
              <span>Required Documents & Preparation</span>
            </h3>
            <ul className="space-y-1.5">
              {summary.requiredDocs.map((doc, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs font-semibold text-slate-800 high-contrast:text-white neu-inset px-3.5 py-2.5 rounded-xl"
                >
                  <span className="text-sky-600 font-bold">•</span>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 6. Missing or unverified items */}
        {summary.unverifiedOrMissing.length > 0 && (
          <div className="p-4 neu-card rounded-2xl border-l-4 border-amber-500 bg-amber-50/50 high-contrast:!bg-slate-900 high-contrast:!border-white">
            <h3 className="text-xs font-bold text-slate-800 high-contrast:text-yellow-300 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-amber-600 high-contrast:text-yellow-400 shrink-0 stroke-[2.5]" />
              <span>Items Needing Verification or Not Specified</span>
            </h3>
            <ul className="space-y-1 text-xs font-medium text-slate-600 high-contrast:text-slate-300">
              {summary.unverifiedOrMissing.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};
