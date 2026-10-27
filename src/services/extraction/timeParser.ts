import { bengaliToEnglishNumerals } from './numerals';

export interface ParsedTimeResult {
  rawSnippet: string;
  startTime: string | null; // e.g. "10:00 AM" or "14:30"
  endTime: string | null;
  displayString: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Extracts event or exam time window from notice text
 */
export function extractTime(text: string): ParsedTimeResult | null {
  if (!text) return null;

  const lines = text.split('\n');

  for (const rawLine of lines) {
    if (!rawLine.trim()) continue;

    const norm = bengaliToEnglishNumerals(rawLine);

    // 1. Time range (e.g., সকাল ১০:০০ হতে দুপুর ১:০০ পর্যন্ত or 10:00 AM to 1:00 PM)
    const rangeMatch =
      norm.match(/(সকাল|বেলা|দুপুর|বিকাল|সন্ধ্যা|রাত)?\s*(\d{1,2}(?::\d{2})?)\s*(?:টা|am|pm)?\s*(?:হতে|থেকে|to|-|–)\s*(সকাল|বেলা|দুপুর|বিকাল|সন্ধ্যা|রাত)?\s*(\d{1,2}(?::\d{2})?)\s*(?:টা|am|pm|ঘটিকায়|ঘটিকায়|পর্যন্ত)?/i);

    if (rangeMatch) {
      const startPeriod = rangeMatch[1];
      const startNum = rangeMatch[2];
      const endPeriod = rangeMatch[3];
      const endNum = rangeMatch[4];

      const start = formatPeriodTime(startNum, startPeriod || (endPeriod === 'দুপুর' ? 'সকাল' : undefined));
      const end = formatPeriodTime(endNum, endPeriod);

      const matchIdx = norm.indexOf(rangeMatch[0]);
      const rawSnippet = matchIdx !== -1 ? rawLine.substring(matchIdx, matchIdx + rangeMatch[0].length) : rangeMatch[0];

      return {
        rawSnippet: rawSnippet.trim(),
        startTime: start,
        endTime: end,
        displayString: `${start} - ${end}`,
        confidence: 'high',
      };
    }

    // 2. Single time in Bengali (e.g., সকাল ১০:০০ ঘটিকায় or দুপুর ২:৩০ টায়)
    const bnSingleMatch =
      norm.match(/(সকাল|বেলা|দুপুর|বিকাল|সন্ধ্যা|রাত)\s*(\d{1,2}(?::\d{2})?)\s*(?:টা|টায়|ঘটিকায়|ঘটিকায়)?/i);

    if (bnSingleMatch) {
      const period = bnSingleMatch[1];
      const timeNum = bnSingleMatch[2];
      const normalizedTime = formatPeriodTime(timeNum, period);
      const matchIdx = norm.indexOf(bnSingleMatch[0]);
      const rawSnippet = matchIdx !== -1 ? rawLine.substring(matchIdx, matchIdx + bnSingleMatch[0].length) : bnSingleMatch[0];

      return {
        rawSnippet: rawSnippet.trim(),
        startTime: normalizedTime,
        endTime: null,
        displayString: normalizedTime,
        confidence: 'high',
      };
    }

    // 3. Single time in English (e.g., 10:30 AM or 02:00 PM)
    const enSingleMatch = norm.match(/\b(\d{1,2}:\d{2})\s*(AM|PM)?\b/i);
    if (enSingleMatch) {
      const timeStr = enSingleMatch[1] + (enSingleMatch[2] ? ` ${enSingleMatch[2].toUpperCase()}` : '');
      const matchIdx = norm.indexOf(enSingleMatch[0]);
      const rawSnippet = matchIdx !== -1 ? rawLine.substring(matchIdx, matchIdx + enSingleMatch[0].length) : enSingleMatch[0];

      return {
        rawSnippet: rawSnippet.trim(),
        startTime: timeStr,
        endTime: null,
        displayString: timeStr,
        confidence: enSingleMatch[2] ? 'high' : 'medium',
      };
    }
  }

  return null;
}

function formatPeriodTime(timeNum: string, period?: string): string {
  let [hStr, mStr] = timeNum.split(':');
  let h = parseInt(hStr, 10);
  let m = mStr ? parseInt(mStr, 10) : 0;
  const mFormatted = m < 10 ? `0${m}` : `${m}`;

  if (period === 'সকাল') {
    return `${h}:${mFormatted} AM`;
  } else if (period === 'দুপুর' || period === 'বিকাল' || period === 'সন্ধ্যা' || period === 'রাত') {
    if (h < 12) h += 12;
    return `${h > 12 ? h - 12 : 12}:${mFormatted} PM`;
  }
  return `${h}:${mFormatted}`;
}
