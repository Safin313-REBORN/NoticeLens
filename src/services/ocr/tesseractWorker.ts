import { createWorker, Worker } from 'tesseract.js';
import { OCRProgress } from '../../types/notice';
import { normalizeImageForOcr } from './imagePreprocess';

export interface OCRResult {
  text: string;
  confidence: number;
  lines: string[];
  languageUsed: 'ben' | 'eng' | 'ben+eng';
}

export type OcrFailurePhase = 'image_decoding' | 'worker_init' | 'network' | 'recognition';

export interface OcrDiagnosticRecord {
  timestamp: string;
  phase: OcrFailurePhase;
  language: string;
  userMessage: string;
  technicalError?: string;
  stack?: string;
}

export const TESSERACT_ENGINE_VERSION = '7.0.0';
export const TESSERACT_CORE_ASSET_VERSION = 'v2';
export const OFFLINE_VERIFICATION_METHOD = 'fresh_worker_offline_recognition';

export interface WorkerProvenance {
  createdAt: number;
  language: string;
  initializedOffline: boolean;
  cachePreflightPassed: boolean;
  startedOffline?: boolean;
  completedOffline?: boolean;
}

export interface OfflineVerificationRecord {
  success: boolean;
  language: string;
  trainedDataSha256: string;
  engineVersion: string;
  coreAssetVersion: string;
  verifiedAt: number;
  verificationMethod: 'fresh_worker_offline_recognition';
  workerCreatedAt: number;
  error?: string;
}

let activeWorker: Worker | null = null;
let currentLanguage: string | null = null;
let activeWorkerProvenance: WorkerProvenance | null = null;
const verifiedLanguageModels = new Set<string>();

export function markLanguageModelVerified(lang: string): void {
  verifiedLanguageModels.add(lang);
}

export function isLanguageModelVerified(lang: string): boolean {
  return verifiedLanguageModels.has(lang);
}

export function getActiveWorkerProvenance(): WorkerProvenance | null {
  return activeWorkerProvenance;
}

export type WorkerCreatorFn = (
  langs?: unknown,
  oem?: unknown,
  options?: unknown,
  config?: unknown
) => Promise<Worker>;

let customWorkerCreator: WorkerCreatorFn | null = null;

export function setCustomWorkerCreatorForTesting(creator: WorkerCreatorFn | null): void {
  customWorkerCreator = creator;
}

export function isOcrWorkerActive(): boolean {
  return activeWorker !== null;
}

// Expose safe test diagnostics ONLY in Vite development or test environments
// In Vite production builds, import.meta.env.DEV is replaced with false and this block is dead-code eliminated
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  const win = window as unknown as {
    __noticelens_ocr_diagnostics?: OcrDiagnosticRecord[];
    __noticelens_terminate_worker__?: () => Promise<void>;
    __noticelens_is_worker_active__?: () => boolean;
  };
  win.__noticelens_ocr_diagnostics = win.__noticelens_ocr_diagnostics || [];
  win.__noticelens_terminate_worker__ = terminateOcrWorker;
  win.__noticelens_is_worker_active__ = isOcrWorkerActive;
}

function sanitizeDiagnosticText(text: string): string {
  if (!text) return '';
  return text.length > 200 ? text.slice(0, 200) + '...' : text;
}

function recordDiagnostic(record: OcrDiagnosticRecord) {
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    const list = (window as unknown as { __noticelens_ocr_diagnostics?: OcrDiagnosticRecord[] }).__noticelens_ocr_diagnostics;
    if (list) {
      const sanitized: OcrDiagnosticRecord = {
        timestamp: record.timestamp,
        phase: record.phase,
        language: record.language,
        userMessage: record.userMessage,
        technicalError: record.technicalError ? sanitizeDiagnosticText(record.technicalError) : undefined,
      };
      list.push(sanitized);
      if (list.length > 20) list.shift();
    }
  }
}

/**
 * Initializes or reuses a Tesseract.js OCR worker
 */
export async function runOcrRecognition(
  imageSource: string | File | Blob,
  language: 'ben' | 'eng' | 'ben+eng' = 'ben+eng',
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
  const report = (step: OCRProgress['step'], progress: number, status: string) => {
    if (onProgress) {
      onProgress({
        step,
        progress,
        status,
      });
    }
  };

  let phase: OcrFailurePhase = 'image_decoding';

  try {
    report('loading_worker', 0.05, 'Validating and decoding notice image format...');

    // Phase 1: Image Decoding & Normalization
    // Normalizes SVGs, Blobs, and raster files into crisp raster PNG with solid white background
    let rasterImage: string;
    try {
      rasterImage = await normalizeImageForOcr(imageSource);
    } catch (decodeErr: unknown) {
      phase = 'image_decoding';
      const msg = 'Unable to decode notice image. Please upload a clear PNG, JPEG, or WebP notice file.';
      recordDiagnostic({
        timestamp: new Date().toISOString(),
        phase,
        language,
        userMessage: msg,
        technicalError: decodeErr instanceof Error ? decodeErr.message : String(decodeErr),
        stack: decodeErr instanceof Error ? decodeErr.stack : undefined,
      });
      throw new Error(msg);
    }

    report('loading_worker', 0.15, `Initializing OCR engine for ${getLanguageLabel(language)}...`);

    // Phase 2: Worker Initialization & Lifecycle
    // If worker exists but for a different language, cleanly terminate and recreate
    if (activeWorker && currentLanguage !== language) {
      report('loading_worker', 0.2, 'Switching OCR language worker...');
      await activeWorker.terminate();
      activeWorker = null;
      currentLanguage = null;
      activeWorkerProvenance = null;
    }

    if (!activeWorker) {
      phase = 'worker_init';
      report('loading_worker', 0.25, `Loading trained language models (${language})...`);

      const preflightOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
      let cachePreflightPassed = false;

      // Verify offline availability before worker spawn to guarantee no network attempt on cache miss
      if (preflightOffline) {
        try {
          const cacheStatus = await checkLanguageCacheStatus();
          cachePreflightPassed = language === 'ben+eng'
            ? Boolean(cacheStatus.ben.plausible && cacheStatus.eng.plausible)
            : Boolean(cacheStatus[language]?.plausible);

          if (!cachePreflightPassed && !customWorkerCreator) {
            phase = 'network';
            const netMsg = `Offline Notice: Trained OCR language data for ${getLanguageLabel(language)} is not cached on this device. Initial language download requires an active internet connection. Once downloaded, OCR can run offline. You can also explore our Instant Sample Data presets (which require no OCR downloads).`;
            recordDiagnostic({
              timestamp: new Date().toISOString(),
              phase: 'network',
              language,
              userMessage: netMsg,
              technicalError: `Offline cache miss: ${language} traineddata not cached with valid binary structure in IndexedDB.`,
            });
            throw new Error(netMsg);
          }
        } catch (checkErr: unknown) {
          if (checkErr instanceof Error && checkErr.message.includes('Offline Notice:')) {
            throw checkErr;
          }
          if (!customWorkerCreator) {
            phase = 'network';
            const netMsg = `Offline Notice: Trained OCR language data for ${getLanguageLabel(language)} is not cached on this device. Initial language download requires an active internet connection. Once downloaded, OCR can run offline. You can also explore our Instant Sample Data presets (which require no OCR downloads).`;
            recordDiagnostic({
              timestamp: new Date().toISOString(),
              phase: 'network',
              language,
              userMessage: netMsg,
              technicalError: checkErr instanceof Error ? checkErr.message : String(checkErr),
            });
            throw new Error(netMsg);
          }
        }
      }

      // Capture network state immediately before worker creation
      const workerCreationOffline = typeof navigator !== 'undefined' && navigator.onLine === false;

      try {
        const creator = customWorkerCreator || createWorker;
        activeWorker = await creator(language, 1, {
          workerPath: '/tesseract/worker.min.js',
          corePath: '/tesseract',
          workerBlobURL: false,
          langPath: 'https://tessdata.projectnaptha.com/4.0.0',
          logger: (m: { status?: string; progress?: number }) => {
            if (m.status === 'loading tesseract core') {
              report('loading_worker', 0.2 + (m.progress || 0) * 0.15, 'Loading OCR core engine...');
            } else if (m.status && m.status.includes('traineddata')) {
              report('loading_worker', 0.35 + (m.progress || 0) * 0.25, `Loading trained language data (${language})...`);
            } else if (m.status === 'initializing api') {
              report('loading_worker', 0.6, 'Configuring OCR parameters...');
            } else if (m.status === 'recognizing text') {
              report('recognizing', 0.65 + (m.progress || 0) * 0.3, `Recognizing text (${Math.round((m.progress || 0) * 100)}%)...`);
            }
          },
          errorHandler: (err: unknown) => {
            console.error('[NoticeLens OCR Worker Error]:', err);
          },
        });

        currentLanguage = language;
        activeWorkerProvenance = {
          createdAt: Date.now(),
          language,
          initializedOffline: workerCreationOffline,
          cachePreflightPassed,
        };

        if (language === 'ben+eng') {
          markLanguageModelInitialized('ben');
          markLanguageModelInitialized('eng');
        } else {
          markLanguageModelInitialized(language);
        }
      } catch (workerInitErr: unknown) {
        activeWorker = null;
        currentLanguage = null;
        activeWorkerProvenance = null;
        console.error('[NoticeLens Detailed WorkerInitErr]:', workerInitErr);

        const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
        const errMsg = workerInitErr instanceof Error ? workerInitErr.message : String(workerInitErr);

        // 1. Worker script loading failure
        if (errMsg.includes('worker.min.js') || errMsg.includes('worker script') || errMsg.includes('Worker is not defined')) {
          phase = 'worker_init';
          const scriptMsg = 'OCR Worker Script Missing: The local Tesseract worker script (/tesseract/worker.min.js) could not be loaded.';
          recordDiagnostic({
            timestamp: new Date().toISOString(),
            phase: 'worker_init',
            language,
            userMessage: scriptMsg,
            technicalError: errMsg,
          });
          throw new Error(scriptMsg);
        }

        // 2. WASM / core loading or compilation failure
        if (errMsg.includes('wasm') || errMsg.includes('WebAssembly') || errMsg.includes('tesseract-core') || errMsg.includes('loading tesseract core')) {
          phase = 'worker_init';
          const wasmMsg = 'OCR Core Engine Error: WebAssembly OCR core failed to load or compile on this browser environment.';
          recordDiagnostic({
            timestamp: new Date().toISOString(),
            phase: 'worker_init',
            language,
            userMessage: wasmMsg,
            technicalError: errMsg,
          });
          throw new Error(wasmMsg);
        }

        // 3. Offline traineddata cache-miss
        if (isOffline || errMsg.includes('traineddata') || errMsg.includes('Failed to fetch traineddata')) {
          phase = 'network';
          const netMsg = `Offline Notice: Trained OCR language data for ${getLanguageLabel(language)} is not cached on this device. Initial language download requires an active internet connection. Once downloaded, OCR can run offline. You can also explore our Instant Sample Data presets (which require no OCR downloads).`;
          recordDiagnostic({
            timestamp: new Date().toISOString(),
            phase: 'network',
            language,
            userMessage: netMsg,
            technicalError: errMsg,
          });
          throw new Error(netMsg);
        }

        // 4. Online CDN network resource failure
        if (errMsg.includes('failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('404')) {
          phase = 'network';
          const netMsg = `Network Error: Could not download the trained OCR language model (${language}). Please verify your connection or retry in English mode.`;
          recordDiagnostic({
            timestamp: new Date().toISOString(),
            phase: 'network',
            language,
            userMessage: netMsg,
            technicalError: errMsg,
          });
          throw new Error(netMsg);
        }

        const safeInitMsg = `Failed to initialize the OCR engine for ${getLanguageLabel(language)}. Please retry or refresh the page.`;
        recordDiagnostic({
          timestamp: new Date().toISOString(),
          phase: 'worker_init',
          language,
          userMessage: safeInitMsg,
          technicalError: errMsg,
          stack: workerInitErr instanceof Error ? workerInitErr.stack : undefined,
        });
        throw new Error(safeInitMsg);
      }
    }

    // Phase 3: Recognition
    phase = 'recognition';
    report('recognizing', 0.65, 'Analyzing notice document and reading printed characters...');

    let ret;
    try {
      // Capture network state immediately before recognition starts
      const recognitionStartOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
      ret = await activeWorker.recognize(rasterImage);
      // Capture network state immediately after recognition completes
      const recognitionCompletionOffline = typeof navigator !== 'undefined' && navigator.onLine === false;

      if (activeWorkerProvenance) {
        activeWorkerProvenance.startedOffline = recognitionStartOffline;
        activeWorkerProvenance.completedOffline = recognitionCompletionOffline;
      }

      const hasRecognizedText = Boolean(ret.data?.text && ret.data.text.trim().length > 0);

      // Provenance condition: Only a fresh worker initialized offline with verified preflight
      // that begins recognition offline and finishes recognition offline can verify IndexedDB offline restoration.
      const isFreshOfflineWorker = Boolean(
        activeWorkerProvenance &&
        activeWorkerProvenance.initializedOffline === true &&
        activeWorkerProvenance.cachePreflightPassed === true &&
        recognitionStartOffline === true &&
        recognitionCompletionOffline === true &&
        hasRecognizedText
      );

      if (isFreshOfflineWorker) {
        if (language === 'ben+eng') {
          await markLanguageModelOfflineVerified('ben');
          await markLanguageModelOfflineVerified('eng');
        } else {
          await markLanguageModelOfflineVerified(language);
        }
      }
    } catch (recErr: unknown) {
      const recMsg = 'Error during text recognition. Please ensure the image is right-side up, clear, and well-lit, or retry.';
      recordDiagnostic({
        timestamp: new Date().toISOString(),
        phase: 'recognition',
        language,
        userMessage: recMsg,
        technicalError: recErr instanceof Error ? recErr.message : String(recErr),
        stack: recErr instanceof Error ? recErr.stack : undefined,
      });
      throw new Error(recMsg);
    }

    report('extracting', 0.95, 'Organizing recognized text into structured details...');

    const extractedText = ret.data.text || '';
    const confidence = ret.data.confidence || 0;
    const lines = extractedText.split('\n').map((l) => l.trim()).filter(Boolean);

    report('completed', 1.0, 'Recognition completed successfully.');

    return {
      text: extractedText,
      confidence,
      lines,
      languageUsed: language,
    };
  } catch (error: unknown) {
    console.error(`[NoticeLens OCR Error - Phase: ${phase}]:`, error);
    const errMessage = error instanceof Error ? error.message : 'Notice OCR recognition encountered an unexpected error. Please retry.';

    if (onProgress) {
      onProgress({
        step: 'error',
        progress: 0,
        status: 'OCR Error',
        errorMessage: errMessage,
      });
    }

    // Always clean up worker so subsequent retry starts with a clean slate
    if (activeWorker) {
      try {
        await activeWorker.terminate();
      } catch {
        // ignore cleanup error
      }
      activeWorker = null;
      currentLanguage = null;
      activeWorkerProvenance = null;
    }

    throw new Error(errMessage);
  }
}

/**
 * Terminates the OCR worker to free system memory
 */
export async function terminateOcrWorker(): Promise<void> {
  if (activeWorker) {
    try {
      await activeWorker.terminate();
    } catch (e) {
      console.warn('Error during OCR worker cleanup:', e);
    }
    activeWorker = null;
    currentLanguage = null;
    activeWorkerProvenance = null;
  }
}

function getLanguageLabel(lang: 'ben' | 'eng' | 'ben+eng'): string {
  if (lang === 'ben') return 'Bengali';
  if (lang === 'eng') return 'English';
  return 'Bengali + English (Mixed)';
}

const initializedLanguageModels = new Set<string>();
const offlineVerifiedLanguageModels = new Set<string>();

const OFFLINE_VERIFIED_STORAGE_KEY_PREFIX = 'noticelens_offline_verified_record_';

export function markLanguageModelInitialized(lang: string): void {
  initializedLanguageModels.add(lang);
}

export function isLanguageModelInitialized(lang: string): boolean {
  return initializedLanguageModels.has(lang);
}

/**
 * Computes standard SHA-256 digest of binary buffer using genuine Web Crypto API.
 * Rejects null/undefined/empty input and fails safely if Web Crypto is unavailable.
 */
export async function computeSha256(data: ArrayBuffer | Uint8Array): Promise<string> {
  if (!data) {
    throw new Error('Cannot compute SHA-256: binary input is null or undefined.');
  }

  const byteLength = data instanceof Uint8Array ? data.byteLength : (data as ArrayBuffer).byteLength;
  if (byteLength === 0) {
    throw new Error('Cannot compute SHA-256 on empty binary buffer (0 bytes).');
  }

  const buffer = data instanceof Uint8Array
    ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
    : data;

  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (digestErr: unknown) {
      throw new Error(`Web Crypto SHA-256 digest failed: ${digestErr instanceof Error ? digestErr.message : String(digestErr)}`);
    }
  }

  // Fail safely rather than generating any fake, padded, or custom hash
  throw new Error('Web Crypto API (crypto.subtle.digest) is unavailable for genuine SHA-256 computation in this environment.');
}

/**
 * Fetches cached traineddata binary directly from browser IndexedDB
 */
export async function getTrainedDataBinaryFromIndexedDb(lang: string): Promise<unknown | null> {
  if (typeof indexedDB === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const openReq = indexedDB.open('keyval-store');
      openReq.onerror = () => resolve(null);
      openReq.onblocked = () => resolve(null);
      openReq.onsuccess = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('keyval')) {
          db.close();
          return resolve(null);
        }
        try {
          const tx = db.transaction('keyval', 'readonly');
          const store = tx.objectStore('keyval');
          const keysReq = store.getAllKeys();
          keysReq.onerror = () => {
            db.close();
            resolve(null);
          };
          keysReq.onsuccess = () => {
            const keys = (keysReq.result || []) as IDBValidKey[];
            const targetKey = keys.find((k) => typeof k === 'string' && k.includes(`${lang}.traineddata`));
            if (!targetKey) {
              db.close();
              return resolve(null);
            }
            const getReq = store.get(targetKey);
            getReq.onsuccess = () => {
              const res = getReq.result;
              db.close();
              resolve(res || null);
            };
            getReq.onerror = () => {
              db.close();
              resolve(null);
            };
          };
        } catch {
          db.close();
          resolve(null);
        }
      };
    } catch {
      resolve(null);
    }
  });
}

export function invalidateStoredOfflineRecord(lang: string): void {
  offlineVerifiedLanguageModels.delete(lang);
  verifiedLanguageModels.delete(lang);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`${OFFLINE_VERIFIED_STORAGE_KEY_PREFIX}${lang}`);
      localStorage.removeItem(`noticelens_offline_verified_${lang}`);
    }
  } catch {
    // ignore
  }
}

/**
 * Production verifier for offline language model status.
 *
 * Requirements:
 * 1. Accepts only the language identifier (strictly rejects any injected test binary or bypass options).
 * 2. Requires genuine active worker provenance proving fresh offline initialization and recognition.
 * 3. Always reads actual traineddata binary directly from browser IndexedDB (keyval-store).
 * 4. Strictly validates real binary structure using isValidTrainedDataBinary.
 * 5. Calculates genuine SHA-256 digest using Web Crypto API.
 * 6. Persists structured verification record to localStorage with write confirmation.
 * 7. Atomically updates in-memory verified state only after successful storage write.
 *
 * If any step fails, storage and in-memory verification are immediately invalidated.
 */
export async function markLanguageModelOfflineVerified(
  lang: string
): Promise<OfflineVerificationRecord> {
  const failureRecord = (reason: string): OfflineVerificationRecord => {
    invalidateStoredOfflineRecord(lang);
    return {
      success: false,
      language: lang,
      trainedDataSha256: '',
      engineVersion: TESSERACT_ENGINE_VERSION,
      coreAssetVersion: TESSERACT_CORE_ASSET_VERSION,
      verifiedAt: 0,
      verificationMethod: OFFLINE_VERIFICATION_METHOD,
      workerCreatedAt: 0,
      error: reason,
    };
  };

  // Reject any injected test binary, options object, or extra parameters in production
  if (arguments.length > 1) {
    return failureRecord('Production verifier does not accept injected binary or test bypass options.');
  }

  // 1. Genuine active worker provenance required
  if (!activeWorkerProvenance) {
    return failureRecord('No active OCR worker provenance found for offline verification.');
  }
  if (
    activeWorkerProvenance.language !== lang &&
    !(activeWorkerProvenance.language === 'ben+eng' && (lang === 'ben' || lang === 'eng'))
  ) {
    return failureRecord(`Active worker was initialized for ${activeWorkerProvenance.language}, not ${lang}.`);
  }
  if (activeWorkerProvenance.initializedOffline !== true) {
    return failureRecord('Online-initialized worker cannot establish offline verification.');
  }
  if (activeWorkerProvenance.cachePreflightPassed !== true) {
    return failureRecord('Cache preflight check was not passed for this worker.');
  }
  if (activeWorkerProvenance.startedOffline !== true || activeWorkerProvenance.completedOffline !== true) {
    return failureRecord('OCR recognition was not started and completed entirely offline.');
  }

  // 2. Always retrieve actual traineddata from IndexedDB (strictly no synthetic data in production)
  const rawBinary = await getTrainedDataBinaryFromIndexedDb(lang);
  if (!rawBinary) {
    return failureRecord(`Actual trained language data for ${lang} is missing or unreadable in IndexedDB keyval-store.`);
  }

  // 3. Always validate actual binary
  const validation = isValidTrainedDataBinary(rawBinary);
  if (!validation.valid) {
    return failureRecord(`Cached traineddata binary validation failed: ${validation.reason || 'invalid binary structure'}`);
  }

  // 4. Always calculate genuine SHA-256
  let digest: string;
  try {
    digest = await computeSha256(rawBinary as Uint8Array);
  } catch (shaErr: unknown) {
    return failureRecord(`Failed to compute genuine SHA-256 digest: ${shaErr instanceof Error ? shaErr.message : String(shaErr)}`);
  }

  // 5. Build structured verification record
  const record: OfflineVerificationRecord = {
    success: true,
    language: lang,
    trainedDataSha256: digest,
    engineVersion: TESSERACT_ENGINE_VERSION,
    coreAssetVersion: TESSERACT_CORE_ASSET_VERSION,
    verifiedAt: Date.now(),
    verificationMethod: OFFLINE_VERIFICATION_METHOD,
    workerCreatedAt: activeWorkerProvenance.createdAt,
  };

  // 6. Always persist verification record to localStorage
  try {
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage is unavailable');
    }
    localStorage.setItem(`${OFFLINE_VERIFIED_STORAGE_KEY_PREFIX}${lang}`, JSON.stringify(record));
    const confirmedItem = localStorage.getItem(`${OFFLINE_VERIFIED_STORAGE_KEY_PREFIX}${lang}`);
    if (!confirmedItem) {
      throw new Error('Failed to confirm write to localStorage');
    }
  } catch (storageErr: unknown) {
    return failureRecord(`localStorage persistence failed: ${storageErr instanceof Error ? storageErr.message : String(storageErr)}`);
  }

  // 7. Atomically update in-memory verified state
  offlineVerifiedLanguageModels.add(lang);
  verifiedLanguageModels.add(lang);

  return record;
}

/**
 * Synchronous check whether a syntactically valid structured offline verification record exists in localStorage.
 *
 * NOTE: This function checks only whether a properly formatted record exists in localStorage.
 * It does NOT compare the digest with the current IndexedDB binary.
 * For full cryptographic verification against the actual cached binary, use verifyStoredOfflineRecord()
 * or verifyLanguageModelOfflineIntegrity().
 */
export function hasStoredOfflineVerificationRecord(lang: string): boolean {
  try {
    if (typeof localStorage === 'undefined') {
      return false;
    }
    const raw = localStorage.getItem(`${OFFLINE_VERIFIED_STORAGE_KEY_PREFIX}${lang}`);
    if (!raw) {
      offlineVerifiedLanguageModels.delete(lang);
      return false;
    }
    const rec = JSON.parse(raw) as OfflineVerificationRecord;
    if (
      rec &&
      rec.language === lang &&
      rec.engineVersion === TESSERACT_ENGINE_VERSION &&
      rec.coreAssetVersion === TESSERACT_CORE_ASSET_VERSION &&
      rec.verificationMethod === OFFLINE_VERIFICATION_METHOD &&
      typeof rec.trainedDataSha256 === 'string' &&
      rec.trainedDataSha256.length === 64 &&
      /^[0-9a-f]{64}$/i.test(rec.trainedDataSha256)
    ) {
      offlineVerifiedLanguageModels.add(lang);
      return true;
    } else {
      invalidateStoredOfflineRecord(lang);
      return false;
    }
  } catch {
    invalidateStoredOfflineRecord(lang);
    return false;
  }
}

/**
 * Synchronous check for stored offline verification record.
 * Aliased to hasStoredOfflineVerificationRecord for backward compatibility.
 */
export function isLanguageModelOfflineVerified(lang: string): boolean {
  return hasStoredOfflineVerificationRecord(lang);
}

/**
 * Asynchronously verifies the genuine cryptographic integrity of a cached language model.
 * Performs deep verification:
 * 1. Checks that a valid structured record exists in localStorage.
 * 2. Reads the actual traineddata binary from IndexedDB keyval-store and checks binary validity.
 * 3. Computes the genuine Web Crypto SHA-256 digest of the actual binary and verifies it matches the record.
 * 4. Verifies engine and core asset version compatibility.
 */
export async function verifyLanguageModelOfflineIntegrity(lang: string): Promise<boolean> {
  return verifyStoredOfflineRecord(lang);
}

/**
 * Validates persistent offline verification record against actual cached binary and engine version.
 * Invalidates record if data is missing, engine versions differ, or SHA-256 fingerprint mismatches.
 */
export async function verifyStoredOfflineRecord(lang: string, cachedBinary?: unknown): Promise<boolean> {
  try {
    if (typeof localStorage === 'undefined') return false;
    const raw = localStorage.getItem(`${OFFLINE_VERIFIED_STORAGE_KEY_PREFIX}${lang}`);
    if (!raw) {
      offlineVerifiedLanguageModels.delete(lang);
      return false;
    }

    let rec: OfflineVerificationRecord;
    try {
      rec = JSON.parse(raw);
    } catch {
      invalidateStoredOfflineRecord(lang);
      return false;
    }

    if (
      !rec ||
      rec.language !== lang ||
      rec.engineVersion !== TESSERACT_ENGINE_VERSION ||
      rec.coreAssetVersion !== TESSERACT_CORE_ASSET_VERSION ||
      rec.verificationMethod !== OFFLINE_VERIFICATION_METHOD ||
      !rec.trainedDataSha256 ||
      rec.trainedDataSha256.length !== 64 ||
      !/^[0-9a-f]{64}$/i.test(rec.trainedDataSha256)
    ) {
      invalidateStoredOfflineRecord(lang);
      return false;
    }

    let binary = cachedBinary;
    if (!binary) {
      binary = await getTrainedDataBinaryFromIndexedDb(lang);
    }
    if (!binary) {
      invalidateStoredOfflineRecord(lang);
      return false;
    }

    const check = isValidTrainedDataBinary(binary);
    if (!check.valid) {
      invalidateStoredOfflineRecord(lang);
      return false;
    }

    const currentSha = await computeSha256(binary as Uint8Array);
    if (currentSha !== rec.trainedDataSha256) {
      invalidateStoredOfflineRecord(lang);
      return false;
    }

    offlineVerifiedLanguageModels.add(lang);
    verifiedLanguageModels.add(lang);
    return true;
  } catch {
    invalidateStoredOfflineRecord(lang);
    return false;
  }
}

export interface VerifiedLanguageCacheItem {
  cached: boolean;
  plausibleSize?: boolean;
  hasPlausibleStructure?: boolean;
  plausible?: boolean;
  initialized?: boolean;
  offlineVerified?: boolean;
  verified: boolean;
  sizeBytes?: number;
  error?: string;
}

export interface VerifiedCacheStatus {
  ben: VerifiedLanguageCacheItem;
  eng: VerifiedLanguageCacheItem;
}

export interface PrecacheResult {
  success: boolean;
  verified: boolean;
  sizeBytes?: number;
  error?: string;
}

export interface TrainedDataBinaryValidation {
  valid: boolean;
  plausibleSize: boolean;
  hasPlausibleStructure: boolean;
  isZeroFilled?: boolean;
  sizeBytes: number;
  numEntries?: number;
  reason?: string;
}

/**
 * Validates whether an entry from IndexedDB is valid binary traineddata
 * Rejects zero-filled buffers, malformed tables, truncated data, and unrelated file formats.
 */
export function isValidTrainedDataBinary(val: unknown): TrainedDataBinaryValidation {
  if (!val) {
    return {
      valid: false,
      plausibleSize: false,
      hasPlausibleStructure: false,
      sizeBytes: 0,
      reason: 'Value is null, undefined, or empty',
    };
  }

  let size = 0;
  let headerBytes: Uint8Array | null = null;

  if (val instanceof Uint8Array) {
    size = val.byteLength;
    headerBytes = val.subarray(0, Math.min(512, val.byteLength));
  } else if (ArrayBuffer.isView(val)) {
    size = val.byteLength;
    headerBytes = new Uint8Array(val.buffer, val.byteOffset, Math.min(512, val.byteLength));
  } else if (val instanceof ArrayBuffer) {
    size = val.byteLength;
    headerBytes = new Uint8Array(val, 0, Math.min(512, val.byteLength));
  } else if (typeof Blob !== 'undefined' && val instanceof Blob) {
    size = val.size;
  } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(val)) {
    size = val.length;
    headerBytes = new Uint8Array(val.buffer, val.byteOffset, Math.min(512, val.length));
  }

  const isBinary = headerBytes !== null || (typeof Blob !== 'undefined' && val instanceof Blob);
  if (!isBinary) {
    return {
      valid: false,
      plausibleSize: false,
      hasPlausibleStructure: false,
      sizeBytes: 0,
      reason: 'Value is not an ArrayBuffer, TypedArray, Blob, or Buffer',
    };
  }

  // Model size must exceed minimum 10KB threshold
  const plausibleSize = size >= 10240;
  if (!plausibleSize) {
    return {
      valid: false,
      plausibleSize: false,
      hasPlausibleStructure: false,
      sizeBytes: size,
      reason: size === 0 ? 'Stored binary data is empty (0 bytes)' : `Stored traineddata is truncated (${size} bytes < 10KB)`,
    };
  }

  if (!headerBytes || headerBytes.length < 4) {
    return {
      valid: false,
      plausibleSize: true,
      hasPlausibleStructure: false,
      sizeBytes: size,
      reason: 'Header byte sample unavailable or truncated',
    };
  }

  // Reject zero-filled buffers
  const isZeroFilled = headerBytes.length > 0 && headerBytes.every((b) => b === 0);
  if (isZeroFilled) {
    return {
      valid: false,
      plausibleSize: true,
      hasPlausibleStructure: false,
      isZeroFilled: true,
      sizeBytes: size,
      reason: 'Zero-filled buffer rejected; does not contain valid language model data',
    };
  }

  // Reject common non-traineddata formats
  const isPdf = headerBytes[0] === 0x25 && headerBytes[1] === 0x50 && headerBytes[2] === 0x44 && headerBytes[3] === 0x46; // %PDF
  const isPng = headerBytes[0] === 0x89 && headerBytes[1] === 0x50 && headerBytes[2] === 0x4e && headerBytes[3] === 0x47; // \x89PNG
  const isJpeg = headerBytes[0] === 0xff && headerBytes[1] === 0xd8 && headerBytes[2] === 0xff; // JPEG
  const isGif = headerBytes[0] === 0x47 && headerBytes[1] === 0x49 && headerBytes[2] === 0x46; // GIF
  const isHtmlOrXml = headerBytes[0] === 0x3c && (headerBytes[1] === 0x21 || headerBytes[1] === 0x68 || headerBytes[1] === 0x3f); // <! <h <?
  const isJson = headerBytes[0] === 0x7b || headerBytes[0] === 0x5b; // { or [

  if (isPdf || isPng || isJpeg || isGif || isHtmlOrXml || isJson) {
    return {
      valid: false,
      plausibleSize: true,
      hasPlausibleStructure: false,
      sizeBytes: size,
      reason: 'Unrelated file format detected (not Tesseract traineddata)',
    };
  }

  // Format A: GZIP-compressed traineddata (.traineddata.gz)
  const isGzip = headerBytes[0] === 0x1f && headerBytes[1] === 0x8b && headerBytes[2] === 0x08;
  if (isGzip) {
    return {
      valid: true,
      plausibleSize: true,
      hasPlausibleStructure: true,
      sizeBytes: size,
    };
  }

  // Format B: Uncompressed Tesseract traineddata directory format
  const numEntries = (headerBytes[0] | (headerBytes[1] << 8) | (headerBytes[2] << 16) | (headerBytes[3] << 24)) >> 0;

  // In standard Tesseract LSTM, numEntries is a positive integer between 1 and 64 (standard is 24)
  if (numEntries <= 0 || numEntries > 64) {
    return {
      valid: false,
      plausibleSize: true,
      hasPlausibleStructure: false,
      sizeBytes: size,
      numEntries,
      reason: `Invalid Tesseract component count (${numEntries}); expected 1-64`,
    };
  }

  const tableSize = 4 + numEntries * 8;
  if (size < tableSize) {
    return {
      valid: false,
      plausibleSize: true,
      hasPlausibleStructure: false,
      sizeBytes: size,
      numEntries,
      reason: 'File size is smaller than directory offset table',
    };
  }

  // Validate component offsets in directory table
  let validPresentOffsets = 0;
  let hasMalformedOffset = false;
  const maxEntriesToCheck = Math.min(numEntries, Math.floor((headerBytes.length - 4) / 8));

  for (let i = 0; i < maxEntriesToCheck; i++) {
    const offsetPos = 4 + i * 8;
    const low = (headerBytes[offsetPos] | (headerBytes[offsetPos + 1] << 8) | (headerBytes[offsetPos + 2] << 16) | (headerBytes[offsetPos + 3] << 24)) >>> 0;
    const high = (headerBytes[offsetPos + 4] | (headerBytes[offsetPos + 5] << 8) | (headerBytes[offsetPos + 6] << 16) | (headerBytes[offsetPos + 7] << 24)) >> 0;

    // Absent component is represented by offset -1 (low === 0xffffffff && high === -1)
    if (low === 0xffffffff && high === -1) {
      continue;
    }

    // Present component: offset must be within file bounds and after the directory table
    if (high === 0 && low >= tableSize && low < size) {
      validPresentOffsets++;
    } else {
      hasMalformedOffset = true;
      break;
    }
  }

  if (hasMalformedOffset || validPresentOffsets === 0) {
    return {
      valid: false,
      plausibleSize: true,
      hasPlausibleStructure: false,
      sizeBytes: size,
      numEntries,
      reason: hasMalformedOffset
        ? 'Malformed component offset pointing outside file bounds'
        : 'No valid component offsets found in directory table',
    };
  }

  return {
    valid: true,
    plausibleSize: true,
    hasPlausibleStructure: true,
    sizeBytes: size,
    numEntries,
  };
}

/**
 * Checks whether trained language data is genuinely cached and verified in browser IndexedDB.
 * Reads the actual binary entry, not just keys, and validates its contents.
 */
export async function checkLanguageCacheStatus(): Promise<VerifiedCacheStatus> {
  const result: VerifiedCacheStatus = {
    ben: { cached: false, verified: false },
    eng: { cached: false, verified: false },
  };

  if (typeof indexedDB === 'undefined') {
    result.ben.error = 'IndexedDB is unavailable in this environment.';
    result.eng.error = 'IndexedDB is unavailable in this environment.';
    return result;
  }

  return new Promise((resolve) => {
    let db: IDBDatabase | null = null;
    let resolved = false;

    const safeResolve = (res: VerifiedCacheStatus) => {
      if (resolved) return;
      resolved = true;
      if (db) {
        try {
          db.close();
        } catch {
          // ignore
        }
        db = null;
      }
      resolve(res);
    };

    try {
      const openReq = indexedDB.open('keyval-store');

      openReq.onerror = () => {
        result.ben.error = 'Failed to open keyval-store database';
        result.eng.error = 'Failed to open keyval-store database';
        safeResolve(result);
      };

      openReq.onblocked = () => {
        result.ben.error = 'Database access blocked';
        result.eng.error = 'Database access blocked';
        safeResolve(result);
      };

      openReq.onsuccess = (e) => {
        db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('keyval')) {
          safeResolve(result);
          return;
        }

        try {
          const tx = db.transaction('keyval', 'readonly');
          const store = tx.objectStore('keyval');

          tx.onerror = () => {
            result.ben.error = 'Transaction error';
            result.eng.error = 'Transaction error';
            safeResolve(result);
          };

          tx.onabort = () => {
            result.ben.error = 'Transaction aborted';
            result.eng.error = 'Transaction aborted';
            safeResolve(result);
          };

          const keysReq = store.getAllKeys();

          keysReq.onerror = () => {
            result.ben.error = 'Failed to read keys';
            result.eng.error = 'Failed to read keys';
            safeResolve(result);
          };

          keysReq.onsuccess = () => {
            const keys = (keysReq.result || []) as IDBValidKey[];
            const benKey = keys.find((k) => typeof k === 'string' && k.includes('ben.traineddata'));
            const engKey = keys.find((k) => typeof k === 'string' && k.includes('eng.traineddata'));

            let pending = 0;
            const checkDone = () => {
              if (pending === 0) {
                safeResolve(result);
              }
            };

            if (benKey) {
              result.ben.cached = true;
              pending++;
              try {
                const getBen = store.get(benKey);
                getBen.onsuccess = () => {
                  const check = isValidTrainedDataBinary(getBen.result);
                  result.ben.plausibleSize = check.plausibleSize;
                  result.ben.hasPlausibleStructure = check.hasPlausibleStructure;
                  result.ben.sizeBytes = check.sizeBytes;
                  result.ben.plausible = check.valid;
                  result.ben.initialized = isLanguageModelInitialized('ben');

                  if (check.valid) {
                    verifyStoredOfflineRecord('ben', getBen.result)
                      .then((isOfflineVer) => {
                        result.ben.offlineVerified = isOfflineVer;
                        result.ben.verified = Boolean(check.valid && isOfflineVer);
                        pending--;
                        checkDone();
                      })
                      .catch(() => {
                        result.ben.offlineVerified = false;
                        result.ben.verified = false;
                        pending--;
                        checkDone();
                      });
                  } else {
                    invalidateStoredOfflineRecord('ben');
                    result.ben.offlineVerified = false;
                    result.ben.verified = false;
                    result.ben.error = check.reason || (
                      check.sizeBytes === 0
                        ? 'Stored traineddata is empty (0 bytes)'
                        : 'Stored traineddata is truncated or invalid binary format'
                    );
                    pending--;
                    checkDone();
                  }
                };
                getBen.onerror = () => {
                  result.ben.verified = false;
                  result.ben.plausible = false;
                  result.ben.error = 'Failed to read stored traineddata entry';
                  pending--;
                  checkDone();
                };
              } catch (err: unknown) {
                result.ben.verified = false;
                result.ben.plausible = false;
                result.ben.error = err instanceof Error ? err.message : String(err);
                pending--;
                checkDone();
              }
            }

            if (engKey) {
              result.eng.cached = true;
              pending++;
              try {
                const getEng = store.get(engKey);
                getEng.onsuccess = () => {
                  const check = isValidTrainedDataBinary(getEng.result);
                  result.eng.plausibleSize = check.plausibleSize;
                  result.eng.hasPlausibleStructure = check.hasPlausibleStructure;
                  result.eng.sizeBytes = check.sizeBytes;
                  result.eng.plausible = check.valid;
                  result.eng.initialized = isLanguageModelInitialized('eng');

                  if (check.valid) {
                    verifyStoredOfflineRecord('eng', getEng.result)
                      .then((isOfflineVer) => {
                        result.eng.offlineVerified = isOfflineVer;
                        result.eng.verified = Boolean(check.valid && isOfflineVer);
                        pending--;
                        checkDone();
                      })
                      .catch(() => {
                        result.eng.offlineVerified = false;
                        result.eng.verified = false;
                        pending--;
                        checkDone();
                      });
                  } else {
                    invalidateStoredOfflineRecord('eng');
                    result.eng.offlineVerified = false;
                    result.eng.verified = false;
                    result.eng.error = check.reason || (
                      check.sizeBytes === 0
                        ? 'Stored traineddata is empty (0 bytes)'
                        : 'Stored traineddata is truncated or invalid binary format'
                    );
                    pending--;
                    checkDone();
                  }
                };
                getEng.onerror = () => {
                  result.eng.verified = false;
                  result.eng.plausible = false;
                  result.eng.error = 'Failed to read stored traineddata entry';
                  pending--;
                  checkDone();
                };
              } catch (err: unknown) {
                result.eng.verified = false;
                result.eng.plausible = false;
                result.eng.error = err instanceof Error ? err.message : String(err);
                pending--;
                checkDone();
              }
            }

            checkDone();
          };
        } catch (txErr: unknown) {
          result.ben.error = txErr instanceof Error ? txErr.message : String(txErr);
          result.eng.error = txErr instanceof Error ? txErr.message : String(txErr);
          safeResolve(result);
        }
      };
    } catch (openErr: unknown) {
      result.ben.error = openErr instanceof Error ? openErr.message : String(openErr);
      result.eng.error = openErr instanceof Error ? openErr.message : String(openErr);
      safeResolve(result);
    }
  });
}

/**
 * Pre-downloads and caches a language model ahead of time while online,
 * ensuring students have 100% offline OCR capability before entering offline environments.
 * Strictly verifies persistence by reading back the actual stored traineddata from IndexedDB.
 */
export async function precacheLanguageModel(
  language: 'ben' | 'eng',
  onProgress?: (progress: number, status: string) => void
): Promise<PrecacheResult> {
  let worker: Worker | null = null;
  try {
    const creator = customWorkerCreator || createWorker;
    worker = await creator(language, 1, {
      workerPath: '/tesseract/worker.min.js',
      corePath: '/tesseract',
      workerBlobURL: false,
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      logger: (m: { status?: string; progress?: number }) => {
        if (onProgress) {
          onProgress(m.progress || 0, m.status || 'Pre-caching...');
        }
      },
      errorHandler: (err: unknown) => {
        console.error('[NoticeLens Pre-cache Error]:', err);
      },
    });

    await worker.terminate();
    worker = null;

    // Verify persistence after worker termination by reading back from IndexedDB
    const status = await checkLanguageCacheStatus();
    const item = status[language];

    if (!item.cached) {
      return {
        success: false,
        verified: false,
        error: `Persistence verification failed: ${language}.traineddata was not saved to IndexedDB keyval-store.`,
      };
    }

    if (!item.plausible) {
      return {
        success: false,
        verified: false,
        sizeBytes: item.sizeBytes,
        error: `Persistence verification failed: ${item.error || 'stored traineddata data is empty or invalid'}.`,
      };
    }

    return {
      success: true,
      verified: Boolean(item.offlineVerified),
      sizeBytes: item.sizeBytes,
    };
  } catch (err: unknown) {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // ignore
      }
    }
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      verified: false,
      error: msg,
    };
  }
}
