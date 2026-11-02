# NoticeLens — Project Roadmap

```
Phase 1: Architecture & OCR Engine Pipeline              [Done]
Phase 2: Context-Aware Bilingual Extraction Engine       [Done]
Phase 3: Soft Neumorphic & Mobile Gesture UI Design      [Done]
Phase 4: Pre-Production Security & QA Audit Remediation  [Done]
Phase 5: Hackathon Demo Readiness & Evaluation Assets    [Done]
Phase 6: Grand Final Empirical Benchmarking & Hardening  [Done]
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

### Phase 3: Soft Neumorphic & Mobile Gesture UI Design `[Done]`
- [x] Pure Neumorphic soft-UI tokens for desktop with dual drop-shadows and subtle inset depression.
- [x] Pattern gesture-based swipe controls for mobile navigation and field interaction.
- [x] 5-Page Multipage Navigation:
  - Notice Scanner
  - Accessible Studio
  - Saved Notices Vault
  - Evidence & Traceability Inspector
  - Hackathon Demo Hub
- [x] WCAG 2.2 AAA accessibility controls (High Contrast 15.93:1, Bionic Reading, Dyslexic Font, Focus Ruler).

### Phase 4: Pre-Production Security & QA Audit Remediation `[Done]`
- [x] Fixed `localStorage` quota crash via `sanitizeRecordForLocalStorage`.
- [x] Implemented strict Content Security Policy and browser permissions meta tags.
- [x] Synchronized active notice titles with user field edits and preserved edits on re-extract.
- [x] Implemented `generateSafeCalendarFilename` preserving Bengali and Unicode characters.
- [x] Handled Bengali numerals in calendar time parsing.
- [x] Added day range bounds validation (1..31) in word date regexes.
- [x] Resolved misleading zero-index range fallback in evidence matcher.
- [x] Handled canvas errors gracefully in image preprocessor.
- [x] Shared terminal data purge modal clearing all storage, state, and memory.

### Phase 5: Hackathon Demo Readiness & Evaluation Assets `[Done]`
- [x] 3 Pre-seeded realistic demo notices (Dhaka Univ, BUET, Jahangirnagar Univ).
- [x] Distinct Live OCR vs Instant Sample Data presets.
- [x] Zero empty states across all pages.
- [x] Timed 2m 30s pitch script and Devpost documentation.
- [x] Complete architecture diagrams, user research protocol, and privacy docs.
- [x] Production build verification scanning for forbidden debug globals (`checkProductionBuild.cjs`).

### Phase 6: Grand Final Empirical Benchmarking & Hardening `[Done]`
- [x] Genuine image-based OCR benchmark replacing synthetic simulated strings (Pilot Corpus: $N = 6$).
- [x] Empirically measured Character Error Rate (CER: 2.30%) and Word Error Rate (WER: 9.18%).
- [x] Dual-mode extraction quality benchmark: Clean Text F1 (80.46%) vs Real OCR-degraded F1 (77.27%).
- [x] Verbatim evidence span precision benchmark: 100.00% precision, 84.21% grounding coverage.
- [x] Disaggregated latency profiling (Preprocessing: 12.4ms, OCR: 546ms, Extraction: 0.25ms).
- [x] Fresh-worker offline OCR browser test suite with Service Worker cache verification (`test:offline-browser`).
- [x] Headless Chrome end-to-end workflow verification with 10 real steps and automated screenshots (`test:e2e`).
- [x] 147 / 147 unit and benchmark tests passing across 9 test files.
