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
      className="brutal-card bg-white overflow-hidden high-contrast:bg-black high-contrast:border-white"
      aria-labelledby="summary-heading"
    >
      {/* Header */}
      <div className="border-b-3 border-black bg-neo-yellow text-black px-6 py-4 flex items-center justify-between high-contrast:bg-black high-contrast:border-b-2 high-contrast:border-white">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-black high-contrast:text-yellow-400 stroke-[2.5]" />
          <h2 id="summary-heading" className="text-base sm:text-lg font-black uppercase tracking-tight text-ink-900 high-contrast:text-white">
            Accessible Plain-Language Summary
          </h2>
        </div>

        <button
          onClick={handleReadSummary}
          aria-label="Listen to accessible notice summary"
          className="brutal-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black text-white hover:bg-neutral-800 text-xs font-black high-contrast:bg-yellow-400 high-contrast:text-black"
        >
          <Volume2 className="w-4 h-4 stroke-[2.5]" />
          <span>Listen to Summary</span>
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* 1. What the notice is about */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 high-contrast:text-yellow-300 mb-1.5">
            What this notice is about
          </h3>
          <p className="text-base text-ink-900 high-contrast:text-white font-medium leading-relaxed">
            {summary.overview}
          </p>
        </div>

        {/* 2. Most important deadline / date */}
        {summary.criticalDeadline && (
          <div className="p-4 border-2 border-black bg-[#FFE17D] text-black shadow-brutal-sm high-contrast:bg-slate-900 high-contrast:border-yellow-400 high-contrast:text-yellow-300">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-black high-contrast:text-yellow-400 shrink-0 mt-0.5 stroke-[2.5]" />
              <div>
                <span className="text-xs font-black uppercase tracking-wide block text-slate-800 high-contrast:text-yellow-300">
                  Critical Timeline
                </span>
                <span className="text-base font-black block mt-0.5">
                  {summary.criticalDeadline}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Where and when */}
        {summary.venueAndTime && (
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 high-contrast:text-yellow-300 mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-black high-contrast:text-yellow-400 stroke-[2.5]" />
              <span>Location & Time Schedule</span>
            </h3>
            <p className="text-sm font-bold text-ink-900 high-contrast:text-white bg-[#FFFDF0] p-3 border-2 border-black shadow-brutal-sm high-contrast:bg-slate-900 high-contrast:border-white">
              {summary.venueAndTime}
            </p>
          </div>
        )}

        {/* 4. Required actions */}
        {summary.actionItems.length > 0 && (
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 high-contrast:text-yellow-300 mb-2 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-black high-contrast:text-yellow-400 stroke-[2.5]" />
              <span>What You Need to Do (Action Items)</span>
            </h3>
            <ul className="space-y-2">
              {summary.actionItems.map((action, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm font-medium text-ink-900 high-contrast:text-white"
                >
                  <span className="w-2.5 h-2.5 border-2 border-black bg-neo-mint mt-1.5 shrink-0" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 5. Required documents */}
        {summary.requiredDocs.length > 0 && (
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 high-contrast:text-yellow-300 mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-black high-contrast:text-yellow-400 stroke-[2.5]" />
              <span>Required Documents & Preparation</span>
            </h3>
            <ul className="space-y-1.5">
              {summary.requiredDocs.map((doc, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs font-bold text-slate-800 high-contrast:text-white bg-[#FFFDF0] px-3 py-2 border-2 border-black high-contrast:bg-slate-900 high-contrast:border-white"
                >
                  <span className="font-black">•</span>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 6. Missing or unverified items */}
        {summary.unverifiedOrMissing.length > 0 && (
          <div className="p-4 border-2 border-black bg-slate-50 high-contrast:bg-slate-900 high-contrast:border-white">
            <h3 className="text-xs font-black text-slate-800 high-contrast:text-yellow-300 flex items-center gap-1.5 mb-2 uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-amber-600 high-contrast:text-yellow-400 shrink-0 stroke-[2.5]" />
              <span>Items Needing Verification or Not Specified</span>
            </h3>
            <ul className="space-y-1 text-xs font-medium text-slate-600 high-contrast:text-slate-300">
              {summary.unverifiedOrMissing.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-black font-black">•</span>
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
