import { ProcessedNotice } from '../../types/notice';

export interface CalendarEventData {
  title: string;
  description: string;
  location?: string;
  startDate: string; // ISO date 'YYYY-MM-DD'
  startTime?: string | null; // e.g. "10:00 AM" or "14:30"
  endTime?: string | null;
  isAllDay: boolean;
}

/**
 * Builds RFC 5545 compliant iCalendar (.ics) string
 */
export function generateIcsContent(event: CalendarEventData): string {
  const now = new Date();
  const dtStamp = formatIcsDateTime(now);
  const uid = `noticelens-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@noticelens.app`;

  let dtStartLine = '';
  let dtEndLine = '';

  if (event.isAllDay || !event.startTime) {
    // All-day event (YYYYMMDD)
    const cleanDate = event.startDate.replace(/-/g, '');
    dtStartLine = `DTSTART;VALUE=DATE:${cleanDate}`;
    // For all-day events, DTEND is next day
    const nextDay = new Date(event.startDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const cleanEndDate = formatIcsDateOnly(nextDay);
    dtEndLine = `DTEND;VALUE=DATE:${cleanEndDate}`;
  } else {
    // Date with time
    const startIso = parseDateTimeToDate(event.startDate, event.startTime);
    dtStartLine = `DTSTART:${formatIcsDateTime(startIso)}`;

    if (event.endTime) {
      const endIso = parseDateTimeToDate(event.startDate, event.endTime);
      dtEndLine = `DTEND:${formatIcsDateTime(endIso)}`;
    } else {
      // Default to 1 hour duration
      const endIso = new Date(startIso.getTime() + 60 * 60 * 1000);
      dtEndLine = `DTEND:${formatIcsDateTime(endIso)}`;
    }
  }

  const cleanTitle = escapeIcsText(event.title);
  const cleanDesc = escapeIcsText(event.description);
  const cleanLoc = event.location ? escapeIcsText(event.location) : '';

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NoticeLens//Notice Intelligence Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
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
  ].filter(Boolean);

  return icsLines.join('\r\n');
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
 * Helper to prepare calendar data from a processed notice
 */
export function buildEventFromNotice(notice: ProcessedNotice): CalendarEventData | null {
  const deadlineField = notice.fields.deadline;
  const eventDateField = notice.fields.eventDate;

  // Prefer deadline, otherwise use eventDate
  const targetField = deadlineField.status !== 'not_found' ? deadlineField : eventDateField;
  if (targetField.status === 'not_found') return null;

  // Extract ISO date
  const isoMatch = targetField.evidence?.text?.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  let isoDate = isoMatch ? isoMatch[0] : null;

  if (!isoDate) {
    // Attempt parsing from value or default to current year
    const parts = targetField.value.match(/(\d{1,2})\s+([A-Za-z]+)\s*(\d{4})?/);
    if (parts) {
      const day = parts[1].padStart(2, '0');
      const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
      const mIdx = monthNames.findIndex(m => m.startsWith(parts[2].toLowerCase()));
      const year = parts[3] || String(new Date().getFullYear());
      if (mIdx !== -1) {
        isoDate = `${year}-${String(mIdx + 1).padStart(2, '0')}-${day}`;
      }
    }
  }

  if (!isoDate) return null;

  const title = `[NoticeLens] ${notice.title}`;
  const description = [
    `Notice Category: ${notice.fields.category.value}`,
    `Institution: ${notice.fields.institution.value}`,
    notice.summary.criticalDeadline ? `Critical Deadline: ${notice.summary.criticalDeadline}` : '',
    notice.fields.venue.status !== 'not_found' ? `Venue: ${notice.fields.venue.value}` : '',
    notice.fields.requiredDocuments.status !== 'not_found' ? `Required Documents:\n${notice.fields.requiredDocuments.value}` : '',
    notice.fields.url.status !== 'not_found' ? `Portal URL: ${notice.fields.url.value}` : '',
    'Processed and verified with NoticeLens.',
  ].filter(Boolean).join('\n\n');

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

function escapeIcsText(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function formatIcsDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
    date.getUTCHours()
  )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function formatIcsDateOnly(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function parseDateTimeToDate(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

  let hours = 9;
  let minutes = 0;

  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  return new Date(year, month - 1, day, hours, minutes, 0);
}
