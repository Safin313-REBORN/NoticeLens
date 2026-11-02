import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, CheckCircle2, ListFilter } from 'lucide-react';
import { ProcessedNotice } from '../../types/notice';

interface ActionChecklistCardProps {
  notice: ProcessedNotice;
  onUpdateCompletedTasks?: (completedTaskIds: string[]) => void;
}

interface ChecklistItem {
  id: string;
  type: 'action' | 'document' | 'fee';
  title: string;
  sourceContext?: string;
  deadlineRef?: string | null;
}

export const ActionChecklistCard: React.FC<ActionChecklistCardProps> = ({
  notice,
  onUpdateCompletedTasks,
}) => {
  const { summary, fields } = notice;
  const storageKey = `noticelens_checklist_${notice.id}`;

  // Build items derived strictly from verified notice fields
  const items: ChecklistItem[] = [];

  // 1. Derived action items
  summary.actionItems.forEach((action, i) => {
    // Exclude generic placeholder if no actions were isolated
    if (action.includes('কোনো একক অ্যাকশন নির্দেশ চিহ্নিত হয়নি') || action.includes('No explicit urgent student action step')) {
      return;
    }
    items.push({
      id: `act_${i}_${action.substring(0, 15)}`,
      type: 'action',
      title: action,
      deadlineRef: summary.criticalDeadline,
    });
  });

  // 2. Required documents
  if (fields.requiredDocuments.status !== 'not_found' && summary.requiredDocs.length > 0) {
    summary.requiredDocs.forEach((doc, i) => {
      items.push({
        id: `doc_${i}_${doc.substring(0, 15)}`,
        type: 'document',
        title: `প্রস্তুত করুন: ${doc}`,
        sourceContext: fields.requiredDocuments.value,
      });
    });
  }

  // 3. Fees / Payment obligation
  if (fields.fees.status !== 'not_found') {
    items.push({
      id: `fee_${fields.fees.value.substring(0, 15)}`,
      type: 'fee',
      title: `ফি পরিশোধ নিশ্চিত করুন: ${fields.fees.value}`,
      sourceContext: fields.fees.value,
      deadlineRef: summary.criticalDeadline,
    });
  }

  // Local completed state with localStorage persistence
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to read checklist state from localStorage:', e);
    }
    return notice.completedTasks || [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(completedIds));
    } catch (e) {
      console.warn('Failed to persist checklist state:', e);
    }
    if (onUpdateCompletedTasks) {
      onUpdateCompletedTasks(completedIds);
    }
  }, [completedIds, storageKey, onUpdateCompletedTasks]);

  const toggleItem = (id: string) => {
    setCompletedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const completedCount = items.filter((it) => completedIds.includes(it.id)).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  if (items.length === 0) {
    return (
      <div className="neu-card p-5 high-contrast:!bg-black high-contrast:!border-white">
        <div className="flex items-center gap-2 text-slate-700 high-contrast:text-white">
          <ListFilter className="w-5 h-5 text-slate-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Student Action Checklist</h3>
        </div>
        <p className="text-xs text-slate-500 high-contrast:text-slate-300 mt-2">
          No mandatory tasks or document attachments were isolated from this circular.
        </p>
      </div>
    );
  }

  return (
    <section
      className="neu-card p-6 high-contrast:!bg-black high-contrast:!border-white space-y-5"
      aria-labelledby="checklist-heading"
    >
      {/* Header & Progress Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 high-contrast:border-white">
        <div className="flex items-center gap-2.5">
          <CheckSquare className="w-5 h-5 text-sky-600 high-contrast:text-yellow-400 stroke-[2.5]" />
          <div>
            <h2 id="checklist-heading" className="text-base font-bold uppercase text-slate-900 high-contrast:text-white">
              Student Action Checklist
            </h2>
            <p className="text-xs text-slate-500 high-contrast:text-slate-300">
              Tasks and preparation derived directly from notice requirements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 high-contrast:text-yellow-300">
            {completedCount} of {items.length} Completed ({progressPercent}%)
          </span>
          {completedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setCompletedIds([]);
                localStorage.removeItem(`noticelens_checklist_${notice.id}`);
                if (onUpdateCompletedTasks) onUpdateCompletedTasks([]);
              }}
              aria-label="Reset checklist progress"
              className="neu-btn px-2.5 py-0.5 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 high-contrast:!bg-white high-contrast:!text-black ml-1.5"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div
        className="w-full bg-slate-200 high-contrast:bg-slate-800 rounded-full h-2.5 overflow-hidden"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Action items completion progress"
      >
        <div
          className="bg-emerald-500 high-contrast:bg-yellow-400 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Interactive Items List */}
      <ul className="space-y-3" role="list">
        {items.map((item) => {
          const isDone = completedIds.includes(item.id);
          return (
            <li
              key={item.id}
              role="checkbox"
              aria-checked={isDone}
              tabIndex={0}
              onClick={() => toggleItem(item.id)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  toggleItem(item.id);
                }
              }}
              className={`neu-inset p-3.5 rounded-xl cursor-pointer select-none transition-all flex items-start gap-3 border ${
                isDone
                  ? 'bg-emerald-50/60 border-emerald-300/80 high-contrast:!bg-slate-950 high-contrast:!border-emerald-400'
                  : 'bg-white/80 border-slate-200/80 hover:bg-slate-50 high-contrast:!bg-black high-contrast:!border-white'
              }`}
            >
              <div className="mt-0.5 shrink-0 text-sky-600 high-contrast:text-yellow-400">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 high-contrast:text-yellow-400 stroke-[2.5]" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 high-contrast:text-white stroke-[2]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      item.type === 'action'
                        ? 'bg-sky-100 text-sky-800 high-contrast:bg-yellow-400 high-contrast:text-black'
                        : item.type === 'document'
                        ? 'bg-purple-100 text-purple-800 high-contrast:bg-white high-contrast:text-black'
                        : 'bg-amber-100 text-amber-800 high-contrast:bg-yellow-400 high-contrast:text-black'
                    }`}
                  >
                    {item.type === 'action' ? 'Required Action' : item.type === 'document' ? 'Required Document' : 'Payment / Fee'}
                  </span>

                  {item.deadlineRef && (
                    <span className="text-[10px] font-bold text-slate-500 high-contrast:text-slate-300">
                      Timeline: {item.deadlineRef}
                    </span>
                  )}
                </div>

                <p
                  className={`text-sm font-semibold leading-relaxed ${
                    isDone
                      ? 'line-through text-slate-400 high-contrast:text-slate-500'
                      : 'text-slate-900 high-contrast:text-white'
                  }`}
                >
                  {item.title}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
