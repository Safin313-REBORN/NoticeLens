import React, { useState } from 'react';
import { SavedNotice } from '../../types/notice';
import { Bookmark, Search, Calendar, Trash2, ArrowUpRight, Download, AlertCircle, Scan } from 'lucide-react';
import { Modal } from '../common/Modal';
import { buildEventFromNotice, downloadIcsFile, generateSafeCalendarFilename } from '../../services/export/icsExporter';

interface SavedNoticesListProps {
  notices: SavedNotice[];
  onOpenNotice: (notice: SavedNotice) => void;
  onDeleteNotice: (id: string) => void;
  onScanNewNotice: () => void;
  onDownloadIcsSuccess: () => void;
  onClearAllNotices?: () => void;
}

export const SavedNoticesList: React.FC<SavedNoticesListProps> = ({
  notices,
  onOpenNotice,
  onDeleteNotice,
  onScanNewNotice,
  onDownloadIcsSuccess,
  onClearAllNotices,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [noticeToDelete, setNoticeToDelete] = useState<SavedNotice | null>(null);
  const [showPurgeModal, setShowPurgeModal] = useState<boolean>(false);

  const categories = ['all', 'Examination', 'Admission', 'Event', 'Scholarship', 'General'];

  const filteredNotices = notices.filter((n) => {
    const matchesCategory = selectedCategory === 'all' || n.category === selectedCategory;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.notice.fields.institution.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.notice.ocrText.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleExportIcs = (saved: SavedNotice, e: React.MouseEvent) => {
    e.stopPropagation();
    const eventData = buildEventFromNotice(saved.notice);
    if (eventData) {
      downloadIcsFile(eventData, generateSafeCalendarFilename(saved.title, 'deadline'));
      onDownloadIcsSuccess();
    }
  };

  const confirmDelete = () => {
    if (noticeToDelete) {
      onDeleteNotice(noticeToDelete.id);
      setNoticeToDelete(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-ink-900 high-contrast:text-white">
            Saved University Notices & Deadlines
          </h1>
          <p className="text-xs font-bold text-slate-600 high-contrast:text-yellow-300 mt-1 uppercase tracking-wider">
            Privately stored on your device's local database. Never uploaded to external servers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {notices.length > 0 && onClearAllNotices && (
            <button
              onClick={() => setShowPurgeModal(true)}
              className="neu-btn inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs transition-colors border border-red-200/60 high-contrast:!bg-black high-contrast:!text-red-400 high-contrast:!border-red-400"
              title="Purge all saved notices when leaving a public or shared university computer"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" />
              <span>Purge Terminal Data</span>
            </button>
          )}

          <button
            onClick={onScanNewNotice}
            className="neu-btn inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition-colors shadow-sm high-contrast:!bg-yellow-400 high-contrast:!text-black"
          >
            <Scan className="w-4 h-4 stroke-[2.5]" />
            <span>Scan Another Notice</span>
          </button>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved notices by title, university, or keywords..."
            aria-label="Search saved notices"
            className="w-full pl-10 pr-4 py-2.5 neu-inset rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 high-contrast:!bg-black high-contrast:!border-white high-contrast:!text-white"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`neu-btn px-3 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white shadow-sm high-contrast:!bg-yellow-400 high-contrast:!text-black'
                  : 'bg-[#eef2f8] text-slate-700 hover:text-slate-900 border border-white/60 high-contrast:!bg-black high-contrast:!text-white'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notices List */}
      {filteredNotices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredNotices.map((item) => {
            const hasDead = item.hasDeadline && item.deadlineDate;
            const inst = item.notice.fields.institution.value;

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpenNotice(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenNotice(item);
                  }
                }}
                aria-label={`Open ${item.title}`}
                className="neu-card neu-card-hover p-5 cursor-pointer flex flex-col justify-between group high-contrast:!bg-black high-contrast:!border-white"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="neu-badge px-2.5 py-0.5 bg-sky-100 text-sky-800 font-bold text-[10px] high-contrast:!bg-yellow-400 high-contrast:!text-black">
                      {item.category}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 high-contrast:text-slate-300">
                      Saved {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 high-contrast:text-white group-hover:text-sky-600 transition-colors line-clamp-2 uppercase tracking-tight">
                    {item.title}
                  </h2>

                  {inst && inst !== 'Not found in notice' && (
                    <p className="text-xs font-medium text-slate-500 high-contrast:text-yellow-300 mt-1 line-clamp-1 uppercase tracking-wider">
                      {inst}
                    </p>
                  )}

                  {hasDead && (
                    <div className="mt-3 p-3 neu-inset rounded-xl text-slate-800 flex items-center gap-2.5 text-xs high-contrast:!bg-slate-900 high-contrast:!text-yellow-300">
                      <Calendar className="w-4 h-4 stroke-[2.5] text-amber-600 shrink-0 high-contrast:text-yellow-400" />
                      <div>
                        <span className="font-bold block uppercase text-[10px] text-slate-500 high-contrast:text-yellow-300">Important Deadline:</span>
                        <span className="font-extrabold text-sm text-slate-900 high-contrast:text-white">{item.deadlineDate}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 high-contrast:border-white/40 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {hasDead && (
                      <button
                        onClick={(e) => handleExportIcs(item, e)}
                        aria-label={`Export ${item.title} calendar event`}
                        className="p-1.5 neu-btn rounded-xl bg-[#eef2f8] hover:text-sky-600 text-slate-700 shadow-[2px_2px_4px_#c5d0e0,-2px_-2px_4px_#ffffff] border border-white/60 transition-colors high-contrast:!text-white"
                        title="Export Calendar (.ics)"
                      >
                        <Download className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNoticeToDelete(item);
                      }}
                      aria-label={`Delete ${item.title}`}
                      className="p-1.5 neu-btn rounded-xl bg-[#eef2f8] hover:text-red-600 text-slate-700 shadow-[2px_2px_4px_#c5d0e0,-2px_-2px_4px_#ffffff] border border-white/60 transition-colors high-contrast:!text-red-400"
                      title="Delete saved notice"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-sky-600 group-hover:translate-x-1 transition-transform high-contrast:text-yellow-300">
                    <span>Open in Workspace</span>
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="neu-card p-12 text-center max-w-lg mx-auto high-contrast:!bg-black high-contrast:!border-white">
          <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 mx-auto mb-4 border border-white/60 shadow-sm high-contrast:!bg-yellow-400 high-contrast:!text-black">
            <Bookmark className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-bold uppercase text-slate-900 high-contrast:text-white mb-2 tracking-tight">
            No saved notices found
          </h2>
          <p className="text-xs font-medium text-slate-600 high-contrast:text-slate-300 mb-6 leading-relaxed">
            {searchQuery
              ? 'No notices match your search keywords or active category filter.'
              : 'When you scan and save university notices, they will appear here privately on your device.'}
          </p>
          <button
            onClick={onScanNewNotice}
            className="neu-btn inline-flex items-center gap-2 px-5 py-3 bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition-colors shadow-sm high-contrast:!bg-yellow-400 high-contrast:!text-black"
          >
            <Scan className="w-4 h-4 stroke-[2.5]" />
            <span>Scan Your First Notice</span>
          </button>
        </div>
      )}

      {/* Accessible Confirmation Modal for Deletion */}
      <Modal
        isOpen={noticeToDelete !== null}
        onClose={() => setNoticeToDelete(null)}
        title="Confirm Deletion"
        description="Permanently remove saved notice from this device"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs high-contrast:bg-black high-contrast:border-red-400 high-contrast:text-red-200">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Are you sure you want to delete this notice?</p>
              <p className="mt-1">
                "{noticeToDelete?.title}" will be removed from your browser's private local database.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setNoticeToDelete(null)}
              className="neu-btn px-4 py-2 bg-[#eef2f8] text-slate-700 text-xs font-bold hover:text-slate-900 border border-white/60 high-contrast:border-white high-contrast:text-white"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="neu-btn px-4 py-2 bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors high-contrast:bg-red-700 high-contrast:text-white shadow-sm"
            >
              Delete Notice
            </button>
          </div>
        </div>
      </Modal>

      {/* Accessible Confirmation Modal for Purging All Saved Data (Shared Terminal Reset) */}
      {showPurgeModal && (
        <Modal
          isOpen={showPurgeModal}
          onClose={() => setShowPurgeModal(false)}
          title="Purge Terminal Data"
          description="Clear all saved notices when leaving a public or shared university computer"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs high-contrast:bg-black high-contrast:border-red-400 high-contrast:text-red-200">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Permanently erase all {notices.length} saved notice(s)?</p>
                <p className="mt-1 leading-relaxed">
                  This will completely clear your browser's private local storage on this computer. Use this option to protect your personal information after using a shared library or cyber-café terminal.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                className="neu-btn px-4 py-2 bg-[#eef2f8] text-slate-700 text-xs font-bold hover:text-slate-900 border border-white/60 high-contrast:border-white high-contrast:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPurgeModal(false);
                  if (onClearAllNotices) onClearAllNotices();
                }}
                className="neu-btn px-4 py-2 bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-sm high-contrast:bg-red-700 high-contrast:text-white"
              >
                Purge All Saved Notices
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
