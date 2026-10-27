import { ExtractedField, NoticeFieldKey } from '../../types/notice';
import { extractAllDates } from './dateParser';
import { extractTime } from './timeParser';
import { matchEvidence } from './evidenceMatcher';
import { bengaliToEnglishNumerals } from './numerals';

export interface FieldExtractionResult {
  fields: Record<NoticeFieldKey, ExtractedField>;
  detectedLanguage: 'bn' | 'en' | 'mixed';
}

export function extractNoticeFields(text: string): FieldExtractionResult {
  if (!text || !text.trim()) {
    return {
      fields: createEmptyFields(),
      detectedLanguage: 'en',
    };
  }

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Language detection
  const bengaliCount = (text.match(/[\u0980-\u09FF]/g) || []).length;
  const englishCount = (text.match(/[a-zA-Z]/g) || []).length;
  const totalLetters = bengaliCount + englishCount;

  let detectedLanguage: 'bn' | 'en' | 'mixed' = 'en';
  if (totalLetters > 0) {
    const bnRatio = bengaliCount / totalLetters;
    const enRatio = englishCount / totalLetters;
    if (bnRatio >= 0.8) {
      detectedLanguage = 'bn';
    } else if (enRatio >= 0.8) {
      detectedLanguage = 'en';
    } else {
      detectedLanguage = 'mixed';
    }
  }

  const dates = extractAllDates(text);
  const timeResult = extractTime(text);

  // 1. Title extraction
  const titleField = extractTitle(lines, text);

  // 2. Category
  const categoryField = extractCategory(text);

  // 3. Institution / Department
  const institutionField = extractInstitution(lines, text);

  // 4. Event / Examination name
  const eventNameField = extractEventName(lines, text, categoryField.value);

  // 5. Dates: Distinguish deadline from event date
  const { deadlineField, eventDateField } = extractDatesClassification(dates, text);

  // 6. Time: Start and End Time
  const { startTimeField, endTimeField } = extractTimeFields(timeResult, text);

  // 7. Venue / Room
  const venueField = extractVenue(lines, text);

  // 8. Required Documents
  const requiredDocsField = extractRequiredDocuments(lines, text);

  // 9. Fees / Payment amount
  const feesField = extractFees(lines, text);

  // 10. Required Actions
  const requiredActionsField = extractRequiredActions(lines, text);

  // 11. Contact information
  const contactField = extractContact(lines, text);

  // 12. URL / Links
  const urlField = extractUrl(text);

  const fields: Record<NoticeFieldKey, ExtractedField> = {
    title: titleField,
    category: categoryField,
    institution: institutionField,
    eventName: eventNameField,
    eventDate: eventDateField,
    startTime: startTimeField,
    endTime: endTimeField,
    venue: venueField,
    deadline: deadlineField,
    requiredDocuments: requiredDocsField,
    fees: feesField,
    requiredActions: requiredActionsField,
    contact: contactField,
    url: urlField,
  };

  return {
    fields,
    detectedLanguage,
  };
}

function extractTitle(lines: string[], fullText: string): ExtractedField {
  // Check top 5 lines for notice header or explicit subject line
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    if (/বিজ্ঞপ্তি|জরুরি বিজ্ঞপ্তি|নোটিশ|Notice|Announcement|Subject:|বিষয়:/i.test(line)) {
      return {
        key: 'title',
        label: 'Notice Title',
        labelBn: 'বিজ্ঞপ্তির শিরোনাম',
        value: line.replace(/^(বিষয়:|Subject:)\s*/i, '').trim(),
        evidence: matchEvidence(fullText, line, 'বিজ্ঞপ্তি/Notice'),
        status: 'confirmed',
      };
    }
  }

  // Fallback to second or first line if it looks like a heading
  if (lines.length > 0) {
    const candidate = lines[0].length < 120 ? lines[0] : lines[0].substring(0, 80) + '...';
    return {
      key: 'title',
      label: 'Notice Title',
      labelBn: 'বিজ্ঞপ্তির শিরোনাম',
      value: candidate,
      evidence: matchEvidence(fullText, candidate, undefined, 'medium'),
      status: 'needs_review',
      explanation: 'Title inferred from document header; please review for accuracy.',
    };
  }

  return createNotFoundField('title', 'Notice Title', 'বিজ্ঞপ্তির শিরোনাম');
}

function extractCategory(text: string): ExtractedField {
  let category = 'General';
  let matchedSnippet = '';

  const topLines = text.split('\n').slice(0, 6).join(' ');

  // 1. Check title/subject lines first
  if (/সেমিনার|কর্মশালা|সম্মেলন|উৎসব|seminar|workshop|symposium|fest|hackathon|contest|competition/i.test(topLines)) {
    category = 'Event';
    matchedSnippet = topLines.match(/সেমিনার|seminar|workshop|fest|hackathon|contest/i)?.[0] || 'Event';
  } else if (/ভর্তি|admission|enrollment/i.test(topLines)) {
    category = 'Admission';
    matchedSnippet = topLines.match(/ভর্তি|admission|enrollment/i)?.[0] || 'Admission';
  } else if (/বৃত্তি|scholarship|stipend|financial aid/i.test(topLines)) {
    category = 'Scholarship';
    matchedSnippet = topLines.match(/বৃত্তি|scholarship|stipend/i)?.[0] || 'Scholarship';
  } else if (/পরীক্ষা|exam\b|examination|সেমিস্টার ফাইনাল|চূড়ান্ত পরীক্ষা/i.test(topLines)) {
    category = 'Examination';
    matchedSnippet = topLines.match(/পরীক্ষা|exam\b|examination/i)?.[0] || 'Examination';
  } else if (/ছুটি|holiday|closure|বন্ধ/i.test(topLines)) {
    category = 'Holiday/Closure';
    matchedSnippet = topLines.match(/ছুটি|holiday|closure/i)?.[0] || 'Holiday';
  } else {
    // 2. Full text fallback with precise regexes
    if (/সেমিনার|কর্মশালা|সম্মেলন|উৎসব|seminar|workshop|symposium|fest|hackathon|contest/i.test(text)) {
      category = 'Event';
      matchedSnippet = text.match(/সেমিনার|seminar|workshop|fest|hackathon/i)?.[0] || 'Event';
    } else if (/ভর্তি|admission\b|enrollment/i.test(text)) {
      category = 'Admission';
      matchedSnippet = text.match(/ভর্তি|admission\b/i)?.[0] || 'Admission';
    } else if (/বৃত্তি|scholarship|stipend/i.test(text)) {
      category = 'Scholarship';
      matchedSnippet = text.match(/বৃত্তি|scholarship/i)?.[0] || 'Scholarship';
    } else if (/পরীক্ষা|exam\b|examination/i.test(text)) {
      category = 'Examination';
      matchedSnippet = text.match(/পরীক্ষা|exam\b|examination/i)?.[0] || 'Examination';
    } else if (/ছুটি|holiday|closure/i.test(text)) {
      category = 'Holiday/Closure';
      matchedSnippet = text.match(/ছুটি|holiday/i)?.[0] || 'Holiday';
    }
  }

  return {
    key: 'category',
    label: 'Notice Category',
    labelBn: 'বিজ্ঞপ্তির ধরণ',
    value: category,
    evidence: matchedSnippet ? matchEvidence(text, matchedSnippet, category) : null,
    status: matchedSnippet ? 'confirmed' : 'needs_review',
  };
}

function extractInstitution(lines: string[], fullText: string): ExtractedField {
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    if (
      /বিশ্ববিদ্যালয়|কলেজ|অনুষদ|বিভাগ|ইনস্টিটিউট|University|College|Department of|Faculty of|Institute of|School of/i.test(
        line
      )
    ) {
      return {
        key: 'institution',
        label: 'Issuing Institution / Department',
        labelBn: 'প্রতিষ্ঠান / বিভাগ',
        value: line,
        evidence: matchEvidence(fullText, line, 'Institution'),
        status: 'confirmed',
      };
    }
  }

  return createNotFoundField('institution', 'Issuing Institution / Department', 'প্রতিষ্ঠান / বিভাগ');
}

function extractEventName(lines: string[], fullText: string, category: string): ExtractedField {
  for (const line of lines) {
    if (
      /সেমিস্টার ফাইনাল|চূড়ান্ত পরীক্ষা|ভর্তি পরীক্ষা|বার্ষিক ক্রীড়া|সমাবর্তন|Semester Final|Final Examination|Admission Test|Convocation|Orientation Program|Annual Sports|Hackathon|Workshop on/i.test(
        line
      )
    ) {
      return {
        key: 'eventName',
        label: 'Event or Exam Name',
        labelBn: 'অনুষ্ঠান বা পরীক্ষার নাম',
        value: line,
        evidence: matchEvidence(fullText, line, 'Event/Exam Name'),
        status: 'confirmed',
      };
    }
  }

  if (category === 'Examination' || category === 'Admission' || category === 'Event') {
    return {
      key: 'eventName',
      label: 'Event or Exam Name',
      labelBn: 'অনুষ্ঠান বা পরীক্ষার নাম',
      value: `${category} Notice`,
      evidence: null,
      status: 'needs_review',
      explanation: 'Specific event title could not be isolated from the body text.',
    };
  }

  return createNotFoundField('eventName', 'Event or Exam Name', 'অনুষ্ঠান বা পরীক্ষার নাম');
}

function extractDatesClassification(
  dates: ReturnType<typeof extractAllDates>,
  fullText: string
): { deadlineField: ExtractedField; eventDateField: ExtractedField } {
  const deadlines = dates.filter((d) => d.dateType === 'deadline');
  const eventDates = dates.filter((d) => d.dateType === 'event');
  const generalDates = dates.filter((d) => d.dateType === 'general');

  let deadlineField: ExtractedField;
  let eventDateField: ExtractedField;

  // 1. Deadline
  if (deadlines.length > 0) {
    const best = deadlines[0];
    deadlineField = {
      key: 'deadline',
      label: 'Submission / Application Deadline',
      labelBn: 'আবেদনের শেষ তারিখ',
      value: best.normalizedDate,
      evidence: matchEvidence(fullText, best.contextSnippet, best.rawSnippet),
      status: best.isAmbiguous ? 'needs_review' : 'confirmed',
      explanation: best.ambiguityReason,
      isAmbiguous: best.isAmbiguous,
    };
  } else {
    deadlineField = createNotFoundField('deadline', 'Submission / Application Deadline', 'আবেদনের শেষ তারিখ');
  }

  // 2. Event Date
  if (eventDates.length > 0) {
    const best = eventDates[0];
    eventDateField = {
      key: 'eventDate',
      label: 'Event / Examination Date',
      labelBn: 'অনুষ্ঠান বা পরীক্ষার তারিখ',
      value: best.normalizedDate,
      evidence: matchEvidence(fullText, best.contextSnippet, best.rawSnippet),
      status: best.isAmbiguous ? 'needs_review' : 'confirmed',
      explanation: best.ambiguityReason,
      isAmbiguous: best.isAmbiguous,
    };
  } else if (generalDates.length > 0 && deadlineField.status === 'not_found') {
    // If we only have a general date and no deadline, offer it as potential date with review flag
    const best = generalDates[0];
    eventDateField = {
      key: 'eventDate',
      label: 'Event / Examination Date',
      labelBn: 'অনুষ্ঠান বা পরীক্ষার তারিখ',
      value: best.normalizedDate,
      evidence: matchEvidence(fullText, best.contextSnippet, best.rawSnippet),
      status: 'needs_review',
      explanation: 'Date detected in notice text; verify if this corresponds to the event date or publication date.',
      isAmbiguous: true,
    };
  } else {
    eventDateField = createNotFoundField('eventDate', 'Event / Examination Date', 'অনুষ্ঠান বা পরীক্ষার তারিখ');
  }

  return { deadlineField, eventDateField };
}

function extractTimeFields(
  timeRes: ReturnType<typeof extractTime>,
  fullText: string
): { startTimeField: ExtractedField; endTimeField: ExtractedField } {
  if (!timeRes) {
    return {
      startTimeField: createNotFoundField('startTime', 'Start Time', 'শুরুর সময়'),
      endTimeField: createNotFoundField('endTime', 'End Time', 'শেষের সময়'),
    };
  }

  const startTimeField: ExtractedField = {
    key: 'startTime',
    label: 'Start Time',
    labelBn: 'শুরুর সময়',
    value: timeRes.startTime || 'Not specified',
    evidence: matchEvidence(fullText, timeRes.rawSnippet),
    status: timeRes.startTime ? 'confirmed' : 'not_found',
  };

  const endTimeField: ExtractedField = {
    key: 'endTime',
    label: 'End Time',
    labelBn: 'শেষের সময়',
    value: timeRes.endTime || 'Not specified',
    evidence: timeRes.endTime ? matchEvidence(fullText, timeRes.rawSnippet) : null,
    status: timeRes.endTime ? 'confirmed' : 'not_found',
  };

  return { startTimeField, endTimeField };
}

function extractVenue(lines: string[], fullText: string): ExtractedField {
  for (const line of lines) {
    if (
      /কক্ষ নং|রুম নং|অডিটোরিয়াম|মিলনায়তন|ক্যাম্পাস|ভবন|হল|Room No|Room:|Auditorium|Campus|Building|Exam Hall|Conference Hall/i.test(
        line
      )
    ) {
      return {
        key: 'venue',
        label: 'Venue / Room',
        labelBn: 'স্থান / কক্ষ',
        value: line,
        evidence: matchEvidence(fullText, line, 'Venue'),
        status: 'confirmed',
      };
    }
  }

  return createNotFoundField('venue', 'Venue / Room', 'স্থান / কক্ষ');
}

function extractRequiredDocuments(lines: string[], fullText: string): ExtractedField {
  const docs: string[] = [];
  const snippets: string[] = [];

  for (const line of lines) {
    if (
      /প্রবেশপত্র|সনদপত্র|মার্কশিট|ট্রান্সক্রিপ্ট|পাসপোর্ট সাইজ ছবি|ছবি|জাতীয় পরিচয়পত্র|এনআইডি|Admit Card|Photo|Transcript|Certificate|National ID|Registration Card|Pay Slip|Student ID/i.test(
        line
      )
    ) {
      docs.push(line);
      snippets.push(line);
    }
  }

  if (docs.length > 0) {
    return {
      key: 'requiredDocuments',
      label: 'Required Documents / Items',
      labelBn: 'প্রয়োজনীয় কাগজপত্র / প্রমাণক',
      value: docs.join('\n• '),
      evidence: matchEvidence(fullText, snippets[0], 'Documents'),
      status: 'confirmed',
    };
  }

  return createNotFoundField('requiredDocuments', 'Required Documents / Items', 'প্রয়োজনীয় কাগজপত্র / প্রমাণক');
}

function extractFees(lines: string[], fullText: string): ExtractedField {
  for (const line of lines) {
    const normLine = bengaliToEnglishNumerals(line);
    if (/ফি|টাকা|Tk|BDT|\/\=|\/\-/i.test(line) && /\d+/.test(normLine)) {
      const match = normLine.match(/(?:Tk\.?|BDT|ফি|টাকা)?\s*(\d+(?:,\d{3})*(?:\/\=|\/\-)?)\s*(?:টাকা|Tk\.?|BDT)?/i);
      if (match) {
        return {
          key: 'fees',
          label: 'Fees / Payment Amount',
          labelBn: 'ফি / টাকার পরিমাণ',
          value: line.trim(),
          evidence: matchEvidence(fullText, line, 'Fee/Amount'),
          status: 'confirmed',
        };
      }
    }
  }

  return createNotFoundField('fees', 'Fees / Payment Amount', 'ফি / টাকার পরিমাণ');
}

function extractRequiredActions(lines: string[], fullText: string): ExtractedField {
  const actions: string[] = [];

  for (const line of lines) {
    if (
      /আবেদন করতে হবে|জমা দিতে হবে|সংগ্রহ করতে হবে|উপস্থিত থাকতে হবে|প্রবেশ করতে হবে|রেজিস্ট্রেশন করতে হবে|apply online|must submit|must bring|required to report|collect your admit|register at/i.test(
        line
      )
    ) {
      actions.push(line);
    }
  }

  if (actions.length > 0) {
    return {
      key: 'requiredActions',
      label: 'Required Student Actions',
      labelBn: 'শিক্ষার্থীর করণীয়',
      value: actions.map((a) => `• ${a}`).join('\n'),
      evidence: matchEvidence(fullText, actions[0], 'Action Item'),
      status: 'confirmed',
    };
  }

  return createNotFoundField('requiredActions', 'Required Student Actions', 'শিক্ষার্থীর করণীয়');
}

function extractContact(lines: string[], fullText: string): ExtractedField {
  for (const line of lines) {
    const norm = bengaliToEnglishNumerals(line);
    // Phone, helpline, email
    if (
      /যোগাযোগ|ফোন|মোবাইল|ইমেইল|হেল্পলাইন|Contact|Phone|Mobile|Email|Helpline/i.test(line) ||
      /\+?8801\d{9}/.test(norm) ||
      /01\d{9}/.test(norm) ||
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(line)
    ) {
      return {
        key: 'contact',
        label: 'Contact Information / Helpline',
        labelBn: 'যোগাযোগ ও হেল্পলাইন',
        value: line,
        evidence: matchEvidence(fullText, line, 'Contact'),
        status: 'confirmed',
      };
    }
  }

  return createNotFoundField('contact', 'Contact Information / Helpline', 'যোগাযোগ ও হেল্পলাইন');
}

function extractUrl(text: string): ExtractedField {
  const urlMatch = text.match(/\b(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.(?:edu\.bd|ac\.bd|gov\.bd))\b/i);

  if (urlMatch) {
    return {
      key: 'url',
      label: 'Website / Portal Link',
      labelBn: 'অনলাইন পোর্টাল লিংক',
      value: urlMatch[0],
      evidence: matchEvidence(text, urlMatch[0], 'URL'),
      status: 'confirmed',
    };
  }

  return createNotFoundField('url', 'Website / Portal Link', 'অনলাইন পোর্টাল লিংক');
}

function createNotFoundField(key: NoticeFieldKey, label: string, labelBn: string): ExtractedField {
  return {
    key,
    label,
    labelBn,
    value: 'Not found in notice',
    evidence: null,
    status: 'not_found',
  };
}

function createEmptyFields(): Record<NoticeFieldKey, ExtractedField> {
  const keys: { key: NoticeFieldKey; label: string; labelBn: string }[] = [
    { key: 'title', label: 'Notice Title', labelBn: 'বিজ্ঞপ্তির শিরোনাম' },
    { key: 'category', label: 'Notice Category', labelBn: 'বিজ্ঞপ্তির ধরণ' },
    { key: 'institution', label: 'Issuing Institution / Department', labelBn: 'প্রতিষ্ঠান / বিভাগ' },
    { key: 'eventName', label: 'Event or Exam Name', labelBn: 'অনুষ্ঠান বা পরীক্ষার নাম' },
    { key: 'eventDate', label: 'Event / Examination Date', labelBn: 'অনুষ্ঠান বা পরীক্ষার তারিখ' },
    { key: 'startTime', label: 'Start Time', labelBn: 'শুরুর সময়' },
    { key: 'endTime', label: 'End Time', labelBn: 'শেষের সময়' },
    { key: 'venue', label: 'Venue / Room', labelBn: 'স্থান / কক্ষ' },
    { key: 'deadline', label: 'Submission / Application Deadline', labelBn: 'আবেদনের শেষ তারিখ' },
    { key: 'requiredDocuments', label: 'Required Documents / Items', labelBn: 'প্রয়োজনীয় কাগজপত্র / প্রমাণক' },
    { key: 'fees', label: 'Fees / Payment Amount', labelBn: 'ফি / টাকার পরিমাণ' },
    { key: 'requiredActions', label: 'Required Student Actions', labelBn: 'শিক্ষার্থীর করণীয়' },
    { key: 'contact', label: 'Contact Information / Helpline', labelBn: 'যোগাযোগ ও হেল্পলাইন' },
    { key: 'url', label: 'Website / Portal Link', labelBn: 'অনলাইন পোর্টাল লিংক' },
  ];

  const obj = {} as Record<NoticeFieldKey, ExtractedField>;
  for (const item of keys) {
    obj[item.key] = createNotFoundField(item.key, item.label, item.labelBn);
  }
  return obj;
}
