import { useState, useEffect, useRef } from 'react';
import { SkipLink } from './components/accessibility/SkipLink';
import { AccessibilityToolbar } from './components/accessibility/AccessibilityToolbar';
import { ScreenReaderLive } from './components/accessibility/ScreenReaderLive';
import { Navbar, ActiveTab } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { NoticeUploader } from './components/upload/NoticeUploader';
import { ProcessingCard } from './components/upload/ProcessingCard';
import { NoticeWorkspace } from './components/results/NoticeWorkspace';
import { SavedNoticesList } from './components/saved/SavedNoticesList';
import { AudioPlayerBar } from './components/speech/AudioPlayerBar';
import { ToastProvider, useToast } from './components/common/Toast';
import { Modal } from './components/common/Modal';

import { ProcessedNotice, SavedNotice, OCRProgress } from './types/notice';
import { runOcrRecognition, terminateOcrWorker } from './services/ocr/tesseractWorker';
import { preprocessNoticeImage } from './services/ocr/imagePreprocess';
import { processNoticeDocument } from './services/extraction/noticeEngine';
import { generateNoticeSummary } from './services/extraction/summaryGenerator';
import { saveNotice, getAllSavedNotices, deleteSavedNotice } from './services/storage/indexedDBService';
import { speechService } from './services/speech/webSpeechService';
import { DEMO_NOTICES, DemoNoticeItem, generateDemoNoticeSvg } from './data/demoNotices';
import { ArrowRight } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scan');
  const [activeNotice, setActiveNotice] = useState<ProcessedNotice | null>(null);
  const [savedNotices, setSavedNotices] = useState<SavedNotice[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<OCRProgress>({
    status: 'idle',
    progress: 0,
    step: 'idle',
  });
  const [announcement, setAnnouncement] = useState<string>('Welcome to NoticeLens. Accessible notice reader.');
  const [sampleModalOpen, setSampleModalOpen] = useState<boolean>(false);

  const isCancelledRef = useRef<boolean>(false);
  const { showToast } = useToast();

  const handleTabChange = (tab: ActiveTab) => {
    if (tab !== activeTab) {
      speechService.stop();
    }
    setActiveTab(tab);
  };

  // Load saved notices from IndexedDB on startup
  useEffect(() => {
    loadSavedNotices();
  }, []);

  const loadSavedNotices = async () => {
    try {
      const list = await getAllSavedNotices();
      setSavedNotices(list);
    } catch (e) {
      console.warn('Failed to load saved notices on startup:', e);
    }
  };

  const handleProcessImage = async (
    imageSource: string | File,
    language: 'ben' | 'eng' | 'ben+eng',
    applyPreprocessing: boolean,
    sourceType: 'upload' | 'camera' | 'demo'
  ) => {
    isCancelledRef.current = false;
    setIsProcessing(true);
    setAnnouncement('Starting notice document recognition. Please wait.');

    try {
      let finalImageSource: string | File = imageSource;
      let previewDataUrl: string | undefined;

      if (applyPreprocessing) {
        setOcrProgress({
          step: 'loading_worker',
          progress: 0.1,
          status: 'Enhancing contrast and normalizing document layout...',
        });

        try {
          const preprocessed = await preprocessNoticeImage(imageSource, {
            grayscale: true,
            enhanceContrast: true,
          });
          finalImageSource = preprocessed.processedDataUrl;
          previewDataUrl = preprocessed.processedDataUrl;
        } catch (prepErr) {
          console.warn('Preprocessing skipped due to error, proceeding with raw image:', prepErr);
        }
      }

      if (!previewDataUrl) {
        previewDataUrl = typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource);
      }

      const ocrResult = await runOcrRecognition(finalImageSource, language, (prog) => {
        setOcrProgress(prog);
      });

      setOcrProgress({
        step: 'extracting',
        progress: 0.95,
        status: 'Extracting verified deadlines, venue, and actionable details...',
      });

      const processed = processNoticeDocument(ocrResult.text, {
        ocrLanguage: language,
        ocrConfidence: ocrResult.confidence,
        imageDataUrl: previewDataUrl,
        sourceType,
      });

      setActiveNotice(processed);
      setIsProcessing(false);
      speechService.stop();
      setActiveTab('workspace');
      showToast('Notice successfully processed and organized!', 'success');
      setAnnouncement(`Notice processed successfully. ${processed.title}. Switched to Notice Workspace.`);
    } catch (err: unknown) {
      if (isCancelledRef.current) {
        return;
      }
      console.error('Notice processing error:', err);
      setIsProcessing(false);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process notice image.';
      setOcrProgress({
        step: 'error',
        progress: 0,
        status: 'Recognition Error',
        errorMessage,
      });
      showToast('Error recognizing notice. You may retry or inspect text.', 'error');
      setAnnouncement('Notice processing failed. Please check error details.');
    }
  };

  const handleLoadDemoDirectly = (demo: DemoNoticeItem) => {
    const svgPreview = generateDemoNoticeSvg(demo);
    const processed = processNoticeDocument(demo.ocrText, {
      ocrLanguage: demo.language,
      ocrConfidence: 94,
      imageDataUrl: svgPreview,
      sourceType: 'demo',
    });

    setActiveNotice(processed);
    speechService.stop();
    setActiveTab('workspace');
    setSampleModalOpen(false);
    showToast(`Loaded demonstration sample: "${demo.title}"`, 'info');
    setAnnouncement(`Loaded sample notice: ${demo.title}. Navigated to Notice Workspace.`);
  };

  const handleUpdateNoticeField = (key: string, newValue: string) => {
    if (!activeNotice) return;

    const updatedFields = { ...activeNotice.fields };
    if (updatedFields[key as keyof typeof updatedFields]) {
      const field = updatedFields[key as keyof typeof updatedFields];
      updatedFields[key as keyof typeof updatedFields] = {
        ...field,
        value: newValue,
        status: 'user_edited',
      };
    }

    const updatedSummary = generateNoticeSummary(updatedFields, activeNotice.summary.language);

    setActiveNotice({
      ...activeNotice,
      fields: updatedFields,
      summary: updatedSummary,
      updatedAt: new Date().toISOString(),
    });

    showToast('Field correction updated.', 'info');
    setAnnouncement(`Field ${key} updated.`);
  };

  const handleUpdateOcrText = (newText: string) => {
    if (!activeNotice) return;
    setActiveNotice({
      ...activeNotice,
      ocrText: newText,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleReExtractFromOcr = () => {
    if (!activeNotice) return;

    const reprocessed = processNoticeDocument(activeNotice.ocrText, {
      ocrLanguage: activeNotice.ocrLanguage,
      ocrConfidence: activeNotice.ocrConfidence,
      imageDataUrl: activeNotice.imageDataUrl,
      sourceType: activeNotice.sourceType,
      existingId: activeNotice.id,
    });

    // Preserve any user-edited fields
    for (const [k, v] of Object.entries(activeNotice.fields)) {
      if (v.status === 'user_edited') {
        reprocessed.fields[k as keyof typeof reprocessed.fields] = v;
      }
    }

    reprocessed.summary = generateNoticeSummary(reprocessed.fields, reprocessed.summary.language);

    setActiveNotice(reprocessed);
    showToast('Notice fields re-derived from edited transcript.', 'success');
    setAnnouncement('Details re-extracted from updated text.');
  };

  const handleSaveActiveNotice = async () => {
    if (!activeNotice) return;

    try {
      await saveNotice(activeNotice);
      await loadSavedNotices();
      showToast('Notice saved privately on your device!', 'success');
      setAnnouncement('Notice saved to device local database.');
    } catch (e: unknown) {
      console.error('Failed to save notice:', e);
      const message = e instanceof Error ? e.message : 'Could not save notice to storage.';
      showToast(message, 'error');
      setAnnouncement(`Notice save failed: ${message}`);
    }
  };

  const handleDeleteSavedNotice = async (id: string) => {
    try {
      await deleteSavedNotice(id);
      await loadSavedNotices();
      showToast('Saved notice removed.', 'info');
      setAnnouncement('Notice deleted.');
    } catch (e) {
      console.error('Failed to delete notice:', e);
      showToast('Failed to delete notice.', 'error');
    }
  };

  const handleOpenSavedNotice = (saved: SavedNotice) => {
    setActiveNotice(saved.notice);
    speechService.stop();
    setActiveTab('workspace');
    showToast(`Opened: "${saved.title}"`, 'info');
    setAnnouncement(`Opened saved notice: ${saved.title}.`);
  };

  const handleCancelOcr = () => {
    isCancelledRef.current = true;
    terminateOcrWorker();
    setIsProcessing(false);
    setOcrProgress({
      step: 'idle',
      progress: 0,
      status: 'Cancelled by user',
    });
    setAnnouncement('OCR processing cancelled.');
  };

  const savedRecord = activeNotice ? savedNotices.find((s) => s.id === activeNotice.id) : null;
  const isCurrentNoticeSaved = savedRecord !== null && savedRecord !== undefined;
  const hasUnsavedChanges = isCurrentNoticeSaved && savedRecord?.notice.updatedAt !== activeNotice?.updatedAt;

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50 high-contrast:bg-black text-ink-900 high-contrast:text-white">
      {/* 1. Accessible Skip Link */}
      <SkipLink />

      {/* 2. Global Screen Reader Live Region */}
      <ScreenReaderLive message={announcement} />

      {/* 3. Accessibility & High Contrast Toolbar */}
      <AccessibilityToolbar onAnnouncement={(txt) => setAnnouncement(txt)} />

      {/* 4. Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        savedCount={savedNotices.length}
        hasActiveNotice={activeNotice !== null}
        onOpenSampleModal={() => setSampleModalOpen(true)}
      />

      {/* 5. Main Content Area */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Processing Loading Overlay/Card */}
        {isProcessing && (
          <div className="py-12">
            <ProcessingCard progress={ocrProgress} onCancel={handleCancelOcr} />
          </div>
        )}

        {/* Tab 1: Scan & Upload Screen */}
        {!isProcessing && activeTab === 'scan' && (
          <NoticeUploader
            onProcessImage={handleProcessImage}
            onLoadDemoDirectly={handleLoadDemoDirectly}
            isProcessing={isProcessing}
          />
        )}

        {/* Tab 2: Results Workspace */}
        {!isProcessing && activeTab === 'workspace' && activeNotice && (
          <NoticeWorkspace
            notice={activeNotice}
            onUpdateNoticeField={handleUpdateNoticeField}
            onUpdateOcrText={handleUpdateOcrText}
            onReExtract={handleReExtractFromOcr}
            onSaveNotice={handleSaveActiveNotice}
            isSaved={isCurrentNoticeSaved}
            hasUnsavedChanges={hasUnsavedChanges}
            onCopySuccess={() => showToast('Recognized text copied to clipboard.', 'info')}
            onDownloadIcsSuccess={() => showToast('Calendar ICS file generated and downloaded.', 'success')}
          />
        )}

        {/* Tab 3: Saved Notices & Deadlines */}
        {!isProcessing && activeTab === 'saved' && (
          <SavedNoticesList
            notices={savedNotices}
            onOpenNotice={handleOpenSavedNotice}
            onDeleteNotice={handleDeleteSavedNotice}
            onScanNewNotice={() => handleTabChange('scan')}
            onDownloadIcsSuccess={() => showToast('Calendar file downloaded.', 'success')}
          />
        )}
      </main>

      {/* 6. Sticky Web Speech Audio Player Bar */}
      <AudioPlayerBar />

      {/* 7. Footer */}
      <Footer />

      {/* Demonstration Samples Modal */}
      <Modal
        isOpen={sampleModalOpen}
        onClose={() => setSampleModalOpen(false)}
        title="Bundled Fictional Notice Samples"
        description="Select a sample to evaluate NoticeLens features without uploading personal documents"
      >
        <div className="space-y-3">
          {DEMO_NOTICES.map((demo) => (
            <div
              key={demo.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 bg-white transition-all high-contrast:bg-black high-contrast:border-white"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-900 high-contrast:bg-yellow-400 high-contrast:text-black uppercase">
                  {demo.category} • {demo.language.toUpperCase()}
                </span>
                <span className="text-xs text-slate-400 high-contrast:text-slate-300">Fictional Notice</span>
              </div>
              <h3 className="text-sm font-bold text-ink-900 high-contrast:text-white">
                {demo.title}
              </h3>
              <p className="text-xs text-slate-500 high-contrast:text-yellow-300 mt-1">
                {demo.description}
              </p>
              <div className="mt-3 flex items-center justify-end">
                <button
                  onClick={() => handleLoadDemoDirectly(demo)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 high-contrast:bg-yellow-400 high-contrast:text-black"
                >
                  <span>Load Sample</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
