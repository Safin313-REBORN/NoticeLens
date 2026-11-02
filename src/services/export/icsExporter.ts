import { ProcessedNotice } from '../../types/notice';
import { extractAllDates, isValidCalendarDate } from '../extraction/dateParser';
import { bengaliToEnglishNumerals } from '../extraction/numerals';

export interface CalendarEventData {
  title: string;
  description: string;
  location?: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string | null;
  endTime?: string | null;
  isAllDay: boolean;
}

/**
 * Generates an OS-safe and Unicode-aware filename for iCalendar downloads.
 * Preserves Bengali and international script letters while sanitizing filesystem-reserved characters.
 */
export function generateSafeCalendarFilename(title: string, suffix = 'deadline'): string {
  if (!title || !title.trim()) {
    return `notice_${suffix}.ics`;
  }
  const sanitized = title
    .trim()
    .replace(/[\\/:*?"<>|\r\n\t]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 40);

  const base = sanitized || 'notice';
  return `${base}_${suffix}.ics`;
}

/**
 * RFC 5545 line folding: folds lines exceeding 75 UTF-8 octets with CRLF followed by single space.
 * Correctly counts UTF-8 byte length (not UTF-16 code units) and never splits multibyte characters.
 */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const chunks: string[] = [];
  let currentChunk = '';
  let currentByteLen = 0;
  let isFirstLine = true;

  for (const char of line) {
    const charBytes = encoder.encode(char).length;
    const limit = isFirstLine ? 75 : 74; // 1 byte reserved for leading space in continuation lines

    if (currentByteLen + charBytes > limit && currentChunk.length > 0) {
      chunks.push(isFirstLine ? currentChunk : ' ' + currentChunk);
      currentChunk = char;
      currentByteLen = charBytes;
      isFirstLine = false;
    } else {
      currentChunk += char;
      currentByteLen += charBytes;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(isFirstLine ? currentChunk : ' ' + currentChunk);
  }

  return chunks.join('\r\n');
}

/**
 * Builds RFC 5545 compliant iCalendar (.ics) string.
 * Defends against CRLF injection, folds lines by UTF-8 octets, and accurately handles Bangladesh timezone (Asia/Dhaka).
 * Does NOT invent missing years, start times, or event durations.
 */
export function generateIcsContent(event: CalendarEventData): string {
  const now = new Date();
  const dtStamp = formatIcsDateTime(now);
  const uid = `noticelens-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@noticelens.app`;

  // Validate startDate format (YYYY-MM-DD)
  const dateMatch = event.startDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) {
    throw new Error(`Invalid start date format: ${event.startDate}. Expected YYYY-MM-DD.`);
  }

  const startYear = parseInt(dateMatch[1], 10);
  const startMonth = parseInt(dateMatch[2], 10);
  const startDay = parseInt(dateMatch[3], 10);

  if (!isValidCalendarDate(startDay, startMonth, startYear)) {
    throw new Error(
      `Invalid calendar date: ${event.startDate}. Day ${startDay} does not exist in month ${startMonth} for year ${startYear}.`
    );
  }

  let dtStartLine = '';
  let dtEndLine = '';
  const includeTimezone = !event.isAllDay && Boolean(event.startTime);

  if (event.isAllDay || !event.startTime) {
    // All-day event (YYYYMMDD)
    const cleanDate = `${dateMatch[1]}${dateMatch[2]}${dateMatch[3]}`;
    dtStartLine = `DTSTART;VALUE=DATE:${cleanDate}`;
    // For all-day events, DTEND is next day per RFC 5545 section 3.6.1
    const nextDay = new Date(Date.UTC(startYear, startMonth - 1, startDay + 1));
    const cleanEndDate = formatIcsDateOnly(nextDay);
    dtEndLine = `DTEND;VALUE=DATE:${cleanEndDate}`;
  } else {
    // Date with time in Asia/Dhaka (+06:00)
    const startIso = parseDateTimeToDate(event.startDate, event.startTime);
    if (!startIso) {
      throw new Error(`Invalid or unparseable event start time: "${event.startTime}". Review required.`);
    }
    dtStartLine = `DTSTART;TZID=Asia/Dhaka:${formatIcsLocalDateTime(startIso)}`;

    if (event.endTime) {
      const endIso = parseDateTimeToDate(event.startDate, event.endTime);
      if (!endIso) {
        throw new Error(`Invalid or unparseable event end time: "${event.endTime}". Review required.`);
      }
      if (endIso.getTime() <= startIso.getTime()) {
        throw new Error(
          `Event end time (${event.endTime}) cannot be earlier than or equal to start time (${event.startTime}) on the same date.`
        );
      }
      dtEndLine = `DTEND;TZID=Asia/Dhaka:${formatIcsLocalDateTime(endIso)}`;
    }
    // Per RFC 5545 §3.6.1: when endTime is omitted, no duration is manufactured.
  }

  const cleanTitle = escapeIcsText(event.title);
  const cleanDesc = escapeIcsText(event.description);
  const cleanLoc = event.location ? escapeIcsText(event.location) : '';

  const vtimezoneLines = includeTimezone
    ? [
        'BEGIN:VTIMEZONE',
        'TZID:Asia/Dhaka',
        'X-LIC-LOCATION:Asia/Dhaka',
        'BEGIN:STANDARD',
        'TZOFFSETFROM:+0600',
        'TZOFFSETTO:+0600',
        'TZNAME:BDT',
        'DTSTART:19700101T000000',
        'END:STANDARD',
        'END:VTIMEZONE',
      ]
    : [];

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NoticeLens//Notice Intelligence Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...vtimezoneLines,
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    dtStartLine,
    dtEndLine,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDesc}`,
    cleanLoc ? `LOCATION:${cleanLoc}` : null,
    'STATUS:CONFIRMED',
    // 24-hour reminder alarm
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:NoticeLens Reminder: Upcoming Notice Deadline',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean) as string[];

  return icsLines.map(foldIcsLine).join('\r\n');
}

/**
 * Triggers a browser file download of the generated .ics file
 */
export function downloadIcsFile(event: CalendarEventData, filename = 'notice-deadline.ics'): void {
  const content = generateIcsContent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Helper to prepare calendar data from a processed notice.
 * Strictly adheres to extracted facts; NEVER invents missing years.
 */
export function buildEventFromNotice(notice: ProcessedNotice): CalendarEventData | null {
  const deadlineField = notice.fields.deadline;
  const eventDateField = notice.fields.eventDate;

  // Prefer deadline, otherwise use eventDate
  const targetField = deadlineField.status !== 'not_found' ? deadlineField : eventDateField;
  if (targetField.status === 'not_found') return null;

  // 1. Direct ISO match in evidence or field value
  const isoMatch =
    targetField.value.match(/\b(\d{4})-(\d{2})-(\d{2})\b/) ||
    targetField.evidence?.text?.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);

  let isoDate = isoMatch ? isoMatch[0] : null;

  // 2. Parse date via extraction engine if not raw ISO
  if (!isoDate) {
    const parsedDates = extractAllDates(targetField.value);
    if (parsedDates.length > 0 && parsedDates[0].isoDate) {
      isoDate = parsedDates[0].isoDate;
    } else if (targetField.evidence?.text) {
      const evidenceDates = extractAllDates(targetField.evidence.text);
      if (evidenceDates.length > 0 && evidenceDates[0].isoDate) {
        isoDate = evidenceDates[0].isoDate;
      }
    }
  }

  // Never invent missing year! If notice lacks explicit year, export must be confirmed or user-edited.
  if (!isoDate) return null;

  const title = `[NoticeLens] ${notice.title}`;
  const description = [
    `Notice Category: ${notice.fields.category.value}`,
    `Institution: ${notice.fields.institution.value}`,
    notice.summary.criticalDeadline ? `Critical Deadline: ${notice.summary.criticalDeadline}` : '',
    notice.fields.venue.status !== 'not_found' ? `Venue: ${notice.fields.venue.value}` : '',
    notice.fields.requiredDocuments.status !== 'not_found'
      ? `Required Documents:\n${notice.fields.requiredDocuments.value}`
      : '',
    notice.fields.url.status !== 'not_found' ? `Portal URL: ${notice.fields.url.value}` : '',
    'Notice details extracted by NoticeLens. Please verify against official university circulars.',
  ]
    .filter(Boolean)
    .join('\n\n');

  const location = notice.fields.venue.status !== 'not_found' ? notice.fields.venue.value : undefined;
  const startTime = notice.fields.startTime.status !== 'not_found' ? notice.fields.startTime.value : null;
  const endTime = notice.fields.endTime.status !== 'not_found' ? notice.fields.endTime.value : null;

  return {
    title,
    description,
    location,
    startDate: isoDate,
    startTime,
    endTime,
    isAllDay: !startTime,
  };
}

/**
 * Escapes characters for RFC 5545 compliance and neutralizes CRLF injection.
 */
export function escapeIcsText(str: string): string {
  if (!str) return '';
  // Normalize CRLF and bare CR to LF
  const normalized = str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // RFC 5545 escaping: backslash, semicolon, comma, and newline
  return normalized
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function formatIcsDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
    date.getUTCHours()
  )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

export function formatIcsLocalDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
    date.getUTCHours()
  )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
}

export function formatIcsDateOnly(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

export function parseDateTimeToDate(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr || !timeStr.trim()) return null;

  const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return null;

  const year = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10);
  const day = parseInt(dateMatch[3], 10);

  if (!isValidCalendarDate(day, month, year)) return null;

  const normalizedTime = bengaliToEnglishNumerals(timeStr.trim());
  // Strictly anchored 12-hour or 24-hour time format
  const match = normalizedTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);

  if (!match) {
    return null;
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[4]?.toUpperCase();

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
}

/**
 * Review gate: determines whether a notice has a verified, non-ambiguous deadline ready for calendar export.
 * Rejects export if deadline is missing, missing a year, or flagged for review unless user confirmed.
 */
export function isExportAllowed(notice: ProcessedNotice): boolean {
  const deadline = notice.fields.deadline;
  const eventDate = notice.fields.eventDate;
  const targetField = deadline && deadline.status !== 'not_found' ? deadline : eventDate;

  if (!targetField || targetField.status === 'not_found') return false;
  if (targetField.status !== 'user_edited' && targetField.status !== 'confirmed' && (targetField.isAmbiguous || targetField.status === 'needs_review')) {
    return false;
  }

  const event = buildEventFromNotice(notice);
  if (!event) return false;

  const dateMatch = event.startDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return false;

  const y = parseInt(dateMatch[1], 10);
  const m = parseInt(dateMatch[2], 10);
  const d = parseInt(dateMatch[3], 10);
  return isValidCalendarDate(d, m, y);
}

export interface CalendarExportOutcome {
  success: boolean;
  requiresReview?: boolean;
  eventData?: CalendarEventData;
  reason?: string;
  filename?: string;
  icsContent?: string;
}

/**
 * Centralized calendar export controller.
 * Enforces review gates across desktop, mobile, and saved vault pathways.
 */
export function exportNoticeCalendar(
  notice: ProcessedNotice,
  options?: { confirmedEvent?: CalendarEventData; bypassReview?: boolean }
): CalendarExportOutcome {
  const deadlineField = notice.fields.deadline;
  const eventDateField = notice.fields.eventDate;
  const targetField = deadlineField && deadlineField.status !== 'not_found' ? deadlineField : eventDateField;

  if (!targetField || targetField.status === 'not_found') {
    return {
      success: false,
      reason: 'No schedule or deadline detected in notice.',
    };
  }

  const isConfirmed = targetField.status === 'user_edited' || targetField.status === 'confirmed';
  const isAmbiguous = targetField.isAmbiguous || targetField.status === 'needs_review';

  if (!isConfirmed && isAmbiguous && !options?.bypassReview) {
    const eventCandidate = options?.confirmedEvent || buildEventFromNotice(notice);
    const reason = targetField.explanation || (targetField.isAmbiguous
      ? 'Extracted date is ambiguous and requires confirmation before calendar export.'
      : 'Extracted date requires review and confirmation before calendar export.');
    return {
      success: false,
      requiresReview: true,
      eventData: eventCandidate || undefined,
      reason,
    };
  }

  const eventData = options?.confirmedEvent || buildEventFromNotice(notice);
  if (!eventData) {
    return {
      success: false,
      requiresReview: false,
      reason: 'Unable to parse a verified calendar date from notice.',
    };
  }

  try {
    const filename = generateSafeCalendarFilename(notice.title, 'deadline');
    const icsContent = generateIcsContent(eventData);
    if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      downloadIcsFile(eventData, filename);
    }
    return {
      success: true,
      requiresReview: false,
      eventData,
      filename,
      icsContent,
    };
  } catch (err: unknown) {
    return {
      success: false,
      requiresReview: false,
      reason: err instanceof Error ? err.message : 'Failed to export calendar event.',
    };
  }
}



