import { createWorker, Worker } from 'tesseract.js';
import { OCRProgress } from '../../types/notice';

export interface OCRResult {
  text: string;
  confidence: number;
  lines: string[];
  languageUsed: 'ben' | 'eng' | 'ben+eng';
}

let activeWorker: Worker | null = null;
let currentLanguage: string | null = null;

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

  try {
    report('loading_worker', 0.1, `Initializing OCR engine for ${getLanguageLabel(language)}...`);

    // If worker exists but for a different language, terminate and recreate
    if (activeWorker && currentLanguage !== language) {
      report('loading_worker', 0.2, 'Switching OCR language worker...');
      await activeWorker.terminate();
      activeWorker = null;
      currentLanguage = null;
    }

    if (!activeWorker) {
      report('loading_worker', 0.3, `Downloading and loading trained language models (${language})...`);

      activeWorker = await createWorker(language, 1, {
        logger: (m) => {
          if (m.status === 'loading tesseract core') {
            report('loading_worker', 0.2 + (m.progress || 0) * 0.2, 'Loading OCR core engine...');
          } else if (m.status.includes('traineddata')) {
            report('loading_worker', 0.4 + (m.progress || 0) * 0.2, `Loading trained language data (${language})...`);
          } else if (m.status === 'initializing api') {
            report('loading_worker', 0.6, 'Configuring OCR parameters...');
          } else if (m.status === 'recognizing text') {
            report('recognizing', 0.6 + (m.progress || 0) * 0.35, `Recognizing text (${Math.round((m.progress || 0) * 100)}%)...`);
          }
        },
      });

      currentLanguage = language;
    }

    report('recognizing', 0.65, 'Analyzing image layout and reading printed characters...');

    const ret = await activeWorker.recognize(imageSource);

    report('extracting', 0.95, 'Organizing recognized text...');

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
  } catch (error: any) {
    console.error('Tesseract OCR Error:', error);
    const errMessage =
      error?.message ||
      'Failed to load OCR language worker. Please check your internet connection for language data download or retry with English mode.';

    if (onProgress) {
      onProgress({
        step: 'error',
        progress: 0,
        status: 'OCR Error',
        errorMessage: errMessage,
      });
    }

    // Reset worker state so next run starts clean
    if (activeWorker) {
      try {
        await activeWorker.terminate();
      } catch {
        // ignore cleanup error
      }
      activeWorker = null;
      currentLanguage = null;
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
  }
}

function getLanguageLabel(lang: 'ben' | 'eng' | 'ben+eng'): string {
  if (lang === 'ben') return 'Bengali';
  if (lang === 'eng') return 'English';
  return 'Bengali + English (Mixed)';
}
