# NoticeLens — Technical Benchmarking Methodology & Evaluation Framework
**Document Version:** 2.0.0  
**Specification:** Mathematical Definitions, Benchmark Architecture & Empirical Evaluation Protocol  
**Author:** AI/ML & OCR Research Engineering Team  
**Dataset Scope:** Six-Document Pilot Benchmark Corpus ($N = 6$, Bangladeshi Institutional Circulars)  

---

## 1. Purpose & Empirical Scope

The NoticeLens Technical Benchmarking Framework establishes a reproducible, scientifically defensible evaluation protocol for:
1. **Genuine Image-Based Optical Character Recognition (OCR):** Evaluating raw character and token recognition using actual Tesseract.js v7.0.0 local workers on rendered institutional image fixtures.
2. **Dual-Mode Information Extraction Quality:** Measuring extraction performance separately on clean source text (isolating the NLP rule engine) and on genuine OCR transcripts (measuring real-world degradation from OCR recognition noise).
3. **Evidence Grounding Integrity & Attribution:** Verifying that extracted facts link directly to authentic, verbatim source text spans with exact character offsets, and tracking overall evidence coverage.
4. **Disaggregated Pipeline Latency Profiling:** Separating image preprocessing, worker initialization, language model loading, OCR recognition, and structured extraction times.

---

## 2. Mathematical Metrics & Definitions

### 2.1 Character Error Rate (CER)
Character Error Rate measures the normalized minimum edit distance required to transform recognized OCR output ($T_{\text{ocr}}$) into the ground-truth transcript ($T_{\text{gt}}$):

$$\text{CER} = \frac{S + D + I}{N_{\text{chars}}} = \frac{\text{LevenshteinDistance}(T_{\text{ocr}}, T_{\text{gt}})}{\text{Length}(T_{\text{gt}})}$$

Where:
- $S$ = Number of character substitutions
- $D$ = Number of character deletions
- $I$ = Number of character insertions
- $N_{\text{chars}}$ = Total character count in ground-truth transcript $T_{\text{gt}}$

#### Bengali & Multilingual Normalization Protocol for CER:
- **Unicode Canonical Composition (NFC):** Both ground-truth and recognized text are normalized using `text.normalize('NFC')`. Character arrays are mapped using `Array.from(str)` to evaluate Unicode code points, correctly preserving surrogate pairs and canonical diacritic representations without truncation.
- **Whitespace Collapsing:** Repeated whitespace characters (`[\s]+`) are collapsed to single spaces and trimmed to evaluate character recognition accuracy rather than visual layout margin differences.
- **Punctuation Preservation:** Administrative punctuation (Bengali Dari `।`, colons, hyphens, slashes, quotation marks) is preserved during evaluation because punctuation directly demarcates date, fee, and prerequisite boundaries.
- **Numeral Handling:** Bengali numerals (`০১২৩৪৫৬৭৮৯`) and Arabic digits (`0123456789`) are evaluated in their exact script representation to measure OCR script fidelity without arbitrary transliteration.

### 2.2 Word Error Rate (WER)
Word Error Rate evaluates token-level fidelity across whitespace-delimited tokens:

$$\text{WER} = \frac{S_w + D_w + I_w}{N_{\text{words}}}$$

Where $N_{\text{words}}$ is the total word count in the ground-truth text. Dynamic programming over token arrays computes the minimum sequence operations.

### 2.3 Information Extraction Metrics (Precision, Recall, F1)
For each key notice field $k \in \{\text{title, institution, category, deadline, eventDate, venue, fees, requiredDocuments, contact}\}$:

$$\text{Precision} (P) = \frac{\text{True Positives (TP)}}{\text{True Positives (TP)} + \text{False Positives (FP)}}$$

$$\text{Recall} (R) = \frac{\text{True Positives (TP)}}{\text{True Positives (TP)} + \text{False Negatives (FN)}}$$

$$F_1 = 2 \times \frac{P \times R}{P + R}$$

#### Strict Field-Specific Scoring Rules:
- **Dates (Deadline vs Event Date):** Normalized numerical day, month, and year must match. If an application deadline is misclassified as an examination date, it counts as both a False Positive for eventDate and a False Negative for deadline.
- **Fees:** Monetary amounts are normalized (converting Bengali numerals to English equivalents) and compared strictly. Extracted text that references fee deadlines without the currency amount is penalized as FP/FN.
- **Venue:** Must match specific room/building identifiers without confusing city or university names.
- **False Positives for Unexpected Fields:** Populating a field that is absent from the ground truth is strictly counted as a False Positive.

### 2.4 Evidence Grounding Metrics
NoticeLens separates evidence span authenticity from evidence coverage and factual alignment:

$$\text{Evidence Span Precision} = \frac{\text{Authentic Verbatim Source Spans}}{\text{Total Provided Evidence Spans}}$$

$$\text{Overall Grounding Coverage} = \frac{\text{Extracted Fields with Evidence}}{\text{Total Non-Empty Extracted Fields}}$$

$$\text{Character Offset Accuracy} = \frac{\text{Spans where } T[\text{start}:\text{end}] = \text{Snippet}}{\text{Total Provided Spans}}$$

$$\text{Gold Fact Evidence Recall} = \frac{\text{Gold Facts with Verified Supporting Evidence}}{\text{Total Gold Annotated Facts}}$$

$$\text{Field-to-Evidence Association Accuracy} = \frac{\text{Gold Facts with Verified Supporting Evidence}}{\text{Total Gold Facts Extracted with Evidence}}$$

> [!NOTE]
> In NoticeLens, **Evidence Span Precision is 100.00%** (every attached evidence span is verified verbatim against the source transcript) with **100.00% Character Offset Accuracy**, while **Overall Grounding Coverage is 84.21%** (abstract taxonomic fields like `category` and inferred headers do not carry direct quote snippets). **Gold Fact Evidence Recall is 81.82%** (27/33 gold annotations matched with verified supporting snippets), and **Field-to-Evidence Association Accuracy is 96.43%** (27/28 extracted gold fields with evidence point to the authentic supporting sentence). We explicitly do NOT describe substring presence as "proof of zero hallucinations."

---

## 3. Ground-Truth Synthetic Pilot Evaluation Corpus ($N = 6$)

The pilot evaluation corpus consists of 6 controlled synthetic notice layouts (`isSynthetic: true`) rendered from HTML templates modeled on authentic Bangladeshi university notice formats (fixtures are 900 px wide × 1000–1200 px high; DOC-04 includes camera perspective distortion simulation):

| Document ID | Language | Category | Format & Capture Quality | Dimensions | Provenance & Origin |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DOC-01** | Bengali (`ben`) | Examination | Clean digital notice | 900x1200 | Controlled synthetic notice modeled on University of Dhaka CSE 8th semester circulars. |
| **DOC-02** | English (`eng`) | Event | Clean digital notice | 900x1100 | Controlled synthetic notice modeled on BUET CSE Hackathon official circulars. |
| **DOC-03** | Mixed (`ben+eng`) | Admission | Bilingual digital circular | 900x1050 | Controlled synthetic notice modeled on Jahangirnagar University IIT postgraduate notices. |
| **DOC-04** | Bengali (`ben`) | General | Camera photo simulation | 900x1050 | Controlled synthetic notice modeled on Khulna University course registration circular with subtle lighting gradient and border perspective. |
| **DOC-05** | English (`eng`) | Admission | Dense circular typography | 900x1100 | Controlled synthetic notice modeled on BRAC University Financial Aid scholarship circulars. |
| **DOC-06** | Mixed (`ben+eng`) | Examination | Table-like academic schedule | 900x1000 | Controlled synthetic notice modeled on Rajshahi University Faculty of Engineering exam notices. |

---

## 4. Empirical Benchmark Results (Generated by Code Execution)

### 4.1 OCR Error Rates (Real Tesseract.js v7.0.0 Recognition on PNG Fixtures)

| Document | Language | Ground-Truth Chars | Measured CER | Measured WER | Substitutions (S) | Insertions (I) | Deletions (D) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **DOC-01** | Bengali | 656 | **2.44%** | **8.08%** | 9 | 2 | 5 |
| **DOC-02** | English | 759 | **1.32%** | **3.81%** | 4 | 6 | 0 |
| **DOC-03** | Mixed | 562 | **2.14%** | **11.69%** | 5 | 6 | 1 |
| **DOC-04** | Bengali (Camera) | 515 | **5.24%** | **14.29%** | 7 | 5 | 15 |
| **DOC-05** | English | 561 | **0.53%** | **3.90%** | 3 | 0 | 0 |
| **DOC-06** | Mixed | 427 | **2.11%** | **13.33%** | 4 | 4 | 1 |

#### Language Subgroup & Aggregate Summary:
- **English Subgroup Mean:** CER = **0.93%**, WER = **3.85%**
- **Bengali Subgroup Mean:** CER = **3.84%**, WER = **11.18%**
- **Mixed Subgroup Mean:** CER = **2.12%**, WER = **12.51%**
- **Aggregate Overall Mean ($N = 6$):** CER = **2.30%**, WER = **9.18%**

---

### 4.2 Three-Mode Information Extraction Results

Evaluating the extraction engine across three distinct operational modes reveals the exact boundaries of algorithmic extraction quality vs OCR degradation:

| Metric | Mode A: Clean Ground-Truth Text (NLP Engine Isolated) | Mode B: Snapshot OCR Transcript (Static Baseline) | Mode C: Live Real OCR Recognition (PNG → Tesseract → NLP) |
| :--- | :---: | :---: | :---: |
| **Input Source** | `doc.rawText` | `doc.actualOcrTranscript` | Real Tesseract.js live output from `.png` fixture |
| **True Positives (TP)** | 35 | 34 | 34 |
| **False Positives (FP)** | 7 | 9 | 9 |
| **False Negatives (FN)** | 10 | 11 | 11 |
| **Precision** | **83.33%** | **79.07%** | **79.07%** |
| **Recall** | **77.78%** | **75.56%** | **75.56%** |
| **F1 Score** | **80.46%** | **77.27%** | **77.27%** |
| **Degradation vs Clean Text** | Baseline | -3.19% F1 | -3.19% F1 |

---

### 4.3 Evidence Grounding & Factual Provenance Results

- **Total Non-Empty Extracted Fields:** 57
- **Fields with Attached Evidence Spans:** 48
- **Evidence Span Verbatim Precision:** **100.00%** (48 / 48 verified verbatim in source transcript)
- **Character Offset Mapping Accuracy:** **100.00%** (exact start and end index alignment)
- **Overall Grounding Coverage:** **84.21%** (48 / 57 fields; remaining 9 fields are abstract category taxonomy tags)
- **Total Gold Annotated Facts:** 33
- **Gold Facts with Any Evidence Attached:** 28
- **Gold Facts with Verified Matching Evidence:** 27
- **Gold Fact Evidence Recall:** **81.82%** (27 / 33 gold annotations matched with verified supporting snippets)
- **Field-to-Evidence Association Accuracy:** **96.43%** (27 / 28 gold fields with evidence point to the authentic supporting sentence)
- **Stale Evidence Invalidation:** Verified via automated regression (mutating transcript automatically purges out-of-date evidence offsets).

---

### 4.4 Dynamically Measured Latency Profile (Benchmark Environment: Linux x86_64, Node v18)

All latency measurements are measured dynamically using `performance.now()` across all 6 benchmark documents (mathematical median: average of middle two observations for even sample size):

| Pipeline Stage | Measurement Mode | Dynamically Measured Latency | Notes |
| :--- | :---: | :---: | :--- |
| **1. Image File Ingest / Read** | Repeated File Read | **0.56 ms (Median) / 0.67 ms (P90)** | `fs.promises.readFile` of fixture PNGs |
| **2. Cold Worker Initialization** | Fresh Process Launch | **504.9 ms** | First `createWorker()` call (fresh worker thread) |
| **3. Warm Worker Reinitialization** | Reused Active Thread | **137.9 ms** | `benchWorker.reinitialize('eng')` on active worker |
| **4. Language Model Pool Load** | Pre-warming (`ben`, `eng`, `ben+eng`) | **718.1 ms** | Concurrent multi-language worker creation |
| **5. OCR Recognition Latency** | Full-Page Recognition | **961.7 ms (Median) / 1556.6 ms (P90)** | Range: ~750 ms (English) to ~1600 ms (Mixed bilingual) |
| **6. Structured Extraction (`processNoticeDocument`)** | Pure In-Memory NLP | **2.36 ms (Median) / 9.63 ms (P90)** | High-speed regex + deterministic parser |
| **Per-Document Pipeline Latency (Warm)** | Complete Per-Document Pipeline | **968.7 ms (Median) / 1559.4 ms (P90)** | **Image Read + OCR Recognition + Extraction (workers initialized)** |

---

## 5. Verification Commands

To reproduce the benchmark suite deterministically:

```bash
# Generate image fixtures from scratch
node scripts/generateBenchmarkFixtures.cjs

# Run the complete technical benchmark runner
npm run benchmark

# Run the Vitest benchmark test directly
npx vitest run src/test/benchmark/benchmarkRunner.test.ts
```
