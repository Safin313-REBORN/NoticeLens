# Devpost Submission — NoticeLens

## 1. Project Title
**NoticeLens**

## 2. Short Tagline
**Read the notice. Know what to do.**

## 3. Concise Project Summary
NoticeLens is an AI-assisted accessibility and document intelligence web application purpose-built for university students with visual impairments or low vision in Bangladesh. Instead of merely reciting unformatted optical character recognition (OCR) text, NoticeLens transforms complex Bengali, English, and mixed-language notice photos into an accessible, structured, verifiable, and actionable workspace. Students get instant plain-language summaries, traceable source citations for every extracted deadline, room number, or fee, editable transcripts with live recalculation, integrated Web Speech audio reading, private local storage, and one-click calendar exports (.ics).

---

## 4. The Problem We Are Solving
University campuses across Bangladesh rely heavily on physical notice boards and scanned PDF/image circulars posted on department walls or social media. These notices feature:
- Complex Bengali scripts, English phrases, or mixed bilingual terminology.
- High-stakes examination dates, room schedules, and admit card requirements.
- Tight application deadlines, admission portals, and non-refundable fees.
- Densely packed administrative paragraphs where critical facts are buried.

For students who are blind, visually impaired, or have low vision, traditional OCR readers present significant hurdles:
1. Raw OCR output is a wall of unstructured text that leaves the student searching for the actual deadline or venue.
2. Standard screen readers struggle with mixed Bengali-English script ordering and lack contextual task awareness.
3. Conventional AI summarizers are prone to hallucinating plausible dates or consequences without accountable source evidence.

---

## 5. Our Solution
NoticeLens provides **evidence-backed notice intelligence**:
1. **Bilingual OCR**: Recognizes printed notices in Bengali, English, or mixed language mode using client-side Tesseract.js with real progress streaming.
2. **Deterministic Extraction Engine**: Uses typed, context-aware rule sets and normalization algorithms to extract 14 key fields (Title, Category, Issuing Institution, Event Name, Event Date, Times, Venue, Deadline, Required Documents, Fees, Action Items, Contact, and URL).
3. **Traceable Citations**: Every extracted fact retains an exact character pointer to its supporting snippet in the recognized text, highlighted visually and accessible to screen readers.
4. **Accessible Plain-Language Summary**: Generates concise, understandable summaries structured into What it's about, Critical Deadline, What you need to do, Location & Time, Documents, and Unverified/Missing items.
5. **Human-in-the-Loop Correction**: Students can edit any recognized field or the raw OCR transcript; NoticeLens dynamically re-derives all downstream summaries and dates.
6. **Honest Web Speech Audio Player**: Built-in audio controls with voice discovery, adjustable speed (0.85x–1.25x), and transparent status feedback if the host device lacks an installed Bengali speech engine.
7. **Privacy & Offline Persistence**: Saved notices and deadlines reside in the browser's private local IndexedDB.
8. **Calendar Export**: Generates RFC 5545 `.ics` files with automated 24-hour reminder alarms for Google Calendar, Apple Calendar, or Outlook.

---

## 6. Key Features
- **WCAG 2.2 AA Accessibility**: Skip-to-content links, visible focus indicators, dynamic ARIA live regions for screen readers, high-contrast mode (7:1+ contrast ratio), and text size scaling (Normal, Large 115%, Extra Large 130%).
- **Mobile Camera & File Upload**: Camera capture (`capture="environment"`), drag-and-drop, and file validation up to 10 MB.
- **Safe Preprocessing**: In-memory canvas grayscale and contrast enhancement to improve OCR recognition on low-light smartphone captures.
- **Traceable Evidence Highlighter**: Clicking any fact snippet highlights its exact occurrence in the raw transcript.
- **Zero-Secret Default**: Operates 100% locally in the browser with no external paid API keys required.
- **Preloaded Fictional Test Samples**: Bundled with three representative fictional notices (Bengali DU Final Exam, English BUET Hackathon, and Mixed JU Admission) for instant evaluation.

---

## 7. What Makes NoticeLens Distinctive
| Traditional OCR & AI Readers | NoticeLens |
| :--- | :--- |
| Dumps raw, unformatted text blocks | Delivers structured, field-by-field actionable cards |
| Hallucinates missing dates or consequences | Transparently marks unverified items as "Needs Review" |
| Black-box outputs without references | Traceable source evidence citations for every extracted detail |
| Sends private student documents to cloud servers | Processes and stores documents 100% locally and privately |
| Silently mispronounces Bengali using English voices | Discovers native Bengali voices and reports hardware fallbacks honestly |
| Requires manual copy-pasting of deadlines | One-click RFC 5545 `.ics` calendar file export with alarms |

---

## 8. How the Technology Works
```
[Notice Image / Camera]
         │
         ▼
[Canvas Preprocessing] ── (Grayscale & Contrast Normalization)
         │
         ▼
[Tesseract.js OCR] ── (Bengali + English Trained Models, Real Progress %)
         │
         ▼
[Raw Recognized Transcript] ◄──► [Human-in-the-Loop Transcript Editor]
         │
         ▼
[Extraction Pipeline]
   ├── Bengali & English Numeral Normalizer (০-৯ ↔ 0-9)
   ├── Contextual Date & Deadline Classifier
   ├── Time Range & Period Parser (সকাল / দুপুর / AM / PM)
   └── Field & Evidence Snippet Matcher
         │
         ▼
[Structured Notice Model]
   ├── 14 Typed Fields with Review Status (Confirmed / Needs Review / Not Found)
   ├── Plain-Language Accessible Summary
   ├── Web Speech Audio Synthesizer (Field & Summary Playback)
   ├── Private Local Storage (IndexedDB)
   └── Calendar Exporter (RFC 5545 .ics with VALARM)
```

---

## 9. Technologies Used
- **Frontend Framework**: React 18, TypeScript (Strict Mode), Vite 5
- **Styling & Design System**: Tailwind CSS v3, custom high-contrast modes, accessible type scales
- **OCR Engine**: Tesseract.js (Worker-based, bilingual `ben+eng` / `ben` / `eng`)
- **Audio & Accessibility**: Web Speech API (`SpeechSynthesis`), ARIA Live Regions, WCAG 2.2 AA Focus Management
- **Persistence**: IndexedDB API (`NoticeLensDB`) with `localStorage` fallback
- **Calendar Standard**: RFC 5545 iCalendar specification
- **Icons**: Lucide React
- **Testing**: Vitest v2, React Testing Library, Happy-DOM (22 automated test suites)

---

## 10. Engineering Challenges
1. **Bilingual Numeral Normalization**: University notices frequently mix Bengali numerals (e.g., ১৫/১১/২০২৪) with English digits and ASCII numbers. We implemented a deterministic bidirectional normalization layer that standardizes numeric sequences while retaining the original text for evidence matching.
2. **Disambiguating Deadlines from Event Dates**: Notices frequently mention publication dates, examination schedules, and application deadlines on adjacent lines. We designed context-window classification rules (`DEADLINE_KEYWORDS`, `EVENT_KEYWORDS`, `PUBLICATION_KEYWORDS`) that evaluate proximity to action verbs like "শেষ তারিখ" (Last date) versus "অনুষ্ঠিত হবে" (Will be held).
3. **Honest Web Speech Voice Discovery**: Browsers running on Linux, Android, or Windows may not have a native Bengali speech engine installed. Instead of failing silently or masquerading English synthesis as Bengali, NoticeLens dynamically inspects installed voice catalogs, surfaces the available voices, and clearly advises the user if hardware fallback is in effect.
4. **Offscreen ARIA Announcements**: Complex asynchronous flows (worker loading, text recognition, re-extraction) need to be announced clearly to screen readers without jarring visual interruptions. We engineered dedicated `ScreenReaderLive` polite live regions that announce milestone steps.

---

## 11. What We Learned
- Accessibility is not an afterthought or a CSS skin; it dictates the fundamental data structures of an application. Attaching character offsets and confidence explanations directly to domain types enables low-vision users to trust and verify automated outputs.
- Running heavy OCR and document intelligence entirely on the client side provides unmatched privacy and zero operational costs for university students.

---

## 12. Future Plans
- Offline progressive web app (PWA) caching for pre-downloaded Tesseract language models.
- Support for tabular university examination routine matrices (day-by-day course code grids).
- Integration of specialized regional university notice templates (National University, DU affiliated 7 colleges).

---

## 13. Ethical and Privacy Considerations
- **Zero Document Leakage**: Notice documents never leave the student's local browser runtime.
- **No Hallucination Policy**: If a deadline, venue, or fee is not explicitly stated in the source text, NoticeLens displays "Not found in notice" and prompts the user to review. It never fabricates dates or consequences.
- **Academic Disclaimer**: NoticeLens explicitly informs students that optical recognition can make mistakes and advises verifying critical dates against official boards.

---

## 14. Instructions for the Live Demo
1. Open the NoticeLens web app locally at `http://127.0.0.1:5173/`.
2. Review the welcome landing view and the accessibility toolbar at the top.
3. Click **Sample Notices** and select **Semester Final Examination Schedule & Rules** (or upload any printed university notice).
4. Observe the 4-step progress stepper as NoticeLens recognizes the notice and organizes key facts.
5. In the **Notice Workspace**, review the Plain-Language Summary and the Critical Timeline.
6. Click on the **Venue** or **Fees** card to observe the exact cited snippet highlighted in the raw transcript.
7. Click **Listen to Summary** or **Read Field** to demonstrate speech synthesis.
8. Click **Save Notice** to store it in local IndexedDB, then navigate to **Saved Notices** to verify persistent storage and search filtering.
9. Click **Export Calendar (.ICS)** to generate and download an iCalendar file with a 24-hour reminder alarm.
