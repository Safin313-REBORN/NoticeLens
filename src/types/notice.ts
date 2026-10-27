export type NoticeFieldKey =
  | 'title'
  | 'category'
  | 'institution'
  | 'eventName'
  | 'eventDate'
  | 'startTime'
  | 'endTime'
  | 'venue'
  | 'deadline'
  | 'requiredDocuments'
  | 'fees'
  | 'requiredActions'
  | 'contact'
  | 'url';

export type ReviewStatus = 'confirmed' | 'needs_review' | 'not_found' | 'user_edited';

export interface EvidenceSnippet {
  text: string;
  startIndex: number;
  endIndex: number;
  confidence: 'high' | 'medium' | 'low' | 'manual';
  matchedKeyword?: string;
}

export interface ExtractedField {
  key: NoticeFieldKey;
  label: string;
  labelBn: string;
  value: string;
  evidence: EvidenceSnippet | null;
  status: ReviewStatus;
  explanation?: string;
  isAmbiguous?: boolean;
}

export interface NoticeSummary {
  overview: string;
  criticalDeadline: string | null;
  actionItems: string[];
  venueAndTime: string | null;
  requiredDocs: string[];
  unverifiedOrMissing: string[];
  language: 'bn' | 'en' | 'mixed';
}

export interface ProcessedNotice {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  ocrText: string;
  ocrLanguage: 'ben' | 'eng' | 'ben+eng';
  ocrConfidence?: number;
  fields: Record<NoticeFieldKey, ExtractedField>;
  summary: NoticeSummary;
  imageDataUrl?: string;
  sourceType: 'upload' | 'camera' | 'demo' | 'manual';
}

export interface SavedNotice {
  id: string;
  title: string;
  createdAt: string;
  notice: ProcessedNotice;
  hasDeadline: boolean;
  deadlineDate?: string;
  category: string;
}

export interface OCRProgress {
  status: string;
  progress: number; // 0 to 1
  step: 'idle' | 'loading_worker' | 'recognizing' | 'extracting' | 'completed' | 'error';
  errorMessage?: string;
}

export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  lang: string;
  name: string;
  isBengali: boolean;
  isEnglish: boolean;
}
