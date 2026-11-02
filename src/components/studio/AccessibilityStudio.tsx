import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Play,
  Square,
  Sparkles,
  Terminal,
  Shield,
  RefreshCw,
  Layers,
  HardDrive,
  Download,
  Upload,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { speechService, SpeechStatusState } from '../../services/speech/webSpeechService';
import {
  checkLanguageCacheStatus,
  precacheLanguageModel,
  VerifiedCacheStatus,
} from '../../services/ocr/tesseractWorker';
import {
  requestPersistentStorage,
  exportNoticeVaultBackup,
  importNoticeVaultBackup,
  StoragePersistenceInfo,
} from '../../services/storage/indexedDBService';

interface AccessibilityStudioProps {
  announcementLog: string[];
  onTestAnnouncement: (msg: string) => void;
}

export const AccessibilityStudio: React.FC<AccessibilityStudioProps> = ({
  announcementLog,
  onTestAnnouncement,
}) => {
  const [speechState, setSpeechState] = useState<SpeechStatusState>(speechService.getState());
  const [testText, setTestText] = useState(
    'এতদ্বারা ঢাকা বিশ্ববিদ্যালয়ের সকল শিক্ষার্থীর অবগতির জন্য জানানো যাচ্ছে যে, আগামী ১৫ নভেম্বর ২০২৪ তারিখের মধ্যে রেজিস্ট্রেশন সম্পন্ন করতে হবে।'
  );
  const [rate, setRate] = useState<number>(1.0);
  const [usePhonetic, setUsePhonetic] = useState<boolean>(true);

  // Offline Language Cache State
  const [cacheStatus, setCacheStatus] = useState<VerifiedCacheStatus>({
    ben: { cached: false, verified: false },
    eng: { cached: false, verified: false },
  });
  const [isPreloadingBen, setIsPreloadingBen] = useState(false);
  const [isPreloadingEng, setIsPreloadingEng] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState<string | null>(null);

  // Storage Persistence State
  const [storageInfo, setStorageInfo] = useState<StoragePersistenceInfo | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = speechService.subscribe((state) => {
      setSpeechState(state);
    });

    // Check language cache on mount
    refreshCacheStatus();

    // Check storage persistence on mount
    refreshStorageInfo();

    return () => unsub();
  }, []);

  const refreshCacheStatus = async () => {
    try {
      const status = await checkLanguageCacheStatus();
      setCacheStatus(status);
    } catch {
      // ignore
    }
  };

  const refreshStorageInfo = async () => {
    try {
      const info = await requestPersistentStorage();
      setStorageInfo(info);
    } catch {
      // ignore
    }
  };

  const handleTestSpeech = (lang: 'bn' | 'en') => {
    speechService.setRate(rate);
    speechService.setPhoneticMode(usePhonetic);
    const textToSpeak =
      lang === 'bn'
        ? testText
        : 'NoticeLens accessible reader. All extracted fields are anchored to exact source text snippets.';
    speechService.speak(textToSpeak, lang);
    onTestAnnouncement(`Playing test audio: ${textToSpeak.substring(0, 30)}...`);
  };

  const handleStopSpeech = () => {
    speechService.stop();
  };

  const handlePrecacheLanguage = async (lang: 'ben' | 'eng') => {
    if (lang === 'ben') setIsPreloadingBen(true);
    else setIsPreloadingEng(true);

    setPreloadProgress(`Initializing download for ${lang.toUpperCase()}...`);
    try {
      const res = await precacheLanguageModel(lang, (p, status) => {
        setPreloadProgress(`${status} (${Math.round(p * 100)}%)`);
      });
      await refreshCacheStatus();
      if (res.success && res.verified) {
        const sizeMb = res.sizeBytes ? ` (${(res.sizeBytes / (1024 * 1024)).toFixed(2)} MB verified)` : '';
        setPreloadProgress(`✓ ${lang.toUpperCase()} language model successfully cached and verified in IndexedDB${sizeMb}!`);
        onTestAnnouncement(`${lang.toUpperCase()} language model verified for 100% offline use.`);
      } else if (res.success) {
        const sizeMb = res.sizeBytes ? ` (${(res.sizeBytes / (1024 * 1024)).toFixed(2)} MB)` : '';
        setPreloadProgress(`✓ ${lang.toUpperCase()} language model cached in IndexedDB${sizeMb}. Ready for offline recognition verification.`);
        onTestAnnouncement(`${lang.toUpperCase()} language model cached in IndexedDB.`);
      } else {
        setPreloadProgress(`Persistence Verification Failed: ${res.error || 'Write verification failed'}`);
      }
    } catch (e: unknown) {
      setPreloadProgress(`Error pre-caching: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsPreloadingBen(false);
      setIsPreloadingEng(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const json = await exportNoticeVaultBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `noticelens_vault_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupMessage('Vault backup downloaded successfully.');
      onTestAnnouncement('Notice Vault backup downloaded as JSON.');
    } catch (e: unknown) {
      setBackupMessage(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = await importNoticeVaultBackup(text);
      setBackupMessage(`Successfully restored ${res.importedCount} notices into Notice Vault!`);
      onTestAnnouncement(`Restored ${res.importedCount} notices from backup.`);
      refreshStorageInfo();
    } catch (err: unknown) {
      setBackupMessage(`Import error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const phoneticPreview = speechService.getPhoneticText(testText);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="neu-card bg-[#eef2f8] p-6 shadow-[8px_8px_20px_#c5d0e0,-8px_-8px_20px_#ffffff] border border-white/80 high-contrast:!bg-black high-contrast:!border-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 neu-badge bg-sky-100 text-sky-800 shadow-[2px_2px_5px_#c5d0e0,-2px_-2px_5px_#ffffff] high-contrast:!bg-yellow-400 high-contrast:!text-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Studio & Laboratory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 high-contrast:text-white uppercase tracking-tight">
              Voice & Accessibility Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 high-contrast:text-yellow-300 font-medium mt-1">
              Manage offline language caches, test phonetic Romanized speech fallback, verify durable storage protection, and inspect live screen reader announcements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="neu-badge px-3 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-200/50 flex items-center gap-1.5 font-bold high-contrast:!bg-yellow-400 high-contrast:!text-black">
              <Shield className="w-4 h-4" />
              <span>WCAG 2.2 AA Aligned</span>
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Offline Language Cache & Readiness Manager */}
      <section className="neu-card bg-[#eef2f8] p-6 shadow-[8px_8px_20px_#c5d0e0,-8px_-8px_20px_#ffffff] border border-white/80 high-contrast:!bg-black high-contrast:!border-white space-y-5" aria-labelledby="cache-manager-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 high-contrast:border-white">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-sky-600 high-contrast:text-yellow-400" />
            <h2 id="cache-manager-heading" className="text-lg font-black uppercase tracking-tight text-slate-900 high-contrast:text-white">
              Offline OCR Language Model Manager
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {cacheStatus.ben.verified && cacheStatus.eng.verified ? (
              <span className="neu-badge px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-1 high-contrast:!bg-yellow-400 high-contrast:!text-black">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% Offline OCR Ready (Verified)</span>
              </span>
            ) : cacheStatus.ben.plausible && cacheStatus.eng.plausible ? (
              <span className="neu-badge px-3 py-1 bg-sky-100 text-sky-900 border border-sky-200 text-xs font-bold flex items-center gap-1 high-contrast:!bg-yellow-400 high-contrast:!text-black">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Language Models Cached (Pending Offline Verification)</span>
              </span>
            ) : (
              <span className="neu-badge px-3 py-1 bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1 high-contrast:!bg-yellow-400 high-contrast:!text-black">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Pre-caching Recommended for Air-Gapped Labs</span>
              </span>
            )}
            <button
              onClick={refreshCacheStatus}
              className="p-1 rounded text-slate-400 hover:text-slate-600"
              title="Refresh cache status"
              aria-label="Refresh cache status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 high-contrast:text-slate-300 leading-relaxed">
          Tesseract OCR executes 100% in your browser using local WebAssembly. To ensure reliable offline scanning in exam halls or without campus Wi-Fi, pre-download the trained language models directly into your browser's persistent IndexedDB cache (<code className="px-1.5 py-0.5 bg-white/60 rounded font-mono text-slate-800">keyval-store</code>). Status is verified by directly reading back stored binary model data and testing a fresh worker while offline.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Bengali Card */}
          <div className="p-4 rounded-xl bg-white/70 border border-slate-200 shadow-sm flex flex-col justify-between high-contrast:!bg-black high-contrast:!border-white">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900 high-contrast:text-white">
                  Bengali Language Model (<code className="text-xs font-mono">ben.traineddata</code>)
                </h3>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  cacheStatus.ben.verified
                    ? 'bg-emerald-100 text-emerald-800'
                    : cacheStatus.ben.plausible
                    ? 'bg-sky-100 text-sky-800'
                    : cacheStatus.ben.cached
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {cacheStatus.ben.verified
                    ? `✓ Verified Offline (${(cacheStatus.ben.sizeBytes ? (cacheStatus.ben.sizeBytes / (1024 * 1024)).toFixed(2) : '1.79')} MB)`
                    : cacheStatus.ben.plausible
                    ? `✓ Cached & Plausible (${(cacheStatus.ben.sizeBytes ? (cacheStatus.ben.sizeBytes / (1024 * 1024)).toFixed(2) : '1.79')} MB)`
                    : cacheStatus.ben.cached
                    ? '⚠ Unverified Structure'
                    : 'Not Cached'}
                </span>
              </div>
              <p className="text-xs text-slate-500 high-contrast:text-slate-400">
                Cached binary size: ~1.79 MB (1,789,439 bytes). Enables bilingual notice OCR for university circulars.
              </p>
              {cacheStatus.ben.error && (
                <p className="text-[11px] font-semibold text-rose-600 mt-1">
                  Cache Note: {cacheStatus.ben.error}
                </p>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => handlePrecacheLanguage('ben')}
                disabled={isPreloadingBen || Boolean(cacheStatus.ben.cached && cacheStatus.ben.plausible)}
                className="neu-btn px-3 py-1.5 w-full text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 high-contrast:!bg-yellow-400 high-contrast:!text-black flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{cacheStatus.ben.verified ? 'Bengali Model Verified Offline' : cacheStatus.ben.plausible ? 'Bengali Model Cached' : isPreloadingBen ? 'Pre-caching & Verifying...' : 'Pre-download Bengali Model'}</span>
              </button>
            </div>
          </div>

          {/* English Card */}
          <div className="p-4 rounded-xl bg-white/70 border border-slate-200 shadow-sm flex flex-col justify-between high-contrast:!bg-black high-contrast:!border-white">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900 high-contrast:text-white">
                  English Language Model (<code className="text-xs font-mono">eng.traineddata</code>)
                </h3>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  cacheStatus.eng.verified
                    ? 'bg-emerald-100 text-emerald-800'
                    : cacheStatus.eng.plausible
                    ? 'bg-sky-100 text-sky-800'
                    : cacheStatus.eng.cached
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {cacheStatus.eng.verified
                    ? `✓ Verified Offline (${(cacheStatus.eng.sizeBytes ? (cacheStatus.eng.sizeBytes / (1024 * 1024)).toFixed(2) : '1.98')} MB)`
                    : cacheStatus.eng.plausible
                    ? `✓ Cached & Plausible (${(cacheStatus.eng.sizeBytes ? (cacheStatus.eng.sizeBytes / (1024 * 1024)).toFixed(2) : '1.98')} MB)`
                    : cacheStatus.eng.cached
                    ? '⚠ Unverified Structure'
                    : 'Not Cached'}
                </span>
              </div>
              <p className="text-xs text-slate-500 high-contrast:text-slate-400">
                Compressed size: ~1.98 MB. Enables alphanumeric and circular text parsing.
              </p>
              {cacheStatus.eng.error && (
                <p className="text-[11px] font-semibold text-rose-600 mt-1">
                  Cache Note: {cacheStatus.eng.error}
                </p>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => handlePrecacheLanguage('eng')}
                disabled={isPreloadingEng || Boolean(cacheStatus.eng.cached && cacheStatus.eng.plausible)}
                className="neu-btn px-3 py-1.5 w-full text-xs font-bold bg-[#eef2f8] text-slate-800 hover:bg-white disabled:opacity-50 border border-white/60 high-contrast:!bg-black high-contrast:!text-white high-contrast:!border flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{cacheStatus.eng.verified ? 'English Model Verified Offline' : cacheStatus.eng.plausible ? 'English Model Cached' : isPreloadingEng ? 'Pre-caching & Verifying...' : 'Pre-download English Model'}</span>
              </button>
            </div>
          </div>
        </div>

        {preloadProgress && (
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs font-mono text-sky-800 high-contrast:!bg-black high-contrast:!text-yellow-300 high-contrast:!border-yellow-400">
            {preloadProgress}
          </div>
        )}
      </section>

      {/* Section 2: Speech Synthesis & Romanized Phonetic Transliteration */}
      <section className="neu-card bg-[#eef2f8] p-6 shadow-[8px_8px_20px_#c5d0e0,-8px_-8px_20px_#ffffff] border border-white/80 high-contrast:!bg-black high-contrast:!border-white space-y-5" aria-labelledby="tts-lab-heading">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 high-contrast:border-white">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-sky-600 high-contrast:text-yellow-400" />
            <h2 id="tts-lab-heading" className="text-lg font-black uppercase tracking-tight text-slate-900 high-contrast:text-white">
              Speech Synthesis & Romanized Phonetic Fallback
            </h2>
          </div>
          <span className={`px-2.5 py-0.5 neu-badge text-xs font-bold ${speechState.hasBengaliVoice ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'} high-contrast:!bg-yellow-400 high-contrast:!text-black`}>
            {speechState.hasBengaliVoice ? '✓ Native Bengali Voice Ready' : '⚡ Phonetic Romanized Narration Active'}
          </span>
        </div>

        {!speechState.hasBengaliVoice && (
          <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 space-y-1.5 high-contrast:!bg-black high-contrast:!border-yellow-400 high-contrast:!text-yellow-300">
            <p className="font-bold flex items-center gap-1.5">
              <span>💡 Intelligent Speech Fallback for Devices Without Bengali TTS:</span>
            </p>
            <p className="leading-relaxed">
              When an operating system lacks a native Bengali voice package (common on default Linux and Windows installations), NoticeLens automatically converts Bengali Unicode letters into <strong>Romanized phonetic syllables</strong>. This enables system-default English voices to read Bengali announcements with clear phonetic intelligibility instead of falling silent or skipping characters.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="test-tts-textarea" className="block text-xs font-black uppercase tracking-wider text-slate-700 high-contrast:text-white mb-1.5">
            Sample University Notice Sentence:
          </label>
          <textarea
            id="test-tts-textarea"
            rows={2}
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            className="w-full p-3 text-xs font-mono rounded-xl border border-slate-300/70 bg-[#eef2f8] text-slate-900 shadow-[inset_2px_2px_4px_#c5d0e0,inset_-2px_-2px_4px_#ffffff] focus:outline-none focus:ring-2 focus:ring-sky-500 high-contrast:!bg-black high-contrast:!border-white high-contrast:!text-white"
          />
        </div>

        {/* Phonetic Preview Box */}
        <div className="p-3 rounded-xl bg-white/60 border border-slate-200 text-xs font-mono space-y-1 high-contrast:!bg-black high-contrast:!border-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Romanized Phonetic Transliteration Preview (Spoken by Fallback TTS):
          </span>
          <p className="text-slate-800 high-contrast:text-white leading-relaxed">
            "{phoneticPreview}"
          </p>
        </div>

        {/* Speed Slider & Phonetic Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label htmlFor="tts-rate-slider" className="text-xs font-bold text-slate-700 high-contrast:text-white">
              Speech Rate: <span className="font-mono text-sky-600 high-contrast:text-yellow-300 font-extrabold">{rate.toFixed(2)}x</span>
            </label>
            <input
              id="tts-rate-slider"
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="accent-sky-600 w-32"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 high-contrast:text-white">
            <input
              type="checkbox"
              checked={usePhonetic}
              onChange={(e) => setUsePhonetic(e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <span>Enable Phonetic Fallback on Bengali</span>
          </label>
        </div>

        {/* Playback Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => handleTestSpeech('bn')}
            disabled={speechState.status === 'playing'}
            className="neu-btn px-4 py-2.5 bg-sky-600 text-white hover:bg-sky-700 rounded-xl shadow-[4px_4px_10px_#c5d0e0,-4px_-4px_10px_#ffffff] text-xs font-bold flex items-center gap-2 disabled:opacity-50 high-contrast:!bg-yellow-400 high-contrast:!text-black"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Speak Bengali Sample</span>
          </button>

          <button
            onClick={() => handleTestSpeech('en')}
            disabled={speechState.status === 'playing'}
            className="neu-btn px-4 py-2.5 bg-[#eef2f8] text-slate-800 hover:bg-white rounded-xl shadow-[4px_4px_10px_#c5d0e0,-4px_-4px_10px_#ffffff] text-xs font-bold flex items-center gap-2 border border-white/70 disabled:opacity-50 high-contrast:!bg-slate-900 high-contrast:!text-white high-contrast:!border-white"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Speak English Sample</span>
          </button>

          {speechState.status === 'playing' && (
            <button
              onClick={handleStopSpeech}
              className="neu-btn px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl shadow-[4px_4px_10px_#c5d0e0,-4px_-4px_10px_#ffffff] text-xs font-bold flex items-center gap-2 high-contrast:!bg-black high-contrast:!border high-contrast:!border-red-400"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Speech</span>
            </button>
          )}
        </div>
      </section>

      {/* Section 3: Persistent Storage & Vault Backup / Recovery */}
      <section className="neu-card bg-[#eef2f8] p-6 shadow-[8px_8px_20px_#c5d0e0,-8px_-8px_20px_#ffffff] border border-white/80 high-contrast:!bg-black high-contrast:!border-white space-y-5" aria-labelledby="storage-guard-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 high-contrast:border-white">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-600 high-contrast:text-yellow-400" />
            <h2 id="storage-guard-heading" className="text-lg font-black uppercase tracking-tight text-slate-900 high-contrast:text-white">
              Storage Protection & Vault Backup
            </h2>
          </div>
          <span className="neu-badge px-3 py-1 bg-sky-100 text-sky-900 text-xs font-bold high-contrast:!bg-yellow-400 high-contrast:!text-black">
            {storageInfo?.isPersisted ? '✓ Persistent Storage Protected' : 'Standard Session Storage'}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 high-contrast:text-slate-300 leading-relaxed">
          NoticeLens uses browser IndexedDB to persist notices and OCR models locally. To guard against automatic cache purging when device storage is constrained, NoticeLens registers for <strong>Persistent Storage</strong> and provides single-click JSON vault backup.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-white/70 border border-slate-200 high-contrast:!bg-black high-contrast:!border-white">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Eviction Protection</span>
            <span className="text-xs font-black text-slate-900 high-contrast:text-white">
              {storageInfo?.isPersisted ? 'Granted (Immune to eviction)' : 'Standard (Can be evicted)'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/70 border border-slate-200 high-contrast:!bg-black high-contrast:!border-white">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Storage Quota</span>
            <span className="text-xs font-black text-slate-900 high-contrast:text-white">
              {storageInfo?.quotaMb ? `${(storageInfo.quotaMb / 1024).toFixed(1)} GB Available` : 'Browser Managed'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white/70 border border-slate-200 high-contrast:!bg-black high-contrast:!border-white">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Current Usage</span>
            <span className="text-xs font-black text-slate-900 high-contrast:text-white">
              {storageInfo?.usageMb ? `${storageInfo.usageMb} MB Used` : '< 5 MB Used'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={refreshStorageInfo}
            className="neu-btn px-4 py-2.5 bg-sky-600 text-white hover:bg-sky-700 rounded-xl text-xs font-bold flex items-center gap-2 high-contrast:!bg-yellow-400 high-contrast:!text-black"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Request Persistent Storage</span>
          </button>

          <button
            onClick={handleExportBackup}
            className="neu-btn px-4 py-2.5 bg-[#eef2f8] text-slate-800 hover:bg-white rounded-xl border border-white/70 text-xs font-bold flex items-center gap-2 high-contrast:!bg-black high-contrast:!text-white high-contrast:!border"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Vault Backup (.json)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="neu-btn px-4 py-2.5 bg-[#eef2f8] text-slate-800 hover:bg-white rounded-xl border border-white/70 text-xs font-bold flex items-center gap-2 high-contrast:!bg-black high-contrast:!text-white high-contrast:!border"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore Backup (.json)</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportBackup}
            className="hidden"
            aria-label="Upload NoticeLens JSON vault backup file"
          />
        </div>

        {backupMessage && (
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs font-mono text-sky-800 high-contrast:!bg-black high-contrast:!text-yellow-300">
            {backupMessage}
          </div>
        )}
      </section>

      {/* Section 4: Neumorphism (Soft UI) Design System Overview */}
      <section className="space-y-4" aria-labelledby="theme-section-heading">
        <div className="flex items-center justify-between">
          <h2 id="theme-section-heading" className="text-lg font-black uppercase tracking-tight text-slate-900 high-contrast:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-600 high-contrast:text-yellow-400" />
            <span>Active Design Architecture: Neumorphism (Soft UI)</span>
          </h2>
          <span className="text-xs font-bold text-sky-700 high-contrast:text-yellow-300 uppercase tracking-wider">
            Standard System
          </span>
        </div>

        <div className="neu-card p-6 bg-[#eef2f8] shadow-[8px_8px_20px_#c5d0e0,-8px_-8px_20px_#ffffff] border border-white/80 space-y-4 high-contrast:!bg-black high-contrast:!border-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div>
              <span className="neu-badge px-3 py-0.5 bg-sky-600 text-white font-bold text-xs high-contrast:!bg-yellow-400 high-contrast:!text-black">
                Tactile Soft Physics
              </span>
              <h3 className="text-base font-extrabold text-slate-900 high-contrast:text-white mt-1.5">
                Minimalist Dual-Light Embossed Surfaces
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full high-contrast:bg-yellow-400 high-contrast:text-black">
              11.8:1 Text Contrast Ratio (AA+)
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 high-contrast:text-slate-300 leading-relaxed">
            NoticeLens uses an ultra-clean <strong>Neumorphic (Soft UI)</strong> visual paradigm on desktop: light is cast from the top-left at a 45° angle, producing soft dual shadows (<code className="px-1.5 py-0.5 bg-white/60 rounded text-slate-800 font-mono">#ffffff</code> highlight and <code className="px-1.5 py-0.5 bg-slate-200/70 rounded text-slate-800 font-mono">#c5d0e0</code> shadow) that elevate interactive cards, buttons, and dropzones with tactile physical depth without harsh visual clutter.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[#eef2f8] shadow-[4px_4px_8px_#c5d0e0,-4px_-4px_8px_#ffffff] text-center border border-white/60">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Base Canvas</span>
              <span className="text-xs font-black text-slate-800 font-mono">#eef2f8</span>
            </div>
            <div className="p-3 rounded-xl bg-[#eef2f8] shadow-[4px_4px_8px_#c5d0e0,-4px_-4px_8px_#ffffff] text-center border border-white/60">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Dual Shadow</span>
              <span className="text-xs font-black text-slate-800 font-mono">#c5d0e0</span>
            </div>
            <div className="p-3 rounded-xl bg-[#eef2f8] shadow-[4px_4px_8px_#c5d0e0,-4px_-4px_8px_#ffffff] text-center border border-white/60">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Accent Primary</span>
              <span className="text-xs font-black text-sky-600 font-mono">#0284c7</span>
            </div>
            <div className="p-3 rounded-xl bg-[#eef2f8] shadow-[inset_3px_3px_6px_#c5d0e0,inset_-3px_-3px_6px_#ffffff] text-center border border-slate-200/50">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Sunken Well</span>
              <span className="text-xs font-black text-slate-800 font-mono">Inset Wells</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Screen Reader Announcement Log */}
      <section className="neu-card bg-[#eef2f8] p-6 shadow-[8px_8px_20px_#c5d0e0,-8px_-8px_20px_#ffffff] border border-white/80 high-contrast:!bg-black high-contrast:!border-white space-y-4" aria-labelledby="live-log-heading">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 high-contrast:border-white">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-sky-600 high-contrast:text-yellow-400" />
            <h2 id="live-log-heading" className="text-lg font-black uppercase tracking-tight text-slate-900 high-contrast:text-white">
              Screen Reader Live Announcement Log
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500 font-mono">
            {announcementLog.length} Events Logged
          </span>
        </div>

        <p className="text-xs text-slate-600 high-contrast:text-slate-300">
          All dynamic updates in NoticeLens are dispatched to an accessible <code className="font-mono bg-white/60 px-1 py-0.5 rounded text-sky-700">aria-live="polite"</code> region for assistive screen readers.
        </p>

        <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs max-h-48 overflow-y-auto space-y-1 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.5)] high-contrast:border high-contrast:border-white">
          {announcementLog.length === 0 ? (
            <div className="text-slate-500 italic py-2">No announcements broadcast yet.</div>
          ) : (
            announcementLog.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-sky-400 shrink-0 font-bold">&gt;</span>
                <span className="leading-snug">{log}</span>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onTestAnnouncement('NoticeLens Screen Reader Test Announcement at ' + new Date().toLocaleTimeString())}
            className="neu-btn px-3 py-1.5 bg-[#eef2f8] text-slate-800 hover:bg-white rounded-xl shadow-[3px_3px_6px_#c5d0e0,-3px_-3px_6px_#ffffff] text-xs font-bold flex items-center gap-1.5 border border-white/60 high-contrast:!bg-black high-contrast:!text-white high-contrast:!border"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Emit Test Screen Reader Broadcast</span>
          </button>
        </div>
      </section>
    </div>
  );
};
