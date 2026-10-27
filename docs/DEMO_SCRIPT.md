# NoticeLens Live Demonstration Script (2:30 Timed Run)

**Presenter Target Duration**: 2 Minutes 30 Seconds  
**Applicable Challenge Time Ranges**: Fits 1–3 min and 2–5 min hackathon video criteria.

---

### Phase 1: The Problem (0:00 – 0:20)
**[Visual on Screen]**: Display a crowded university notice board or a scanned, crumpled paper notice written in mixed Bengali-English.

**Presenter Narration**:  
> "Every semester, hundreds of thousands of university students in Bangladesh rely on printed wall circulars for exam schedules, admit card deadlines, and fee submissions. But for students with visual impairments or low vision, reading these complex notices is an exhausting challenge. Conventional OCR apps just dump a wall of unformatted text, leaving students guessing: *What is the actual deadline? Which room am I in? What do I need to bring?*"

---

### Phase 2: Introducing NoticeLens (0:20 – 0:40)
**[Visual on Screen]**: Switch to NoticeLens homepage at `http://127.0.0.1:5173/`. Point to the brand title and tagline: *"Read the notice. Know what to do."* Demonstrate toggling High Contrast Mode (7:1+ contrast) and text sizing in the top accessibility toolbar.

**Presenter Narration**:  
> "This is **NoticeLens**—an AI-assisted accessibility application built to transform university notices into clear, verifiable, and actionable intelligence. NoticeLens does not merely read text aloud. It understands what the notice is about, isolates critical deadlines, and backs every single fact with traceable source evidence."

---

### Phase 3: Live Document Upload & Real OCR (0:40 – 1:20)
**[Visual on Screen]**: Click on **"Sample Notices"** and select **"Semester Final Examination Schedule & Rules"** (or drag and drop a printed university notice photo). The 4-step progress stepper activates:
1. *Preparing Document & Layout*
2. *Recognizing Bengali & English Text (Real % progress)*
3. *Extracting Deadlines & Dates*
4. *Preparing Accessible Results*

**Presenter Narration**:  
> "NoticeLens runs 100% locally in the browser with zero cloud server dependencies and complete student privacy. Watch as we load a realistic university notice. The client-side OCR engine recognizes both Bengali and English scripts simultaneously with real progress feedback. It normalizes Bengali numerals like '১৫ নভেম্বর ২০২৪' into standardized dates, and organizes the circular into structured categories."

---

### Phase 4: Structured Fields & Evidence Highlighting (1:20 – 1:50)
**[Visual on Screen]**: The app seamlessly transitions into the **Notice Workspace**.
- Highlight the **Accessible Plain-Language Summary**: *"What this notice is about"*, *"Critical Timeline"*, and *"What You Need to Do"*.
- Click on the **Venue** field card (`কাজী মোতাহার হোসেন ভবন, কক্ষ নং ৪০২`). Notice how the exact source snippet is highlighted in bright yellow in the Raw OCR Transcript editor on the right!
- Demonstrate editing a field: Click the edit icon on the **Fees** card, change `৫০০/-` to `৫০০/- টাকা (পরিশোধিত)`, and click Save Correction.

**Presenter Narration**:  
> "NoticeLens generates an accessible plain-language summary in seconds. But here is our defining feature: **evidence-backed notice intelligence**. When I click on the Venue card or the Fees card, NoticeLens cites and highlights the exact snippet in the original text where that detail was found! If poor lighting or unusual fonts cause an OCR typo, the student can correct the field or edit the transcript, and NoticeLens recalculates downstream deadlines in real time."

---

### Phase 5: Voice Output & Calendar Export (1:50 – 2:10)
**[Visual on Screen]**:
- Click the **"Listen to Summary"** button. The sticky Audio Player Bar illuminates and plays the synthesized narration.
- Click **"Export Calendar (.ICS)"**. An `.ics` calendar file downloads instantly.
- Click **"Save Notice"**. A confirmation toast confirms: *"Notice saved privately on your device!"*

**Presenter Narration**:  
> "Students who prefer listening can tap 'Listen to Summary' or click the speaker on any individual field. NoticeLens discovers installed device voices and honestly advises the user if native Bengali TTS is available or if hardware fallback is active. With one click on 'Export Calendar', NoticeLens generates an RFC 5545 `.ics` file complete with a 24-hour deadline reminder for Google Calendar or Apple Calendar. And tapping 'Save Notice' stores the notice privately in the browser's IndexedDB."

*(Contingency Note: If the host machine lacks a native Bengali voice, state: 'NoticeLens honestly identifies that this machine lacks a native Bengali voice package and falls back gracefully without pretending or crashing.')*

---

### Phase 6: Impact, Engineering & Closing (2:10 – 2:30)
**[Visual on Screen]**: Click on the **"Saved Notices"** tab. Show the saved notice in the list with category badge, search bar, and deadline countdown. Pan over the clean, high-contrast UI.

**Presenter Narration**:  
> "Built with React 18, TypeScript, Tailwind CSS, Tesseract.js, and IndexedDB, NoticeLens is fast, private, and fully WCAG 2.2 AA compliant. It bridges the gap between inaccessible physical notice boards and independent university education for low-vision students across Bangladesh. NoticeLens: *Read the notice. Know what to do.* Thank you!"
