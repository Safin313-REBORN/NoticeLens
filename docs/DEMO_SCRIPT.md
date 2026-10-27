# NoticeLens Live Demonstration Script (2:30 Timed Run)

**Presenter Target Duration**: 2 Minutes 30 Seconds  
**Applicable Challenge Time Ranges**: Fits 1–3 min and 2–5 min hackathon video criteria.

---

### Phase 1: The Problem (0:00 – 0:20)
**[Visual on Screen]**: Display a crowded university notice board or a scanned paper notice written in mixed Bengali-English.

**Presenter Narration**:  
> "Every semester, hundreds of thousands of university students in Bangladesh rely on physical circulars pinned to department notice boards for exam schedules, admit card deadlines, and fee submissions. But for students with low vision or visual impairments, reading these complex notices is an exhausting barrier. Conventional OCR apps simply dump a wall of unformatted text, leaving students guessing: *What is the actual deadline? Which room am I in? What do I need to bring?*"

---

### Phase 2: Introducing NoticeLens (0:20 – 0:40)
**[Visual on Screen]**: Switch to NoticeLens homepage at `http://127.0.0.1:5173/`. Point to the brand title and tagline: *"Read the notice. Know what to do."* Demonstrate toggling High Contrast Mode in the top accessibility toolbar.

**Presenter Narration**:  
> "This is **NoticeLens**—an AI-assisted accessibility application built to transform university notices into clear, verifiable, and actionable intelligence. NoticeLens does not merely read raw text aloud. It understands the notice, extracts critical deadlines, and backs every single fact with traceable source evidence."

---

### Phase 3: Real OCR & Transparent Evaluation (0:40 – 1:15)
**[Visual on Screen]**: Scroll to the evaluation samples section. Point out the two distinct actions on each sample card:
1. `⚡ Run Live OCR on Image` (Executes actual client-side Tesseract OCR on the sample notice image)
2. `Instant Sample Data (Preset)` (Loads pre-parsed text without running OCR, clearly labeled)
Click on **"⚡ Run Live OCR on Image"** on the Bengali notice ("Semester Final Examination Schedule & Rules").
Watch the progress stepper activate:
- *Enhancing contrast and normalizing document layout...*
- *Recognizing Bengali & English text (Worker progress %)...*
- *Extracting verified deadlines, venue, and actionable details...*

**Presenter Narration**:  
> "NoticeLens runs 100% locally in the browser with zero cloud server dependencies and complete student privacy. NoticeLens lets judges run a real live OCR scan using client-side Tesseract.js with local assets and strict CSP compliance. NoticeLens never fakes confidence: preset samples are clearly marked as pre-parsed, while live OCR reports real character confidence from the engine."

*(Contingency Note: If OCR initialization is slow on low-powered judging devices, click 'Instant Sample Data' and state: 'NoticeLens provides pre-parsed sample data so students and evaluators can inspect downstream intelligence instantly even on low-end hardware.')*

---

### Phase 4: Structured Fields & Traceable Evidence (1:15 – 1:45)
**[Visual on Screen]**: The app transitions into the **Notice Workspace**.
- Highlight the **Accessible Plain-Language Summary**: *"What this notice is about"*, *"Critical Timeline"*, and *"What You Need to Do"*.
- Click on the **Venue** field card (`কাজী মোতাহার হোসেন ভবন, কক্ষ নং ৪০২`). Notice how the exact source snippet is highlighted in the Raw OCR Transcript editor on the right!
- Demonstrate editing the transcript: Click **"Edit Transcript"**, change the date or venue in the text, and click **"Apply Changes & Re-derive"**. Notice how downstream fields update synchronously without stale-state bugs!
- Demonstrate editing a field: Click the edit icon on a card, enter a correction, and save. The card displays a prominent purple badge: **"User Override: Manually corrected value (overrides machine extraction)"** and labels the original OCR snippet as superseded.

**Presenter Narration**:  
> "NoticeLens generates an accessible plain-language summary in seconds. But here is our core innovation: **evidence-backed notice intelligence**. When I click on any field, NoticeLens cites and highlights the exact snippet in the original text where that detail was found! If poor lighting caused an OCR typo, the student can correct the transcript, and NoticeLens atomically re-derives all dates. When a student overrides a field, NoticeLens honestly labels it as a human correction rather than pretending it was machine-extracted."

---

### Phase 5: Voice Output, Calendar Export & Persistence (1:45 – 2:15)
**[Visual on Screen]**:
- Click the **"Listen to Summary"** button. The Audio Player Bar illuminates.
- Point to the toolbar: *"Bengali Voice: Hardware Fallback"* (or native voice if present).
- Click **"Export to Calendar (.ICS)"**. If a date is ambiguous, the review gate modal prompts confirmation. Upon confirmation, the `.ics` file downloads with `Asia/Dhaka` timezone definition.
- Click **"Save Notice"**. A toast confirms: *"Notice saved privately on your device!"*
- Switch to the **"Notice Vault"** tab to show the saved record with search and category filters.

**Presenter Narration**:  
> "Students can listen to summaries or individual fields. NoticeLens checks device speech hardware and honestly displays whether native Bengali speech or a hardware fallback is active. With one click on 'Export to Calendar', NoticeLens generates an RFC 5545 `.ics` file with proper Asia/Dhaka timezone formatting and an automatic review gate for ambiguous dates. And tapping 'Save Notice' persists the notice privately in the browser's IndexedDB with durable base64 image storage that survives page reloads."

---

### Phase 6: Impact & Closing (2:15 – 2:30)
**[Visual on Screen]**: Show the full NoticeLens interface in High Contrast Mode.

**Presenter Narration**:  
> "Built with React 18, TypeScript, Tailwind CSS, Tesseract.js, and IndexedDB, NoticeLens is fast, private, and fully aligned with WCAG 2.2 AA accessibility. It bridges the gap between inaccessible physical notice boards and independent university education for low-vision students across Bangladesh. NoticeLens: *Read the notice. Know what to do.* Thank you!"
