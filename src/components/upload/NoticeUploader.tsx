import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Camera, FileText, Image as ImageIcon, Sparkles, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { DEMO_NOTICES, DemoNoticeItem, generateDemoNoticeSvg } from '../../data/demoNotices';

interface NoticeUploaderProps {
  onProcessImage: (
    imageSource: string | File,
    language: 'ben' | 'eng' | 'ben+eng',
    applyPreprocessing: boolean,
    sourceType: 'upload' | 'camera' | 'demo'
  ) => void;
  onLoadDemoDirectly: (demo: DemoNoticeItem) => void;
  isProcessing: boolean;
  ocrError?: string | null;
  onClearOcrError?: () => void;
}

export const NoticeUploader: React.FC<NoticeUploaderProps> = ({
  onProcessImage,
  onLoadDemoDirectly,
  isProcessing,
  ocrError,
  onClearOcrError,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<'ben' | 'eng' | 'ben+eng'>('ben+eng');
  const [preprocess, setPreprocess] = useState<boolean>(true);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage('Unsupported file format. Please upload a JPEG, PNG, or WebP notice image.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('Image size exceeds 10 MB limit. Please select a smaller photo or document.');
      return false;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const clearSelection = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const lastAttemptedSourceRef = useRef<string | File | null>(null);

  const handleStartOCR = () => {
    const src = selectedFile || previewUrl || lastAttemptedSourceRef.current;
    if (!src) {
      setErrorMessage('Please select or capture a notice image first.');
      return;
    }
    onProcessImage(src, language, preprocess, selectedFile ? 'upload' : 'demo');
  };

  const handleSelectDemo = (demo: DemoNoticeItem) => {
    clearSelection();
    // Generate clean SVG visual for preview
    const svgUri = generateDemoNoticeSvg(demo);
    lastAttemptedSourceRef.current = svgUri;
    setPreviewUrl(svgUri);
    setLanguage(demo.language);
    onLoadDemoDirectly(demo);
  };

  const handleScanSampleLive = (demo: DemoNoticeItem) => {
    setErrorMessage(null);
    onClearOcrError?.();
    const svgUri = generateDemoNoticeSvg(demo);
    lastAttemptedSourceRef.current = svgUri;
    setPreviewUrl(svgUri);
    setLanguage(demo.language);
    onProcessImage(svgUri, demo.language, false, 'demo');
  };

  return (
    <div className="space-y-8">
      {/* Hero Introduction */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 neu-badge bg-sky-50 border border-sky-200/50 text-sky-900 text-xs font-bold uppercase tracking-wider high-contrast:!bg-yellow-400 high-contrast:!text-black high-contrast:!border-white">
          <Sparkles className="w-4 h-4 text-sky-600 high-contrast:text-black" />
          <span>Notice Intelligence for Low-Vision & Visually Impaired Students</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 high-contrast:text-white uppercase tracking-tight">
          Transform University Notices into <br className="hidden sm:inline" />
          <span className="text-sky-600 bg-sky-100/70 px-2.5 py-0.5 rounded-xl inline-block mt-1 high-contrast:bg-yellow-400 high-contrast:text-black">
            Clear, Actionable Details
          </span>
        </h1>
        <p className="text-sm font-medium text-slate-600 high-contrast:text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Scan or upload any Bengali, English, or bilingual university announcement. NoticeLens extracts deadlines, fees, rooms, and action items with verifiable source evidence and audio narration.
        </p>
      </div>

      {/* Main Upload Box */}
      <div className="neu-card p-6 sm:p-8 max-w-3xl mx-auto high-contrast:!bg-black high-contrast:!border-white">
        {!previewUrl ? (
          <div>
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`neu-inset border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
                dragOver
                  ? 'border-sky-500 bg-sky-50/70 scale-[1.01] high-contrast:border-yellow-400 high-contrast:bg-slate-900'
                  : 'border-slate-300 hover:border-sky-400 bg-[#eef2f8] high-contrast:border-white high-contrast:bg-slate-950'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#eef2f8] shadow-[5px_5px_12px_#c5d0e0,-5px_-5px_12px_#ffffff] flex items-center justify-center text-sky-600 mx-auto mb-4 border border-white/60 high-contrast:bg-yellow-400 high-contrast:text-black">
                <UploadCloud className="w-8 h-8 stroke-[2.5]" />
              </div>

              <h2 className="text-xl font-black text-slate-900 high-contrast:text-white uppercase mb-1">
                Drop your university notice here
              </h2>
              <p className="text-xs font-bold text-slate-500 high-contrast:text-slate-400 mb-6 uppercase tracking-wider">
                Supports JPEG, PNG, and WebP (up to 10 MB)
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="neu-btn inline-flex items-center gap-2 px-5 py-3 bg-sky-600 text-white hover:bg-sky-700 rounded-xl shadow-[4px_4px_10px_#c5d0e0,-4px_-4px_10px_#ffffff] focus-visible:ring-4 focus-visible:ring-sky-500 font-bold text-sm high-contrast:!bg-yellow-400 high-contrast:!text-black"
                >
                  <FileText className="w-4 h-4 stroke-[2.5]" />
                  <span>Choose Notice Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="neu-btn inline-flex items-center gap-2 px-5 py-3 bg-[#eef2f8] text-slate-800 hover:bg-white rounded-xl shadow-[4px_4px_10px_#c5d0e0,-4px_-4px_10px_#ffffff] border border-white/70 focus-visible:ring-4 focus-visible:ring-sky-500 font-bold text-sm high-contrast:!bg-slate-900 high-contrast:!text-white high-contrast:!border-white"
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                  <span>Take Photo with Camera</span>
                </button>
              </div>

              {/* Mobile Gesture Navigation Hint */}
              <div className="md:hidden mt-6 p-2 rounded-xl bg-sky-100/60 text-sky-900 text-[11px] font-bold flex items-center justify-center gap-1.5 high-contrast:!bg-black high-contrast:!border high-contrast:!border-yellow-400 high-contrast:!text-yellow-300">
                <span>📱 Pattern Gesture UI Active • Swipe screen to navigate</span>
              </div>

              {/* Hidden Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload notice image file"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Capture notice with camera"
              />
            </div>
          </div>
        ) : (
          /* Image Preview & Options State */
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 high-contrast:border-white pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 shadow-sm border border-white/60 high-contrast:!bg-yellow-400 high-contrast:!text-black">
                  <ImageIcon className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 high-contrast:text-white">
                    Selected Notice Document
                  </h2>
                  <p className="text-xs font-medium text-slate-500 high-contrast:text-slate-300">
                    {selectedFile ? `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(0)} KB)` : 'Demonstration Notice Document'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="neu-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 high-contrast:!bg-black high-contrast:!border-red-400 high-contrast:!text-red-300"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
                <span>Remove</span>
              </button>
            </div>

            {/* Document Preview Box */}
            <div className="relative neu-inset overflow-hidden max-h-80 flex items-center justify-center p-3 rounded-2xl high-contrast:bg-slate-950 high-contrast:border-white">
              <img
                src={previewUrl}
                alt="Selected university notice document"
                className="max-h-72 w-auto object-contain rounded-lg"
              />
            </div>

            {/* Recognition Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 neu-inset p-4 rounded-xl border border-slate-200/60 high-contrast:!bg-slate-900 high-contrast:!border-white">
              {/* Language Selection */}
              <div>
                <label
                  htmlFor="ocr-language-select"
                  className="block text-xs font-bold text-slate-700 high-contrast:text-white mb-1.5"
                >
                  OCR Language Mode:
                </label>
                <select
                  id="ocr-language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'ben' | 'eng' | 'ben+eng')}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-300 bg-white/95 text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 high-contrast:!bg-black high-contrast:!text-white high-contrast:!border-white"
                >
                  <option value="ben+eng">Bengali + English (Recommended)</option>
                  <option value="ben">Bengali Only (বাংলা)</option>
                  <option value="eng">English Only</option>
                </select>
              </div>

              {/* Preprocessing Checkbox */}
              <div className="flex items-center gap-3 pt-4 sm:pt-6">
                <input
                  id="preprocess-toggle"
                  type="checkbox"
                  checked={preprocess}
                  onChange={(e) => setPreprocess(e.target.checked)}
                  className="w-5 h-5 rounded-md border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <label
                  htmlFor="preprocess-toggle"
                  className="text-xs font-bold text-slate-700 high-contrast:text-white cursor-pointer select-none"
                >
                  Enhance contrast for printed notice readability
                </label>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleStartOCR}
                disabled={isProcessing}
                className="flex-1 neu-btn inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-sky-600 text-white font-bold text-base hover:bg-sky-700 transition-all shadow-md disabled:opacity-50 high-contrast:!bg-yellow-400 high-contrast:!text-black"
              >
                <RefreshCw className={`w-5 h-5 stroke-[2.5] ${isProcessing ? 'animate-spin' : ''}`} />
                <span>{isProcessing ? 'Processing Notice...' : 'Start Notice Recognition (OCR)'}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="neu-btn px-4 py-3 bg-[#eef2f8] text-slate-700 font-bold text-sm hover:text-slate-900 border border-white/60 high-contrast:!border-white high-contrast:!text-white"
              >
                Replace Image
              </button>
            </div>
          </div>
        )}

        {/* Validation Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="neu-card mt-6 p-4 border-l-4 border-red-500 bg-red-50/80 text-red-900 text-sm flex items-start gap-2.5 high-contrast:!bg-black high-contrast:!border-red-400 high-contrast:!text-red-200"
          >
            <ShieldAlert className="w-5 h-5 stroke-[2.5] shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-bold uppercase tracking-wider">Validation Issue</p>
              <p className="text-xs mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* OCR Recognition Error Alert with Direct Retry */}
        {ocrError && (
          <div
            role="alert"
            className="neu-card mt-6 p-4 border-l-4 border-red-500 bg-red-50/90 text-red-900 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 high-contrast:!bg-black high-contrast:!border-red-400 high-contrast:!text-red-200"
          >
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 stroke-[2.5] shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold uppercase tracking-wider">Recognition Error</p>
                <p className="text-xs mt-1 font-medium">{ocrError}</p>
                <p className="text-[11px] mt-1 text-slate-600 high-contrast:text-slate-400">
                  Your document selection has been preserved. You can change language, adjust contrast, or retry.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={handleStartOCR}
                disabled={isProcessing}
                className="neu-btn px-3 py-1.5 text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 shadow-sm disabled:opacity-50 high-contrast:!bg-yellow-400 high-contrast:!text-black"
              >
                Retry OCR
              </button>
              {onClearOcrError && (
                <button
                  type="button"
                  onClick={onClearOcrError}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 focus-visible:outline-none"
                  aria-label="Dismiss recognition error"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fictional Sample Notice Presets for Live Testing */}
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 high-contrast:text-yellow-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-600 high-contrast:text-yellow-400" />
            <span>Try Fictional University Notice Samples</span>
          </h2>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 high-contrast:text-slate-300">
            Pre-bundled for evaluation
          </span>
        </div>

        {/* Clear Explanation of Modes */}
        <div className="mb-4 p-3 rounded-xl bg-slate-100/80 border border-slate-200/80 text-xs text-slate-600 high-contrast:!bg-black high-contrast:!border-white high-contrast:!text-white flex flex-col gap-1.5">
          <p>
            <strong className="text-slate-800 high-contrast:text-yellow-300">⚡ Run Live OCR:</strong> Processes the actual sample notice image through the in-browser Tesseract engine. Requires internet for initial trained language download (~4 MB), after which models remain cached for offline use.
          </p>
          <p>
            <strong className="text-slate-800 high-contrast:text-yellow-300">📋 Instant Sample Data (Preset):</strong> Loads pre-parsed sample notice text immediately into the workspace without running OCR or downloading trained models (works 100% offline).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DEMO_NOTICES.map((demo) => (
            <div
              key={demo.id}
              className="neu-card neu-card-hover text-left p-5 flex flex-col justify-between high-contrast:!bg-black high-contrast:!border-white"
            >
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="neu-badge inline-block px-2.5 py-0.5 bg-sky-100 text-sky-800 text-xs font-bold high-contrast:!bg-yellow-400 high-contrast:!text-black">
                    {demo.category} • {demo.language.toUpperCase()}
                  </span>
                  <span className="neu-badge inline-block px-2 py-0.5 bg-slate-200/80 text-slate-700 text-[10px] font-bold high-contrast:!bg-white high-contrast:!text-black">
                    Educational Archive
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 high-contrast:text-white line-clamp-1">
                  {demo.title}
                </h3>
                <p className="text-xs font-medium text-slate-700 high-contrast:text-slate-300 line-clamp-2 mt-1.5 leading-relaxed">
                  {demo.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 high-contrast:border-white/40 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleScanSampleLive(demo)}
                  disabled={isProcessing}
                  className="neu-btn py-2 px-3 bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 text-center shadow-sm disabled:opacity-50 high-contrast:!bg-yellow-400 high-contrast:!text-black"
                  title="Executes actual Tesseract OCR engine on this sample notice image"
                >
                  ⚡ Run Live OCR on Image
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDemo(demo)}
                  disabled={isProcessing}
                  className="neu-btn py-2 px-3 bg-[#eef2f8] text-slate-700 text-xs font-semibold hover:bg-white text-center border border-white/60 high-contrast:!bg-slate-900 high-contrast:!text-white disabled:opacity-50"
                  title="Loads pre-parsed text immediately without running OCR recognition"
                >
                  Instant Sample Data (Preset)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
