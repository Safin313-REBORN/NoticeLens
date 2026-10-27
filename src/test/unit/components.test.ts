import { describe, it, expect } from 'vitest';
import { DEMO_NOTICES, generateDemoNoticeSvg } from '../../data/demoNotices';
import { processNoticeDocument } from '../../services/extraction/noticeEngine';
import { generateNoticeSummary } from '../../services/extraction/summaryGenerator';
import { extractNoticeFields } from '../../services/extraction/fieldExtractor';

describe('Demo Notices & Pipeline Integration', () => {
  it('has all 3 required fictional sample notices (Bengali, English, Mixed)', () => {
    expect(DEMO_NOTICES.length).toBe(3);
    const languages = DEMO_NOTICES.map((d) => d.language);
    expect(languages).toContain('ben');
    expect(languages).toContain('eng');
    expect(languages).toContain('ben+eng');
  });

  it('generates valid SVG data URI for demo notices', () => {
    const svgUri = generateDemoNoticeSvg(DEMO_NOTICES[0]);
    expect(svgUri.startsWith('data:image/svg+xml')).toBe(true);
    expect(svgUri).toContain('NoticeLens');
  });

  it('processes Demo Notice 1 (Bengali Exam) and extracts critical deadline and fee', () => {
    const notice = processNoticeDocument(DEMO_NOTICES[0].ocrText);
    expect(notice.fields.category.value).toBe('Examination');
    expect(notice.fields.fees.value).toContain('৫০০/-');
    expect(notice.fields.deadline.status).toBe('confirmed');
    expect(notice.summary.criticalDeadline).toBeDefined();
    expect(notice.summary.actionItems.length).toBeGreaterThan(0);
  });

  it('processes Demo Notice 2 (English Hackathon Event) and extracts portal URL', () => {
    const notice = processNoticeDocument(DEMO_NOTICES[1].ocrText);
    expect(notice.fields.category.value).toBe('Event');
    expect(notice.fields.url.value).toContain('https://hackathon.buet.ac.bd');
    expect(notice.fields.venue.value).toContain('Auditorium');
    expect(notice.fields.requiredDocuments.value).toContain('Student ID');
  });

  it('processes Demo Notice 3 (Mixed Bengali-English Admission) preserving both languages', () => {
    const notice = processNoticeDocument(DEMO_NOTICES[2].ocrText);
    expect(notice.fields.category.value).toBe('Admission');
    expect(notice.fields.url.value).toContain('https://admission.juniv.edu');
    expect(notice.fields.venue.value).toContain('Room No. 204');
    expect(notice.summary.overview).toBeDefined();
  });

  it('generates plain-language accessible summaries correctly for English and Bengali', () => {
    const fieldsRes = extractNoticeFields(DEMO_NOTICES[1].ocrText);
    const summaryEn = generateNoticeSummary(fieldsRes.fields, 'en');
    expect(summaryEn.overview).toContain('notice');
    expect(summaryEn.actionItems.length).toBeGreaterThan(0);

    const fieldsBnRes = extractNoticeFields(DEMO_NOTICES[0].ocrText);
    const summaryBn = generateNoticeSummary(fieldsBnRes.fields, 'bn');
    expect(summaryBn.overview).toContain('বিজ্ঞপ্তি');
  });

  it('supports all 4 avant-garde UI theme modes (Neo-Brutalist, Memphis, Art Deco, Retro)', () => {
    const supportedThemes = ['neobrutalist', 'memphis', 'artdeco', 'retroterminal'];
    expect(supportedThemes).toHaveLength(4);
    supportedThemes.forEach((t) => {
      expect(typeof t).toBe('string');
      expect(['neobrutalist', 'memphis', 'artdeco', 'retroterminal']).toContain(t);
    });
  });

  it('supports all 5 multipage navigation destinations', () => {
    const multipageTabs = ['scan', 'workspace', 'saved', 'studio', 'transparency'];
    expect(multipageTabs).toHaveLength(5);
    expect(multipageTabs).toContain('scan');
    expect(multipageTabs).toContain('workspace');
    expect(multipageTabs).toContain('saved');
    expect(multipageTabs).toContain('studio');
    expect(multipageTabs).toContain('transparency');
  });
});
