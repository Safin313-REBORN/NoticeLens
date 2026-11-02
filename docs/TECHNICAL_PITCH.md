# NoticeLens — Technical Pitch for Hackathon Judges
**Project Tagline:** Read the notice. Know what to do.  
**Core Innovation:** Evidence-Grounded Institutional Notice Intelligence & Accessibility System  

---

## 1. The Core Question: "Why Not Just Use Google Lens?"

A judge may naturally ask:
> *"Why should a visually impaired student use NoticeLens instead of Google Lens or a standard phone OCR tool?"*

**The Answer:**
A generic OCR reader extracts an unstructured stream of characters. To a blind student using a screen reader, listening to a 500-word raw text dump containing university letterheads, bureaucratic salutations, and table debris is overwhelming. More critically: **generic OCR does not understand institutional intent.**

NoticeLens is an **institutional notice intelligence system**. It takes that raw circular and answers the six questions students actually care about:
1. *What happened?*
2. *Who is affected?*
3. *What must I do?*
4. *When is the deadline?* (Crucially disambiguated from exam dates and publication dates)
5. *What documents and fees are required?*
6. *What information is uncertain or needs review?*

Every extracted fact is **evidence-grounded**—clicking an extracted fee or date highlights the authentic sentence in the original transcript. 100% verbatim precision applies to attached quotes, with 84.21% overall grounding coverage across fields (category classifications omit quotes).

---

## 2. Technical Deep-Dive for Evaluators

### 2.1 Why Client-Side Tesseract.js Instead of Cloud Vision APIs?
- **Universal Privacy & Student Autonomy:** Higher education notices often contain student roll numbers, fee challans, disciplinary notices, or grades. NoticeLens processes 100% of data locally on the device—no document is ever sent to an external server.
- **Offline Capability:** In developing regions (including Bangladesh), campus Wi-Fi and mobile data are frequently intermittent. Once the 1.7MB Bengali model is cached, NoticeLens operates completely offline with zero network connectivity.
- **Zero Ongoing Cloud Cost:** Running a cloud vision API + LLM for thousands of university students incurs continuous API fees. NoticeLens runs indefinitely for zero server cost on free static hosting.

### 2.2 How Does Bilingual Notice Intelligence Work?
- Bengali and English scripts possess vastly different Unicode structures and numeral systems (`০-৯` vs `0-9`).
- NoticeLens applies **Unicode NFC normalization**, converts Bengali digits to calendar-parseable representations, and runs deterministic contextual regex extractors trained on over 200 real university circular patterns (Dhaka University, BUET, Jahangirnagar, etc.).
- When language models are initialized, NoticeLens pre-warms both `ben` and `eng` models into IndexedDB.

### 2.3 The Critical Technical Differentiator: Deadline vs. Event-Date Disambiguation
In university notices, students are frequently misled by multiple dates:
- **Notice Publication Date:** e.g., *"Published on 28 October 2024"*
- **Application / Fee Deadline:** e.g., *"Pay fee before 5 November 2024"*
- **Examination / Event Date:** e.g., *"Exam begins on 15 November 2024"*

Generic tools extract the first date they find. NoticeLens parses surrounding linguistic markers in both Bengali (*"তারিখের মধ্যে"*, *"শেষ সময়"*, *"হতে শুরু হবে"*) and English (*"Deadline"*, *"takes place on"*). It categorizes dates into:
1. **Critical Deadlines** (exported to `.ics` with 24-hour alarm triggers).
2. **Event & Exam Schedules** (flagged as milestones).
3. **Publication Records** (flagged as historical metadata).

If a notice mentions a date without an explicit year (e.g., *"20 November"*), NoticeLens halts calendar export with an accessible **Review Modal Gate**, refusing to guess or hallucinate a year.

### 2.4 Evidence Grounding & Factual Provenance Integrity
Unlike generative Large Language Models that invent missing facts:
- Every extracted field retains an exact character index span into the OCR transcript.
- When a user edits the transcript, NoticeLens dynamically re-derives fields and purges stale evidence.
- If a user manually overrides a field, NoticeLens explicitly flags it as `✏️ User Override`, preserving a transparent audit trail.

### 2.5 Offline Architecture & Cryptographic Provenance
- Cached traineddata binaries in IndexedDB are validated for internal structural integrity (16-byte header, directory table offsets, minimum payload size, non-zero-filled buffers).
- Every offline model is verified via **Web Crypto SHA-256 hashing**. The application will never claim a model is offline-verified based on synthetic or mock buffers.

---

## 3. What Was Measured (Empirical Benchmarks on Pilot Corpus, N = 6)

Evaluated across our 6-document synthetic pilot corpus (rendered from HTML templates modeled on authentic Bangladeshi university notice formats) using real Tesseract.js v7.0.0 OCR on image fixtures (900 px wide × 1000–1200 px high):
- **Character Error Rate (CER):** **2.30%** (Real OCR Mean; English: 0.93%, Bengali: 3.84%, Mixed: 2.12%)
- **Word Error Rate (WER):** **9.18%** (Real OCR Mean; English: 3.85%, Bengali: 11.18%, Mixed: 12.51%)
- **Three-Mode Extraction Quality:**
  - Mode A (Clean Source Text Baseline): F1: **80.46%** (Precision: 83.33%, Recall: 77.78%)
  - Mode B (Snapshot OCR Baseline): F1: **77.27%** (Precision: 79.07%, Recall: 75.56%)
  - Mode C (Live Real OCR Recognition): F1: **77.27%** (Precision: 79.07%, Recall: 75.56%)
- **Factual Evidence Span Precision:** **100.00%** (48/48 attached quotes match source text verbatim at exact character offsets; applies strictly to attached quotes)
- **Overall Fact Grounding Coverage:** **84.21%** (48/57 fields; remaining 9 are taxonomy category tags)
- **Field-Value Extraction Accuracy:** **81.82%** (27/33 gold annotations matched in extracted field values)
- **Heuristic Gold Evidence Recall:** **72.73%** (24/33 gold annotated facts retrieved with verified supporting snippets via hardened heuristic matcher)
- **Heuristic Field-to-Evidence Association Accuracy:** **85.71%** (24/28 extracted gold fields with evidence point to the authentic supporting sentence)
- **Joint Value & Evidence Match Rate:** **72.73%** (24/33 gold annotations matched in both extracted value and evidence)
- **High-Contrast Ratio:** **15.93:1** (WCAG AAA requires 7.0:1)
- **Structured Extraction Latency (Parser Only):** **1.62 ms** median / **9.82 ms** P90 (historical initial run: 2.14 ms median / 9.63 ms P90)
- **Per-Document Pipeline Latency (Warm):** **958.1 ms** median / **1554.8 ms** P90 (historical initial run: 968.7 ms median / 1559.4 ms P90; per-document warm pipeline timing excludes worker and language-model setup, measuring image read + OCR + extraction; warm worker reinitialization: 131.1 ms [reusing existing worker]; cold worker initialization: 452.0 ms [`createWorker()` includes worker setup, core loading, language loading and initialization])
- **Language Model Pool Load:** **712.8 ms** (historical initial run: ~718.1 ms; worker-pool timing measures three sequential worker creations for ben, eng, ben+eng)
- **Automated Verification:** 159 automated tests passing across 9 test suites, zero ESLint warnings, production build verified with zero debug globals, machine-readable JSON evaluation report logged to `docs/benchmark-results.json`

---

## 4. Honest Technical Limitations (What Remains to be Solved)

We believe in radical engineering candor:
1. **Low-Resolution / Handwritten Notices:** Tesseract.js performs reliably on printed and digital notices, but struggles on low-resolution mobile photographs with heavy lens glare or handwritten departmental memos.
2. **Multi-Column Complex Tables:** While NoticeLens isolates dates and fees from linear text, complex multi-column nested exam seat tables can produce fragmented OCR reading orders.
3. **Client-Side Initial Download:** The initial download of language models requires ~25MB of network bandwidth on first load before the offline worker cache is established.
