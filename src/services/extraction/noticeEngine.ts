import { ProcessedNotice } from '../../types/notice';
import { extractNoticeFields } from './fieldExtractor';
import { generateNoticeSummary } from './summaryGenerator';

export interface ProcessOptions {
  ocrLanguage?: 'ben' | 'eng' | 'ben+eng';
  ocrConfidence?: number;
  imageDataUrl?: string;
  sourceType?: 'upload' | 'camera' | 'demo' | 'manual';
  existingId?: string;
}

/**
 * Main deterministic extraction engine
 * Coordinates bilingual normalization, context extraction, evidence matching, and summary generation.
 */
export function processNoticeDocument(
  ocrText: string,
  options: ProcessOptions = {}
): ProcessedNotice {
  const {
    ocrLanguage = 'ben+eng',
    ocrConfidence,
    imageDataUrl,
    sourceType = 'upload',
    existingId,
  } = options;

  const id = existingId || `notice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const { fields, detectedLanguage } = extractNoticeFields(ocrText);
  const summary = generateNoticeSummary(fields, detectedLanguage);

  // Derive notice title
  const noticeTitle =
    fields.title.status !== 'not_found'
      ? fields.title.value
      : fields.eventName.status !== 'not_found'
      ? fields.eventName.value
      : 'Untitled University Notice';

  return {
    id,
    title: noticeTitle,
    createdAt: now,
    updatedAt: now,
    ocrText,
    ocrLanguage,
    ocrConfidence,
    fields,
    summary,
    imageDataUrl,
    sourceType,
  };
}
