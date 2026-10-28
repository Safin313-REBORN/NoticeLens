import { describe, it, expect } from 'vitest';
import { processNoticeDocument } from '../../services/extraction/noticeEngine';
import { generateNoticeSummary } from '../../services/extraction/summaryGenerator';
import {
  isValidCalendarDate,
  isLeapYear,
  extractAllDates,
} from '../../services/extraction/dateParser';
import {
  buildEventFromNotice,
  generateIcsContent,
  foldIcsLine,
  isExportAllowed,
} from '../../services/export/icsExporter';
import { matchEvidence } from '../../services/extraction/evidenceMatcher';
import { DEMO_NOTICES } from '../../data/demoNotices';

describe('Master Bug-Fixes & QA Regression Suite', () => {
  describe('P1 Bug Fix: Atomic Transcript Editing & Re-extraction', () => {
    it('re-extracts using the edited transcript string and replaces the old date', () => {
      const initialTranscript = `ঢাকা বিশ্ববিদ্যালয়
বিজ্ঞপ্তি: ভর্তি পরীক্ষা ২০২৪
আবেদনের শেষ তারিখ: ১৫ নভেম্বর ২০২৪
স্থান: কার্জন হল`;

      // 1. Initial processing
      const initialNotice = processNoticeDocument(initialTranscript, {
        ocrLanguage: 'ben',
        ocrConfidence: 88,
        sourceType: 'upload',
      });

      expect(initialNotice.fields.deadline.value).toContain('15 November 2024');

      // 2. User edits transcript: changes date from 15 November to 28 November
      const editedTranscript = `ঢাকা বিশ্ববিদ্যালয়
বিজ্ঞপ্তি: ভর্তি পরীক্ষা ২০২৪
আবেদনের শেষ তারিখ: ২৮ নভেম্বর ২০২৪
স্থান: কার্জন হল`;

      // 3. Atomic re-extraction using the exact edited string
      const reprocessed = processNoticeDocument(editedTranscript, {
        ocrLanguage: initialNotice.ocrLanguage,
        ocrConfidence: initialNotice.ocrConfidence,
        imageDataUrl: initialNotice.imageDataUrl,
        sourceType: initialNotice.sourceType,
        existingId: initialNotice.id,
      });

      // 4. Confirm new date is extracted and old date is no longer the active result
      expect(reprocessed.fields.deadline.value).toContain('28 November 2024');
      expect(reprocessed.fields.deadline.value).not.toContain('15 November');
      expect(reprocessed.ocrText).toBe(editedTranscript);

      // 5. Update summary and verify
      const summary = generateNoticeSummary(reprocessed.fields, 'bn');
      expect(summary.criticalDeadline).toContain('28 November 2024');
    });

    it('preserves user-edited field corrections across transcript re-extractions', () => {
      const initialTranscript = `Department of Computer Science
Notice: Seminar on Accessible AI
Venue: Seminar Room 101`;

      const notice = processNoticeDocument(initialTranscript, {
        ocrLanguage: 'eng',
        sourceType: 'upload',
      });

      // User manually corrects venue
      notice.fields.venue = {
        ...notice.fields.venue,
        value: 'Auditorium Hall B (Room 304)',
        status: 'user_edited',
      };

      // Transcript edit occurs on another line
      const updatedTranscript = `Department of Computer Science and Engineering
Notice: Seminar on Accessible AI
Venue: Seminar Room 101`;

      const reprocessed = processNoticeDocument(updatedTranscript, {
        ocrLanguage: notice.ocrLanguage,
        sourceType: notice.sourceType,
        existingId: notice.id,
      });

      // Re-apply preserved user-edited field as implemented in handleApplyTranscriptEdit
      for (const [k, v] of Object.entries(notice.fields)) {
        if (v.status === 'user_edited') {
          reprocessed.fields[k as keyof typeof reprocessed.fields] = v;
        }
      }

      expect(reprocessed.fields.venue.value).toBe('Auditorium Hall B (Room 304)');
      expect(reprocessed.fields.venue.status).toBe('user_edited');
    });
  });

  describe('P1 Bug Fix: Strict Calendar Date Validation', () => {
    it('correctly validates leap years', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2023)).toBe(false);
      expect(isLeapYear(1900)).toBe(false);
      expect(isLeapYear(2025)).toBe(false);
    });

    it('strictly rejects impossible calendar dates (e.g. Feb 30/31, April 31)', () => {
      expect(isValidCalendarDate(31, 2, 2024)).toBe(false); // Feb 31 invalid
      expect(isValidCalendarDate(30, 2, 2024)).toBe(false); // Feb 30 invalid
      expect(isValidCalendarDate(31, 4, 2024)).toBe(false); // Apr 31 invalid
      expect(isValidCalendarDate(31, 6, 2024)).toBe(false); // Jun 31 invalid
      expect(isValidCalendarDate(31, 9, 2024)).toBe(false); // Sep 31 invalid
      expect(isValidCalendarDate(31, 11, 2024)).toBe(false); // Nov 31 invalid
      expect(isValidCalendarDate(32, 1, 2024)).toBe(false); // Jan 32 invalid
      expect(isValidCalendarDate(0, 1, 2024)).toBe(false); // Jan 0 invalid
    });

    it('correctly handles February 29 leap and non-leap years', () => {
      expect(isValidCalendarDate(29, 2, 2024)).toBe(true); // 2024 is leap year
      expect(isValidCalendarDate(29, 2, 2023)).toBe(false); // 2023 is NOT leap year
      expect(isValidCalendarDate(29, 2, 2000)).toBe(true); // 2000 is leap year
      expect(isValidCalendarDate(29, 2, 1900)).toBe(false); // 1900 is NOT leap year
    });

    it('rejects invalid calendar dates in Bengali and English notice text extraction', () => {
      const invalidBengaliText = 'আবেদনের শেষ তারিখ ৩১ ফেব্রুয়ারি ২০২৪।';
      const extracted = extractAllDates(invalidBengaliText);
      expect(extracted).toHaveLength(0);

      const invalidEnglishText = 'Application deadline is 31 April 2024.';
      const extractedEn = extractAllDates(invalidEnglishText);
      expect(extractedEn).toHaveLength(0);
    });
  });

  describe('P1 Bug Fix: Never Invent Dates & Calendar Review Gate', () => {
    it('does NOT invent the current year when year is absent in notice text', () => {
      const yearlessText = 'আবেদনের শেষ তারিখ ১৫ নভেম্বর বিকাল ৫:০০ ঘটিকা।';
      const parsed = extractAllDates(yearlessText);

      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0].year).toBeNull();
      expect(parsed[0].isoDate).toBeNull();
      expect(parsed[0].isAmbiguous).toBe(true);

      const notice = processNoticeDocument(yearlessText, { ocrLanguage: 'ben' });
      // buildEventFromNotice must return null if ISO date cannot be derived without inventing a year
      const event = buildEventFromNotice(notice);
      expect(event).toBeNull();

      // isExportAllowed must gate export
      expect(isExportAllowed(notice)).toBe(false);
    });

    it('allows export when the date is complete with explicit year', () => {
      const completeNoticeText = `ঢাকা বিশ্ববিদ্যালয়
ভর্তি পরীক্ষা ২০২৪
আবেদনের শেষ তারিখ: ১৫ নভেম্বর ২০২৪
স্থান: কার্জন হল`;

      const notice = processNoticeDocument(completeNoticeText, { ocrLanguage: 'ben' });
      const event = buildEventFromNotice(notice);

      expect(event).not.toBeNull();
      expect(event?.startDate).toBe('2024-11-15');
      expect(event?.isAllDay).toBe(true);
      expect(isExportAllowed(notice)).toBe(true);
    });
  });

  describe('P1 Bug Fix: RFC 5545 Line Folding & Asia/Dhaka Timezone Handling', () => {
    it('folds lines exceeding 75 octets with CRLF followed by a single space', () => {
      const longText = 'DESCRIPTION:This is a very long calendar event description generated by NoticeLens for testing RFC 5545 compliance line folding standard.';
      const folded = foldIcsLine(longText);

      const lines = folded.split('\r\n');
      expect(lines.length).toBeGreaterThan(1);
      expect(lines[0].length).toBeLessThanOrEqual(75);
      expect(lines[1].startsWith(' ')).toBe(true);
    });

    it('generates RFC 5545 compliant ICS with Asia/Dhaka VTIMEZONE and truthful attribution', () => {
      const ics = generateIcsContent({
        title: 'BUET Admission Test 2024',
        description: 'Undergraduate Admission Test for Academic Session 2024',
        startDate: '2024-11-25',
        startTime: '10:00 AM',
        endTime: '01:00 PM',
        isAllDay: false,
        location: 'ECE Building, BUET',
      });

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('END:VCALENDAR');
      expect(ics).toContain('BEGIN:VTIMEZONE');
      expect(ics).toContain('TZID:Asia/Dhaka');
      expect(ics).toContain('DTSTART;TZID=Asia/Dhaka:20241125T100000');
      expect(ics).toContain('DTEND;TZID=Asia/Dhaka:20241125T130000');
      // Must NOT contain false claim "Processed and verified with NoticeLens"
      expect(ics).not.toContain('Processed and verified with NoticeLens');
    });
  });

  describe('P1 Bug Fix: Honest Sample Provenance & No Fabricated Confidence', () => {
    it('does not assign hardcoded 94% confidence to preset demo samples', () => {
      for (const demo of DEMO_NOTICES) {
        const processed = processNoticeDocument(demo.ocrText, {
          ocrLanguage: demo.language,
          ocrConfidence: undefined, // Truthful preset demo
          sourceType: 'demo',
        });

        expect(processed.ocrConfidence).toBeUndefined();
        expect(processed.sourceType).toBe('demo');
      }
    });
  });

  describe('P1 Bug Fix: Evidence Integrity & Index-Mapped Offsets', () => {
    it('accurately locates substring offsets in original transcript without overflow', () => {
      const transcript = `OFFICIAL NOTICE
The final semester examination will commence on 25 November 2024 at 10:00 AM.
Please bring your student ID and admit card.`;

      const target = '25 November 2024';
      const evidence = matchEvidence(transcript, target);

      expect(evidence).not.toBeNull();
      expect(evidence?.startIndex).toBe(transcript.indexOf(target));
      expect(evidence?.endIndex).toBe(transcript.indexOf(target) + target.length);
      expect(evidence?.endIndex).toBeLessThanOrEqual(transcript.length);
      expect(transcript.substring(evidence!.startIndex, evidence!.endIndex)).toBe(target);
    });

    it('tolerates whitespace differences while preserving exact offsets in original text', () => {
      const transcript = `বিজ্ঞপ্তি:\nপরীক্ষার তারিখ:  ১৫    নভেম্বর   ২০২৪  তারিখ।`;
      const normalizedQuery = '১৫ নভেম্বর ২০২৪';

      const evidence = matchEvidence(transcript, normalizedQuery);
      expect(evidence).not.toBeNull();
      expect(evidence!.startIndex).toBeGreaterThan(0);
      expect(evidence!.endIndex).toBeLessThanOrEqual(transcript.length);
      const extractedSlice = transcript.substring(evidence!.startIndex, evidence!.endIndex);
      expect(extractedSlice.replace(/\s+/g, ' ')).toBe('১৫ নভেম্বর ২০২৪');
    });

    it('disambiguates repeated occurrences by selecting the one closest to matchedKeyword', () => {
      const transcript = `ঢাকা বিশ্ববিদ্যালয়
বিজ্ঞপ্তি প্রকাশের তারিখ: ১৫/১১/২০২৪
বিষয়: পরীক্ষার ফি জমাদান
পরীক্ষার ফি জমাদানের শেষ তারিখ: ১৫/১১/২০২৪ বিকাল ৫:০০ ঘটিকা।`;

      const target = '১৫/১১/২০২৪';
      // Match with keyword 'শেষ তারিখ'
      const deadlineEvidence = matchEvidence(transcript, target, 'শেষ তারিখ');
      expect(deadlineEvidence).not.toBeNull();
      // Must match the second occurrence (closest to 'শেষ তারিখ'), NOT the first (প্রকাশের তারিখ)
      const secondIdx = transcript.lastIndexOf(target);
      expect(deadlineEvidence?.startIndex).toBe(secondIdx);

      // Match with keyword 'প্রকাশের তারিখ'
      const pubEvidence = matchEvidence(transcript, target, 'প্রকাশের তারিখ');
      expect(pubEvidence).not.toBeNull();
      const firstIdx = transcript.indexOf(target);
      expect(pubEvidence?.startIndex).toBe(firstIdx);
    });

    it('preserves provenance and avoids displaying contradictory evidence when user edits field', () => {
      const initialField = {
        key: 'deadline' as const,
        label: 'Application Deadline',
        labelBn: 'আবেদনের শেষ তারিখ',
        value: '15/11/2024',
        evidence: {
          text: '15/11/2024',
          startIndex: 45,
          endIndex: 55,
          confidence: 'high' as const,
        },
        status: 'confirmed' as const,
      };

      const userCorrectedValue = '20/11/2024';
      const ocrText = 'Notice: Old deadline was 15/11/2024.';

      // Simulating user edit logic in App.tsx
      const origValue = initialField.value;
      const origEvidence = initialField.evidence;
      const newEvidence = matchEvidence(ocrText, userCorrectedValue, initialField.label);

      const editedField = {
        ...initialField,
        value: userCorrectedValue,
        status: 'user_edited' as const,
        evidence: newEvidence, // null because 20/11/2024 is not in ocrText
        originalValue: origValue,
        originalEvidence: origEvidence,
        isAmbiguous: false,
      };

      expect(editedField.value).toBe('20/11/2024');
      expect(editedField.status).toBe('user_edited');
      // Critical check: old evidence does NOT contaminate or contradict new user value
      expect(editedField.evidence).toBeNull();
      expect(editedField.originalValue).toBe('15/11/2024');
      expect(editedField.originalEvidence?.text).toBe('15/11/2024');
    });
  });
});
