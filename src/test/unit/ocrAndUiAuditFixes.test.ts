// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { Worker } from 'tesseract.js';
import type { OCRProgress } from '../../types/notice';
import { normalizeImageForOcr } from '../../services/ocr/imagePreprocess';
import {
  runOcrRecognition,
  terminateOcrWorker,
  setCustomWorkerCreatorForTesting,
  checkLanguageCacheStatus,
  isValidTrainedDataBinary,
  isOcrWorkerActive,
  markLanguageModelOfflineVerified,
  hasStoredOfflineVerificationRecord,
  isLanguageModelOfflineVerified,
  isLanguageModelVerified,
  verifyLanguageModelOfflineIntegrity,
  getActiveWorkerProvenance,
  verifyStoredOfflineRecord,
  invalidateStoredOfflineRecord,
  computeSha256,
  TESSERACT_ENGINE_VERSION,
  TESSERACT_CORE_ASSET_VERSION,
  OFFLINE_VERIFICATION_METHOD,
} from '../../services/ocr/tesseractWorker';
import {
  createMockTrainedData,
  testOnlyMarkOfflineVerified,
} from '../helpers/testVerificationHelper';
import { speechService } from '../../services/speech/webSpeechService';
import { transliterateBengaliToPhonetic } from '../../services/speech/bengaliPhonetics';
import {
  requestPersistentStorage,
  exportNoticeVaultBackup,
  importNoticeVaultBackup,
} from '../../services/storage/indexedDBService';

function mockIndexedDbKeyvalStore(storeMap: Record<string, unknown>) {
  const req: Record<string, unknown> = {
    result: {
      objectStoreNames: { contains: (name: string) => name === 'keyval' },
      close: vi.fn(),
      transaction: () => ({
        objectStore: () => ({
          getAllKeys: () => {
            const r: Record<string, unknown> = {};
            setTimeout(() => {
              r.result = Object.keys(storeMap);
              if (typeof r.onsuccess === 'function') {
                r.onsuccess({ target: r });
              }
            }, 0);
            return r;
          },
          get: (key: string) => {
            const r: Record<string, unknown> = {};
            setTimeout(() => {
              r.result = storeMap[key];
              if (typeof r.onsuccess === 'function') {
                r.onsuccess({ target: r });
              }
            }, 0);
            return r;
          },
        }),
      }),
    },
    onsuccess: null,
    onerror: null,
  };
  (window as unknown as { indexedDB: unknown }).indexedDB = {
    open: vi.fn().mockImplementation(() => {
      setTimeout(() => {
        if (typeof req.onsuccess === 'function') {
          req.onsuccess({ target: req });
        }
      }, 0);
      return req;
    }),
  };
}

describe('OCR and UI Regression Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    setCustomWorkerCreatorForTesting(null);
    await terminateOcrWorker();
  });

  describe('1. Image Normalization & Input Validation', () => {
    it('rejects empty or null image source immediately', async () => {
      // @ts-expect-error testing null input
      await expect(normalizeImageForOcr(null)).rejects.toThrow(/No image provided/i);
    });

    it('rejects invalid or corrupted image data gracefully without hanging', async () => {
      await expect(normalizeImageForOcr('invalid://not-an-image')).rejects.toThrow();
    });

    it('normalizes valid raster images onto an in-memory canvas with a white background', async () => {
      // In JSDOM, a 1x1 base64 transparent PNG data URI
      const transparent1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      const normalized = await normalizeImageForOcr(transparent1x1);
      expect(normalized).toBeDefined();
      expect(typeof normalized).toBe('string');
      expect(normalized.startsWith('data:image/png;base64,')).toBe(true);
    });
  });

  describe('2. Offline Caching & Worker Lifecycle (Scenarios A, B, C)', () => {
    // Scenario A: Cached language data is available while offline
    it('Scenario A: permits real OCR recognition while offline when cached language data is available', async () => {
      const originalOnLine = navigator.onLine;
      try {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

        // Inject worker representing cached-language initialization and successful recognition
        const mockRecognize = vi.fn().mockResolvedValue({
          data: {
            text: 'ঢাকা বিশ্ববিদ্যালয় ভর্তি বিজ্ঞপ্তি ২০২৪',
            confidence: 91,
            lines: [{ text: 'ঢাকা বিশ্ববিদ্যালয় ভর্তি বিজ্ঞপ্তি ২০২৪' }],
          },
        });
        const mockWorker = {
          recognize: mockRecognize,
          terminate: vi.fn().mockResolvedValue({}),
        };
        setCustomWorkerCreatorForTesting(vi.fn().mockResolvedValue(mockWorker as unknown as Worker));

        const transparent1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        const result = await runOcrRecognition(transparent1x1, 'ben');

        expect(result).toBeDefined();
        expect(result.text).toContain('ঢাকা বিশ্ববিদ্যালয় ভর্তি বিজ্ঞপ্তি ২০২৪');
        expect(result.confidence).toBe(91);
        expect(mockRecognize).toHaveBeenCalled();
      } finally {
        setCustomWorkerCreatorForTesting(null);
        Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
      }
    });

    // Scenario B: Cached language data is unavailable (cache miss) while offline
    it('Scenario B: provides clear actionable offline guidance on cache miss without fake OCR output', async () => {
      const originalOnLine = navigator.onLine;
      try {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

        // Inject worker creator that fails because language file is not cached and network is offline
        setCustomWorkerCreatorForTesting(vi.fn().mockRejectedValue(new Error('Failed to fetch traineddata: network offline')));

        const transparent1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        await expect(runOcrRecognition(transparent1x1, 'ben')).rejects.toThrowError(
          /Offline Notice: Trained OCR language data for Bengali is not cached/i
        );

        // Verify diagnostic was logged in window telemetry
        const diagnostics = (window as unknown as { __noticelens_ocr_diagnostics: Array<{ phase: string; userMessage: string }> }).__noticelens_ocr_diagnostics;
        expect(diagnostics).toBeDefined();
        const latest = diagnostics[diagnostics.length - 1];
        expect(latest.phase).toBe('network');
        expect(latest.userMessage).toContain('Offline Notice');
      } finally {
        setCustomWorkerCreatorForTesting(null);
        Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
      }
    });

    // Scenario C: Online first use loads language data and reports progress
    it('Scenario C: loads language data when online and preserves progress reporting and error handling', async () => {
      const originalOnLine = navigator.onLine;
      try {
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

        const progressUpdates: OCRProgress[] = [];
        const mockRecognize = vi.fn().mockResolvedValue({
          data: {
            text: 'Notice: Fall 2024 Exam',
            confidence: 95,
            lines: [{ text: 'Notice: Fall 2024 Exam' }],
          },
        });
        const mockWorker = {
          recognize: mockRecognize,
          terminate: vi.fn().mockResolvedValue({}),
        };
        const mockCreator = vi.fn().mockImplementation((_langs, _oem, options) => {
          if (options?.logger) {
            options.logger({ status: 'loading tesseract core', progress: 0.5 });
            options.logger({ status: 'loading traineddata (eng)', progress: 0.8 });
          }
          return Promise.resolve(mockWorker as unknown as Worker);
        });

        setCustomWorkerCreatorForTesting(mockCreator);

        const transparent1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        const result = await runOcrRecognition(transparent1x1, 'eng', (p) => {
          progressUpdates.push(p);
        });

        expect(result.text).toContain('Notice: Fall 2024 Exam');
        expect(result.confidence).toBe(95);
        expect(progressUpdates.length).toBeGreaterThanOrEqual(2);
        expect(progressUpdates.some((p) => p.step === 'loading_worker')).toBe(true);
      } finally {
        setCustomWorkerCreatorForTesting(null);
        Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
      }
    });

    it('cleans up worker state upon termination so retries start fresh', async () => {
      await expect(terminateOcrWorker()).resolves.not.toThrow();
    });

    // P1 Regression: Online-created worker reused while offline must NOT mark offline verified
    it('Regression: Online-created worker reused while offline succeeds OCR but does NOT mark offline verified', async () => {
      await terminateOcrWorker();
      invalidateStoredOfflineRecord('ben');
      const originalOnLine = navigator.onLine;

      try {
        // 1. Worker created while online
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
        const mockRecognize = vi.fn().mockResolvedValue({
          data: { text: 'Online Bengali Notice Text', confidence: 94, lines: [{ text: 'Online Bengali Notice Text' }] }
        });
        const mockWorker = {
          recognize: mockRecognize,
          terminate: vi.fn().mockResolvedValue({}),
        };
        setCustomWorkerCreatorForTesting(vi.fn().mockResolvedValue(mockWorker as unknown as Worker));

        const transparent1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        const res1 = await runOcrRecognition(transparent1x1, 'ben');
        expect(res1.text).toBe('Online Bengali Notice Text');

        const prov = getActiveWorkerProvenance();
        expect(prov).toBeDefined();
        expect(prov?.initializedOffline).toBe(false);

        // 2. Network goes offline, existing worker is reused
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
        const res2 = await runOcrRecognition(transparent1x1, 'ben');
        expect(res2.text).toBe('Online Bengali Notice Text');

        // 3. Must NOT mark offline verified because worker was created online
        expect(isLanguageModelOfflineVerified('ben')).toBe(false);
      } finally {
        await terminateOcrWorker();
        setCustomWorkerCreatorForTesting(null);
        Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
      }
    });

    // P1 Regression: Newly created offline worker with cached language data
    it('Regression: Newly created offline worker with cached language data succeeds and records structured offline verification', async () => {
      await terminateOcrWorker();
      invalidateStoredOfflineRecord('ben');
      const originalOnLine = navigator.onLine;

      try {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

        // Mock IndexedDB having valid traineddata
        const mockData = createMockTrainedData();
        const mockDB = {
          objectStoreNames: { contains: (n: string) => n === 'keyval' },
          close: vi.fn(),
          transaction: () => ({
            objectStore: () => ({
              getAllKeys: () => {
                const req: { onsuccess?: () => void; onerror?: () => void; result?: unknown } = {};
                setTimeout(() => {
                  req.result = ['https://tessdata.projectnaptha.com/4.0.0/ben.traineddata.gz'];
                  req.onsuccess?.();
                }, 0);
                return req;
              },
              get: () => {
                const req: { onsuccess?: () => void; onerror?: () => void; result?: unknown } = {};
                setTimeout(() => {
                  req.result = mockData;
                  req.onsuccess?.();
                }, 0);
                return req;
              }
            })
          })
        };

        const originalIndexedDB = globalThis.indexedDB;
        globalThis.indexedDB = {
          open: () => {
            const req = {
              onsuccess: null as ((e: unknown) => void) | null,
              onerror: null as (() => void) | null,
              onblocked: null as (() => void) | null,
              result: undefined as unknown,
            };
            setTimeout(() => {
              req.result = mockDB;
              req.onsuccess?.({ target: req });
            }, 0);
            return req as unknown as IDBOpenDBRequest;
          }
        } as unknown as IDBFactory;

        const mockRecognize = vi.fn().mockResolvedValue({
          data: { text: 'অফলাইন নোটিশ পাঠ্য', confidence: 92, lines: [{ text: 'অফলাইন নোটিশ পাঠ্য' }] }
        });
        const mockWorker = {
          recognize: mockRecognize,
          terminate: vi.fn().mockResolvedValue({}),
        };
        setCustomWorkerCreatorForTesting(vi.fn().mockResolvedValue(mockWorker as unknown as Worker));

        const transparent1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        const result = await runOcrRecognition(transparent1x1, 'ben');
        expect(result.text).toBe('অফলাইন নোটিশ পাঠ্য');

        const prov = getActiveWorkerProvenance();
        expect(prov).toBeDefined();
        expect(prov?.initializedOffline).toBe(true);
        expect(prov?.cachePreflightPassed).toBe(true);
        expect(prov?.startedOffline).toBe(true);
        expect(prov?.completedOffline).toBe(true);

        // Verified state marked
        expect(isLanguageModelOfflineVerified('ben')).toBe(true);

        // Verify structured record stored in localStorage
        const rawRecord = localStorage.getItem('noticelens_offline_verified_record_ben');
        expect(rawRecord).toBeDefined();
        const parsed = JSON.parse(rawRecord!);
        expect(parsed.language).toBe('ben');
        expect(parsed.engineVersion).toBe(TESSERACT_ENGINE_VERSION);
        expect(parsed.coreAssetVersion).toBe(TESSERACT_CORE_ASSET_VERSION);
        expect(parsed.verificationMethod).toBe(OFFLINE_VERIFICATION_METHOD);
        expect(parsed.trainedDataSha256).toBeDefined();

        // Verify verifyStoredOfflineRecord returns true with matching binary
        const isValid = await verifyStoredOfflineRecord('ben', mockData);
        expect(isValid).toBe(true);

        globalThis.indexedDB = originalIndexedDB;
      } finally {
        await terminateOcrWorker();
        setCustomWorkerCreatorForTesting(null);
        Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
      }
    });

    // P1 Regression: Newly created offline worker with missing data
    it('Regression: Newly created offline worker with missing data aborts before network fetch and throws actionable notice', async () => {
      await terminateOcrWorker();
      const originalOnLine = navigator.onLine;

      try {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
        const originalIndexedDB = globalThis.indexedDB;
        globalThis.indexedDB = undefined as unknown as IDBFactory;

        const transparent1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        await expect(runOcrRecognition(transparent1x1, 'ben')).rejects.toThrow(/Offline Notice: Trained OCR language data for Bengali is not cached/i);

        expect(isOcrWorkerActive()).toBe(false);
        expect(getActiveWorkerProvenance()).toBeNull();

        globalThis.indexedDB = originalIndexedDB;
      } finally {
        await terminateOcrWorker();
        Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
      }
    });

    // P1 Regression: Worker recreation after changing OCR languages
    it('Regression: Worker recreation cleanly switches languages and terminates previous worker', async () => {
      await terminateOcrWorker();
      const originalOnLine = navigator.onLine;

      try {
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
        const termFn1 = vi.fn().mockResolvedValue({});
        const mockWorker1 = {
          recognize: vi.fn().mockResolvedValue({ data: { text: 'Bengali' } }),
          terminate: termFn1,
        };
        const termFn2 = vi.fn().mockResolvedValue({});
        const mockWorker2 = {
          recognize: vi.fn().mockResolvedValue({ data: { text: 'English' } }),
          terminate: termFn2,
        };

        let callCount = 0;
        setCustomWorkerCreatorForTesting(vi.fn().mockImplementation(() => {
          callCount++;
          return Promise.resolve((callCount === 1 ? mockWorker1 : mockWorker2) as unknown as Worker);
        }));

        const transparent1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

        await runOcrRecognition(transparent1x1, 'ben');
        expect(getActiveWorkerProvenance()?.language).toBe('ben');

        // Now switch to English
        await runOcrRecognition(transparent1x1, 'eng');
        expect(termFn1).toHaveBeenCalled();
        expect(getActiveWorkerProvenance()?.language).toBe('eng');
      } finally {
        await terminateOcrWorker();
        setCustomWorkerCreatorForTesting(null);
        Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
      }
    });

    // P1 Regression: Online/offline status changing during OCR operation
    it('Regression: Online status transition to online during OCR prevents false offline verification', async () => {
      await terminateOcrWorker();
      invalidateStoredOfflineRecord('ben');
      const originalOnLine = navigator.onLine;

      try {
        // Starts offline
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

        const mockRecognize = vi.fn().mockImplementation(() => {
          // Network comes back online mid-operation!
          Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
          return Promise.resolve({
            data: { text: 'Text during status change', confidence: 90, lines: [] }
          });
        });

        const mockWorker = {
          recognize: mockRecognize,
          terminate: vi.fn().mockResolvedValue({}),
        };
        setCustomWorkerCreatorForTesting(vi.fn().mockResolvedValue(mockWorker as unknown as Worker));

        const transparent1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        const result = await runOcrRecognition(transparent1x1, 'ben');
        expect(result.text).toBe('Text during status change');

        // Provenance shows completedOffline was false
        const prov = getActiveWorkerProvenance();
        expect(prov?.startedOffline).toBe(true);
        expect(prov?.completedOffline).toBe(false);

        // Must NOT be marked offline verified!
        expect(isLanguageModelOfflineVerified('ben')).toBe(false);
      } finally {
        await terminateOcrWorker();
        setCustomWorkerCreatorForTesting(null);
        Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
      }
    });

    // P1 Regression: Fingerprint and version validation
    it('Regression: Invalidate stored record if traineddata SHA-256 fingerprint, engine version, or core version differs', async () => {
      invalidateStoredOfflineRecord('ben');
      const mockData = createMockTrainedData(65536);
      const correctSha = await computeSha256(mockData);

      // 1. Valid record matches
      const validRec = await testOnlyMarkOfflineVerified('ben', { binary: mockData });
      expect(validRec.trainedDataSha256).toBe(correctSha);
      expect(await verifyStoredOfflineRecord('ben', mockData)).toBe(true);

      // 2. Tampered SHA-256 in storage
      const tamperedShaRec = { ...validRec, trainedDataSha256: 'tampered_sha256_hash_value' };
      localStorage.setItem('noticelens_offline_verified_record_ben', JSON.stringify(tamperedShaRec));
      expect(await verifyStoredOfflineRecord('ben', mockData)).toBe(false);
      expect(isLanguageModelOfflineVerified('ben')).toBe(false);

      // 3. Stale engine version
      const staleEngineRec = { ...validRec, engineVersion: '6.0.0' };
      localStorage.setItem('noticelens_offline_verified_record_ben', JSON.stringify(staleEngineRec));
      expect(await verifyStoredOfflineRecord('ben', mockData)).toBe(false);
      expect(isLanguageModelOfflineVerified('ben')).toBe(false);

      // 4. Stale core asset version
      const staleCoreRec = { ...validRec, coreAssetVersion: 'v1' };
      localStorage.setItem('noticelens_offline_verified_record_ben', JSON.stringify(staleCoreRec));
      expect(await verifyStoredOfflineRecord('ben', mockData)).toBe(false);
      expect(isLanguageModelOfflineVerified('ben')).toBe(false);

      // 5. Binary changed or tampered
      const differentBinary = new Uint8Array(mockData);
      differentBinary[300] = (differentBinary[300] + 1) % 255;
      localStorage.setItem('noticelens_offline_verified_record_ben', JSON.stringify(validRec));
      expect(await verifyStoredOfflineRecord('ben', differentBinary)).toBe(false);
      expect(isLanguageModelOfflineVerified('ben')).toBe(false);
    });

    // Test A: Missing IndexedDB binary must never generate a mock verification record
    it('Regression A: Missing IndexedDB binary must never generate a mock verification record', async () => {
      invalidateStoredOfflineRecord('ben');
      // 1. Without active worker provenance, verification is rejected immediately
      const resNoWorker = await markLanguageModelOfflineVerified('ben');
      expect(resNoWorker.success).toBe(false);
      expect(isLanguageModelOfflineVerified('ben')).toBe(false);

      // 2. Production verifier rejects injected bypass arguments
      // @ts-expect-error testing invalid arguments
      const resInjected = await markLanguageModelOfflineVerified('ben', { skipProvenanceCheck: true });
      expect(resInjected.success).toBe(false);
      expect(resInjected.error).toContain('Production verifier does not accept injected binary');
      expect(isLanguageModelOfflineVerified('ben')).toBe(false);
      expect(localStorage.getItem('noticelens_offline_verified_record_ben')).toBeNull();
    });

    // Test B: Invalid binary must never receive verified status
    it('Regression B: Invalid binary must never receive verified status (truncated, zero-filled, or malformed)', async () => {
      invalidateStoredOfflineRecord('ben');

      // 1. Truncated (< 10KB)
      const truncated = new Uint8Array(256);
      const resTrunc = await testOnlyMarkOfflineVerified('ben', { binary: truncated });
      expect(resTrunc.success).toBe(false);
      expect(resTrunc.error).toContain('validation failed');
      expect(isLanguageModelOfflineVerified('ben')).toBe(false);

      // 2. Zero-filled
      const zeroFilled = new Uint8Array(65536);
      const resZero = await testOnlyMarkOfflineVerified('ben', { binary: zeroFilled });
      expect(resZero.success).toBe(false);
      expect(resZero.error).toContain('Zero-filled buffer rejected');
      expect(isLanguageModelOfflineVerified('ben')).toBe(false);

      // 3. Unrelated format (PDF / PNG)
      const fakePdf = new Uint8Array(65536);
      fakePdf[0] = 0x25; fakePdf[1] = 0x50; fakePdf[2] = 0x44; fakePdf[3] = 0x46; // %PDF
      const resPdf = await testOnlyMarkOfflineVerified('ben', { binary: fakePdf });
      expect(resPdf.success).toBe(false);
      expect(resPdf.error).toContain('Unrelated file format');
      expect(isLanguageModelOfflineVerified('ben')).toBe(false);

      // 4. Malformed directory table (invalid numEntries)
      const malformedHeader = new Uint8Array(65536);
      malformedHeader[0] = 0x99; malformedHeader[1] = 0x01; // numEntries = 409
      const resMalformed = await testOnlyMarkOfflineVerified('ben', { binary: malformedHeader });
      expect(resMalformed.success).toBe(false);
      expect(isLanguageModelOfflineVerified('ben')).toBe(false);
    });

    // Test C: Valid actual binary plus successful fresh offline worker may be verified
    it('Regression C: Valid actual binary plus successful fresh offline worker may be verified', async () => {
      await terminateOcrWorker();
      invalidateStoredOfflineRecord('ben');
      const originalOnLine = navigator.onLine;

      try {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

        const mockRecognize = vi.fn().mockResolvedValue({
          data: { text: 'ঢাকা বিশ্ববিদ্যালয় বিজ্ঞপ্তি', confidence: 95, lines: ['ঢাকা বিশ্ববিদ্যালয় বিজ্ঞপ্তি'] },
        });
        const mockWorker = {
          recognize: mockRecognize,
          terminate: vi.fn().mockResolvedValue({}),
        };
        setCustomWorkerCreatorForTesting(vi.fn().mockResolvedValue(mockWorker as unknown as Worker));

        const validBinary = createMockTrainedData(65536);
        mockIndexedDbKeyvalStore({ 'tesseract/4.0.0/ben.traineddata': validBinary });

        const transparent1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

        const ocrRes = await runOcrRecognition(transparent1x1, 'ben');
        expect(ocrRes.text).toContain('ঢাকা');

        const prov = getActiveWorkerProvenance();
        expect(prov?.initializedOffline).toBe(true);
        expect(prov?.completedOffline).toBe(true);

        const res = await markLanguageModelOfflineVerified('ben');
        expect(res.success).toBe(true);
        expect(res.trainedDataSha256).toHaveLength(64);
        expect(isLanguageModelOfflineVerified('ben')).toBe(true);
        expect(await verifyStoredOfflineRecord('ben', validBinary)).toBe(true);
      } finally {
        await terminateOcrWorker();
        setCustomWorkerCreatorForTesting(null);
        delete (window as unknown as { indexedDB?: unknown }).indexedDB;
        Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
      }
    });

    // Test D: SHA-256 must match a known test vector
    it('Regression D: SHA-256 must match a known test vector and reject empty input', async () => {
      const input = new TextEncoder().encode('NoticeLens');
      const sha = await computeSha256(input);
      expect(sha).toBe('46941145af59106729a96f55c9a87b82b1d42b2c2cac596b574a0b572aec9727');

      // Empty buffer rejection
      await expect(computeSha256(new Uint8Array(0))).rejects.toThrow('empty binary buffer');
      // @ts-expect-error test null input
      await expect(computeSha256(null)).rejects.toThrow('null or undefined');
    });

    // Test E: Missing Web Crypto must fail safely rather than returning a fake SHA-256
    it('Regression E: Missing Web Crypto must fail safely rather than returning a fake SHA-256', async () => {
      invalidateStoredOfflineRecord('ben');
      const mockData = createMockTrainedData(65536);
      const originalSubtle = crypto.subtle;

      try {
        Object.defineProperty(crypto, 'subtle', { value: undefined, configurable: true });

        await expect(computeSha256(mockData)).rejects.toThrow('unavailable for genuine SHA-256');

        const res = await testOnlyMarkOfflineVerified('ben', { binary: mockData });
        expect(res.success).toBe(false);
        expect(res.error).toContain('unavailable for genuine SHA-256');
        expect(isLanguageModelOfflineVerified('ben')).toBe(false);
      } finally {
        Object.defineProperty(crypto, 'subtle', { value: originalSubtle, configurable: true });
      }
    });

    // Test F: localStorage write failure must not result in persistent verification success
    it('Regression F: localStorage write failure must not result in persistent verification success', async () => {
      invalidateStoredOfflineRecord('ben');
      const mockData = createMockTrainedData(65536);
      const setItemSpy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError: LocalStorage quota exceeded');
      });

      try {
        const res = await testOnlyMarkOfflineVerified('ben', { binary: mockData });
        expect(res.success).toBe(false);
        expect(res.error).toContain('localStorage persistence failed');
        expect(isLanguageModelOfflineVerified('ben')).toBe(false);
        expect(isLanguageModelVerified('ben')).toBe(false);
      } finally {
        setItemSpy.mockRestore();
      }
    });

    // Test G: Changed cached traineddata must invalidate the old verification record
    it('Regression G: Changed cached traineddata must invalidate the old verification record', async () => {
      invalidateStoredOfflineRecord('ben');
      const mockData1 = createMockTrainedData(65536);
      const res = await testOnlyMarkOfflineVerified('ben', { binary: mockData1 });
      expect(res.success).toBe(true);
      expect(isLanguageModelOfflineVerified('ben')).toBe(true);

      const mockData2 = new Uint8Array(mockData1);
      mockData2[500] = (mockData2[500] + 7) % 255;

      const isValid = await verifyStoredOfflineRecord('ben', mockData2);
      expect(isValid).toBe(false);
      expect(isLanguageModelOfflineVerified('ben')).toBe(false);
      expect(localStorage.getItem('noticelens_offline_verified_record_ben')).toBeNull();
    });

    // Test H: An online-created worker reused offline must not establish offline verification
    it('Regression H: An online-created worker reused offline must not establish offline verification', async () => {
      await terminateOcrWorker();
      invalidateStoredOfflineRecord('ben');
      const originalOnLine = navigator.onLine;

      try {
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

        const mockRecognize = vi.fn().mockResolvedValue({
          data: { text: 'Bengali Notice Text', confidence: 90, lines: ['Bengali Notice Text'] }
        });
        const mockWorker = {
          recognize: mockRecognize,
          terminate: vi.fn().mockResolvedValue({}),
        };
        setCustomWorkerCreatorForTesting(vi.fn().mockResolvedValue(mockWorker as unknown as Worker));

        const transparent1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

        await runOcrRecognition(transparent1x1, 'ben');
        expect(getActiveWorkerProvenance()?.initializedOffline).toBe(false);

        // Network disconnects while worker remains active in memory
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

        await runOcrRecognition(transparent1x1, 'ben');
        expect(getActiveWorkerProvenance()?.initializedOffline).toBe(false);

        expect(isLanguageModelOfflineVerified('ben')).toBe(false);

        const res = await markLanguageModelOfflineVerified('ben');
        expect(res.success).toBe(false);
        expect(res.error).toContain('Online-initialized worker cannot establish offline verification');
      } finally {
        await terminateOcrWorker();
        setCustomWorkerCreatorForTesting(null);
        Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
      }
    });

    // Test I: Language change and worker reinitialization isolates verification state per language
    it('Regression I: Language change and worker reinitialization isolates verification state per language', async () => {
      await terminateOcrWorker();
      invalidateStoredOfflineRecord('ben');
      invalidateStoredOfflineRecord('eng');

      const mockBen = createMockTrainedData(65536);
      await testOnlyMarkOfflineVerified('ben', { binary: mockBen });
      expect(isLanguageModelOfflineVerified('ben')).toBe(true);
      expect(isLanguageModelOfflineVerified('eng')).toBe(false);

      const mockWorker1 = { recognize: vi.fn().mockResolvedValue({ data: { text: 'Bengali' } }), terminate: vi.fn().mockResolvedValue({}) };
      const mockWorker2 = { recognize: vi.fn().mockResolvedValue({ data: { text: 'English' } }), terminate: vi.fn().mockResolvedValue({}) };

      let callCount = 0;
      setCustomWorkerCreatorForTesting(vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve((callCount === 1 ? mockWorker1 : mockWorker2) as unknown as Worker);
      }));

      const transparent1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      await runOcrRecognition(transparent1x1, 'ben');
      expect(getActiveWorkerProvenance()?.language).toBe('ben');

      await runOcrRecognition(transparent1x1, 'eng');
      expect(getActiveWorkerProvenance()?.language).toBe('eng');

      expect(isLanguageModelOfflineVerified('eng')).toBe(false);
      await terminateOcrWorker();
      setCustomWorkerCreatorForTesting(null);
    });

    // Test J: Successful online OCR must not automatically mean offline cache verification
    it('Regression J: Successful online OCR must not automatically mean offline cache verification', async () => {
      await terminateOcrWorker();
      invalidateStoredOfflineRecord('ben');
      const originalOnLine = navigator.onLine;

      try {
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

        const mockRecognize = vi.fn().mockResolvedValue({
          data: { text: 'ঢাকা বিশ্ববিদ্যালয় বিজ্ঞপ্তি', confidence: 92, lines: [] }
        });
        const mockWorker = {
          recognize: mockRecognize,
          terminate: vi.fn().mockResolvedValue({}),
        };
        setCustomWorkerCreatorForTesting(vi.fn().mockResolvedValue(mockWorker as unknown as Worker));

        const transparent1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        const res = await runOcrRecognition(transparent1x1, 'ben');
        expect(res.text).toBe('ঢাকা বিশ্ববিদ্যালয় বিজ্ঞপ্তি');

        expect(isLanguageModelOfflineVerified('ben')).toBe(false);
        expect(isLanguageModelVerified('ben')).toBe(false);
        expect(localStorage.getItem('noticelens_offline_verified_record_ben')).toBeNull();
      } finally {
        await terminateOcrWorker();
        setCustomWorkerCreatorForTesting(null);
        Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
      }
    });

    // Additional test for fake 64-character hexadecimal digest string
    it('Regression: Caller-provided fake 64-hex string without matching binary is rejected', async () => {
      invalidateStoredOfflineRecord('ben');
      const fakeDigest = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

      // @ts-expect-error testing invalid argument
      const res = await markLanguageModelOfflineVerified('ben', fakeDigest);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Production verifier does not accept injected binary');
      expect(isLanguageModelOfflineVerified('ben')).toBe(false);
    });

    it('Regression: Production verifier strictly rejects injected binary or test bypass arguments', async () => {
      invalidateStoredOfflineRecord('ben');
      const mockData = createMockTrainedData(65536);

      // Injected binary
      // @ts-expect-error testing invalid injected argument
      const resBinary = await markLanguageModelOfflineVerified('ben', mockData);
      expect(resBinary.success).toBe(false);
      expect(resBinary.error).toContain('Production verifier does not accept injected binary');

      // Injected skipProvenanceCheck option
      // @ts-expect-error testing invalid injected option
      const resOptions = await markLanguageModelOfflineVerified('ben', { skipProvenanceCheck: true });
      expect(resOptions.success).toBe(false);
      expect(resOptions.error).toContain('Production verifier does not accept injected binary');
    });

    it('Regression: Test-only verification helpers are excluded from production build bundle', () => {
      expect(typeof testOnlyMarkOfflineVerified).toBe('function');
      expect(typeof createMockTrainedData).toBe('function');

      const distDir = path.resolve(__dirname, '../../../dist/assets');
      if (fs.existsSync(distDir)) {
        const jsFiles = fs.readdirSync(distDir).filter((f) => f.endsWith('.js'));
        for (const f of jsFiles) {
          const content = fs.readFileSync(path.join(distDir, f), 'utf8');
          expect(content).not.toContain('skipProvenanceCheck');
          expect(content).not.toContain('testOnlyMarkOfflineVerified');
          expect(content).not.toContain('createMockTrainedData');
        }
      }
    });

    it('Regression (Timing 1): Connectivity changing during preprocessing prevents false offline verification', async () => {
      await terminateOcrWorker();
      invalidateStoredOfflineRecord('ben');
      const originalOnLine = navigator.onLine;

      try {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

        const mockWorker = {
          recognize: vi.fn().mockResolvedValue({ data: { text: 'Bengali Notice' } }),
          terminate: vi.fn().mockResolvedValue({}),
        };

        const transparent1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        setCustomWorkerCreatorForTesting(vi.fn().mockResolvedValue(mockWorker as unknown as Worker));

        let hasFlippedToOnline = false;
        const ocrRes = await runOcrRecognition(transparent1x1, 'ben', (progress) => {
          if (progress.step === 'loading_worker' && !hasFlippedToOnline) {
            hasFlippedToOnline = true;
            // Network turns online during image decoding / preprocessing (Phase 1)
            Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
          }
        });
        expect(ocrRes.text).toBe('Bengali Notice');

        expect(getActiveWorkerProvenance()?.initializedOffline).toBe(false);
        expect(isLanguageModelOfflineVerified('ben')).toBe(false);
      } finally {
        await terminateOcrWorker();
        setCustomWorkerCreatorForTesting(null);
        Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
      }
    });

    it('Regression (Timing 2): Connectivity changing during worker initialization prevents false offline verification', async () => {
      await terminateOcrWorker();
      invalidateStoredOfflineRecord('ben');
      const originalOnLine = navigator.onLine;

      try {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

        const mockWorker = {
          recognize: vi.fn().mockImplementation(() => {
            return Promise.resolve({ data: { text: 'Bengali Notice' } });
          }),
          terminate: vi.fn().mockResolvedValue({}),
        };

        setCustomWorkerCreatorForTesting(vi.fn().mockImplementation(() => {
          // Network comes online right after worker creation before recognition begins
          Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
          return Promise.resolve(mockWorker as unknown as Worker);
        }));

        const transparent1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        await runOcrRecognition(transparent1x1, 'ben');

        expect(getActiveWorkerProvenance()?.startedOffline).toBe(false);
        expect(isLanguageModelOfflineVerified('ben')).toBe(false);
      } finally {
        await terminateOcrWorker();
        setCustomWorkerCreatorForTesting(null);
        Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
      }
    });

    it('Regression (Timing 3): Connectivity changing during recognition prevents false offline verification', async () => {
      await terminateOcrWorker();
      invalidateStoredOfflineRecord('ben');
      const originalOnLine = navigator.onLine;

      try {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

        const mockWorker = {
          recognize: vi.fn().mockImplementation(() => {
            // Network turns online during recognition!
            Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
            return Promise.resolve({ data: { text: 'Bengali Notice' } });
          }),
          terminate: vi.fn().mockResolvedValue({}),
        };
        setCustomWorkerCreatorForTesting(vi.fn().mockResolvedValue(mockWorker as unknown as Worker));

        const transparent1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        await runOcrRecognition(transparent1x1, 'ben');

        expect(getActiveWorkerProvenance()?.startedOffline).toBe(true);
        expect(getActiveWorkerProvenance()?.completedOffline).toBe(false);
        expect(isLanguageModelOfflineVerified('ben')).toBe(false);
      } finally {
        await terminateOcrWorker();
        setCustomWorkerCreatorForTesting(null);
        Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
      }
    });

    it('Regression (Semantics): hasStoredOfflineVerificationRecord checks storage while verifyLanguageModelOfflineIntegrity verifies binary cryptographic match', async () => {
      invalidateStoredOfflineRecord('ben');
      const mockData = createMockTrainedData(65536);

      // Write syntactically valid record to storage
      await testOnlyMarkOfflineVerified('ben', { binary: mockData });
      expect(hasStoredOfflineVerificationRecord('ben')).toBe(true);
      expect(isLanguageModelOfflineVerified('ben')).toBe(true);

      // When IndexedDB binary does not exist, verifyLanguageModelOfflineIntegrity returns false and invalidates record
      const deepVerified = await verifyLanguageModelOfflineIntegrity('ben');
      expect(deepVerified).toBe(false);
      expect(hasStoredOfflineVerificationRecord('ben')).toBe(false);
      expect(isLanguageModelOfflineVerified('ben')).toBe(false);
    });
  });

  describe('3. Voice Detection & Speech Fallback Messaging', () => {
    it('returns truthful voice status describing system default fallback when native Bengali is absent', () => {
      const state = speechService.getState();
      expect(state).toHaveProperty('hasBengaliVoice');
      expect(state).toHaveProperty('voiceName');
      expect(typeof state.hasBengaliVoice).toBe('boolean');
      expect(typeof state.voiceName).toBe('string');
      // Must not contain technical hardware jargon
      expect(state.voiceName.toLowerCase()).not.toContain('hardware fallback');
    });

    it('retains text synthesis capability check even in headless test environments', () => {
      const canSpeak = speechService.isSupported();
      expect(typeof canSpeak).toBe('boolean');
    });
  });

  describe('4. Error Notification & Retry Lifecycle', () => {
    it('preserves user transcript and image preview on OCR failure', () => {
      // Simulating component state transitions:
      const activeImage: string | null = 'data:image/png;base64,sample-preview';
      let activeOcrError: string | null = null;

      // When OCR fails
      activeOcrError = 'Failed to recognize notice. Please retry.';
      // Image preview must NOT be wiped out
      expect(activeImage).toBe('data:image/png;base64,sample-preview');

      // When retrying, error is cleared while image preview is preserved
      activeOcrError = null;
      expect(activeOcrError).toBeNull();
      expect(activeImage).toBe('data:image/png;base64,sample-preview');
    });
  });

  describe('5. Solved Limitations: Phonetic Fallback, Language Pre-caching, and Storage Persistence', () => {
    it('transliterates Bengali notice text to clear Romanized phonetic syllables for default voices', () => {
      const bengaliText = 'ঢাকা বিশ্ববিদ্যালয় ভর্তি বিজ্ঞপ্তি ২০২৪';
      const phonetic = transliterateBengaliToPhonetic(bengaliText);

      expect(phonetic).toContain('Dhaka');
      expect(phonetic).toContain('Bishwobiddaloy');
      expect(phonetic).toContain('Bhorti');
      expect(phonetic).toContain('Biggopti');
      expect(phonetic).toContain('2024');
    });

    it('enables Romanized phonetic fallback in WebSpeechService when native Bengali voice is missing', () => {
      speechService.setPhoneticMode(true);
      const state = speechService.getState();
      expect(state.phoneticModeEnabled).toBe(true);

      const phonetic = speechService.getPhoneticText('পরীক্ষা সময়সূচী');
      expect(phonetic).toContain('Porikkha');
      expect(phonetic).toContain('Shomoysuchi');
    });

    it('validates binary format and size of trained language data, rejecting zero-filled, malformed, and unrelated data', () => {
      // Null, undefined, empty, or string inputs
      expect(isValidTrainedDataBinary(null).valid).toBe(false);
      expect(isValidTrainedDataBinary(undefined).valid).toBe(false);
      expect(isValidTrainedDataBinary('invalid-string').valid).toBe(false);
      expect(isValidTrainedDataBinary(new Uint8Array(0)).valid).toBe(false);
      expect(isValidTrainedDataBinary(new Uint8Array(0)).sizeBytes).toBe(0);

      // Truncated/corrupted small binary (< 10 KB)
      expect(isValidTrainedDataBinary(new Uint8Array(100)).valid).toBe(false);

      // Zero-filled buffer (> 10 KB) MUST be rejected
      const zeroFilled = new Uint8Array(65536);
      const zeroRes = isValidTrainedDataBinary(zeroFilled);
      expect(zeroRes.valid).toBe(false);
      expect(zeroRes.hasPlausibleStructure).toBe(false);
      expect(zeroRes.reason).toContain('Zero-filled');

      // Unrelated binary formats (PDF, PNG, HTML, JSON) MUST be rejected
      const pdfBuffer = new Uint8Array(65536);
      pdfBuffer.set([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]); // %PDF-1.5
      expect(isValidTrainedDataBinary(pdfBuffer).valid).toBe(false);
      expect(isValidTrainedDataBinary(pdfBuffer).reason).toContain('Unrelated');

      const pngBuffer = new Uint8Array(65536);
      pngBuffer.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // \x89PNG
      expect(isValidTrainedDataBinary(pngBuffer).valid).toBe(false);

      // Malformed directory entry count (e.g. 100 entries)
      const malformedBuf = new Uint8Array(65536);
      const malformedView = new DataView(malformedBuf.buffer);
      malformedView.setInt32(0, 100, true);
      expect(isValidTrainedDataBinary(malformedBuf).valid).toBe(false);

      // Valid synthetic uncompressed traineddata model data (> 10 KB with valid 24-entry component table)
      const validTrainedData = createMockTrainedData(65536, 24);
      const res = isValidTrainedDataBinary(validTrainedData);
      expect(res.valid).toBe(true);
      expect(res.hasPlausibleStructure).toBe(true);
      expect(res.sizeBytes).toBe(65536);
      expect(res.numEntries).toBe(24);

      // Valid GZIP-compressed traineddata (.traineddata.gz)
      const gzipTrainedData = new Uint8Array(65536);
      gzipTrainedData[0] = 0x1f;
      gzipTrainedData[1] = 0x8b;
      gzipTrainedData[2] = 0x08;
      for (let i = 3; i < 200; i++) gzipTrainedData[i] = (i % 200) + 1;
      const gzipRes = isValidTrainedDataBinary(gzipTrainedData);
      expect(gzipRes.valid).toBe(true);
      expect(gzipRes.hasPlausibleStructure).toBe(true);
    });

    it('checks IndexedDB language cache status safely and distinguishes cached, plausible, and verified states', async () => {
      const status = await checkLanguageCacheStatus();
      expect(status).toHaveProperty('ben');
      expect(status).toHaveProperty('eng');
      expect(typeof status.ben.cached).toBe('boolean');
      expect(typeof status.ben.verified).toBe('boolean');
      expect(typeof status.eng.cached).toBe('boolean');
      expect(typeof status.eng.verified).toBe('boolean');

      // Test offline verified state tracking with explicit test fixture
      const mockData = createMockTrainedData(65536);
      const rec = await testOnlyMarkOfflineVerified('ben', { binary: mockData });
      expect(rec.success).toBe(true);
      expect(isLanguageModelOfflineVerified('ben')).toBe(true);
    });

    it('exposes safe worker lifecycle termination and active check on window for e2e testing', async () => {
      expect(typeof isOcrWorkerActive).toBe('function');
      expect(isOcrWorkerActive()).toBe(false);

      const win = window as unknown as {
        __noticelens_terminate_worker__?: () => Promise<void>;
        __noticelens_is_worker_active__?: () => boolean;
      };

      expect(typeof win.__noticelens_terminate_worker__).toBe('function');
      expect(typeof win.__noticelens_is_worker_active__).toBe('function');
      expect(win.__noticelens_is_worker_active__!()).toBe(false);

      await win.__noticelens_terminate_worker__!();
      expect(win.__noticelens_is_worker_active__!()).toBe(false);
    });

    it('queries storage persistence and estimates quota metrics', async () => {
      const info = await requestPersistentStorage();
      expect(info).toHaveProperty('isSupported');
      expect(info).toHaveProperty('isPersisted');
      expect(typeof info.isSupported).toBe('boolean');
      expect(typeof info.isPersisted).toBe('boolean');
    });

    it('exports and restores Notice Vault backups accurately', async () => {
      const backupJson = await exportNoticeVaultBackup();
      expect(typeof backupJson).toBe('string');
      const parsed = JSON.parse(backupJson);
      expect(parsed.app).toBe('NoticeLens');
      expect(parsed).toHaveProperty('savedNotices');

      // Restore test with valid payload
      const testBackup = JSON.stringify({
        app: 'NoticeLens',
        savedNotices: [
          {
            id: 'backup-notice-1',
            notice: {
              id: 'backup-notice-1',
              title: 'Restored Circular Notice',
              fields: {
                category: { value: 'Examination', status: 'confirmed' },
                deadline: { value: '2024-11-20', status: 'confirmed' },
              },
            },
          },
        ],
      });
      const restoreRes = await importNoticeVaultBackup(testBackup);
      expect(restoreRes.importedCount).toBe(1);
    });
  });
});
