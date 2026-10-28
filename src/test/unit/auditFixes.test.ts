// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import {
  sanitizeRecordForLocalStorage,
  clearAllSavedNotices,
  getAllSavedNotices,
} from '../../services/storage/indexedDBService';
import {
  generateSafeCalendarFilename,
  parseDateTimeToDate,
} from '../../services/export/icsExporter';
import { extractAllDates } from '../../services/extraction/dateParser';
import { matchEvidence } from '../../services/extraction/evidenceMatcher';
import { preprocessNoticeImage } from '../../services/ocr/imagePreprocess';
import { runOcrRecognition } from '../../services/ocr/tesseractWorker';
import { SavedNotice, ProcessedNotice } from '../../types/notice';

describe('Production Audit Remediations', () => {
  describe('Finding 2: LocalStorage Quota Defense', () => {
    it('strips heavy base64 imageDataUrl while preserving all metadata and extracted fields', () => {
      const mockRecord: SavedNotice = {
        id: 'notice-test-123',
        title: 'Dhaka University Admission Circular',
        category: 'Admission',
        hasDeadline: true,
        deadlineDate: '2024-11-25',
        createdAt: '2024-11-01T10:00:00.000Z',
        notice: {
          id: 'notice-test-123',
          title: 'Dhaka University Admission Circular',
          ocrText: 'Sample text...',
          ocrLanguage: 'ben+eng',
          sourceType: 'upload',
          createdAt: '2024-11-01T10:00:00.000Z',
          updatedAt: '2024-11-01T10:00:00.000Z',
          imageDataUrl: 'data:image/jpeg;base64,' + 'A'.repeat(50000), // Heavy base64 string
          fields: {} as unknown as ProcessedNotice['fields'],
          summary: {
            overview: 'Circular overview',
            criticalDeadline: '2024-11-25',
            actionItems: ['Item 1'],
            venueAndTime: null,
            requiredDocs: [],
            unverifiedOrMissing: [],
            language: 'en',
          },
        },
      };

      const sanitized = sanitizeRecordForLocalStorage(mockRecord);

      expect(sanitized.id).toBe('notice-test-123');
      expect(sanitized.title).toBe('Dhaka University Admission Circular');
      expect(sanitized.notice.imageDataUrl).toBeUndefined();
      expect(sanitized.notice.summary.criticalDeadline).toBe('2024-11-25');
    });
  });

  describe('Findings 5 & 8: Safe Unicode Calendar Filename & Bengali Time Parsing', () => {
    it('preserves Bengali characters in calendar filenames without destroying into underscores', () => {
      const bengaliTitle = 'ঢাকা বিশ্ববিদ্যালয়ের ভর্তি পরীক্ষা ২০২৪';
      const filename = generateSafeCalendarFilename(bengaliTitle, 'deadline');

      expect(filename).toContain('ঢাকা_বিশ্ববিদ্যালয়ের');
      expect(filename).toMatch(/_deadline\.ics$/);
      // Ensure it does not become a row of blank underscores
      expect(filename).not.toMatch(/^_{4,}/);
    });

    it('sanitizes filesystem forbidden characters and excessive whitespace in filenames', () => {
      const dirtyTitle = 'Notice / Exam: 2024 *final* <CSE> | Test?';
      const filename = generateSafeCalendarFilename(dirtyTitle, 'event');

      expect(filename).not.toMatch(/[\\/:*?"<>|]/);
      expect(filename).toBe('Notice_Exam_2024_final_CSE_Test_event.ics');
    });

    it('falls back to safe default name when title is empty or whitespace', () => {
      expect(generateSafeCalendarFilename('', 'deadline')).toBe('notice_deadline.ics');
      expect(generateSafeCalendarFilename('   ', 'alert')).toBe('notice_alert.ics');
    });

    it('correctly parses time strings containing Bengali numerals into UTC Dates', () => {
      const dateStr = '2024-11-15';
      // "১০:৩০ AM" in Bengali digits
      const parsedBengaliTime = parseDateTimeToDate(dateStr, '১০:৩০ AM');
      expect(parsedBengaliTime.getUTCHours()).toBe(10);
      expect(parsedBengaliTime.getUTCMinutes()).toBe(30);

      // "০২:৪৫ PM" in Bengali digits (14:45 UTC)
      const parsedBengaliPm = parseDateTimeToDate(dateStr, '০২:৪৫ PM');
      expect(parsedBengaliPm.getUTCHours()).toBe(14);
      expect(parsedBengaliPm.getUTCMinutes()).toBe(45);
    });

    it('correctly parses standard English 12-hour time strings', () => {
      const dateStr = '2024-11-15';
      const parsedAm = parseDateTimeToDate(dateStr, '09:15 AM');
      expect(parsedAm.getUTCHours()).toBe(9);
      expect(parsedAm.getUTCMinutes()).toBe(15);

      const parsedPm = parseDateTimeToDate(dateStr, '03:45 PM');
      expect(parsedPm.getUTCHours()).toBe(15);
      expect(parsedPm.getUTCMinutes()).toBe(45);
    });
  });

  describe('Finding 7: Date Range Bounds Validation', () => {
    it('rejects impossible days > 31 in word-based dates in English and Bengali', () => {
      const invalidEnglishNotice = 'The last date of submission is 99 January 2025 at 5 PM.';
      const invalidBengaliNotice = 'আবেদনের শেষ সময় ৯৯ জানুয়ারি ২০২৫ পর্যন্ত।';

      const resultsEnglish = extractAllDates(invalidEnglishNotice);
      expect(resultsEnglish.filter((d) => d.day === 99)).toHaveLength(0);

      const resultsBengali = extractAllDates(invalidBengaliNotice);
      expect(resultsBengali.filter((d) => d.day === 99)).toHaveLength(0);
    });

    it('correctly extracts valid dates within 1..31 day range', () => {
      const validText = 'আবেদনের শেষ তারিখ ১৫ নভেম্বর ২০২৪ এবং পরীক্ষা ২০ ডিসেম্বর ২০২৪।';
      const dates = extractAllDates(validText);

      expect(dates.length).toBeGreaterThanOrEqual(2);
      expect(dates.some((d) => d.day === 15 && d.month === 11)).toBe(true);
      expect(dates.some((d) => d.day === 20 && d.month === 12)).toBe(true);
    });
  });

  describe('Finding 9: Evidence Matcher Zero-Index Fallback', () => {
    it('returns null when target snippet does not exist in the source text', () => {
      const fullText = 'ঢাকা বিশ্ববিদ্যালয় ভর্তি কার্যক্রম শুরু হয়েছে।';
      const nonExistentSnippet = 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় কনভোকেশন';

      const result = matchEvidence(fullText, nonExistentSnippet);
      expect(result).toBeNull();
    });

    it('returns exact character range when target snippet is present', () => {
      const fullText = 'বিজ্ঞপ্তি নং: ১২৩৪\nপরীক্ষা অনুষ্ঠিত হবে ২০ ডিসেম্বর ২০২৪ তারিখে।';
      const snippet = '২০ ডিসেম্বর ২০২৪';

      const result = matchEvidence(fullText, snippet);
      expect(result).not.toBeNull();
      expect(result?.startIndex).toBe(fullText.indexOf(snippet));
      expect(result?.endIndex).toBe(fullText.indexOf(snippet) + snippet.length);
    });
  });

  describe('Finding 6: Image Preprocessing Robustness', () => {
    it('gracefully rejects when given an invalid image source without hanging', async () => {
      await expect(preprocessNoticeImage('data:image/jpeg;base64,invalid-corrupted-data')).rejects.toThrow();
    });
  });

  describe('Finding 1 & Enterprise Security: Shared Lab Machine Data Purge', () => {
    it('successfully clears all saved records on terminal purge', async () => {
      // Clear all notices
      await clearAllSavedNotices();
      const recordsAfterPurge = await getAllSavedNotices();
      expect(recordsAfterPurge).toHaveLength(0);
    });
  });

  describe('Finding 2: Offline Environment Detection', () => {
    it('provides clear actionable guidance when device is offline instead of unhandled failure', async () => {
      const originalOnLine = navigator.onLine;
      try {
        Object.defineProperty(navigator, 'onLine', {
          value: false,
          configurable: true,
        });

        await expect(runOcrRecognition('sample-data', 'ben')).rejects.toThrowError(
          /Offline Mode Detected/
        );
      } finally {
        Object.defineProperty(navigator, 'onLine', {
          value: originalOnLine,
          configurable: true,
        });
      }
    });
  });
});
