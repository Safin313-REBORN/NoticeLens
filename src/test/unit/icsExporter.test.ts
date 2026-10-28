import { describe, it, expect } from 'vitest';
import { generateIcsContent, buildEventFromNotice, escapeIcsText, foldIcsLine } from '../../services/export/icsExporter';
import { processNoticeDocument } from '../../services/extraction/noticeEngine';
import { DEMO_NOTICES } from '../../data/demoNotices';

describe('ICS Calendar Exporter', () => {
  it('generates standard RFC 5545 format with UID, DTSTART, DTEND, and VALARM', () => {
    const event = {
      title: 'CSE Semester Final Exam',
      description: 'Exam at Room 402',
      location: 'Room 402, Kazi Motahar Hossain Building',
      startDate: '2024-11-15',
      startTime: '10:00 AM',
      endTime: '1:00 PM',
      isAllDay: false,
    };

    const ics = generateIcsContent(event);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('SUMMARY:CSE Semester Final Exam');
    expect(ics).toContain('DTSTART;TZID=Asia/Dhaka:');
    expect(ics).toContain('DTEND;TZID=Asia/Dhaka:');
    expect(ics).toContain('LOCATION:Room 402\\, Kazi Motahar Hossain Building');
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('TRIGGER:-PT24H');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('builds calendar event directly from a processed notice', () => {
    const notice = processNoticeDocument(DEMO_NOTICES[1].ocrText);
    const eventData = buildEventFromNotice(notice);

    expect(eventData).not.toBeNull();
    expect(eventData?.title).toContain('Notice');
    expect(eventData?.startDate).toBeDefined();
    expect(eventData?.description).toContain('NoticeLens');
  });

  it('neutralizes CRLF injection in title and description (SEC-01)', () => {
    const maliciousEvent = {
      title: 'Exam Notice\r\nLOCATION:Attacker Injected Site\r\nSTATUS:CANCELLED',
      description: 'Important details\r\nBEGIN:VEVENT\r\nUID:fake-uid',
      location: 'Room 101\r\nX-INJECTED:Header',
      startDate: '2024-12-01',
      startTime: null,
      isAllDay: true,
    };

    const ics = generateIcsContent(maliciousEvent);

    // Verify unescaped CRLF injection did not break the structure into separate raw lines
    // In RFC 5545, literal newlines inside text properties MUST be escaped as "\n"
    expect(ics).not.toContain('\r\nLOCATION:Attacker Injected Site');
    expect(ics).not.toContain('\r\nSTATUS:CANCELLED');
    expect(ics).toContain('SUMMARY:Exam Notice\\nLOCATION:Attacker Injected Site\\nSTATUS:CANCELLED');
    expect(ics).toContain('DESCRIPTION:Important details\\nBEGIN:VEVENT\\nUID:fake-uid');

    // Test raw escape helper
    const escaped = escapeIcsText('Hello\r\nWorld\rInjected');
    expect(escaped).toBe('Hello\\nWorld\\nInjected');
  });

  it('successfully extracts calendar event from Bengali-language date circulars (DAT-03)', () => {
    const bengaliNotice = processNoticeDocument(DEMO_NOTICES[0].ocrText);
    const eventData = buildEventFromNotice(bengaliNotice);

    expect(eventData).not.toBeNull();
    // Demo 0 has deadline "৫ নভেম্বর ২০২৪" (2024-11-05)
    expect(eventData?.startDate).toBe('2024-11-05');
    expect(eventData?.title).toContain('NoticeLens');
  });

  it('throws descriptive error on malformed start date format', () => {
    const invalidEvent = {
      title: 'Test Event',
      description: 'Description',
      startDate: 'invalid-date-string',
      isAllDay: true,
    };

    expect(() => generateIcsContent(invalidEvent)).toThrowError(/Invalid start date format/);
  });

  it('rejects impossible calendar dates like 31 February or 31 April', () => {
    const feb31Event = {
      title: 'Impossible Date',
      description: 'Test',
      startDate: '2024-02-31',
      isAllDay: true,
    };
    expect(() => generateIcsContent(feb31Event)).toThrowError(/Invalid calendar date/);

    const apr31Event = {
      title: '31 April Test',
      description: 'Test',
      startDate: '2024-04-31',
      isAllDay: true,
    };
    expect(() => generateIcsContent(apr31Event)).toThrowError(/Invalid calendar date/);
  });

  it('handles leap years accurately: accepts 2024-02-29 and rejects 2023-02-29', () => {
    const leapYearEvent = {
      title: 'Leap Year Event',
      description: 'Test',
      startDate: '2024-02-29',
      isAllDay: true,
    };
    expect(() => generateIcsContent(leapYearEvent)).not.toThrow();

    const nonLeapYearEvent = {
      title: 'Non Leap Year Event',
      description: 'Test',
      startDate: '2023-02-29',
      isAllDay: true,
    };
    expect(() => generateIcsContent(nonLeapYearEvent)).toThrowError(/Invalid calendar date/);
  });

  it('folds long lines by UTF-8 octets without splitting multibyte Bengali characters', () => {
    // 35 Bengali characters = 105 UTF-8 bytes (exceeds 75 octet limit)
    const longBengali = 'ঢাকা বিশ্ববিদ্যালয় ভর্তি পরীক্ষার সময়সূচী ও নির্দেশনাবলী বিস্তারিত প্রকাশ';
    const folded = foldIcsLine(`SUMMARY:${longBengali}`);

    const lines = folded.split('\r\n');
    expect(lines.length).toBeGreaterThan(1);

    const encoder = new TextEncoder();
    for (let i = 0; i < lines.length; i++) {
      const lineBytes = encoder.encode(lines[i]).length;
      expect(lineBytes).toBeLessThanOrEqual(75);
      if (i > 0) {
        // Continuation lines must begin with a single space
        expect(lines[i].startsWith(' ')).toBe(true);
      }
    }
  });

  it('does NOT manufacture a 1-hour duration when endTime is omitted', () => {
    const pointInTimeEvent = {
      title: 'Application Deadline 5 PM',
      description: 'Submit fees by 5 PM sharp',
      startDate: '2024-11-15',
      startTime: '5:00 PM',
      isAllDay: false,
    };

    const ics = generateIcsContent(pointInTimeEvent);
    expect(ics).toContain('DTSTART;TZID=Asia/Dhaka:20241115T170000');
    // Per RFC 5545, when endTime is omitted, no manufactured DTEND is produced
    expect(ics).not.toContain('DTEND;TZID=Asia/Dhaka:20241115T180000');
  });
});
