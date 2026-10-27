import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { OCRProgress } from '../../types/notice';

interface ProcessingCardProps {
  progress: OCRProgress;
  onCancel?: () => void;
}

export const ProcessingCard: React.FC<ProcessingCardProps> = ({ progress, onCancel }) => {
  const percent = Math.round(progress.progress * 100);

  const steps = [
    { id: 'prep', label: 'Preparing Document & Layout', activeStep: progress.step === 'loading_worker' },
    { id: 'ocr', label: 'Recognizing Bengali & English Text', activeStep: progress.step === 'recognizing' },
    { id: 'extract', label: 'Extracting Deadlines & Dates', activeStep: progress.step === 'extracting' },
    { id: 'ready', label: 'Preparing Accessible Results', activeStep: progress.step === 'completed' },
  ];

  const getStepStatus = (index: number) => {
    const currentIdx =
      progress.step === 'loading_worker'
        ? 0
        : progress.step === 'recognizing'
        ? 1
        : progress.step === 'extracting'
        ? 2
        : progress.step === 'completed'
        ? 3
        : -1;

    if (progress.step === 'error') return 'error';
    if (index < currentIdx) return 'done';
    if (index === currentIdx) return 'current';
    return 'pending';
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 max-w-xl mx-auto high-contrast:bg-black high-contrast:border-white"
      role="status"
      aria-live="polite"
      aria-label="Document Processing Status"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 high-contrast:bg-yellow-400 high-contrast:text-black">
            {progress.step === 'error' ? (
              <AlertCircle className="w-6 h-6 text-red-600" />
            ) : progress.step === 'completed' ? (
              <CheckCircle2 className="w-6 h-6 text-teal-600" />
            ) : (
              <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-900 high-contrast:text-white">
              {progress.step === 'error'
                ? 'Processing Error'
                : progress.step === 'completed'
                ? 'Notice Processing Ready!'
                : 'Analyzing Notice Document...'}
            </h2>
            <p className="text-sm text-slate-500 high-contrast:text-yellow-300">
              {progress.status || 'Extracting bilingual information'}
            </p>
          </div>
        </div>

        {onCancel && progress.step !== 'completed' && (
          <button
            onClick={onCancel}
            aria-label="Cancel notice processing"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500 high-contrast:text-white"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 high-contrast:text-white mb-2">
          <span>Overall Progress</span>
          <span className="font-mono text-teal-700 high-contrast:text-yellow-300">{percent}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 high-contrast:bg-slate-900 high-contrast:border-white">
          <div
            className="h-full bg-gradient-to-r from-teal-600 to-teal-500 transition-all duration-300 rounded-full high-contrast:bg-yellow-400"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="space-y-3">
        {steps.map((st, idx) => {
          const status = getStepStatus(idx);
          return (
            <div
              key={st.id}
              className={`flex items-center gap-3 p-2.5 rounded-xl border text-sm transition-colors ${
                status === 'current'
                  ? 'bg-teal-50/70 border-teal-300 font-semibold text-teal-900 high-contrast:bg-slate-900 high-contrast:border-yellow-400 high-contrast:text-yellow-300'
                  : status === 'done'
                  ? 'bg-slate-50 border-slate-200 text-slate-700 high-contrast:bg-black high-contrast:border-white/40 high-contrast:text-white'
                  : 'bg-white border-transparent text-slate-400 high-contrast:text-slate-600'
              }`}
            >
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                {status === 'done' ? (
                  <CheckCircle2 className="w-5 h-5 text-teal-600 high-contrast:text-yellow-400" />
                ) : status === 'current' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600 high-contrast:text-yellow-300" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 high-contrast:bg-slate-700" />
                )}
              </div>
              <span>{st.label}</span>
            </div>
          );
        })}
      </div>

      {progress.errorMessage && (
        <div
          role="alert"
          className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm high-contrast:bg-black high-contrast:border-red-400 high-contrast:text-red-200"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Error Processing Notice</p>
              <p className="text-xs mt-1 leading-relaxed">{progress.errorMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
