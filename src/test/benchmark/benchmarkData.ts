/**
 * NoticeLens Ground-Truth Benchmarking Dataset (Pilot Corpus, N = 6)
 * 
 * Standardized institutional notice corpus spanning authentic Bangladeshi formats:
 * - Bengali examination and departmental notices (Dhaka University, Khulna University)
 * - English hackathon, event, and scholarship circulars (BUET, BRAC University)
 * - Bilingual (Bengali + English) mixed university circulars (Jahangirnagar University, Rajshahi University)
 * 
 * Each document contains:
 * - Unique ID
 * - Language designation
 * - Category
 * - Ground-truth transcript (rawText)
 * - Genuine image fixture path in src/test/benchmark/fixtures/
 * - Image metadata (resolution, dimensions, DPI, font, capture mode)
 * - Dataset provenance and synthetic designation
 * - Expected gold-standard structured fields
 * - Gold evidence annotations with target associations
 * - Verified actual Tesseract.js recognition transcript snapshots
 */

export interface GoldEvidenceAnnotation {
  fieldKey: string;
  expectedSnippet: string;
  semanticTarget: string;
}

export interface GroundTruthNotice {
  id: string;
  name: string;
  language: 'ben' | 'eng' | 'ben+eng';
  category: 'Examination' | 'Event' | 'Admission' | 'General';
  rawText: string;
  actualOcrTranscript: string; // Genuine Tesseract recognition text from live image OCR
  imageFixturePath: string;
  imageMetadata: {
    width: number;
    height: number;
    dpi: number;
    format: 'png';
    captureType: 'clean_render' | 'camera_photo_simulation';
    fontFamily: string;
  };
  provenance: string;
  isSynthetic: boolean; // Controlled synthetic documents modeled on authentic university notices
  expectedFields: {
    title?: string;
    category: string;
    institution: string;
    deadline?: string;
    eventDate?: string;
    venue?: string;
    fees?: string;
    requiredDocuments?: string;
    contact?: string;
  };
  goldEvidenceAnnotations: GoldEvidenceAnnotation[];
  expectedEvidenceSnippets: string[];
}

export const BENCHMARK_DATASET: GroundTruthNotice[] = [
  {
    id: 'DOC-01',
    name: 'DU CSE 8th Semester Exam Circular (Bengali)',
    language: 'ben',
    category: 'Examination',
    imageFixturePath: 'src/test/benchmark/fixtures/DOC-01.png',
    imageMetadata: {
      width: 900,
      height: 1200,
      dpi: 150,
      format: 'png',
      captureType: 'clean_render',
      fontFamily: "'Noto Serif Bengali', 'Noto Sans Bengali', serif",
    },
    provenance: 'Controlled synthetic notice modeled on University of Dhaka Faculty of Science departmental circulars.',
    isSynthetic: true,
    rawText: `ঢাকা বিশ্ববিদ্যালয়
কম্পিউটার বিজ্ঞান ও প্রকৌশল বিভাগ
বিজ্ঞপ্তি

বিষয়: ৪র্থ বর্ষ ৮ম সেমিস্টার ফাইনাল পরীক্ষা সংক্রান্ত।

এতদ্বারা কম্পিউটার বিজ্ঞান ও প্রকৌশল বিভাগের সংশ্লিষ্ট সকল শিক্ষার্থীর অবগতির জন্য জানানো যাচ্ছে যে, শিক্ষাবর্ষ ২০২৩ এর ৪র্থ বর্ষ ৮ম সেমিস্টার ফাইনাল পরীক্ষা আগামী ১৫ নভেম্বর ২০২৪ তারিখ হতে শুরু হবে।

জরুরি নির্দেশনাবলী:
• পরীক্ষার ফি বাবদ নির্ধারিত ৫০০/- টাকা আগামী ৫ নভেম্বর ২০২৪ তারিখের মধ্যে বিভাগীয় অফিসে জমা দিতে হবে।
• প্রবেশপত্র সংগ্রহের জন্য বিভাগীয় কার্যালয়ে যোগাযোগ করতে হবে।
• পরীক্ষার শুরুর তারিখ: ১৫ নভেম্বর ২০২৪
• পরীক্ষার স্থান: ড. কুদরত-এ-খুদা ভবন, কক্ষ নং ৪০২ ও ৪০৩

স্বাক্ষরিত:
পরীক্ষা নিয়ন্ত্রক
ঢাকা বিশ্ববিদ্যালয়`,
    actualOcrTranscript: `1
ঢাকা বিশ্ববিদ্যালয়
কম্পিউটার বিজ্ঞান ও প্রকৌশল বিভাগ
[দম
| বিষয়: ৪র্থ বর্ষ ৮ম সেমিস্টার ফাইনাল পরীক্ষা সংক্রান্ত
এতদ্বারা কম্পিউটার বিজ্ঞান ও প্রকৌশল বিভাগের সংশ্লিষ্ট সকল শিক্ষার্থীর অবগতির জন্য জানানো যাচ্ছে যে, শিক্ষাবর্ষ ২০২৩ এর
৪র্থ বর্ষ ৮ম সেমিস্টার ফাইনাল পরীক্ষা আগামী ১৫ নভেম্বর ২০২৪ তারিখ হতে শুরু হবে।
জরুরি নির্দেশনাবলী:
* পরীক্ষার ফি বাবদ নির্ধারিত ৫০০/- টাকা আগামী ৫ নভেম্বর ২০২৪ তারিখের মধ্যে বিভাগীয় অফিসে জমা দিতে হবে।
* প্রবেশপত্র সংগ্রহের জন্য বিভাগীয় কার্যালয়ে যোগাযোগ করতে হবে।
* পরীক্ষার শুরুর তারিখ: ১৫ নভেম্বর ২০২৪
* পরীক্ষার স্থান: ড. কুদরত-এ-খুদা ভবন, কক্ষ নং ৪০২ ও ৪০৩
স্বাক্ষরিত:
পরীক্ষা নিয়ন্ত্রক
ঢাকা বিশ্ববিদ্যালয়`,
    expectedFields: {
      title: '৪র্থ বর্ষ ৮ম সেমিস্টার ফাইনাল পরীক্ষা',
      category: 'Examination',
      institution: 'ঢাকা বিশ্ববিদ্যালয়',
      deadline: '5 November 2024',
      eventDate: '15 November 2024',
      venue: 'ড. কুদরত-এ-খুদা ভবন, কক্ষ নং ৪০২ ও ৪০৩',
      fees: '৫০০/-',
      requiredDocuments: 'প্রবেশপত্র',
    },
    goldEvidenceAnnotations: [
      {
        fieldKey: 'institution',
        expectedSnippet: 'ঢাকা বিশ্ববিদ্যালয়',
        semanticTarget: 'Issuing university name in header',
      },
      {
        fieldKey: 'deadline',
        expectedSnippet: '৫ নভেম্বর ২০২৪',
        semanticTarget: 'Fee submission deadline',
      },
      {
        fieldKey: 'eventDate',
        expectedSnippet: '১৫ নভেম্বর ২০২৪',
        semanticTarget: 'Examination commencement date',
      },
      {
        fieldKey: 'venue',
        expectedSnippet: 'ড. কুদরত-এ-খুদা ভবন, কক্ষ নং ৪০২ ও ৪০৩',
        semanticTarget: 'Examination venue and room numbers',
      },
      {
        fieldKey: 'fees',
        expectedSnippet: '৫০০/- টাকা',
        semanticTarget: 'Examination fee amount',
      },
      {
        fieldKey: 'requiredDocuments',
        expectedSnippet: 'প্রবেশপত্র',
        semanticTarget: 'Admit card document requirement',
      },
    ],
    expectedEvidenceSnippets: [
      'পরীক্ষার ফি বাবদ নির্ধারিত ৫০০/- টাকা',
      'আগামী ৫ নভেম্বর ২০২৪',
      'কক্ষ নং ৪০২ ও ৪০৩',
    ],
  },
  {
    id: 'DOC-02',
    name: 'BUET CSE Hackathon 2024 Announcement (English)',
    language: 'eng',
    category: 'Event',
    imageFixturePath: 'src/test/benchmark/fixtures/DOC-02.png',
    imageMetadata: {
      width: 900,
      height: 1100,
      dpi: 150,
      format: 'png',
      captureType: 'clean_render',
      fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
    },
    provenance: 'Controlled synthetic notice modeled on BUET Department of Computer Science & Engineering official notices.',
    isSynthetic: true,
    rawText: `BANGLADESH UNIVERSITY OF ENGINEERING AND TECHNOLOGY (BUET)
DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
OFFICIAL NOTICE

HACKATHON 2024: INNOVATIONS FOR ACCESSIBILITY

We are pleased to announce the Annual Inter-University Hackathon 2024 scheduled to take place on 2 November 2024 at the ECE Building Auditorium.

KEY DEADLINES & REQUIREMENTS:
1. Team Registration Deadline: 25 October 2024 (11:59 PM BST) via the online portal.
2. Event Date: 2 November 2024, reporting time 8:30 AM.
3. Venue: ECE Building Auditorium, BUET West Campus.
4. Required Documents: Valid Student ID card and printed registration slip.
5. Registration Fee: Free for all accredited university students.

Portal URL: https://hackathon.buet.ac.bd
For inquiries: hackathon@cse.buet.ac.bd`,
    actualOcrTranscript: `BANGLADESH UNIVERSITY OF ENGINEERING AND
TECHNOLOGY (BUET)
DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
| oFFiciAL NOTICE |
| HACKATHON 2024: INNOVATIONS FOR ACCESSIBILITY
We are pleased to announce the Annual Inter-University Hackathon 2024 scheduled to take place on
2 November 2024 at the ECE Building Auditorium.
KEY DEADLINES & REQUIREMENTS:
1. Team Registration Deadline: 25 October 2024 (11:59 PM BST) via the online portal.
2. Event Date: 2 November 2024, reporting time 8:30 AM.
3. Venue: ECE Building Auditorium, BUET West Campus.
4. Required Documents: Valid Student ID card and printed registration slip.
5. Registration Fee: Free for all accredited university students.
Portal URL: https://hackathon.buet.ac.bd
For inquiries: hackathon@cse.buet.ac.bd`,
    expectedFields: {
      title: 'HACKATHON 2024: INNOVATIONS FOR ACCESSIBILITY',
      category: 'Event',
      institution: 'BANGLADESH UNIVERSITY OF ENGINEERING AND TECHNOLOGY (BUET)',
      deadline: '25 October 2024',
      eventDate: '2 November 2024',
      venue: 'ECE Building Auditorium, BUET West Campus',
      fees: 'Free',
      requiredDocuments: 'Student ID card',
      contact: 'hackathon@cse.buet.ac.bd',
    },
    goldEvidenceAnnotations: [
      {
        fieldKey: 'institution',
        expectedSnippet: 'BANGLADESH UNIVERSITY OF ENGINEERING AND TECHNOLOGY (BUET)',
        semanticTarget: 'Host university header',
      },
      {
        fieldKey: 'deadline',
        expectedSnippet: '25 October 2024',
        semanticTarget: 'Team registration deadline',
      },
      {
        fieldKey: 'eventDate',
        expectedSnippet: '2 November 2024',
        semanticTarget: 'Hackathon date',
      },
      {
        fieldKey: 'venue',
        expectedSnippet: 'ECE Building Auditorium, BUET West Campus',
        semanticTarget: 'Event location',
      },
      {
        fieldKey: 'fees',
        expectedSnippet: 'Free',
        semanticTarget: 'Free registration indication',
      },
      {
        fieldKey: 'requiredDocuments',
        expectedSnippet: 'Student ID card',
        semanticTarget: 'Mandatory identification',
      },
      {
        fieldKey: 'contact',
        expectedSnippet: 'hackathon@cse.buet.ac.bd',
        semanticTarget: 'Inquiry email address',
      },
    ],
    expectedEvidenceSnippets: [
      'Registration Deadline: 25 October 2024',
      'ECE Building Auditorium',
      'hackathon.buet.ac.bd',
    ],
  },
  {
    id: 'DOC-03',
    name: 'JU IIT Postgraduate Admission Circular (Mixed)',
    language: 'ben+eng',
    category: 'Admission',
    imageFixturePath: 'src/test/benchmark/fixtures/DOC-03.png',
    imageMetadata: {
      width: 900,
      height: 1050,
      dpi: 150,
      format: 'png',
      captureType: 'clean_render',
      fontFamily: "'Noto Sans Bengali', 'Arial', sans-serif",
    },
    provenance: 'Controlled synthetic notice modeled on Jahangirnagar University IIT postgraduate program circulars.',
    isSynthetic: true,
    rawText: `জাহাঙ্গীরনগর বিশ্ববিদ্যালয়
ইনস্টিটিউট অব ইনফরমেশন টেকনোলজি (IIT)
ADMISSION & SCHOLARSHIP NOTICE — SPRING 2025

পোস্টগ্র্যাজুয়েট ডিপ্লোমা ইন আইটি (PGDIT) ভর্তি বিজ্ঞপ্তি

১. আবেদনের শেষ তারিখ (Application Deadline): 10 December 2024
২. ভর্তি পরীক্ষা ও সাক্ষাৎকার (Admission Test): 20 December 2024, সকাল ১০:০০ টা
৩. পরীক্ষার স্থান (Venue): IIT Building, Room No. 204
৪. আবেদন ফি (Application Fee): ১২০০/- টাকা (বিকাশ বা রকেটের মাধ্যমে প্রদেয়)
৫. প্রয়োজনীয় কাগজপত্র: সকল পরীক্ষার মার্কশিট ও সার্টিফিকেটের সত্যায়িত কপি।

Apply online: https://admission.juniv.edu`,
    actualOcrTranscript: `জাহাঙ্গীরনগর বিশ্ববিদ্যালয়
ইনস্টিটিউট অব ইনফরমেশন টেকনোলজি (IT)
| ADMISSION & SCHOLARSHIP NOTICE — SPRING 2025 |

| পোস্টগ্র্যাজুয়েট ডিপ্লোমা ইন আইটি (PGDIT) ভর্তি বিজ্ঞপ্তি

1. আবেদনের শেষ তারিখ (Application Deadline): 10 December 2024

2. ভর্তি পরীক্ষা ও সাক্ষাৎকার (Admission Test): 20 December 2024, সকাল ১০:০০ টা

3. পরীক্ষার স্থান (Venue): IIT Building, Room No. 204

4. আবেদন ফি (Application Fee): ১২০০/- টাকা (বিকাশ বা রকেটের মাধ্যমে প্রদেয়)

5. প্রয়োজনীয় কাগজপত্র: সকল পরীক্ষার মার্কশিট ও সার্টিফিকেটের সত্যায়িত কপি।
Apply online: https://admission.juniv.edu`,
    expectedFields: {
      title: 'পোস্টগ্র্যাজুয়েট ডিপ্লোমা ইন আইটি (PGDIT) ভর্তি বিজ্ঞপ্তি',
      category: 'Admission',
      institution: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয়',
      deadline: '10 December 2024',
      eventDate: '20 December 2024',
      venue: 'IIT Building, Room No. 204',
      fees: '১২০০/-',
      requiredDocuments: 'মার্কশিট',
    },
    goldEvidenceAnnotations: [
      {
        fieldKey: 'institution',
        expectedSnippet: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয়',
        semanticTarget: 'University institution',
      },
      {
        fieldKey: 'deadline',
        expectedSnippet: '10 December 2024',
        semanticTarget: 'Application deadline date',
      },
      {
        fieldKey: 'eventDate',
        expectedSnippet: '20 December 2024',
        semanticTarget: 'Admission test date',
      },
      {
        fieldKey: 'venue',
        expectedSnippet: 'IIT Building, Room No. 204',
        semanticTarget: 'Exam building and room',
      },
      {
        fieldKey: 'fees',
        expectedSnippet: '১২০০/- টাকা',
        semanticTarget: 'Application fee amount',
      },
      {
        fieldKey: 'requiredDocuments',
        expectedSnippet: 'মার্কশিট',
        semanticTarget: 'Required marksheet certificates',
      },
    ],
    expectedEvidenceSnippets: [
      'Application Deadline): 10 December 2024',
      'Room No. 204',
      '১২০০/- টাকা',
    ],
  },
  {
    id: 'DOC-04',
    name: 'Khulna University Course Enrollment Notice (Bengali)',
    language: 'ben',
    category: 'General',
    imageFixturePath: 'src/test/benchmark/fixtures/DOC-04.png',
    imageMetadata: {
      width: 900,
      height: 1050,
      dpi: 150,
      format: 'png',
      captureType: 'camera_photo_simulation',
      fontFamily: "'Noto Serif Bengali', 'Georgia', serif",
    },
    provenance: 'Controlled synthetic notice simulating a camera-captured printed notice with subtle lighting gradient and border perspective.',
    isSynthetic: true,
    rawText: `খুলনা বিশ্ববিদ্যালয়
কম্পিউটার সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং ডিসিপ্লিন
জরুরি বিজ্ঞপ্তি

শিক্ষাবর্ষ ২০২৪-২০২৫ এর সকল নিয়মিত শিক্ষার্থীদের জানানো যাচ্ছে যে, আগামী সেমিস্টারের কোর্স রেজিস্ট্রেশন শুরু হয়েছে।

গুরুত্বপূর্ণ সময়সূচী:
• সাধারণ রেজিস্ট্রেশনের শেষ তারিখ: ১২ ডিসেম্বর ২০২৪
• বিলম্ব ফিসহ রেজিস্ট্রেশনের শেষ তারিখ: ১৮ ডিসেম্বর ২০২৪
• রেজিস্ট্রেশন ফি: ৭৫০/- টাকা
• জমা দেওয়ার স্থান: ডিসিপ্লিন অফিস, একাডেমিক ভবন-২

সকল শিক্ষার্থীকে নির্ধারিত সময়ের মধ্যে ফি পরিশোধ করে রেজিস্ট্রেশন সম্পন্ন করতে অনুরোধ করা হলো।`,
    actualOcrTranscript: `খুলনা বিশ্ববিদ্যালয়
কম্পিউটার সায়েন্স আযান্ড ইঞ্জিনিয়ারিং ডিসিপ্লিন
চা

শিক্ষাবর্ষ ২০২৪-২০২৫ এর সকল নিয়মিত শিক্ষার্থীদের জানানো যাচ্ছে যে, আগামী সেমিস্টারের কোর্স রেজিস্ট্রেশন শুরু হয়েছে
গুরুত্বপূর্ণ সময়সূচী:

* সাধারণ রেজিস্ট্রেশনের শেষ তারিখ: ১২ ডিসেম্বর ২০২৪

* বিলম্ব ফিসহ রেজিস্ট্রেশনের শেষ তারিখ: ১৮ ডিসেম্বর ২০২৪

* রেজিস্ট্রেশন ফি: ৭৫০/- টাকা

* জমা দেওয়ার স্থান: ডিসিপ্লিন অফিস, একাডেমিক ভবন-২
সকল শিক্ষার্থীকে নির্ধারিত সময়ের মধ্যে ফি পরিশোধ করে রেজিস্ট্রেশন সম্পন্ন করতে অনুরোধ করা হলো।

4 জজ`,
    expectedFields: {
      title: 'জরুরি বিজ্ঞপ্তি',
      category: 'General',
      institution: 'খুলনা বিশ্ববিদ্যালয়',
      deadline: '12 December 2024',
      venue: 'একাডেমিক ভবন-২',
      fees: '৭৫০/-',
    },
    goldEvidenceAnnotations: [
      {
        fieldKey: 'institution',
        expectedSnippet: 'খুলনা বিশ্ববিদ্যালয়',
        semanticTarget: 'Issuing university name',
      },
      {
        fieldKey: 'deadline',
        expectedSnippet: '১২ ডিসেম্বর ২০২৪',
        semanticTarget: 'General registration deadline',
      },
      {
        fieldKey: 'venue',
        expectedSnippet: 'একাডেমিক ভবন-২',
        semanticTarget: 'Discipline office location',
      },
      {
        fieldKey: 'fees',
        expectedSnippet: '৭৫০/- টাকা',
        semanticTarget: 'Registration fee amount',
      },
    ],
    expectedEvidenceSnippets: [
      '১২ ডিসেম্বর ২০২৪',
      '৭৫০/- টাকা',
      'একাডেমিক ভবন-২',
    ],
  },
  {
    id: 'DOC-05',
    name: 'BRAC University Merit Scholarship Circular (English)',
    language: 'eng',
    category: 'Admission',
    imageFixturePath: 'src/test/benchmark/fixtures/DOC-05.png',
    imageMetadata: {
      width: 900,
      height: 1100,
      dpi: 150,
      format: 'png',
      captureType: 'clean_render',
      fontFamily: "'Trebuchet MS', 'Arial', sans-serif",
    },
    provenance: 'Controlled synthetic notice modeled on BRAC University Financial Aid and Scholarship notices.',
    isSynthetic: true,
    rawText: `BRAC UNIVERSITY
OFFICE OF STUDENT AFFAIRS & FINANCIAL AID
SCHOLARSHIP CIRCULAR — SPRING 2025

Applications are invited from eligible students for Merit-Based Tuition Scholarships for Spring 2025.

ELIGIBILITY & SUBMISSION DETAILS:
1. Application Deadline: 15 January 2025 by 4:00 PM.
2. Required Documents:
   - Official Academic Transcript (Minimum CGPA 3.80)
   - Two Letters of Recommendation
   - Student Identification Card copy
3. Submission Procedure: Submit dossier to Financial Aid Office, Building UB-02.
4. Contact: financialaid@bracu.ac.bd | Phone: 09612345678`,
    actualOcrTranscript: `BRAC UNIVERSITY
OFFICE OF STUDENT AFFAIRS & FINANCIAL AID
SCHOLARSHIP CIRCULAR — SPRING 2025
Applications are invited from eligible students for Merit-Based Tuition Scholarships for Spring 2025.
ELIGIBILITY & SUBMISSION DETAILS:
1. Application Deadline: 15 January 2025 by 4:00 PM.
2. Required Documents:
© Official Academic Transcript (Minimum CGPA 3.80)
© Two Letters of Recommendation
© Student Identification Card copy
3. Submission Procedure: Submit dossier to Financial Aid Office, Building UB-02.
4. Contact: financialaid@bracu.ac.bd | Phone: 09612345678`,
    expectedFields: {
      title: 'SCHOLARSHIP CIRCULAR — SPRING 2025',
      category: 'Admission',
      institution: 'BRAC UNIVERSITY',
      deadline: '15 January 2025',
      venue: 'Financial Aid Office, Building UB-02',
      requiredDocuments: 'Academic Transcript',
      contact: 'financialaid@bracu.ac.bd',
    },
    goldEvidenceAnnotations: [
      {
        fieldKey: 'institution',
        expectedSnippet: 'BRAC UNIVERSITY',
        semanticTarget: 'University header',
      },
      {
        fieldKey: 'deadline',
        expectedSnippet: '15 January 2025',
        semanticTarget: 'Scholarship application deadline',
      },
      {
        fieldKey: 'venue',
        expectedSnippet: 'Financial Aid Office, Building UB-02',
        semanticTarget: 'Dossier submission office',
      },
      {
        fieldKey: 'requiredDocuments',
        expectedSnippet: 'Official Academic Transcript',
        semanticTarget: 'Prerequisite document requirement',
      },
      {
        fieldKey: 'contact',
        expectedSnippet: 'financialaid@bracu.ac.bd',
        semanticTarget: 'Contact email',
      },
    ],
    expectedEvidenceSnippets: [
      'Application Deadline: 15 January 2025',
      'Academic Transcript',
      'financialaid@bracu.ac.bd',
    ],
  },
  {
    id: 'DOC-06',
    name: 'Rajshahi University Academic Schedule (Mixed Table)',
    language: 'ben+eng',
    category: 'Examination',
    imageFixturePath: 'src/test/benchmark/fixtures/DOC-06.png',
    imageMetadata: {
      width: 900,
      height: 1000,
      dpi: 150,
      format: 'png',
      captureType: 'clean_render',
      fontFamily: "'Noto Sans Bengali', 'Arial', sans-serif",
    },
    provenance: 'Controlled synthetic notice modeled on University of Rajshahi Faculty of Engineering departmental circulars.',
    isSynthetic: true,
    rawText: `রাজশাহী বিশ্ববিদ্যালয়
ফলিত পদার্থবিজ্ঞান ও ইলেকট্রনিক ইঞ্জিনিয়ারিং বিভাগ
পরীক্ষা ও ক্লাস নোটিশ

সংশ্লিষ্ট সকল শিক্ষার্থীকে জানানো যাচ্ছে যে ২০২৪ শিক্ষাবর্ষের সূচী নিম্নরূপ:
১. ফর্ম পূরণ শেষ তারিখ (Form Fill-up Deadline): 28 November 2024
২. ব্যবহারিক পরীক্ষা (Practical Exam): 12 December 2024
৩. পরীক্ষার ফি (Exam Fee): ৯০০/- টাকা
৪. স্থান: তৃতীয় বিজ্ঞান ভবন, ল্যাবরেটরি ৩

অনুরোধক্রমে: বিভাগীয় প্রধান
রাজশাহী বিশ্ববিদ্যালয়`,
    actualOcrTranscript: `রাজশাহী বিশ্ববিদ্যালয়
ফলিত পদার্থবিজ্ঞান ও ইলেকট্রনিক ইঞ্জিনিয়ারিং বিভাগ
[ পরীক্ষা ওক্লাস নোটিশ |
সংশ্লিষ্ট সকল শিক্ষার্থীকে জানানো যাচ্ছে যে ২০২৪ শিক্ষাবর্ষের সূচী নিম্নরূপ:
1. ফর্ম পূরণ শেষ তারিখ (Form Fill-up Deadline): 28 November 2024
2. ব্যবহারিক পরীক্ষা (Practical Exam): 12 December 2024
3. পরীক্ষার ফি (Exam Fee): ৯০০/- টাকা
4. স্থান: তৃতীয় বিজ্ঞান ভবন, ল্যাবরেটরি ৩
অনুরোধক্রমে: বিভাগীয় প্রধান
রাজশাহী বিশ্ববিদ্যালয়`,
    expectedFields: {
      title: 'পরীক্ষা ও ক্লাস নোটিশ',
      category: 'Examination',
      institution: 'রাজশাহী বিশ্ববিদ্যালয়',
      deadline: '28 November 2024',
      eventDate: '12 December 2024',
      venue: 'তৃতীয় বিজ্ঞান ভবন',
      fees: '৯০০/-',
    },
    goldEvidenceAnnotations: [
      {
        fieldKey: 'institution',
        expectedSnippet: 'রাজশাহী বিশ্ববিদ্যালয়',
        semanticTarget: 'University signature and header',
      },
      {
        fieldKey: 'deadline',
        expectedSnippet: '28 November 2024',
        semanticTarget: 'Form fill-up deadline',
      },
      {
        fieldKey: 'eventDate',
        expectedSnippet: '12 December 2024',
        semanticTarget: 'Practical examination date',
      },
      {
        fieldKey: 'venue',
        expectedSnippet: 'তৃতীয় বিজ্ঞান ভবন, ল্যাবরেটরি ৩',
        semanticTarget: 'Lab examination location',
      },
      {
        fieldKey: 'fees',
        expectedSnippet: '৯০০/- টাকা',
        semanticTarget: 'Exam fee amount',
      },
    ],
    expectedEvidenceSnippets: [
      'Deadline): 28 November 2024',
      '৯০০/- টাকা',
      'তৃতীয় বিজ্ঞান ভবন',
    ],
  },
];
