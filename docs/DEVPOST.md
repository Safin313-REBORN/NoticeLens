# Devpost Submission — NoticeLens

### 1. Project Name
**NoticeLens**

### 2. Tagline
**Read the notice. Know what to do.**

### 3. Short Description
NoticeLens is an evidence-grounded institutional notice intelligence and accessibility web application designed for university students with visual impairments, low vision, and cognitive reading challenges. Instead of dumping raw, unstructured OCR text, NoticeLens transforms complex visual notices into actionable student workflows: structured 6-question plain-language summaries, deadline versus event-date disambiguation, interactive checklists with persistence, verbatim source-evidence highlighting, dedicated low-vision reading mode, offline speech synthesis, and timezone-compliant `.ics` calendar exports—all operating 100% locally in the browser with zero cloud server reliance.

---

### 4. Inspiration
On university campuses across Bangladesh and South Asia, administrative communication remains overwhelmingly analog: physical circulars pinned to department notice boards, low-resolution phone photos shared across messaging groups, and non-searchable PDF scans. For visually impaired and low-vision students, these circulars are an exhausting, stressful obstacle. A missed fee payment, an overlooked prerequisite document, or confusing an examination start date with an application deadline can derail a student's entire semester. Generic OCR readers read words aloud, but they fail to understand institutional structure. We were inspired to build a system that doesn't just read the notice, but tells the student exactly what to do, when to do it, and proves every fact with verifiable source evidence.

---

### 5. Problem
1. **Raw OCR is Cognitive Overload:** Generic OCR produces an unformatted stream of 500+ characters littered with letterhead addresses, memo numbers, and table fragments. Screen-reader users must parse this entire stream to find a single deadline.
2. **Deadline vs Event-Date Confusion:** University circulars frequently contain multiple conflicting dates (e.g., publication date, registration deadline, admit card collection, and final exam date). Generic parsers blindly grab the first date, causing students to enter exam dates into their calendars instead of registration deadlines.
3. **AI Hallucinations in High-Stakes Contexts:** Cloud LLMs often invent plausible-sounding deadlines or obligations when presented with noisy text. In university administration, hallucinated dates mean missed deadlines.
4. **Data Privacy on Shared Campus PCs:** Many students use shared computers in university library labs or cyber-cafés. Traditional web apps leave confidential notices, fee records, or roll numbers stored indefinitely in browser caches.
5. **Offline Reality:** Campus Wi-Fi and mobile data in student dormitories are frequently intermittent or expensive. Applications requiring continuous cloud vision APIs fail when connectivity drops.

---

### 6. What We Built
NoticeLens is a local-first notice intelligence application featuring:
- **Notice-to-Action Executive Summary:** Answers the six critical student questions: *What happened? Who is affected? What must be done? When is the deadline? What documents are needed? What information is unverified?*
- **Date & Timeline Disambiguation Engine:** Categorizes circular dates into Critical Application Deadlines, Examination Schedules, and Publication Notices with visual verification badges.
- **Interactive Student Action Checklist:** Translates notice requirements into actionable tasks (fee submission, document attachments) with completion tracking and localStorage persistence.
- **Traceable Source Evidence Grounding:** Clicking any extracted detail highlights the authentic sentence in the original OCR transcript using `<mark>` elements. No ungrounded facts.
- **Dedicated Low-Vision Reading Mode:** A high-contrast, distraction-free reading experience with 3-tier font size scaling (`Normal`, `Large`, `Extra-Large`) and linear speech readout.
- **Deterministic RFC 5545 Calendar Integration:** Generates `.ics` calendar events with automated 24-hour reminder alarms, `Asia/Dhaka` timezone definitions, and a mandatory review gate for missing years.
- **Private Notice Vault & Shared Terminal Purge:** Complete client-side IndexedDB document vault with a one-click security purge that wipes all stored notices, task states, and worker memory upon leaving a public computer.

---

### 7. How It Works
1. **Ingest & Preprocessing:** The student uploads an image, captures a notice photo, or selects a sample preset. An in-memory canvas applies contrast normalization and layout leveling.
2. **Client-Side Tesseract OCR:** A local Web Worker pool runs Tesseract.js with Bengali and English trained LSTM models cached in IndexedDB and Service Worker CacheStorage.
3. **Normalization & Context Extraction:** The recognized text is normalized to Unicode NFC. Contextual regex and structural state machines extract key fields: Title, Institution, Category, Deadlines, Event Dates, Venue, Fees, and Required Documents.
4. **Evidence Grounding:** Every extracted field maps to an exact substring in the transcript. If the user edits the transcript, the engine synchronously re-derives fields and purges stale evidence.
5. **Multimodal Action:** The student can read through the Low-Vision Reading View, listen via Web Speech API (with automatic Bengali phonetic transliteration fallback), check off completed tasks, export deadlines to calendar, or save to the private Notice Vault.

---

### 8. What Makes NoticeLens Different
| Capability | Generic OCR (Google Lens / Apple Live Text) | NoticeLens |
| :--- | :--- | :--- |
| **Output Format** | Unstructured raw text stream | Structured 6-question executive summary + action cards |
| **Deadline Detection** | Extracts arbitrary numbers/dates | Disambiguates submission deadlines from exam and notice dates |
| **Actionable Workflow** | Static text display | Interactive Student Action Checklist with completion tracking |
| **Evidence Traceability** | Bounding box on pixels | Semantic source-span highlight in an editable transcript |
| **Hallucination Risk** | High (if paired with LLMs) | **Zero fabricated quotes** — 100% evidence span precision with 84.21% overall grounding coverage |
| **Privacy Architecture** | Images uploaded to corporate cloud | **100% Client-Side** — Zero server uploads |
| **Offline Operation** | Requires active cloud internet connection | Fully operational offline via IndexedDB & CacheStorage |
| **Speech Adaptability** | Fails or mutes on unsupported OS languages | Native speech with deterministic Bengali phonetic fallback |
| **Public PC Protection** | Data remains in browser cache | One-click "Purge Terminal Data" clears all storage & memory |

---

### 8.1 Empirical Benchmarks (Six-Document Pilot Corpus, Real Tesseract.js OCR)
- **Character Error Rate (CER):** **2.30%** (Live OCR Mean; English: 0.93%, Bengali: 3.84%, Mixed: 2.12%)
- **Word Error Rate (WER):** **9.18%** (Live OCR Mean; English: 3.85%, Bengali: 11.18%, Mixed: 12.51%)
- **Three-Mode Extraction Quality:**
  - Mode A (Clean Text Baseline): F1: **80.46%** (P: 83.33%, R: 77.78%)
  - Mode B (Snapshot OCR Baseline): F1: **77.27%** (P: 79.07%, R: 75.56%)
  - Mode C (Live Real OCR Recognition): F1: **77.27%** (P: 79.07%, R: 75.56%)
- **Evidence Span Precision:** **100.00%** (Zero fabricated source snippets; 48 of 48 attached spans verified verbatim in source transcript)
- **Overall Fact Grounding Coverage:** **84.21%** (48 of 57 non-empty extracted fields supported by authentic text spans)
- **Dynamically Measured Latency:** Parser-only extraction: **2.14 ms** median / **9.88 ms** P90; End-to-end pipeline (Image Read → Tesseract OCR → NLP Engine): **1003.2 ms** median / **1580.1 ms** P90
- **Automated Verification:** 147 automated tests passing across 9 test suites, zero ESLint warnings, production build verified with zero debug globals, and machine-readable JSON evaluation report logged to `docs/benchmark-results.json`

---

### 9. Technology Stack
- **Frontend Framework:** React 18, TypeScript (Strict Mode), Vite
- **Styling Architecture:** Tailwind CSS, Soft-UI Neumorphic Design Tokens, Custom High-Contrast Theme (15.93:1 contrast)
- **OCR Engine:** Tesseract.js v7 with client-side Web Workers and WebAssembly (relaxed-SIMD LSTM)
- **Language Models:** Bengali (`ben.traineddata`) and English (`eng.traineddata`)
- **Cryptography & Security:** Web Crypto API (SHA-256 binary provenance verification)
- **Offline Storage:** IndexedDB (`keyval-store`, `noticelens_db`), Service Worker `CacheStorage`, `localStorage` fallback
- **Audio & Accessibility:** Web Speech API (`window.speechSynthesis`), Bengali Phonetic Transliteration Engine, WAI-ARIA 1.2
- **Calendar Standard:** RFC 5545 iCalendar specification with `Asia/Dhaka` `VTIMEZONE` blocks
- **Testing & Verification:** Vitest v2.1.9, Happy-DOM, Headless Chrome with Chrome DevTools Protocol (CDP)

---

### 10. Engineering Challenges
1. **Eliminating False Offline Verification States:** Early worker implementations verified offline status simply by checking `navigator.onLine === false`. If offline recognition occurred using an online-spawned worker, it created a false-positive verification. We completely re-architected the verifier to inspect the physical binary in IndexedDB, validate its 16-byte header, verify $\ge 10$ directory entries, calculate a real SHA-256 hash via Web Crypto, and test fresh worker initialization in an offline sandbox.
2. **Preventing React State Race Conditions on Transcript Edits:** When users edited the OCR transcript, early state updates triggered asynchronous re-extractions that read stale notice state. We re-engineered the pipeline to pass the edited string atomically to the extraction engine, synchronously updating structured fields, summaries, and evidence pointers in a single atomic commit.
3. **Calendar Date Integrity & Leap Year Rules:** Regex date extractors frequently accept invalid dates like 31 February or 31 April. We built a strict calendar date validator that checks month lengths and leap years, and blocks calendar export with an accessible Review Gate whenever a year is omitted.
4. **Bengali Numeral & Language Support Without Native TTS:** Many operating systems (particularly Linux distributions and older Windows versions) lack a native Bengali speech voice. Rather than leaving students without audio feedback, we designed a phonetic transliteration engine that converts Bengali script into phonetically approximate Latin strings, allowing universal speech engines to speak intelligible Bengali circulars.

---

### 11. Accessibility Impact
NoticeLens was evaluated against WCAG 2.2 Level AA guidelines:
- **15.93:1 Heading Contrast Ratio** in dedicated High-Contrast Mode (far exceeding the 7.0:1 AAA standard).
- **0 px Mobile Overflow:** Tested on 375x812 viewport with 100% reflow compliance.
- **3.0 px Solid Focus Indicators** on all interactive controls.
- **Full Keyboard Navigation:** Tab-accessible checklist items, modal gates, and audio triggers.
- **Low-Vision Typography:** 3-tier font size scaling (`Normal`, `Large`, `Extra-Large`) engineered for low-vision reading.

---

### 12. What We Learned
- **Deterministic AI Beats Generative AI for Bureaucracy:** In high-stakes institutional notices, students prefer 100% grounded, traceable facts over articulate probabilistic summaries that might hallucinate a critical date.
- **Offline First is an Accessibility Feature:** In developing countries, digital accessibility cannot assume reliable fiber internet. Engineering client-side WebAssembly OCR makes the app truly usable for low-income and rural university students.
- **Accessibility Requires Holistic UX:** Building for screen readers is not just about adding `aria-label`. It requires rethinking information architecture—turning a 500-word block into an action checklist, a disambiguated timeline, and an executive Q&A.

---

### 13. Future Plans
- **Mobile Camera Perspective Correction:** Integrate client-side OpenCV.js document contour detection and quad-warping to automatically rectify skewed mobile captures.
- **Multi-Department Notice Feeds:** Partner with university student unions in Bangladesh to establish RSS/JSON notice syndication feeds that pull circulars directly into student Notice Vaults.
- **Community Ground-Truth Expansion:** Open-source an expanded benchmarking dataset of 100+ annotated Bangladeshi university notices to establish an open benchmark for low-resource script OCR intelligence.
