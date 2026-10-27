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
}

export const NoticeUploader: React.FC<NoticeUploaderProps> = ({
  onProcessImage,
  onLoadDemoDirectly,
  isProcessing,
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

  const handleStartOCR = () => {
    if (!selectedFile && !previewUrl) {
      setErrorMessage('Please select or capture a notice image first.');
      return;
    }
    onProcessImage(selectedFile || previewUrl!, language, preprocess, 'upload');
  };

  const handleSelectDemo = (demo: DemoNoticeItem) => {
    clearSelection();
    // Generate clean SVG visual for preview
    const svgUri = generateDemoNoticeSvg(demo);
    setPreviewUrl(svgUri);
    setLanguage(demo.language);
    onLoadDemoDirectly(demo);
  };

  return (
    <div className="space-y-8">
      {/* Hero Introduction */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 brutal-badge bg-neo-mint border-2 border-black text-black text-xs font-black uppercase tracking-wider -rotate-1 shadow-brutal-sm high-contrast:bg-yellow-400 high-contrast:text-black high-contrast:border-white">
          <Sparkles className="w-4 h-4 text-black" />
          <span>Notice Intelligence for Low-Vision & Visually Impaired Students</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-ink-900 high-contrast:text-white uppercase tracking-tight">
          Transform University Notices into <br className="hidden sm:inline" />
          <span className="bg-neo-yellow px-2 py-0.5 border-2 border-black text-black inline-block rotate-1 shadow-brutal-sm high-contrast:bg-yellow-400 high-contrast:text-black">
            Clear, Actionable Details
          </span>
        </h1>
        <p className="text-sm font-medium text-slate-700 high-contrast:text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Scan or upload any Bengali, English, or bilingual university announcement. NoticeLens extracts deadlines, fees, rooms, and action items with verifiable source evidence and audio narration.
        </p>
      </div>

      {/* Main Upload Box */}
      <div className="brutal-card bg-white p-6 sm:p-8 max-w-3xl mx-auto high-contrast:bg-black high-contrast:border-white">
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
              className={`border-3 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all ${
                dragOver
                  ? 'border-black bg-neo-mint/30 scale-[1.01] shadow-brutal high-contrast:border-yellow-400 high-contrast:bg-slate-900'
                  : 'border-black bg-[#FFFDF2] hover:bg-yellow-50/60 high-contrast:border-white high-contrast:bg-slate-950'
              }`}
            >
              <div className="w-16 h-16 border-3 border-black bg-neo-yellow shadow-brutal flex items-center justify-center text-black mx-auto mb-4 high-contrast:bg-yellow-400 high-contrast:text-black">
                <UploadCloud className="w-8 h-8 stroke-[2.5]" />
              </div>

              <h2 className="text-xl font-black text-ink-900 high-contrast:text-white uppercase mb-1">
                Drop your university notice here
              </h2>
              <p className="text-xs font-bold text-slate-600 high-contrast:text-slate-400 mb-6 uppercase tracking-wider">
                Supports JPEG, PNG, and WebP (up to 10 MB)
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="brutal-btn inline-flex items-center gap-2 px-5 py-3 bg-black text-white hover:bg-neutral-800 focus-visible:ring-4 focus-visible:ring-black high-contrast:bg-yellow-400 high-contrast:text-black"
                >
                  <FileText className="w-4 h-4 stroke-[2.5]" />
                  <span>Choose Notice Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="brutal-btn inline-flex items-center gap-2 px-5 py-3 bg-neo-yellow text-black hover:bg-yellow-300 focus-visible:ring-4 focus-visible:ring-black high-contrast:bg-slate-900 high-contrast:text-white high-contrast:border-white"
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                  <span>Take Photo with Camera</span>
                </button>
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
            <div className="flex items-center justify-between border-b-3 border-black high-contrast:border-white pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 border-2 border-black bg-neo-yellow flex items-center justify-center text-black">
                  <ImageIcon className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-base font-black uppercase text-ink-900 high-contrast:text-white">
                    Selected Notice Document
                  </h2>
                  <p className="text-xs font-bold text-slate-500 high-contrast:text-slate-300">
                    {selectedFile ? `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(0)} KB)` : 'Demonstration Notice Document'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="brutal-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-neo-coral text-white hover:bg-red-600 high-contrast:bg-black high-contrast:border-red-400 high-contrast:text-red-300"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
                <span>Remove</span>
              </button>
            </div>

            {/* Document Preview Box */}
            <div className="relative border-3 border-black overflow-hidden max-h-80 flex items-center justify-center bg-slate-100 high-contrast:bg-slate-950 high-contrast:border-white shadow-brutal-sm">
              <img
                src={previewUrl}
                alt="Selected university notice document"
                className="max-h-80 w-auto object-contain"
              />
            </div>

            {/* Recognition Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FFFDF0] p-4 border-2 border-black high-contrast:bg-slate-900 high-contrast:border-white">
              {/* Language Selection */}
              <div>
                <label
                  htmlFor="ocr-language-select"
                  className="block text-xs font-bold text-ink-900 high-contrast:text-white mb-1.5"
                >
                  OCR Language Mode:
                </label>
                <select
                  id="ocr-language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'ben' | 'eng' | 'ben+eng')}
                  className="w-full text-xs font-bold px-3 py-2 border-2 border-black bg-white text-ink-900 focus-visible:ring-2 focus-visible:ring-black high-contrast:bg-black high-contrast:text-white high-contrast:border-white shadow-brutal-sm"
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
                  className="w-5 h-5 border-2 border-black rounded-none text-black focus:ring-black accent-black cursor-pointer"
                />
                <label
                  htmlFor="preprocess-toggle"
                  className="text-xs font-bold text-ink-900 high-contrast:text-white cursor-pointer select-none"
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
                className="flex-1 brutal-btn inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-neo-yellow text-black font-black text-base hover:bg-yellow-300 transition-all shadow-brutal disabled:opacity-50 high-contrast:bg-yellow-400 high-contrast:text-black"
              >
                <RefreshCw className={`w-5 h-5 stroke-[2.5] ${isProcessing ? 'animate-spin' : ''}`} />
                <span>{isProcessing ? 'Processing Notice...' : 'Start Notice Recognition (OCR)'}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="brutal-btn px-4 py-3 bg-white text-black font-bold text-sm hover:bg-slate-100 high-contrast:border-white high-contrast:text-white"
              >
                Replace Image
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-6 p-4 border-3 border-black bg-neo-coral text-white text-sm flex items-start gap-2.5 shadow-brutal high-contrast:bg-black high-contrast:border-red-400 high-contrast:text-red-200"
          >
            <ShieldAlert className="w-5 h-5 stroke-[2.5] shrink-0 mt-0.5" />
            <div>
              <p className="font-black uppercase tracking-wider">Validation Issue</p>
              <p className="text-xs font-bold mt-1">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Fictional Sample Notice Presets for Live Testing */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-ink-900 high-contrast:text-yellow-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-black high-contrast:text-yellow-400" />
            <span>Try Fictional University Notice Samples</span>
          </h2>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 high-contrast:text-slate-300">
            Pre-bundled for evaluation
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DEMO_NOTICES.map((demo) => (
            <button
              key={demo.id}
              onClick={() => handleSelectDemo(demo)}
              className="brutal-card brutal-card-hover text-left p-4 bg-white transition-all group focus-visible:ring-2 focus-visible:ring-black high-contrast:bg-black high-contrast:border-white"
            >
              <span className="brutal-badge inline-block px-2 py-0.5 bg-neo-pink text-black mb-2 shadow-brutal-sm">
                {demo.category}
              </span>
              <h3 className="text-xs font-black text-ink-900 high-contrast:text-white line-clamp-1 group-hover:underline">
                {demo.title}
              </h3>
              <p className="text-[11px] font-medium text-slate-600 high-contrast:text-slate-300 line-clamp-2 mt-1 leading-snug">
                {demo.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
