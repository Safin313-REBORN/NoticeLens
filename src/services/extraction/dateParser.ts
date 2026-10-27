import { bengaliToEnglishNumerals } from './numerals';

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function isValidCalendarDate(day: number, month: number, year: number | null): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const daysInMonth = [
    31,
    year !== null ? (isLeapYear(year) ? 29 : 28) : 29, // max 29 if year unknown, but never 30/31
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return day <= daysInMonth[month - 1];
}

export interface ParsedDateResult {
  rawSnippet: string;
  normalizedDate: string;
  isoDate: string | null;
  day: number | null;
  month: number | null; // 1-12
  year: number | null;
  dateType: 'deadline' | 'event' | 'publication' | 'general';
  confidence: 'high' | 'medium' | 'low';
  contextSnippet: string;
  isAmbiguous: boolean;
  ambiguityReason?: string;
}

const BENGALI_MONTHS_MAP: Record<string, number> = {
  জানুয়ারি: 1,
  জানুয়ারি: 1,
  জানু: 1,
  ফেব্রুয়ারি: 2,
  ফেব্রুয়ারি: 2,
  ফেব্রু: 2,
  মার্চ: 3,
  এপ্রিল: 4,
  মে: 5,
  জুন: 6,
  জুলাই: 7,
  আগস্ট: 8,
  আগষ্ট: 8,
  সেপ্টেম্বর: 9,
  অক্টোবর: 10,
  নভেম্বর: 11,
  নভে: 11,
  ডিসেম্বর: 12,
  ডিসে: 12,
};

const ENGLISH_MONTHS_MAP: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const DEADLINE_KEYWORDS = [
  'শেষ তারিখ',
  'আবেদনের শেষ তারিখ',
  'জমাদানের তারিখ',
  'জমাদানের শেষ',
  'পর্যন্ত আবেদন',
  'পর্যন্ত গ্রহণ',
  'তারিখের মধ্যে',
  'deadline',
  'last date',
  'due date',
  'apply by',
  'submission deadline',
  'closing date',
  'closing date for',
];

const EVENT_KEYWORDS = [
  'পরীক্ষার তারিখ',
  'পরীক্ষা',
  'অনুষ্ঠানের তারিখ',
  'শুরুর তারিখ',
  'অনুষ্ঠিত হবে',
  'শুরু হবে',
  'সময়সূচী',
  'রুটিন',
  'exam date',
  'examination date',
  'event date',
  'commencing from',
  'starts on',
  'held on',
  'date of examination',
];

const PUBLICATION_KEYWORDS = [
  'বিজ্ঞপ্তির তারিখ',
  'স্মারক নং',
  'প্রকাশের তারিখ',
  'dated:',
  'date of issue',
];

/**
 * Parses all dates in notice text and classifies them with supporting context
 */
export function extractAllDates(text: string): ParsedDateResult[] {
  if (!text) return [];

  const lines = text.split('\n');
  const results: ParsedDateResult[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex];
    if (!rawLine.trim()) continue;

    const normalizedLine = bengaliToEnglishNumerals(rawLine);

    // 1. Detect date with month name in Bengali (e.g., ১৫ নভেম্বর ২০২৪ or ১৫ই নভেম্বর ২০২৪)
    const bnMonthPattern =
      /(?<!\d)(\d{1,2})(?!\d)(?:ই|শে|লা|র্থ|st|nd|rd|th)?\s+(জানুয়ারি|জানুয়ারি|ফেব্রুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগষ্ট|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর|জানু|ফেব্রু|নভে|ডিসে)\s*,?\s*(?:(?<!\d)(\d{4})(?!\d))?/gi;

    let bnMatch: RegExpExecArray | null;
    while ((bnMatch = bnMonthPattern.exec(normalizedLine)) !== null) {
      const day = parseInt(bnMatch[1], 10);
      const monthStr = bnMatch[2].toLowerCase();
      const month = BENGALI_MONTHS_MAP[monthStr];
      const year = bnMatch[3] ? parseInt(bnMatch[3], 10) : null;

      if (!isValidCalendarDate(day, month, year)) continue;

      const rawSnippet = rawLine.substring(bnMatch.index, bnMatch.index + bnMatch[0].length);
      const classification = classifyDateContext(rawLine, lineIndex, lines);

      results.push({
        rawSnippet,
        normalizedDate: formatDateDisplay(day, month, year),
        isoDate: year && month && day ? `${year}-${pad2(month)}-${pad2(day)}` : null,
        day,
        month,
        year,
        dateType: classification.type,
        confidence: year ? 'high' : 'medium',
        contextSnippet: rawLine.trim(),
        isAmbiguous: !year,
        ambiguityReason: !year ? 'Year was not explicitly specified in the notice text; requires user verification.' : undefined,
      });
    }

    // 1b. Detect date with Bengali Month-Day-Year (e.g., নভেম্বর ১৫, ২০২৪ or অক্টোবর ১২)
    const bnMonthDayPattern =
      /(জানুয়ারি|জানুয়ারি|ফেব্রুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগষ্ট|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর|জানু|ফেব্রু|নভে|ডিসে)\s+(?<!\d)(\d{1,2})(?!\d)(?:ই|শে|লা|র্থ|st|nd|rd|th)?\s*,?\s*(?:(?<!\d)(\d{4})(?!\d))?/gi;

    while ((bnMatch = bnMonthDayPattern.exec(normalizedLine)) !== null) {
      const monthStr = bnMatch[1].toLowerCase();
      const month = BENGALI_MONTHS_MAP[monthStr];
      const day = parseInt(bnMatch[2], 10);
      const year = bnMatch[3] ? parseInt(bnMatch[3], 10) : null;

      if (!isValidCalendarDate(day, month, year)) continue;

      const rawSnippet = rawLine.substring(bnMatch.index, bnMatch.index + bnMatch[0].length);
      const classification = classifyDateContext(rawLine, lineIndex, lines);

      results.push({
        rawSnippet,
        normalizedDate: formatDateDisplay(day, month, year),
        isoDate: year && month && day ? `${year}-${pad2(month)}-${pad2(day)}` : null,
        day,
        month,
        year,
        dateType: classification.type,
        confidence: year ? 'high' : 'medium',
        contextSnippet: rawLine.trim(),
        isAmbiguous: !year,
        ambiguityReason: !year ? 'Year was not explicitly specified in the notice text; requires user verification.' : undefined,
      });
    }

    // 2. English Day-Month-Year (e.g., 25th November 2024 or 25 Nov 2024)
    const enDayMonthPattern =
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s*,?\s*(\d{4})?\b/gi;

    let enMatch: RegExpExecArray | null;
    while ((enMatch = enDayMonthPattern.exec(normalizedLine)) !== null) {
      const day = parseInt(enMatch[1], 10);
      const monthName = enMatch[2].toLowerCase();
      const month = ENGLISH_MONTHS_MAP[monthName];
      const year = enMatch[3] ? parseInt(enMatch[3], 10) : null;

      if (!isValidCalendarDate(day, month, year)) continue;

      const rawSnippet = rawLine.substring(enMatch.index, enMatch.index + enMatch[0].length);
      const classification = classifyDateContext(rawLine, lineIndex, lines);

      results.push({
        rawSnippet,
        normalizedDate: formatDateDisplay(day, month, year),
        isoDate: year && month && day ? `${year}-${pad2(month)}-${pad2(day)}` : null,
        day,
        month,
        year,
        dateType: classification.type,
        confidence: year ? 'high' : 'medium',
        contextSnippet: rawLine.trim(),
        isAmbiguous: !year,
        ambiguityReason: !year ? 'Year was not explicitly specified; requires user verification.' : undefined,
      });
    }

    // 3. English Month-Day-Year (e.g., November 25, 2024 or Nov 25 2024)
    const enMonthDayPattern =
      /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(\d{4})?\b/gi;

    while ((enMatch = enMonthDayPattern.exec(normalizedLine)) !== null) {
      const monthName = enMatch[1].toLowerCase();
      const month = ENGLISH_MONTHS_MAP[monthName];
      const day = parseInt(enMatch[2], 10);
      const year = enMatch[3] ? parseInt(enMatch[3], 10) : null;

      if (!isValidCalendarDate(day, month, year)) continue;

      const rawSnippet = rawLine.substring(enMatch.index, enMatch.index + enMatch[0].length);
      const classification = classifyDateContext(rawLine, lineIndex, lines);

      results.push({
        rawSnippet,
        normalizedDate: formatDateDisplay(day, month, year),
        isoDate: year && month && day ? `${year}-${pad2(month)}-${pad2(day)}` : null,
        day,
        month,
        year,
        dateType: classification.type,
        confidence: year ? 'high' : 'medium',
        contextSnippet: rawLine.trim(),
        isAmbiguous: !year,
        ambiguityReason: !year ? 'Year was not explicitly specified; requires user verification.' : undefined,
      });
    }

    // 4. Numeric dates (DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY)
    const numericDatePattern = /\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})\b/g;
    let numMatch: RegExpExecArray | null;
    while ((numMatch = numericDatePattern.exec(normalizedLine)) !== null) {
      const p1 = parseInt(numMatch[1], 10);
      const p2 = parseInt(numMatch[2], 10);
      const yearRaw = parseInt(numMatch[3], 10);
      const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;

      let day = p1;
      let month = p2;
      let isAmbiguous = false;
      let ambiguityReason: string | undefined;

      if (month > 12 && day <= 12) {
        month = p1;
        day = p2;
      } else if (day <= 12 && month <= 12) {
        isAmbiguous = true;
        ambiguityReason = 'Could be interpreted as Day/Month or Month/Day; assumed DD/MM/YYYY by regional convention; requires user verification.';
      }

      if (!isValidCalendarDate(day, month, year)) continue;

      const rawSnippet = rawLine.substring(numMatch.index, numMatch.index + numMatch[0].length);
      const classification = classifyDateContext(rawLine, lineIndex, lines);

      results.push({
        rawSnippet,
        normalizedDate: formatDateDisplay(day, month, year),
        isoDate: `${year}-${pad2(month)}-${pad2(day)}`,
        day,
        month,
        year,
        dateType: classification.type,
        confidence: isAmbiguous ? 'medium' : 'high',
        contextSnippet: rawLine.trim(),
        isAmbiguous,
        ambiguityReason,
      });
    }
  }

  // De-duplicate dates occurring at identical snippets
  const uniqueResults: ParsedDateResult[] = [];
  const seen = new Set<string>();
  for (const item of results) {
    const key = `${item.isoDate || item.normalizedDate}-${item.rawSnippet}-${item.contextSnippet}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueResults.push(item);
    }
  }

  return uniqueResults;
}

function classifyDateContext(
  currentLine: string,
  lineIndex: number,
  allLines: string[]
): { type: 'deadline' | 'event' | 'publication' | 'general'; keywordMatched?: string } {
  const windowText = [
    lineIndex > 0 ? allLines[lineIndex - 1] : '',
    currentLine,
    lineIndex < allLines.length - 1 ? allLines[lineIndex + 1] : '',
  ]
    .join(' ')
    .toLowerCase();

  for (const kw of DEADLINE_KEYWORDS) {
    if (windowText.includes(kw)) {
      return { type: 'deadline', keywordMatched: kw };
    }
  }

  for (const kw of EVENT_KEYWORDS) {
    if (windowText.includes(kw)) {
      return { type: 'event', keywordMatched: kw };
    }
  }

  for (const kw of PUBLICATION_KEYWORDS) {
    if (windowText.includes(kw)) {
      return { type: 'publication', keywordMatched: kw };
    }
  }

  return { type: 'general' };
}

function formatDateDisplay(day: number | null, month: number | null, year: number | null): string {
  const monthNames = [
    '',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const parts: string[] = [];
  if (day) parts.push(String(day));
  if (month && monthNames[month]) parts.push(monthNames[month]);
  if (year) parts.push(String(year));
  return parts.join(' ');
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
