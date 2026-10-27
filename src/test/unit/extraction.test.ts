import { describe, it, expect } from 'vitest';
import {
  bengaliToEnglishNumerals,
  englishToBengaliNumerals,
  containsBengaliNumerals,
  extractNumbers,
} from '../../services/extraction/numerals';
import { extractAllDates } from '../../services/extraction/dateParser';
import { extractTime } from '../../services/extraction/timeParser';
import { matchEvidence } from '../../services/extraction/evidenceMatcher';
import { extractNoticeFields } from '../../services/extraction/fieldExtractor';
import { processNoticeDocument } from '../../services/extraction/noticeEngine';

describe('Bengali & English Numeral Normalization', () => {
  it('converts Bengali digits to English digits accurately', () => {
    expect(bengaliToEnglishNumerals('০১২৩৪৫৬৭৮৯')).toBe('0123456789');
    expect(bengaliToEnglishNumerals('তারিখ: ১৫/১১/২০২৪')).toBe('তারিখ: 15/11/2024');
    expect(bengaliToEnglishNumerals('কক্ষ নং ৪০২')).toBe('কক্ষ নং 402');
  });

  it('converts English digits to Bengali digits accurately', () => {
    expect(englishToBengaliNumerals('0123456789')).toBe('০১২৩৪৫৬৭৮৯');
    expect(englishToBengaliNumerals('Room 101')).toBe('Room ১০১');
  });

  it('detects Bengali digits presence correctly', () => {
    expect(containsBengaliNumerals('আজকে ১২ তারিখ')).toBe(true);
    expect(containsBengaliNumerals('Today is 12th')).toBe(false);
  });

  it('extracts numbers from mixed strings', () => {
    expect(extractNumbers('ফি ৫০০ টাকা এবং বিলম্ব ফি ১০০ টাকা')).toEqual([500, 100]);
  });
});

describe('Bilingual Date Parsing', () => {
  it('extracts numeric dates with Bengali digits (DD/MM/YYYY)', () => {
    const text = 'আবেদনের শেষ তারিখ: ১৫/১১/২০২৪ খ্রিষ্টাব্দ।';
    const dates = extractAllDates(text);
    expect(dates.length).toBeGreaterThan(0);
    expect(dates[0].isoDate).toBe('2024-11-15');
    expect(dates[0].day).toBe(15);
    expect(dates[0].month).toBe(11);
    expect(dates[0].year).toBe(2024);
    expect(dates[0].dateType).toBe('deadline');
  });

  it('extracts word dates in Bengali (e.g. ১২ অক্টোবর ২০২৪)', () => {
    const text = 'সেমিস্টার ফাইনাল পরীক্ষা আগামী ১২ অক্টোবর ২০২৪ তারিখ থেকে শুরু হবে।';
    const dates = extractAllDates(text);
    expect(dates.length).toBeGreaterThan(0);
    expect(dates[0].isoDate).toBe('2024-10-12');
    expect(dates[0].day).toBe(12);
    expect(dates[0].month).toBe(10);
    expect(dates[0].year).toBe(2024);
    expect(dates[0].dateType).toBe('event');
  });

  it('extracts English dates with ordinal suffixes (e.g. 25th November 2024)', () => {
    const text = 'All students must submit the project report by 25th November 2024.';
    const dates = extractAllDates(text);
    expect(dates.length).toBeGreaterThan(0);
    expect(dates[0].isoDate).toBe('2024-11-25');
    expect(dates[0].day).toBe(25);
    expect(dates[0].month).toBe(11);
    expect(dates[0].year).toBe(2024);
  });

  it('flags dates without a year as ambiguous and explains why', () => {
    const text = 'আবেদনের শেষ সময়: ১০ নভেম্বর পর্যন্ত।';
    const dates = extractAllDates(text);
    expect(dates.length).toBeGreaterThan(0);
    expect(dates[0].year).toBeNull();
    expect(dates[0].isAmbiguous).toBe(true);
    expect(dates[0].ambiguityReason).toContain('Year');
  });
});

describe('Time Parsing', () => {
  it('parses Bengali time ranges (e.g. সকাল ১০:০০ হতে দুপুর ১:০০ পর্যন্ত)', () => {
    const text = 'পরীক্ষা প্রতিদিন সকাল ১০:০০ হতে দুপুর ১:০০ পর্যন্ত অনুষ্ঠিত হবে।';
    const time = extractTime(text);
    expect(time).not.toBeNull();
    expect(time?.startTime).toBe('10:00 AM');
    expect(time?.endTime).toBe('1:00 PM');
  });

  it('parses English 12-hour format (e.g. 02:30 PM)', () => {
    const text = 'Seminar starts at 02:30 PM in the auditorium.';
    const time = extractTime(text);
    expect(time).not.toBeNull();
    expect(time?.startTime).toBe('02:30 PM');
  });
});

describe('Evidence Matching', () => {
  it('calculates exact start and end indexes for verified evidence snippets', () => {
    const notice = `ঢাকা বিশ্ববিদ্যালয়
বিজ্ঞপ্তি
সেমিস্টার ফাইনাল পরীক্ষা আগামী ১৫ নভেম্বর ২০২৪ তারিখে অনুষ্ঠিত হবে।
কক্ষ নং ৪০২।`;

    const evidence = matchEvidence(notice, 'কক্ষ নং ৪০২');
    expect(evidence).not.toBeNull();
    expect(evidence?.startIndex).toBe(notice.indexOf('কক্ষ নং ৪০২'));
    expect(evidence?.text).toBe('কক্ষ নং ৪০২');
  });
});

describe('Full Notice Field Extraction Engine', () => {
  it('correctly processes a realistic Bengali university exam notice', () => {
    const sampleNotice = `ঢাকা বিশ্ববিদ্যালয়
কম্পিউটার বিজ্ঞান ও প্রকৌশল বিভাগ
বিজ্ঞপ্তি
বিষয়: ৪র্থ বর্ষ ৮ম সেমিস্টার ফাইনাল পরীক্ষা ২০২৩-এর সময়সূচী

এতদ্বারা শিক্ষার্থীদের জানানো যাচ্ছে যে, ৪র্থ বর্ষ ৮ম সেমিস্টার ফাইনাল পরীক্ষা আগামী ১২ অক্টোবর ২০২৪ তারিখ সকাল ১০:০০ ঘটিকায় অনুষ্ঠিত হবে।
পরীক্ষার স্থান: অডিটোরিয়াম ভবন, কক্ষ নং ৪০২।
পরীক্ষার্থীদের অবশ্যই মূল প্রবেশপত্র ও রেজিস্ট্রেশন কার্ড সঙ্গে আনতে হবে।
পরীক্ষার ফি বাবদ ৫০০/- টাকা আগামী ৫ অক্টোবর ২০২৪ তারিখের মধ্যে জমা দিতে হবে।
যে কোনো প্রয়োজনে বিভাগের হেল্পলাইন ০১৭XXXXXXXX এ যোগাযোগ করুন।`;

    const result = extractNoticeFields(sampleNotice);

    expect(result.detectedLanguage).toBe('bn');
    expect(result.fields.title.status).toBe('confirmed');
    expect(result.fields.category.value).toBe('Examination');
    expect(result.fields.institution.value).toContain('ঢাকা বিশ্ববিদ্যালয়');
    expect(result.fields.venue.value).toContain('কক্ষ নং ৪০২');
    expect(result.fields.fees.value).toContain('৫০০/-');
    expect(result.fields.requiredDocuments.value).toContain('প্রবেশপত্র');
    expect(result.fields.contact.value).toContain('০১৭XXXXXXXX');

    // Both deadline (৫ অক্টোবর ২০২৪) and event date (১২ অক্টোবর ২০২৪) should be classified
    expect(result.fields.deadline.status).toBe('confirmed');
    expect(result.fields.eventDate.status).toBe('confirmed');

    // Supporting evidence snippets must exist
    expect(result.fields.venue.evidence).not.toBeNull();
    expect(result.fields.deadline.evidence).not.toBeNull();
    expect(result.fields.fees.evidence).not.toBeNull();
  });

  it('correctly identifies not found fields without inventing facts', () => {
    const sparseText = `জরুরি বিজ্ঞপ্তি
আগামীকাল ক্লাস স্থগিত থাকবে।`;

    const result = extractNoticeFields(sparseText);
    expect(result.fields.deadline.status).toBe('not_found');
    expect(result.fields.deadline.value).toBe('Not found in notice');
    expect(result.fields.venue.status).toBe('not_found');
    expect(result.fields.fees.status).toBe('not_found');
  });

  it('generates end-to-end ProcessedNotice with summary', () => {
    const notice = processNoticeDocument(`BUET CSE Fest 2024
Notice
Date: 15 November 2024
Venue: ECE Building, Room 301
Last date of registration: 10 November 2024
Registration Fee: BDT 300
All participants must bring Student ID.
Register at https://fest.buet.ac.bd`);

    expect(notice.title).toContain('Notice');
    expect(notice.summary.criticalDeadline).toContain('10 November 2024');
    expect(notice.fields.url.value).toBe('https://fest.buet.ac.bd');
    expect(notice.fields.requiredDocuments.value).toContain('Student ID');
    expect(notice.fields.fees.value).toContain('300');
  });

  it('sanitizes extracted URLs by stripping trailing sentence punctuation and rejecting dangerous schemes', () => {
    const noticeWithPunctuation = `Online Registration Notice
Submit form at https://example.edu/register., or contact support.`;
    const resPunct = extractNoticeFields(noticeWithPunctuation);
    expect(resPunct.fields.url.value).toBe('https://example.edu/register');

    const noticeWithScript = `Exam Notice
Do not click javascript:alert(1) in the browser.`;
    const resScript = extractNoticeFields(noticeWithScript);
    expect(resScript.fields.url.status).toBe('not_found');
  });

  it('parses numeric date formats with hyphens and periods', () => {
    const textHyphen = 'শেষ তারিখ: ১৫-১১-২০২৪';
    const datesHyphen = extractAllDates(textHyphen);
    expect(datesHyphen.length).toBeGreaterThan(0);
    expect(datesHyphen[0].isoDate).toBe('2024-11-15');

    const textDot = 'Deadline is 20.12.2024 for fees';
    const datesDot = extractAllDates(textDot);
    expect(datesDot.length).toBeGreaterThan(0);
    expect(datesDot[0].isoDate).toBe('2024-12-20');
  });
});
