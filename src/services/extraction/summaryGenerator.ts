import { ExtractedField, NoticeFieldKey, NoticeSummary } from '../../types/notice';

/**
 * Generates plain, direct, and accessible summaries from extracted fields
 * Strictly adheres to verified evidence without inventing missing information.
 */
export function generateNoticeSummary(
  fields: Record<NoticeFieldKey, ExtractedField>,
  language: 'bn' | 'en' | 'mixed'
): NoticeSummary {
  const isBengali = language === 'bn' || language === 'mixed';

  // 1. Overview
  let overview = '';
  const title = fields.title.status !== 'not_found' ? fields.title.value : '';
  const institution = fields.institution.status !== 'not_found' ? fields.institution.value : '';
  const category = fields.category.value;

  if (isBengali) {
    if (title && institution) {
      overview = `${institution}-এর পক্ষ থেকে "${title}" সংক্রান্ত ${category} বিজ্ঞপ্তি জারি করা হয়েছে।`;
    } else if (title) {
      overview = `নোটিশটি "${title}" সংক্রান্ত ${category} বিষয়ক বিজ্ঞপ্তি।`;
    } else if (institution) {
      overview = `${institution}-এর একটি ${category} বিষয়ক বিজ্ঞপ্তি।`;
    } else {
      overview = `বিজ্ঞপ্তিটি একটি ${category} সংক্রান্ত নোটিশ।`;
    }
  } else {
    if (title && institution) {
      overview = `${institution} has issued a ${category.toLowerCase()} notice regarding "${title}".`;
    } else if (title) {
      overview = `This is a ${category.toLowerCase()} notice concerning "${title}".`;
    } else if (institution) {
      overview = `A ${category.toLowerCase()} notice from ${institution}.`;
    } else {
      overview = `This is a ${category.toLowerCase()} notice.`;
    }
  }

  // 1b. Target Audience (Who is affected)
  let targetAudience: string | null = null;
  const combinedContext = `${title} ${fields.eventName.status !== 'not_found' ? fields.eventName.value : ''}`;
  if (isBengali) {
    const matchYear = combinedContext.match(/(?:৪র্থ|৩য়|২য়|১ম|\d+)\s*বর্ষ|(?:৮ম|৭ম|৬ষ্ঠ|৫ম|৪র্থ|৩য়|২য়|১ম|\d+)\s*সেমিস্টার|স্নাতক|স্নাতকোত্তর|মাস্টার্স/i);
    if (matchYear) {
      targetAudience = `${matchYear[0]}-এর সকল শিক্ষার্থী ও পরীক্ষার্থীবৃন্দ`;
    } else if (category === 'Admission') {
      targetAudience = 'সংশ্লিষ্ট সকল ভর্তিচ্ছু শিক্ষার্থী ও আবেদনকারী';
    } else if (category === 'Scholarship') {
      targetAudience = 'আবেদনকারী ও বৃত্তি প্রত্যাশী শিক্ষার্থীবৃন্দ';
    } else if (category === 'Examination') {
      targetAudience = 'সংশ্লিষ্ট পরীক্ষা সংক্রান্ত সকল শিক্ষার্থীবৃন্দ';
    } else {
      targetAudience = 'বিশ্ববিদ্যালয়ের সংশ্লিষ্ট সকল শিক্ষার্থী ও বিভাগীয় সদস্যবৃন্দ';
    }
  } else {
    const matchYear = combinedContext.match(/(?:\d+(?:st|nd|rd|th)|final|first|second|third|fourth)\s*(?:year|semester)|undergraduate|postgraduate|masters|bachelor/i);
    if (matchYear) {
      targetAudience = `Students of ${matchYear[0]}`;
    } else if (category === 'Admission') {
      targetAudience = 'Prospective applicants & admission candidates';
    } else if (category === 'Scholarship') {
      targetAudience = 'Eligible scholarship applicants & students';
    } else if (category === 'Examination') {
      targetAudience = 'All participating examination candidates';
    } else {
      targetAudience = 'All concerned university students & department stakeholders';
    }
  }

  // 2. Critical Deadline
  let criticalDeadline: string | null = null;
  if (fields.deadline.status !== 'not_found') {
    criticalDeadline = isBengali
      ? `আবেদনের বা কার্যক্রমের শেষ তারিখ: ${fields.deadline.value}`
      : `Critical Submission/Application Deadline: ${fields.deadline.value}`;
  } else if (fields.eventDate.status !== 'not_found') {
    criticalDeadline = isBengali
      ? `প্রধান তারিখ: ${fields.eventDate.value}`
      : `Primary Scheduled Date: ${fields.eventDate.value}`;
  }

  // 3. Action Items
  const actionItems: string[] = [];
  if (fields.requiredActions.status !== 'not_found') {
    const rawActions = fields.requiredActions.value.split('\n');
    for (const action of rawActions) {
      const clean = action.replace(/^[•\-*]\s*/, '').trim();
      if (clean) actionItems.push(clean);
    }
  }

  if (fields.deadline.status !== 'not_found') {
    actionItems.push(
      isBengali
        ? `নির্ধারিত শেষ তারিখ (${fields.deadline.value})-এর পূর্বে আবেদন বা প্রয়োজনীয় প্রক্রিয়া সম্পন্ন করুন।`
        : `Complete necessary application or submission prior to the deadline: ${fields.deadline.value}.`
    );
  }

  if (fields.fees.status !== 'not_found') {
    actionItems.push(
      isBengali
        ? `প্রদেয় ফি পরিশোধ নিশ্চিত করুন (${fields.fees.value})।`
        : `Pay required fee amount: ${fields.fees.value}.`
    );
  }

  if (actionItems.length === 0) {
    actionItems.push(
      isBengali
        ? 'বিজ্ঞপ্তিতে সরাসরি কোনো একক অ্যাকশন নির্দেশ চিহ্নিত হয়নি; বিস্তারিত পাঠ পর্যালোচনা করুন।'
        : 'No explicit urgent student action step was isolated in the notice text.'
    );
  }

  // 4. Venue and Time
  let venueAndTime: string | null = null;
  const venue = fields.venue.status !== 'not_found' ? fields.venue.value : null;
  const time =
    fields.startTime.status !== 'not_found'
      ? `${fields.startTime.value}${fields.endTime.status !== 'not_found' ? ` to ${fields.endTime.value}` : ''}`
      : null;
  const date = fields.eventDate.status !== 'not_found' ? fields.eventDate.value : null;

  const parts: string[] = [];
  if (date) parts.push(isBengali ? `তারিখ: ${date}` : `Date: ${date}`);
  if (time) parts.push(isBengali ? `সময়: ${time}` : `Time: ${time}`);
  if (venue) parts.push(isBengali ? `স্থান: ${venue}` : `Venue: ${venue}`);

  if (parts.length > 0) {
    venueAndTime = parts.join(' | ');
  }

  // 5. Required Documents
  const requiredDocs: string[] = [];
  if (fields.requiredDocuments.status !== 'not_found') {
    const rawDocs = fields.requiredDocuments.value.split('\n');
    for (const d of rawDocs) {
      const clean = d.replace(/^[•\-*]\s*/, '').trim();
      if (clean) requiredDocs.push(clean);
    }
  }

  // 6. Unverified or Missing information
  const unverifiedOrMissing: string[] = [];

  // Check critical fields
  if (fields.deadline.status === 'not_found' && fields.eventDate.status === 'not_found') {
    unverifiedOrMissing.push(
      isBengali
        ? 'কোনো সুনির্দিষ্ট সময়সীমা বা পরীক্ষার তারিখ নোটিশে পাওয়া যায়নি।'
        : 'No specific deadline or event date was identified in the notice.'
    );
  } else if (fields.deadline.status === 'needs_review' || fields.deadline.isAmbiguous) {
    unverifiedOrMissing.push(
      isBengali
        ? `সময়সীমার তারিখটিতে স্পষ্টতা প্রয়োজন (${fields.deadline.explanation || 'মূল পাঠ মিলিয়ে দেখুন'})।`
        : `Deadline requires review (${fields.deadline.explanation || 'verify against original notice'}).`
    );
  }

  if (fields.venue.status === 'not_found' && (category === 'Examination' || category === 'Event')) {
    unverifiedOrMissing.push(
      isBengali
        ? 'পরীক্ষা বা অনুষ্ঠানের নির্ধারিত স্থান বা কক্ষ নম্বর উল্লেখ পাওয়া যায়নি।'
        : 'Specific room number or examination hall was not identified.'
    );
  }

  if (fields.institution.status === 'not_found') {
    unverifiedOrMissing.push(
      isBengali
        ? 'বিজ্ঞপ্তি প্রদানকারী প্রতিষ্ঠান বা বিভাগের নাম স্পষ্ট নয়।'
        : 'Issuing department or university header could not be verified.'
    );
  }

  return {
    overview,
    targetAudience,
    criticalDeadline,
    actionItems,
    venueAndTime,
    requiredDocs,
    unverifiedOrMissing,
    language,
  };
}
