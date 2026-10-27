# NoticeLens — Project Roadmap

```
Phase 1: Architecture & OCR Engine Pipeline              [Done]
Phase 2: Context-Aware Bilingual Extraction Engine       [Done]
Phase 3: Neo-Brutalist & Multi-Aesthetic Design System   [Done]
Phase 4: Pre-Production Security & QA Audit Remediation  [Done]
Phase 5: Hackathon Demo Readiness & Deployment           [In progress]
```

---

## 📌 Milestone Breakdown

### Phase 1: Architecture & OCR Engine Pipeline `[Done]`
- [x] Project scaffolding with React 18, TypeScript strict mode, and Vite 5.
- [x] In-memory HTML5 Canvas contrast stretching and preprocessing.
- [x] Tesseract.js WASM integration with bilingual (`ben+eng`, `ben`, `eng`) support.
- [x] Streamed OCR progress indicators and non-blocking worker pools.

### Phase 2: Context-Aware Bilingual Extraction Engine `[Done]`
- [x] Numeral normalizer (`০-৯` to `0-9`).
- [x] Comprehensive date parsing across 4 distinct syntax formats.
- [x] Time window and AM/PM interval extraction.
- [x] Exact character range evidence locator (`matchEvidence`).
- [x] Plain-language accessible summary generator in Bengali and English.
- [x] RFC 5545 iCalendar generation with VALARM alarms.
- [x] IndexedDB private local storage with fallback protection.

### Phase 3: Neo-Brutalist & Multi-Aesthetic Design System `[Done]`
- [x] Neo-Brutalist design tokens: 3px solid black borders, hard offset shadows, high-visibility badges.
- [x] Memphis Design & Retro UI accents with vibrant contrasting pastel highlights.
- [x] Art Deco architectural typography and symmetric framing.
- [x] 5-Page Multipage Navigation:
  - Notice Scanner
  - Accessible Studio
  - Saved Notices Archive
  - Evidence & Traceability Inspector
  - Hackathon Demo Hub
- [x] WCAG 2.2 AAA accessibility controls (High Contrast 21:1, Bionic Reading, Dyslexic Font, Focus Ruler).

### Phase 4: Pre-Production Security & QA Audit Remediation `[Done]`
- [x] Fixed `localStorage` quota crash via `sanitizeRecordForLocalStorage`.
- [x] Implemented strict Content Security Policy and browser permissions meta tags.
- [x] Synchronized active notice titles with user field edits and preserved edits on re-extract.
- [x] Implemented `generateSafeCalendarFilename` preserving Bengali and Unicode characters.
- [x] Handled Bengali numerals in calendar time parsing.
- [x] Added day range bounds validation (1..31) in word date regexes.
- [x] Resolved misleading zero-index range fallback in evidence matcher.
- [x] Handled canvas errors gracefully in image preprocessor.
- [x] 41/41 unit tests passing with 0 ESLint errors.

### Phase 5: Hackathon Demo Readiness & Deployment `[In progress]`
- [x] 3 Pre-seeded realistic demo notices (Dhaka Univ, BUET, Jahangirnagar Univ).
- [x] Zero empty states across all pages.
- [x] Timed 2m 30s pitch script and Devpost documentation.
- [x] Architecture diagrams in README.
- [ ] Production build deployment to Vercel/Cloudflare Pages.
