# Devpost Submission — NoticeLens

## 1. Project Title
**NoticeLens**

## 2. Short Tagline
**Read the notice. Know what to do.**

## 3. Concise Project Summary
NoticeLens is an AI-assisted accessibility and document intelligence web application purpose-built for university students with visual impairments or low vision in Bangladesh. Instead of merely reciting unformatted optical character recognition (OCR) text, NoticeLens transforms complex Bengali, English, and mixed-language notice photos into an accessible, structured, verifiable, and actionable workspace. Students get instant plain-language summaries, traceable source citations for every extracted deadline, room number, or fee, editable transcripts with atomic real-time recalculation, integrated Web Speech audio reading, private local storage, and timezone-compliant calendar exports (.ics).

---

## 4. The Problem We Are Solving
University campuses across Bangladesh rely heavily on physical notice boards and scanned PDF/image circulars posted on department walls or social media. These notices feature:
- Complex Bengali scripts, English phrases, or mixed bilingual terminology.
- High-stakes examination dates, room schedules, and admit card requirements.
- Tight application deadlines, admission portals, and non-refundable fees.
- Densely packed administrative paragraphs where critical facts are buried.

For students who are blind, visually impaired, or have low vision, traditional OCR readers present significant hurdles:
1. **Unstructured Output**: Raw OCR output is a wall of disorganized text that leaves the student searching for the actual deadline or venue.
2. **Context Blindness**: Standard screen readers struggle with mixed Bengali-English script ordering and lack contextual task awareness.
3. **Hallucination Risk**: Conventional cloud AI summarizers often hallucinate plausible dates or consequences without accountable source evidence, risking missed exams or fees.

---

## 5. Our Solution
NoticeLens provides **evidence-backed notice intelligence**:
1. **Local Bilingual OCR**: Recognizes printed notices in Bengali, English, or mixed language mode using client-side Tesseract.js with local assets and strict CSP compliance.
2. **Deterministic Extraction Engine**: Uses typed, context-aware rule sets and normalization algorithms to extract 14 key fields (Title, Category, Issuing Institution, Event Name, Event Date, Times, Venue, Deadline, Required Documents, Fees, Action Items, Contact, and URL).
3. **Strict Calendar Validation**: Rejects impossible calendar dates (such as 31 February or 31 April) and validates leap years. If a notice omits a year, NoticeLens flags it for user review rather than inventing the current year.
4. **Traceable Citations**: Every extracted fact retains an exact character pointer to its supporting snippet in the recognized text, highlighted visually and accessible to screen readers via normalized index mapping.
5. **Accessible Plain-Language Summary**: Generates concise, understandable summaries structured into *What it's about*, *Critical Deadline*, *What you need to do*, *Location & Time*, *Documents*, and *Missing/unverified details*.
6. **Atomic Human-in-the-Loop Correction**: Students can edit the raw OCR transcript and NoticeLens synchronously re-derives all downstream summaries and dates without state race conditions. User overrides are prominently marked to prevent misleading evidence claims.
7. **Honest Web Speech Audio Player**: Built-in audio controls with voice discovery, adjustable speed (0.85x–1.25x), and transparent status feedback if the host device lacks an installed Bengali speech engine.
8. **Privacy & Offline Persistence**: Saved notices, metadata, and durable base64 image data URLs reside in the browser's private local IndexedDB (`NoticeLensDB`).
9. **Timezone-Compliant Calendar Export**: Generates RFC 5545 `.ics` files with line folding, `Asia/Dhaka` `VTIMEZONE` blocks, and an automatic review gate for ambiguous dates.

---

## 6. Key Features & Accessibility Standards
- **WCAG 2.2 AA Aligned**: Skip-to-content links, visible focus indicators, dynamic ARIA live regions for screen readers, high-contrast mode, and text size scaling (Normal, Large 115%, Extra Large 130%).
- **Mobile Camera & File Upload**: Camera capture (`capture="environment"`), drag-and-drop, and file validation up to 10 MB.
- **Safe Preprocessing**: In-memory canvas grayscale and contrast enhancement to improve OCR recognition on low-light smartphone captures.
- **Traceable Evidence Highlighter**: Clicking any fact snippet highlights its exact occurrence in the raw transcript.
- **Zero-Secret Default**: Operates 100% locally in the browser with no external paid API keys required.
- **Preloaded Fictional Test Samples**: Bundled with three representative fictional notices (Bengali DU Final Exam, English BUET Hackathon, and Mixed JU Admission) with separate Live OCR and Instant Sample load actions.

---

## 7. What Makes NoticeLens Distinctive
| Traditional OCR & AI Readers | NoticeLens |
| :--- | :--- |
| Dumps raw, unformatted text blocks | Delivers structured, field-by-field actionable cards |
| Hallucinates missing dates or consequences | Strictly rejects invalid dates and never invents missing years |
| Black-box outputs without references | Traceable source evidence citations for every extracted detail |
| Fabricates confidence scores | Transparently reports genuine engine confidence or labels preset samples |
| Sends private student documents to cloud servers | Processes and stores documents 100% locally and privately |
| Silently mispronounces Bengali using English voices | Discovers native Bengali voices and reports hardware fallbacks honestly |
| Shifts Bangladesh local times by 6 hours | Compliant RFC 5545 `.ics` export with `Asia/Dhaka` timezone definition |

---

## 8. Engineering Challenges & Solutions

1. **Content Security Policy vs Tesseract Worker Assets**:  
   Default Tesseract.js configurations rely on CDN blobs and `importScripts`, which conflicted with strict CSP directives in `index.html`. We resolved this by downloading local worker scripts, WASM files, and core LSTM scripts into `/public/tesseract/`, setting `workerBlobURL: false`, and updating CSP directives to safely permit self-hosted worker execution.

2. **React State Race Condition in Transcript Re-Extraction**:  
   The initial transcript editor called a text update followed by a re-extraction handler that read `activeNotice.ocrText`. Because React state updates are asynchronous, the extractor read stale text. We re-engineered the pipeline to take the edited string as an atomic argument `handleApplyTranscriptEdit(newText)`, re-extracting fields directly and committing state in a single synchronous transition.

3. **Calendar Date Integrity & Leap Year Rules**:  
   Generic regex parsers accept invalid dates like 31 February or 31 April because JavaScript's `Date` normalizes them into subsequent months. We implemented strict boundary checks (`isValidCalendarDate`), leap year algorithms, and blocked automatic year invention for circulars lacking an explicit year.

4. **Timezone Accuracy in Calendar Exports**:  
   Notice times were initially formatted as UTC timestamps, shifting Bangladesh standard time (+06:00) by 6 hours. We implemented compliant `VTIMEZONE` blocks for `Asia/Dhaka` and local date-time formatting (`DTSTART;TZID=Asia/Dhaka:...`).

5. **Durable Image Storage vs Broken Blob URLs**:  
   Storing temporary `blob:` URLs in IndexedDB resulted in broken image references upon browser restarts. We integrated `FileReader` base64 data URL conversion so notices survive page reloads and browser restarts without dead URLs.

---

## 9. Technologies Used
- **Frontend Framework**: React 18, TypeScript (Strict Mode), Vite 5
- **Styling & Design System**: Tailwind CSS v3 with custom `.high-contrast` variant plugin
- **OCR Engine**: Tesseract.js v7 (Self-hosted local worker assets, bilingual `ben+eng` / `ben` / `eng`)
- **Audio & Accessibility**: Web Speech API (`SpeechSynthesis`), ARIA Live Regions, WCAG 2.2 AA Focus Management
- **Persistence**: IndexedDB API (`NoticeLensDB`) with `localStorage` fallback
- **Calendar Standard**: RFC 5545 iCalendar specification with `Asia/Dhaka` timezone
- **Test Automation**: Vitest v2, React Testing Library, Happy-DOM (54 passing automated tests)

---

## 10. Honest Limitations & Future Work
- **Client-Side OCR Hardware Limitations**: Client-side OCR requires legible image resolution and adequate device memory. For severely degraded or blurry notices, student manual transcript editing remains an essential human-in-the-loop fallback.
- **Speech Engine Availability**: Web Speech API depends on the host operating system's installed TTS engines. If the user's OS lacks a Bengali voice pack, NoticeLens falls back to hardware defaults while advising the user.
- **Future Directions**:
  - Offline fine-tuned quantized on-device small language model (SLM) for multi-column layout table extraction.
  - Direct integration with university open portal RSS feeds.
  - Audio recording upload for verbal notice announcements in university halls.
