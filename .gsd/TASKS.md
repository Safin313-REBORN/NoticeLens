# NoticeLens — GSD Task Backlog

### Active Task
- **Active Task**: All Core & Grand Final Benchmarking Phases Complete. Ready for Hackathon evaluation, live showcase, or deployment.

---

## Task Inventory

### Phase 1: Architecture & OCR Pipeline
- [x] Task 1.1: Initialize Vite React TypeScript project with Strict mode `[Done]`
- [x] Task 1.2: Configure Tesseract.js bilingual worker pipeline `[Done]`
- [x] Task 1.3: Build in-memory canvas contrast enhancer `[Done]`
- [x] Task 1.4: Implement real-time progress bar and camera capture `[Done]`

### Phase 2: Bilingual Extraction Engine
- [x] Task 2.1: Write numeral normalizer module (`src/services/extraction/numerals.ts`) `[Done]`
- [x] Task 2.2: Implement multi-pattern date parser with ambiguity flags (`dateParser.ts`) `[Done]`
- [x] Task 2.3: Build time parser for Bengali & English periods (`timeParser.ts`) `[Done]`
- [x] Task 2.4: Implement exact character-range evidence matcher (`evidenceMatcher.ts`) `[Done]`
- [x] Task 2.5: Build RFC 5545 iCalendar exporter with VALARM (`icsExporter.ts`) `[Done]`
- [x] Task 2.6: Configure IndexedDB local repository (`indexedDBService.ts`) `[Done]`

### Phase 3: Inclusive UX & Soft Neumorphic Design
- [x] Task 3.1: Standardize Pure Neumorphic soft UI for desktop and gesture UI for mobile `[Done]`
- [x] Task 3.2: Build 5-page multipage navigation in `App.tsx` `[Done]`
- [x] Task 3.3: Implement Accessibility Studio with Bionic Reading, Dyslexia Font, Focus Ruler `[Done]`
- [x] Task 3.4: Integrate Web Speech API audio narrator with voice discovery & phonetic fallback `[Done]`
- [x] Task 3.5: Build Saved Archive (Notice Vault) with filters, search, and delete modals `[Done]`
- [x] Task 3.6: Build Evidence & Traceability Inspector with live transcript highlighter `[Done]`

### Phase 4: Production Audit & Remediation
- [x] Task 4.1: Perform 20-category pre-production audit `[Done]`
- [x] Task 4.2: Strip heavy base64 data URLs in localStorage fallback `[Done]`
- [x] Task 4.3: Add strict Content Security Policy and permissions meta tags `[Done]`
- [x] Task 4.4: Synchronize notice title with user field edits `[Done]`
- [x] Task 4.5: Preserve Unicode/Bengali characters in calendar filenames `[Done]`
- [x] Task 4.6: Parse Bengali digits in time strings for iCalendar `[Done]`
- [x] Task 4.7: Add day range checks (1..31) in word date regexes `[Done]`
- [x] Task 4.8: Return null on unmatched evidence snippets `[Done]`
- [x] Task 4.9: Wrap image preprocessing in try-catch to prevent hangs `[Done]`
- [x] Task 4.10: Add automated unit tests in `src/test/unit/auditFixes.test.ts` `[Done]`
- [x] Task 4.11: Run test suite, lint (0 errors), build `[Done]`

### Phase 5: Hackathon Demo & Evaluation Assets
- [x] Task 5.1: Create pitch deck outlines, Devpost summary, and timed demo script `[Done]`
- [x] Task 5.2: Seed 3 diverse university demo notices with Live OCR vs Instant Presets `[Done]`
- [x] Task 5.3: Cross-audit project against Hackathon, GSD, UI-UX Pro Max, and Vibe Coding skills `[Done]`
- [x] Task 5.4: Implement production build scanner for forbidden debug globals (`checkProductionBuild.cjs`) `[Done]`

### Phase 6: Grand Final Empirical Benchmarking & Hardening
- [x] Task 6.1: Build genuine image-based benchmark runner with real Tesseract recognition (`runBenchmarks.cjs`) `[Done]`
- [x] Task 6.2: Compute Levenshtein Character Error Rate (2.30%) and Word Error Rate (9.18%) across pilot corpus `[Done]`
- [x] Task 6.3: Implement dual-mode extraction benchmark (Clean F1: 80.46% vs OCR F1: 77.27%) `[Done]`
- [x] Task 6.4: Validate verbatim evidence precision (100.0%) and grounding coverage (84.21%) `[Done]`
- [x] Task 6.5: Verify offline Chrome OCR with fresh worker and Service Worker CacheStorage (`verifyOfflineCacheBrowser.cjs`) `[Done]`
- [x] Task 6.6: Execute 10-step headless Chrome E2E test with automated screenshot generation (`verifyWorkflowAndScreenshots.cjs`) `[Done]`
- [x] Task 6.7: Complete 147/147 passing automated tests across 9 test files `[Done]`
