# NoticeLens

> **Read the notice. Know what to do.**

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![WCAG 2.2 AA](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA-green.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Tests](https://img.shields.io/badge/Tests-22%20Passing-emerald.svg)](https://vitest.dev/)

**NoticeLens** is an AI-assisted accessibility and document intelligence web application designed for university students with visual impairments or low vision in Bangladesh. It transforms printed and photographed Bengali, English, and mixed-language university notices into an accessible, structured, verifiable, and actionable workspace.

---

## The Problem
University notices in Bangladesh are frequently published as low-resolution photos or physical flyers pinned to departmental notice boards. They feature:
- Complex Bengali and English typography.
- High-stakes examination dates, room schedules, and seat allocations.
- Crucial application deadlines, admission portals, and payment receipts.
- Dense administrative paragraphs where actionable information is difficult to find.

Conventional OCR solutions dump unformatted text without explaining what the student needs to do, while cloud AI readers often hallucinate deadlines or compromise privacy by uploading sensitive student documents.

---

## Our Solution
NoticeLens provides **evidence-backed notice intelligence**:
1. **Bilingual OCR**: Recognizes Bengali, English, and mixed-language text directly in the browser via Tesseract.js.
2. **Context-Aware Extraction**: Automatically isolates 14 structured fields (Deadline, Examination Date, Start/End Time, Venue, Required Documents, Fees, Actions, Contacts, Portal URLs).
3. **Traceable Citations**: Every extracted fact retains an exact character pointer to its supporting snippet in the raw notice, highlighted on click.
4. **Accessible Plain-Language Summary**: Breaks circulars down into: *What it's about*, *Critical deadline*, *What you need to do*, *Where and when*, *Required documents*, and *Missing/unverified details*.
5. **Human-in-the-Loop Correction**: Edit any recognized field or the raw transcript; NoticeLens dynamically re-derives all fields and summaries in real time.
6. **Honest Web Speech Audio Narration**: Integrated audio controls with voice discovery, adjustable speed, and transparent status when a host OS lacks a native Bengali voice engine.
7. **Private Local Persistence**: Saves notices privately in browser IndexedDB (`NoticeLensDB`) with zero cloud data transmission.
8. **One-Click Calendar Export**: Generates RFC 5545 `.ics` files with automated 24-hour reminder alarms for Google Calendar, Apple Calendar, and Outlook.

---

## Key Differentiators
- **Verifiable Evidence**: We never output ungrounded assertions. Every date, room, and fee is visually linked to its source line in the document.
- **Zero API Keys Required**: 100% of OCR, text processing, audio synthesis, and storage runs locally in your browser.
- **Accessibility by Architecture**: Built according to WCAG 2.2 AA standards with keyboard navigation, visible focus indicators, screen reader live regions, high-contrast mode (7:1+), and text scaling.

---

## Architecture & Data Flow

```
[Uploaded Notice Image / Camera]
               │
               ▼
   [In-Memory Canvas Enhancement]  (Grayscale & Contrast Stretching)
               │
               ▼
       [Tesseract.js OCR]           (Worker-based bilingual recognition)
               │
               ▼
    [Raw OCR Text Transcript]  ◄──►  [Human-in-the-Loop Transcript Editor]
               │
               ▼
      [Extraction Engine]
         ├── Numeral Normalizer     (০-৯ ↔ 0-9)
         ├── Contextual Date Parser (DD/MM/YYYY, Bengali Month Names, Deadlines vs Events)
         ├── Time Window Parser     (সকাল / দুপুর / 12-Hour AM/PM)
         └── Evidence Snippet Matcher
               │
               ▼
    [Structured Notice Model]
         ├── 14 Typed Fields with Review Status (Confirmed / Needs Review / Not Found)
         ├── Plain-Language Accessible Summary
         ├── Web Speech Audio Reader (Synthesis with Voice Discovery)
         ├── IndexedDB Local Database (Saved Notices & Deadlines)
         └── Calendar Exporter (RFC 5545 .ics with VALARM)
```

---

## Technology Stack
- **Frontend**: React 18, TypeScript (Strict Mode), Vite 5
- **Styling**: Tailwind CSS v3, custom high-contrast mode, accessible type scales
- **OCR Engine**: Tesseract.js (Bilingual `ben+eng`, `ben`, `eng`)
- **Speech & Accessibility**: Web Speech API (`SpeechSynthesis`), ARIA Live Regions, WCAG 2.2 AA Focus Styles
- **Storage**: IndexedDB (`NoticeLensDB`) with `localStorage` fallback
- **Export**: RFC 5545 iCalendar (`.ics`)
- **Icons**: Lucide React
- **Testing**: Vitest v2, React Testing Library, Happy-DOM (22 automated test suites)

---

## Prerequisites
- Node.js: `v18.0.0` or higher (tested on Node.js v18.19.1)
- npm: `v9.0.0` or higher
- Any modern web browser (Chrome, Edge, Firefox, Safari)

---

## Installation & Setup

```bash
# 1. Clone repository (or navigate to project directory)
cd noticelens

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# The app will be available at: http://localhost:5173
```

---

## Available Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server with Hot Module Replacement (HMR) |
| `npm run build` | Compiles TypeScript and builds optimized production bundle in `dist/` |
| `npm run test` | Executes all 22 automated Vitest unit and integration test suites |
| `npm run preview` | Serves the production build locally |

---

## OCR Setup & Language Data Behavior
NoticeLens uses Tesseract.js for optical character recognition.
- On first execution with a chosen language (e.g. `ben+eng`), Tesseract.js automatically downloads the required trained language data (`.traineddata`) and caches it in IndexedDB for subsequent offline use.
- The OCR processing card streams real progress percentages (e.g. `20%`, `65%`, `95%`) and displays transparent loading states.
- If an image has poor lighting or skewed angles, enable the **"Enhance contrast for printed notice readability"** option to trigger canvas-level luminance normalization.

---

## Browser Speech Voice Behavior
NoticeLens inspects the host device's available voice catalog using `speechSynthesis.getVoices()`.
- If a native Bengali voice package (e.g. `bn-BD` or `bn-IN`) is detected, NoticeLens automatically utilizes it for Bengali text reading.
- If the operating system lacks an installed Bengali voice (common in minimal Linux distributions or default Windows setups), NoticeLens **honestly advises the user** and uses the closest available speech engine without crashing or pretending that native speech succeeded.

---

## Privacy & Data Protection
- **No External Uploads**: Documents and notice images are processed entirely in browser memory.
- **Local Private Storage**: Saved notices, titles, and extracted deadlines reside strictly in the browser's local IndexedDB (`NoticeLensDB`).
- **Data Cleanup**: Clearing browser site data immediately removes all stored notices. An explicit "Delete Notice" dialog with focus trap allows students to erase items anytime.

---

## Quality Assurance & Test Verification
All 22 unit and integration tests run cleanly:
```bash
npm run test
```
Test coverage includes:
- Bengali & English numeral conversions (`০-৯` ↔ `0-9`)
- Date parsing: Numeric (`১৫/১১/২০২৪`), Bengali word dates (`১২ অক্টোবর ২০২৪`), English ordinal dates (`25th November 2024`)
- Time range extraction (`সকাল ১০:০০ হতে দুপুর ১:০০ পর্যন্ত`)
- Traceable evidence character indexing
- Fictional university notice fixtures (DU Exam, BUET Hackathon, JU Admission)
- RFC 5545 iCalendar generation and VALARM triggers

See [`docs/TEST_REPORT.md`](file:///home/safin313/.gemini/antigravity-ide/scratch/noticelens/docs/TEST_REPORT.md) for full audit records.

---

## Hackathon Submission Documents
- [`docs/DEVPOST.md`](file:///home/safin313/.gemini/antigravity-ide/scratch/noticelens/docs/DEVPOST.md) — Comprehensive Devpost submission draft
- [`docs/DEMO_SCRIPT.md`](file:///home/safin313/.gemini/antigravity-ide/scratch/noticelens/docs/DEMO_SCRIPT.md) — 2 minute 30 second timed live demo script
- [`docs/TEST_REPORT.md`](file:///home/safin313/.gemini/antigravity-ide/scratch/noticelens/docs/TEST_REPORT.md) — QA test execution results
- [`docs/screenshots/`](file:///home/safin313/.gemini/antigravity-ide/scratch/noticelens/docs/screenshots/) — Screenshot verification guide

---

## License
MIT License. Created for the Hackathon by the NoticeLens Engineering Team.
