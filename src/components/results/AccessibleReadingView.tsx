import React, { useState } from 'react';
import { Volume2, VolumeX, BookOpen, AlertTriangle, FileText, CheckCircle2, Calendar, Users } from 'lucide-react';
import { ProcessedNotice } from '../../types/notice';
import { speechService } from '../../services/speech/webSpeechService';

interface AccessibleReadingViewProps {
  notice: ProcessedNotice;
  onExitReadingMode: () => void;
}

export const AccessibleReadingView: React.FC<AccessibleReadingViewProps> = ({
  notice,
  onExitReadingMode,
}) => {
  const [fontScale, setFontScale] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const { summary } = notice;

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else {
      const fullText = [
        notice.sourceType === 'demo' ? 'Fictional educational sample notice. Not an official university announcement.' : '',
        `Title: ${notice.title}`,
        summary.overview,
        summary.targetAudience ? `Target students: ${summary.targetAudience}` : '',
        summary.criticalDeadline ? `Critical deadline: ${summary.criticalDeadline}` : '',
        summary.venueAndTime ? `Schedule and venue: ${summary.venueAndTime}` : '',
        summary.actionItems.length > 0 ? `Required actions: ${summary.actionItems.join('. ')}` : '',
        summary.requiredDocs.length > 0 ? `Required documents: ${summary.requiredDocs.join(', ')}` : '',
        `Transcript content: ${notice.ocrText}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      speechService.speak(fullText, summary.language === 'bn' ? 'bn' : 'en');
      setIsSpeaking(true);
    }
  };

  const getFontSizeClasses = () => {
    switch (fontScale) {
      case 'xlarge':
        return 'text-xl sm:text-2xl leading-relaxed sm:leading-loose';
      case 'large':
        return 'text-lg sm:text-xl leading-relaxed';
      case 'normal':
      default:
        return 'text-base sm:text-lg leading-normal';
    }
  };

  return (
    <article
      className="neu-card p-6 sm:p-10 max-w-4xl mx-auto high-contrast:!bg-black high-contrast:!border-white space-y-8"
      aria-label="Accessible Notice Reading Mode"
    >
      {/* Reading Mode Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-2 border-slate-200/80 high-contrast:border-white">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-sky-600 high-contrast:text-yellow-400 stroke-[2.5]" />
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 high-contrast:text-yellow-300">
              Low-Vision & Cognitive Accessibility View
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 high-contrast:text-white">
              Focused Reading Mode
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Audio Narration */}
          <button
            onClick={handleToggleSpeech}
            className={`neu-btn px-4 py-2 font-bold text-xs flex items-center gap-2 ${
              isSpeaking
                ? 'bg-amber-600 text-white high-contrast:!bg-yellow-400 high-contrast:!text-black'
                : 'bg-sky-600 text-white hover:bg-sky-700 high-contrast:!bg-yellow-400 high-contrast:!text-black'
            }`}
            aria-label={isSpeaking ? 'Stop reading notice aloud' : 'Read notice aloud'}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4 stroke-[2.5]" /> : <Volume2 className="w-4 h-4 stroke-[2.5]" />}
            <span>{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
          </button>

          {/* Font Scaling */}
          <div className="flex items-center gap-1 neu-inset p-1 rounded-xl bg-slate-100 high-contrast:!bg-slate-900">
            <button
              onClick={() => setFontScale('normal')}
              className={`neu-btn px-2.5 py-1 text-xs font-bold ${fontScale === 'normal' ? 'bg-sky-600 text-white' : 'text-slate-700'}`}
              aria-label="Normal text size"
            >
              A
            </button>
            <button
              onClick={() => setFontScale('large')}
              className={`neu-btn px-2.5 py-1 text-xs font-bold ${fontScale === 'large' ? 'bg-sky-600 text-white' : 'text-slate-700'}`}
              aria-label="Large text size"
            >
              A+
            </button>
            <button
              onClick={() => setFontScale('xlarge')}
              className={`neu-btn px-2.5 py-1 text-xs font-bold ${fontScale === 'xlarge' ? 'bg-sky-600 text-white' : 'text-slate-700'}`}
              aria-label="Extra large text size"
            >
              A++
            </button>
          </div>

          {/* Exit Reading Mode */}
          <button
            onClick={onExitReadingMode}
            className="neu-btn px-4 py-2 font-bold text-xs bg-slate-200 text-slate-800 hover:bg-slate-300 high-contrast:!bg-white high-contrast:!text-black"
          >
            Return to Workspace
          </button>
        </div>
      </div>

      {/* Notice Title Banner */}
      <div className="space-y-2">
        <span className="neu-badge text-xs px-3 py-1 bg-sky-100 text-sky-800 font-bold inline-block high-contrast:!bg-yellow-400 high-contrast:!text-black">
          {notice.fields.category.value} Notice
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 high-contrast:text-white leading-tight">
          {notice.title}
        </h2>
        <p className="text-sm font-bold text-slate-600 high-contrast:text-yellow-300">
          Published by: {notice.fields.institution.value}
        </p>
      </div>

      {/* 6-Part Executive Q&A Intelligence Section */}
      <section className="space-y-4" aria-label="Executive Notice Answers">
        {/* Q1: What happened? */}
        <div className="neu-inset p-5 rounded-2xl bg-white/90 high-contrast:!bg-black border border-slate-200/80 high-contrast:border-white">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 high-contrast:text-yellow-300 mb-1 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-600 stroke-[2.5]" />
            <span>1. What is this notice about?</span>
          </h3>
          <p className={`${getFontSizeClasses()} font-medium text-slate-900 high-contrast:text-white`}>
            {summary.overview}
          </p>
        </div>

        {/* Q2: Who is affected? */}
        {summary.targetAudience && (
          <div className="neu-inset p-5 rounded-2xl bg-white/90 high-contrast:!bg-black border border-slate-200/80 high-contrast:border-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 high-contrast:text-yellow-300 mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600 stroke-[2.5]" />
              <span>2. Who is affected (Target Students)?</span>
            </h3>
            <p className={`${getFontSizeClasses()} font-medium text-slate-900 high-contrast:text-white`}>
              {summary.targetAudience}
            </p>
          </div>
        )}

        {/* Q3: What must be done? */}
        {summary.actionItems.length > 0 && (
          <div className="neu-inset p-5 rounded-2xl bg-white/90 high-contrast:!bg-black border border-slate-200/80 high-contrast:border-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 high-contrast:text-yellow-300 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600 stroke-[2.5]" />
              <span>3. What must be done?</span>
            </h3>
            <ul className="space-y-2">
              {summary.actionItems.map((act, i) => (
                <li key={i} className={`${getFontSizeClasses()} font-medium text-slate-900 high-contrast:text-white flex items-start gap-2.5`}>
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 mt-2.5 shrink-0" />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Q4: What is the deadline? */}
        {summary.criticalDeadline && (
          <div className="neu-inset p-5 rounded-2xl bg-amber-50/70 high-contrast:!bg-slate-950 border border-amber-300 high-contrast:border-yellow-400">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 high-contrast:text-yellow-300 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-700 stroke-[2.5]" />
              <span>4. When is the deadline?</span>
            </h3>
            <p className={`${getFontSizeClasses()} font-black text-amber-950 high-contrast:text-white`}>
              {summary.criticalDeadline}
            </p>
          </div>
        )}

        {/* Q5: What documents are needed? */}
        {summary.requiredDocs.length > 0 && (
          <div className="neu-inset p-5 rounded-2xl bg-white/90 high-contrast:!bg-black border border-slate-200/80 high-contrast:border-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 high-contrast:text-yellow-300 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-600 stroke-[2.5]" />
              <span>5. What documents are needed?</span>
            </h3>
            <ul className="space-y-1.5">
              {summary.requiredDocs.map((doc, i) => (
                <li key={i} className={`${getFontSizeClasses()} font-medium text-slate-900 high-contrast:text-white flex items-start gap-2`}>
                  <span className="text-sky-600 font-bold">•</span>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Q6: What details are missing or uncertain? */}
        <div className={`neu-inset p-5 rounded-2xl ${
          summary.unverifiedOrMissing.length > 0
            ? 'bg-amber-50/60 high-contrast:!bg-slate-950 border-l-4 border-amber-500'
            : 'bg-emerald-50/40 high-contrast:!bg-slate-950 border-l-4 border-emerald-500'
        }`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2 ${
            summary.unverifiedOrMissing.length > 0
              ? 'text-amber-900 high-contrast:text-yellow-300'
              : 'text-emerald-900 high-contrast:text-yellow-300'
          }`}>
            {summary.unverifiedOrMissing.length > 0 ? (
              <AlertTriangle className="w-4 h-4 text-amber-700 stroke-[2.5]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
            )}
            <span>6. What details are unverified or missing?</span>
          </h3>
          {summary.unverifiedOrMissing.length > 0 ? (
            <ul className="space-y-1">
              {summary.unverifiedOrMissing.map((item, i) => (
                <li key={i} className="text-sm font-semibold text-amber-950 high-contrast:text-white">
                  • {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className={`${getFontSizeClasses()} font-medium text-emerald-900 high-contrast:text-white`}>
              All essential notice fields have verified source evidence with high OCR confidence. No unverified facts.
            </p>
          )}
        </div>
      </section>

      {/* Transcript Text Reader */}
      <section className="space-y-3 pt-4 border-t border-slate-200 high-contrast:border-white">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 high-contrast:text-yellow-300">
          Complete Original Notice Text (Linear Readout)
        </h3>
        <div className="neu-inset p-6 rounded-2xl bg-slate-50/90 high-contrast:!bg-slate-950 whitespace-pre-wrap font-sans text-slate-900 high-contrast:text-white select-text">
          <p className={`${getFontSizeClasses()} font-normal`}>
            {notice.ocrText}
          </p>
        </div>
      </section>
    </article>
  );
};
