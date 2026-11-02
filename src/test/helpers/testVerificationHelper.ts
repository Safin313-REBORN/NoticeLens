import {
  computeSha256,
  isValidTrainedDataBinary,
  TESSERACT_ENGINE_VERSION,
  TESSERACT_CORE_ASSET_VERSION,
  OFFLINE_VERIFICATION_METHOD,
  OfflineVerificationRecord,
  invalidateStoredOfflineRecord,
} from '../../services/ocr/tesseractWorker';

export interface TestVerificationOptions {
  binary?: unknown;
  workerCreatedAt?: number;
  skipProvenanceCheck?: boolean;
  expectedDigest?: string;
}

const OFFLINE_VERIFIED_STORAGE_KEY_PREFIX = 'noticelens_offline_verified_record_';

/**
 * Test-only verification helper for Vitest unit and integration test fixtures.
 * This file is strictly located in src/test/helpers/ and is excluded from the production build.
 * It allows unit tests to test storage quota failures, invalid binary responses, and crypto failures
 * without compromising the production verification path in tesseractWorker.ts.
 */
export async function testOnlyMarkOfflineVerified(
  lang: string,
  options: TestVerificationOptions = {}
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

  const rawBinary = options.binary;
  if (!rawBinary) {
    return failureRecord(`Actual trained language data for ${lang} is missing or unreadable in test fixture.`);
  }

  const validation = isValidTrainedDataBinary(rawBinary);
  if (!validation.valid) {
    return failureRecord(`Cached traineddata binary validation failed: ${validation.reason || 'invalid binary structure'}`);
  }

  let digest: string;
  try {
    digest = await computeSha256(rawBinary as Uint8Array);
  } catch (shaErr: unknown) {
    return failureRecord(`Failed to compute genuine SHA-256 digest: ${shaErr instanceof Error ? shaErr.message : String(shaErr)}`);
  }

  if (options.expectedDigest && options.expectedDigest !== digest) {
    return failureRecord('Caller-provided digest does not match genuine computed SHA-256 of actual traineddata.');
  }

  const record: OfflineVerificationRecord = {
    success: true,
    language: lang,
    trainedDataSha256: digest,
    engineVersion: TESSERACT_ENGINE_VERSION,
    coreAssetVersion: TESSERACT_CORE_ASSET_VERSION,
    verifiedAt: Date.now(),
    verificationMethod: OFFLINE_VERIFICATION_METHOD,
    workerCreatedAt: options.workerCreatedAt || Date.now(),
  };

  try {
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage is unavailable');
    }
    localStorage.setItem(`${OFFLINE_VERIFIED_STORAGE_KEY_PREFIX}${lang}`, JSON.stringify(record));
    const confirmed = localStorage.getItem(`${OFFLINE_VERIFIED_STORAGE_KEY_PREFIX}${lang}`);
    if (!confirmed) {
      throw new Error('Failed to confirm write to localStorage');
    }
  } catch (storageErr: unknown) {
    return failureRecord(`localStorage persistence failed: ${storageErr instanceof Error ? storageErr.message : String(storageErr)}`);
  }

  return record;
}

/**
 * Creates a valid synthetic Tesseract traineddata buffer strictly for automated unit tests
 */
export function createMockTrainedData(size = 65536, numEntries = 24): Uint8Array {
  const buf = new Uint8Array(Math.max(size, 4 + numEntries * 8 + 64));
  const view = new DataView(buf.buffer);
  view.setInt32(0, numEntries, true);
  const tableSize = 4 + numEntries * 8;

  // First component present with valid offset
  view.setUint32(4, tableSize, true);
  view.setInt32(8, 0, true);

  // Subsequent components absent (-1)
  for (let i = 1; i < numEntries; i++) {
    view.setUint32(4 + i * 8, 0xffffffff, true);
    view.setInt32(4 + i * 8 + 4, -1, true);
  }

  // Non-zero payload so it is not a zero-filled buffer
  for (let i = tableSize; i < Math.min(tableSize + 128, buf.length); i++) {
    buf[i] = (i % 250) + 1;
  }
  return buf;
}
