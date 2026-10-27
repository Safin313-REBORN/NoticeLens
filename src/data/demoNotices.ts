export interface DemoNoticeItem {
  id: string;
  title: string;
  titleBn: string;
  category: string;
  language: 'ben' | 'eng' | 'ben+eng';
  description: string;
  ocrText: string;
  svgImageUri?: string;
  notes: string;
}

export const DEMO_NOTICES: DemoNoticeItem[] = [
  {
    id: 'demo-1-bengali-exam',
    title: 'Semester Final Examination Schedule & Rules',
    titleBn: '৪র্থ বর্ষ ৮ম সেমিস্টার ফাইনাল পরীক্ষা ২০২৩-এর সময়সূচী',
    category: 'Examination',
    language: 'ben',
    description: 'Realistic fictional Bengali university examination schedule with venue, admit card requirements, and fees.',
    notes: 'Fictional notice for academic testing and judging demonstration only.',
    ocrText: `ঢাকা বিশ্ববিদ্যালয়
কম্পিউটার বিজ্ঞান ও প্রকৌশল বিভাগ
বিজ্ঞপ্তি

বিষয়: ৪র্থ বর্ষ ৮ম সেমিস্টার ফাইনাল পরীক্ষা ২০২৩-এর সময়সূচী ও নির্দেশিকা

এতদ্বারা কম্পিউটার বিজ্ঞান ও প্রকৌশল বিভাগের সংশ্লিষ্ট সকল শিক্ষার্থীর অবগতির জন্য জানানো যাচ্ছে যে, শিক্ষাবর্ষ ২০২৩ এর ৪র্থ বর্ষ ৮ম সেমিস্টার ফাইনাল পরীক্ষা আগামী ১৫ নভেম্বর ২০২৪ তারিখ হতে শুরু হবে।

পরীক্ষার নির্ধারিত সূচী ও বিবরণ:
১. পরীক্ষার শুরুর তারিখ: ১৫ নভেম্বর ২০২৪
২. প্রতিদিনের সময়: সকাল ১০:০০ হতে দুপুর ১:০০ ঘটিকা পর্যন্ত
৩. পরীক্ষার স্থান: কাজী মোতাহার হোসেন ভবন, কক্ষ নং ৪০২ ও ৪০৩

শিক্ষার্থীদের করণীয় ও জরুরি নির্দেশনা:
• প্রত্যেক শিক্ষার্থীকে অবশ্যই রেজিস্ট্রেশন কার্ড ও মূল প্রবেশপত্র (Admit Card) সাথে আনতে হবে।
• পরীক্ষার ফি বাবদ নির্ধারিত ৫০০/- টাকা আগামী ৫ নভেম্বর ২০২৪ তারিখের মধ্যে বিভাগীয় অফিসে জমা দিতে হবে।
• কোনো প্রকার ইলেকট্রনিক ডিভাইস বা মোবাইল ফোন পরীক্ষা কক্ষে প্রবেশ সম্পূর্ণ নিষিদ্ধ।

যে কোনো জরুরি সহায়তার জন্য বিভাগীয় হেল্পলাইন ০১৭০-০০০০০০ অথবা cse-office@du.ac.bd এ যোগাযোগ করার জন্য অনুরোধ করা হলো।

আদেশক্রমে,
পরীক্ষা নিয়ন্ত্রক কমিটি
ঢাকা বিশ্ববিদ্যালয়`,
  },
  {
    id: 'demo-2-english-event',
    title: 'National Collegiate Innovation Hackathon 2024',
    titleBn: 'ন্যাশনাল কলেজিয়েট ইনোভেশন হ্যাকাথন ২০২৪',
    category: 'Event',
    language: 'eng',
    description: 'Realistic fictional English campus event notice with team registration deadline, dates, venue, and portal URL.',
    notes: 'Fictional notice for academic testing and judging demonstration only.',
    ocrText: `BANGLADESH UNIVERSITY OF ENGINEERING AND TECHNOLOGY (BUET)
DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
OFFICIAL NOTICE

Subject: Registration and Schedule for National Collegiate Innovation Hackathon 2024

We are pleased to announce the National Collegiate Innovation Hackathon 2024, hosted by the Department of CSE, BUET. Undergraduate students across all disciplines are invited to participate.

Key Dates & Schedule:
• Event Date: 22 November 2024 to 24 November 2024
• Start Time: 09:30 AM (Reporting at 08:30 AM)
• Submission & Registration Deadline: 12 November 2024
• Venue: ECE Building Auditorium, BUET West Campus, Dhaka

Registration & Requirements:
• All participants must submit team details through the portal: https://hackathon.buet.ac.bd
• Registration Fee: BDT 1,200 per team of four members
• Required Documents: Valid Student ID card and Dean's recommendation letter

Contact:
For inquiries, contact the Event Secretariat at hackathon@buet.ac.bd or call +880-1811-000000.

Dr. A. K. Rahman
Convener, Event Committee`,
  },
  {
    id: 'demo-3-mixed-admission',
    title: 'Postgraduate Diploma Admission & Scholarship Form',
    titleBn: 'পোস্টগ্র্যাজুয়েট ডিপ্লোমা ভর্তি ও স্কলারশিপ আবেদন বিজ্ঞপ্তি',
    category: 'Admission',
    language: 'ben+eng',
    description: 'Realistic fictional bilingual Bengali-English notice for diploma admission with portal link and certificate requirements.',
    notes: 'Fictional notice for academic testing and judging demonstration only.',
    ocrText: `জাহাঙ্গীরনগর বিশ্ববিদ্যালয়
ইনস্টিটিউট অব ইনফরমেশন টেকনোলজি (IIT)
ADMISSION & SCHOLARSHIP NOTICE — SPRING 2025

পোস্টগ্র্যাজুয়েট ডিপ্লোমা ইন আইটি (PGDIT) প্রোগ্রামে স্প্রিং ২০২৫ সেশনের ভর্তির আবেদন আহবান করা যাচ্ছে।

Important Deadlines & Dates:
• Online Application Deadline (শেষ তারিখ): 28 November 2024
• Admission Written Test: 06 December 2024
• সময়: বিকাল ০৩:০০ ঘটিকা (03:00 PM)
• Exam Venue: IIT Building, Room No. 204, JU Campus

আবেদনের নিয়মাবলী ও প্রয়োজনীয় ডকুমেন্টস:
১. আবেদনকারীকে অবশ্যই অনলাইন পোর্টাল https://admission.juniv.edu মাধ্যমে আবেদন সম্পন্ন করতে হবে।
২. আবেদন ফি বাবদ ১০০০/- টাকা বিকাশ বা রকেটের মাধ্যমে জমা দিতে হবে।
৩. লিখিত পরীক্ষার দিন সাথে আনতে হবে:
   • অনলাইন পূরণকৃত আবেদন ফরমের প্রিন্ট কপি
   • ২ কপি পাসপোর্ট সাইজ রঙিন ছবি (Passport size photo)
   • স্নাতক বা সমমানের মূল মার্কশিট ও এনআইডি কপি

Helpline: ০১৯০০-০০০০০০ (সকাল ৯টা হতে বিকাল ৫টা)
Email: pgdit.admission@juniv.edu`,
  },
];

/**
 * Generates an SVG Data URI representing a university notice paper
 * Useful for instant demonstration without relying on external file loading.
 */
export function generateDemoNoticeSvg(demoItem: DemoNoticeItem): string {
  const isBn = demoItem.language === 'ben' || demoItem.language === 'ben+eng';
  const lines = demoItem.ocrText.split('\n').slice(0, 18);

  const textSvgLines = lines
    .map((line, idx) => {
      const y = 90 + idx * 26;
      const isHeader = idx < 3;
      const fontWeight = isHeader ? 'bold' : 'normal';
      const fontSize = isHeader ? (idx === 0 ? '20' : '17') : '14';
      const fill = isHeader ? '#0f172a' : '#334155';
      const escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<text x="50" y="${y}" font-family="${isBn ? 'Noto Sans Bengali, Inter, sans-serif' : 'Inter, sans-serif'}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}">${escaped}</text>`;
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 650" width="800" height="650">
    <rect width="800" height="650" fill="#ffffff" />
    <rect x="20" y="20" width="760" height="610" fill="#fafafa" stroke="#cbd5e1" stroke-width="2" rx="4" />
    <line x1="50" y1="70" x2="750" y2="70" stroke="#0d9488" stroke-width="3" />
    ${textSvgLines}
    <rect x="50" y="580" width="700" height="28" fill="#f1f5f9" rx="4" />
    <text x="60" y="598" font-family="Inter, sans-serif" font-size="11" fill="#64748b">NoticeLens Test Document • Fictional Academic Demonstration • Not an Official University Notice</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
