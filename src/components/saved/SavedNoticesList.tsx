import React, { useState } from 'react';
import { SavedNotice } from '../../types/notice';
import { Bookmark, Search, Calendar, Trash2, ArrowUpRight, Download, AlertCircle, Scan } from 'lucide-react';
import { Modal } from '../common/Modal';
import { buildEventFromNotice, downloadIcsFile } from '../../services/export/icsExporter';

interface SavedNoticesListProps {
  notices: SavedNotice[];
  onOpenNotice: (notice: SavedNotice) => void;
  onDeleteNotice: (id: string) => void;
  onScanNewNotice: () => void;
  onDownloadIcsSuccess: () => void;
}

export const SavedNoticesList: React.FC<SavedNoticesListProps> = ({
  notices,
  onOpenNotice,
  onDeleteNotice,
  onScanNewNotice,
  onDownloadIcsSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [noticeToDelete, setNoticeToDelete] = useState<SavedNotice | null>(null);

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
      downloadIcsFile(eventData, `${saved.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 high-contrast:text-white">
            Saved University Notices & Deadlines
          </h1>
          <p className="text-xs text-slate-500 high-contrast:text-yellow-300 mt-1">
            Privately stored on your device's local database. Never uploaded to external servers.
          </p>
        </div>

        <button
          onClick={onScanNewNotice}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 text-white font-bold text-xs hover:bg-teal-800 transition-colors shadow-sm high-contrast:bg-yellow-400 high-contrast:text-black"
        >
          <Scan className="w-4 h-4" />
          <span>Scan Another Notice</span>
        </button>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved notices by title, university, or keywords..."
            aria-label="Search saved notices"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs text-ink-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 high-contrast:bg-black high-contrast:border-white high-contrast:text-white"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-teal-700 text-white high-contrast:bg-yellow-400 high-contrast:text-black font-bold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 high-contrast:bg-black high-contrast:border-white high-contrast:text-white'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notices List */}
      {filteredNotices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotices.map((item) => {
            const hasDead = item.hasDeadline && item.deadlineDate;
            const inst = item.notice.fields.institution.value;

            return (
              <div
                key={item.id}
                onClick={() => onOpenNotice(item)}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-400 transition-all cursor-pointer flex flex-col justify-between group high-contrast:bg-black high-contrast:border-white high-contrast:hover:border-yellow-400"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 group-hover:bg-teal-100 group-hover:text-teal-900 high-contrast:bg-yellow-400 high-contrast:text-black">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-400 high-contrast:text-slate-300">
                      Saved {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-ink-900 high-contrast:text-white group-hover:text-teal-800 high-contrast:group-hover:text-yellow-300 transition-colors line-clamp-2">
                    {item.title}
                  </h2>

                  {inst && inst !== 'Not found in notice' && (
                    <p className="text-xs text-slate-500 high-contrast:text-yellow-300 mt-1 line-clamp-1">
                      {inst}
                    </p>
                  )}

                  {hasDead && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 high-contrast:bg-slate-900 high-contrast:border-yellow-400 high-contrast:text-yellow-300 flex items-center gap-2 text-xs">
                      <Calendar className="w-4 h-4 text-amber-600 high-contrast:text-yellow-400 shrink-0" />
                      <div>
                        <span className="font-semibold block">Important Deadline:</span>
                        <span className="font-extrabold">{item.deadlineDate}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 high-contrast:border-white/20 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {hasDead && (
                      <button
                        onClick={(e) => handleExportIcs(item, e)}
                        aria-label={`Export ${item.title} calendar event`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 high-contrast:text-white"
                        title="Export Calendar (.ics)"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNoticeToDelete(item);
                      }}
                      aria-label={`Delete ${item.title}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500 high-contrast:text-red-400"
                      title="Delete saved notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 group-hover:translate-x-0.5 transition-transform high-contrast:text-yellow-300">
                    <span>Open in Workspace</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto high-contrast:bg-black high-contrast:border-white">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 mx-auto mb-4 high-contrast:bg-yellow-400 high-contrast:text-black">
            <Bookmark className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-ink-900 high-contrast:text-white mb-2">
            No saved notices found
          </h2>
          <p className="text-xs text-slate-500 high-contrast:text-slate-300 mb-6 leading-relaxed">
            {searchQuery
              ? 'No notices match your search keywords or active category filter.'
              : 'When you scan and save university notices, they will appear here privately on your device.'}
          </p>
          <button
            onClick={onScanNewNotice}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-700 text-white font-semibold text-xs hover:bg-teal-800 transition-colors high-contrast:bg-yellow-400 high-contrast:text-black"
          >
            <Scan className="w-4 h-4" />
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
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 high-contrast:border-white high-contrast:text-white"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors high-contrast:bg-red-700 high-contrast:text-white"
            >
              Delete Notice
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
