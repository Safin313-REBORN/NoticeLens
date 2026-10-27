import { describe, it, expect } from 'vitest';
import { generateIcsContent, buildEventFromNotice } from '../../services/export/icsExporter';
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
    expect(ics).toContain('DTSTART:');
    expect(ics).toContain('DTEND:');
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
});
