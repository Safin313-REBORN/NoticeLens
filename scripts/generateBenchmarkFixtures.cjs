/**
 * Benchmark Image Fixture Generator
 * Renders authentic institutional notices to PNG image fixtures using Google Chrome headless.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FIXTURES_DIR = path.resolve(__dirname, '../src/test/benchmark/fixtures');
if (!fs.existsSync(FIXTURES_DIR)) {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

function resolveChromeBinary() {
  const candidates = [
    process.env.CHROME_BIN,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome-stable',
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Chrome/Chromium binary not found.');
}

const chromeBin = resolveChromeBinary();

const documents = [
  {
    id: 'DOC-01',
    filename: 'DOC-01.png',
    title: 'ঢাকা বিশ্ববিদ্যালয় — পরীক্ষা বিজ্ঞপ্তি',
    bodyHtml: `
      <div class="header">
        <div class="inst-logo">🏛️</div>
        <h1 class="inst-name">ঢাকা বিশ্ববিদ্যালয়</h1>
        <h2 class="dept-name">কম্পিউটার বিজ্ঞান ও প্রকৌশল বিভাগ</h2>
        <div class="notice-badge">বিজ্ঞপ্তি</div>
      </div>
      <div class="subject"><strong>বিষয়:</strong> ৪র্থ বর্ষ ৮ম সেমিস্টার ফাইনাল পরীক্ষা সংক্রান্ত।</div>
      <div class="body-text">
        <p>এতদ্বারা কম্পিউটার বিজ্ঞান ও প্রকৌশল বিভাগের সংশ্লিষ্ট সকল শিক্ষার্থীর অবগতির জন্য জানানো যাচ্ছে যে, শিক্ষাবর্ষ ২০২৩ এর ৪র্থ বর্ষ ৮ম সেমিস্টার ফাইনাল পরীক্ষা আগামী ১৫ নভেম্বর ২০২৪ তারিখ হতে শুরু হবে।</p>
        <p><strong>জরুরি নির্দেশনাবলী:</strong></p>
        <ul>
          <li>পরীক্ষার ফি বাবদ নির্ধারিত ৫০০/- টাকা আগামী ৫ নভেম্বর ২০২৪ তারিখের মধ্যে বিভাগীয় অফিসে জমা দিতে হবে।</li>
          <li>প্রবেশপত্র সংগ্রহের জন্য বিভাগীয় কার্যালয়ে যোগাযোগ করতে হবে।</li>
          <li>পরীক্ষার শুরুর তারিখ: ১৫ নভেম্বর ২০২৪</li>
          <li>পরীক্ষার স্থান: ড. কুদরত-এ-খুদা ভবন, কক্ষ নং ৪০২ ও ৪০৩</li>
        </ul>
      </div>
      <div class="signature">
        <p>স্বাক্ষরিত:</p>
        <p class="sig-title">পরীক্ষা নিয়ন্ত্রক</p>
        <p>ঢাকা বিশ্ববিদ্যালয়</p>
      </div>
    `,
    fontFamily: "'Noto Serif Bengali', 'Noto Sans Bengali', serif",
    width: 900,
    height: 1200,
  },
  {
    id: 'DOC-02',
    filename: 'DOC-02.png',
    title: 'BUET CSE Hackathon 2024 Announcement',
    bodyHtml: `
      <div class="header">
        <h1 class="inst-name">BANGLADESH UNIVERSITY OF ENGINEERING AND TECHNOLOGY (BUET)</h1>
        <h2 class="dept-name">DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING</h2>
        <div class="notice-badge">OFFICIAL NOTICE</div>
      </div>
      <div class="subject"><strong>HACKATHON 2024: INNOVATIONS FOR ACCESSIBILITY</strong></div>
      <div class="body-text">
        <p>We are pleased to announce the Annual Inter-University Hackathon 2024 scheduled to take place on 2 November 2024 at the ECE Building Auditorium.</p>
        <p><strong>KEY DEADLINES & REQUIREMENTS:</strong></p>
        <ol>
          <li>Team Registration Deadline: 25 October 2024 (11:59 PM BST) via the online portal.</li>
          <li>Event Date: 2 November 2024, reporting time 8:30 AM.</li>
          <li>Venue: ECE Building Auditorium, BUET West Campus.</li>
          <li>Required Documents: Valid Student ID card and printed registration slip.</li>
          <li>Registration Fee: Free for all accredited university students.</li>
        </ol>
        <p class="meta">Portal URL: https://hackathon.buet.ac.bd<br>For inquiries: hackathon@cse.buet.ac.bd</p>
      </div>
    `,
    fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
    width: 900,
    height: 1100,
  },
  {
    id: 'DOC-03',
    filename: 'DOC-03.png',
    title: 'JU IIT Postgraduate Admission Circular',
    bodyHtml: `
      <div class="header">
        <h1 class="inst-name">জাহাঙ্গীরনগর বিশ্ববিদ্যালয়</h1>
        <h2 class="dept-name">ইনস্টিটিউট অব ইনফরমেশন টেকনোলজি (IIT)</h2>
        <div class="notice-badge">ADMISSION & SCHOLARSHIP NOTICE — SPRING 2025</div>
      </div>
      <div class="subject">পোস্টগ্র্যাজুয়েট ডিপ্লোমা ইন আইটি (PGDIT) ভর্তি বিজ্ঞপ্তি</div>
      <div class="body-text">
        <ol>
          <li>আবেদনের শেষ তারিখ (Application Deadline): 10 December 2024</li>
          <li>ভর্তি পরীক্ষা ও সাক্ষাৎকার (Admission Test): 20 December 2024, সকাল ১০:০০ টা</li>
          <li>পরীক্ষার স্থান (Venue): IIT Building, Room No. 204</li>
          <li>আবেদন ফি (Application Fee): ১২০০/- টাকা (বিকাশ বা রকেটের মাধ্যমে প্রদেয়)</li>
          <li>প্রয়োজনীয় কাগজপত্র: সকল পরীক্ষার মার্কশিট ও সার্টিফিকেটের সত্যায়িত কপি।</li>
        </ol>
        <p class="meta">Apply online: https://admission.juniv.edu</p>
      </div>
    `,
    fontFamily: "'Noto Sans Bengali', 'Arial', sans-serif",
    width: 900,
    height: 1050,
  },
  {
    id: 'DOC-04',
    filename: 'DOC-04.png',
    title: 'Khulna University Course Enrollment Notice',
    bodyHtml: `
      <div class="header">
        <h1 class="inst-name">খুলনা বিশ্ববিদ্যালয়</h1>
        <h2 class="dept-name">কম্পিউটার সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং ডিসিপ্লিন</h2>
        <div class="notice-badge">জরুরি বিজ্ঞপ্তি</div>
      </div>
      <div class="body-text">
        <p>শিক্ষাবর্ষ ২০২৪-২০২৫ এর সকল নিয়মিত শিক্ষার্থীদের জানানো যাচ্ছে যে, আগামী সেমিস্টারের কোর্স রেজিস্ট্রেশন শুরু হয়েছে।</p>
        <p><strong>গুরুত্বপূর্ণ সময়সূচী:</strong></p>
        <ul>
          <li>সাধারণ রেজিস্ট্রেশনের শেষ তারিখ: ১২ ডিসেম্বর ২০২৪</li>
          <li>বিলম্ব ফিসহ রেজিস্ট্রেশনের শেষ তারিখ: ১৮ ডিসেম্বর ২০২৪</li>
          <li>রেজিস্ট্রেশন ফি: ৭৫০/- টাকা</li>
          <li>জমা দেওয়ার স্থান: ডিসিপ্লিন অফিস, একাডেমিক ভবন-২</li>
        </ul>
        <p>সকল শিক্ষার্থীকে নির্ধারিত সময়ের মধ্যে ফি পরিশোধ করে রেজিস্ট্রেশন সম্পন্ন করতে অনুরোধ করা হলো।</p>
      </div>
    `,
    fontFamily: "'Noto Serif Bengali', 'Georgia', serif",
    width: 900,
    height: 1050,
    cameraPhotoEffect: true,
  },
  {
    id: 'DOC-05',
    filename: 'DOC-05.png',
    title: 'BRAC University Merit Scholarship Circular',
    bodyHtml: `
      <div class="header">
        <h1 class="inst-name">BRAC UNIVERSITY</h1>
        <h2 class="dept-name">OFFICE OF STUDENT AFFAIRS & FINANCIAL AID</h2>
        <div class="notice-badge">SCHOLARSHIP CIRCULAR — SPRING 2025</div>
      </div>
      <div class="body-text">
        <p>Applications are invited from eligible students for Merit-Based Tuition Scholarships for Spring 2025.</p>
        <p><strong>ELIGIBILITY & SUBMISSION DETAILS:</strong></p>
        <ol>
          <li>Application Deadline: 15 January 2025 by 4:00 PM.</li>
          <li>Required Documents:
            <ul>
              <li>Official Academic Transcript (Minimum CGPA 3.80)</li>
              <li>Two Letters of Recommendation</li>
              <li>Student Identification Card copy</li>
            </ul>
          </li>
          <li>Submission Procedure: Submit dossier to Financial Aid Office, Building UB-02.</li>
          <li>Contact: financialaid@bracu.ac.bd | Phone: 09612345678</li>
        </ol>
      </div>
    `,
    fontFamily: "'Trebuchet MS', 'Arial', sans-serif",
    width: 900,
    height: 1100,
  },
  {
    id: 'DOC-06',
    filename: 'DOC-06.png',
    title: 'Rajshahi University Academic Schedule Notice',
    bodyHtml: `
      <div class="header">
        <h1 class="inst-name">রাজশাহী বিশ্ববিদ্যালয়</h1>
        <h2 class="dept-name">ফলিত পদার্থবিজ্ঞান ও ইলেকট্রনিক ইঞ্জিনিয়ারিং বিভাগ</h2>
        <div class="notice-badge">পরীক্ষা ও ক্লাস নোটিশ</div>
      </div>
      <div class="body-text">
        <p>সংশ্লিষ্ট সকল শিক্ষার্থীকে জানানো যাচ্ছে যে ২০২৪ শিক্ষাবর্ষের সূচী নিম্নরূপ:</p>
        <ol>
          <li>ফর্ম পূরণ শেষ তারিখ (Form Fill-up Deadline): 28 November 2024</li>
          <li>ব্যবহারিক পরীক্ষা (Practical Exam): 12 December 2024</li>
          <li>পরীক্ষার ফি (Exam Fee): ৯০০/- টাকা</li>
          <li>স্থান: তৃতীয় বিজ্ঞান ভবন, ল্যাবরেটরি ৩</li>
        </ol>
      </div>
      <div class="signature">
        <p>অনুরোধক্রমে: বিভাগীয় প্রধান</p>
        <p>রাজশাহী বিশ্ববিদ্যালয়</p>
      </div>
    `,
    fontFamily: "'Noto Sans Bengali', 'Arial', sans-serif",
    width: 900,
    height: 1000,
  },
];

console.log('Rendering authentic benchmark notice fixtures with Chrome headless...');

for (const doc of documents) {
  const tempHtmlPath = path.resolve(`/tmp/${doc.id}.html`);
  const targetPngPath = path.resolve(FIXTURES_DIR, doc.filename);

  const html = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: ${doc.width}px;
    height: ${doc.height}px;
    background: ${doc.cameraPhotoEffect ? '#f3f1ea' : '#ffffff'};
    color: #1a1a1a;
    font-family: ${doc.fontFamily};
    padding: 60px 70px;
    display: flex;
    flex-direction: column;
    justifyContent: flex-start;
    ${doc.cameraPhotoEffect ? 'box-shadow: inset 0 0 80px rgba(0,0,0,0.06); transform: rotate(0.1deg);' : ''}
  }
  .header {
    text-align: center;
    border-bottom: 2px solid #333333;
    padding-bottom: 18px;
    margin-bottom: 25px;
  }
  .inst-logo { font-size: 32px; margin-bottom: 8px; }
  .inst-name { font-size: 26px; font-weight: 700; color: #111111; line-height: 1.3; }
  .dept-name { font-size: 20px; font-weight: 600; color: #2b2b2b; margin-top: 6px; }
  .notice-badge {
    display: inline-block;
    margin-top: 12px;
    padding: 4px 18px;
    font-size: 17px;
    font-weight: 700;
    border: 1px solid #444;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .subject {
    font-size: 19px;
    margin-bottom: 20px;
    padding: 10px 14px;
    background: #f7f7f7;
    border-left: 4px solid #333;
  }
  .body-text {
    font-size: 17px;
    line-height: 1.8;
    color: #222222;
    flex-grow: 1;
  }
  p { margin-bottom: 16px; }
  ul, ol { margin-left: 30px; margin-bottom: 18px; }
  li { margin-bottom: 10px; line-height: 1.7; }
  .meta { margin-top: 25px; padding-top: 15px; border-top: 1px dashed #aaa; font-size: 15px; color: #444; }
  .signature {
    margin-top: 30px;
    text-align: right;
    font-size: 16px;
    line-height: 1.5;
  }
  .sig-title { font-weight: 700; }
</style>
</head>
<body>
  ${doc.bodyHtml}
</body>
</html>`;

  fs.writeFileSync(tempHtmlPath, html, 'utf8');

  execSync(
    `"${chromeBin}" --headless --disable-gpu --screenshot="${targetPngPath}" --window-size=${doc.width},${doc.height} "file://${tempHtmlPath}"`,
    { stdio: 'pipe' }
  );

  const stats = fs.statSync(targetPngPath);
  console.log(`✅ [${doc.id}] Generated ${doc.filename} (${stats.size} bytes)`);

  fs.unlinkSync(tempHtmlPath);
}

console.log('All 6 benchmark fixtures generated successfully in src/test/benchmark/fixtures/\n');
