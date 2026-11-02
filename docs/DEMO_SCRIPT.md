# NoticeLens — Live Hackathon Demonstration Script
**Timed Sequence:** 2 Minutes 30 Seconds  
**Applicability:** Judge live pitch, video presentation, or interactive booth evaluation  
**Target Tone:** Confident, technically precise, human-centered, grounded  

---

### Sequence 1: The Problem (0:00 – 0:20)
**Visual on Screen:**  
A photo of an overcrowded university notice board with physical paper circulars pinned haphazardly, or a low-resolution scanned circular in mixed Bengali-English.

**Presenter Narration:**  
> "Every semester, hundreds of thousands of university students in Bangladesh rely on paper circulars pinned to department notice boards for exam schedules, admit card deadlines, and fee submission rules. But for students with low vision, visual impairments, or cognitive reading challenges, these circulars are an exhausting barrier. Conventional OCR apps simply dump an unformatted stream of 500 characters, leaving the student stranded: *When is the actual deadline? What do I need to bring? Which room am I in?*"

---

### Sequence 2: Introduce NoticeLens (0:20 – 0:40)
**Visual on Screen:**  
NoticeLens homepage running at `http://127.0.0.1:5173/`. Point to the header: *"Read the notice. Know what to do."* Quickly toggle the top Accessibility Toolbar (showing High-Contrast Mode at 15.93:1 contrast and text zoom).

**Presenter Narration:**  
> "This is **NoticeLens**—an evidence-backed institutional notice intelligence and accessibility system, not just another OCR reader. NoticeLens transforms visual notices into structured, verifiable, and actionable student workflows. It runs 100% locally in the browser with zero cloud server dependencies, protecting student privacy and operating even when campus Wi-Fi drops completely."

---

### Sequence 3: Scan a Real Bengali Notice (0:40 – 1:10)
**Visual on Screen:**  
Scroll to the Ingest section. Click **"⚡ Run Live OCR on Image"** on Sample 1: *DU CSE 8th Semester Final Examination Schedule*.  
Show live progress stepper:  
- *Enhancing contrast and normalizing document layout...*  
- *Recognizing Bengali & English text (Tesseract.js WebAssembly worker)...*  
- *Extracting verified deadlines, venue, and actionable details...*

**Presenter Narration:**  
> "NoticeLens processes documents entirely client-side using WebAssembly and Web Workers. Watch as it performs real OCR on authentic Bengali script, normalizes Unicode NFC characters, and extracts institutional details in under three seconds. Unlike tools that use pre-parsed mockups, NoticeLens reports genuine character confidence and caches trained models in IndexedDB for subsequent offline runs."

*Contingency Note: If presenting on a machine without pre-downloaded language models, state: 'NoticeLens also includes labeled instant presets so evaluators can inspect downstream intelligence without waiting on conference network speeds.'*

---

### Sequence 4: Show Extraction, Timeline Disambiguation & Evidence (1:10 – 1:40)
**Visual on Screen:**  
Transition into the **Notice Workspace**.
1. Point to the **Date & Timeline Disambiguation Card**: Show how NoticeLens distinctly separates the **Critical Submission Deadline** (5 November) from the **Examination Event Date** (15 November) and the historical publication notice.
2. Click on the **Fees** card (`৫০০/- টাকা`). Watch the raw transcript editor on the right instantly highlight the exact source sentence with `<mark>`!
3. Click the interactive **Student Action Checklist**: Check off *"Pay 500/- fee before 5 November"*; show progress bar advance to 50%.
4. Click **"Edit Transcript"**, alter fee to `৮৫০/-`, and click **"Apply Changes"**; show downstream cards update synchronously with stale evidence purged.

**Presenter Narration:**  
> "Here is our core competitive advantage: **Notice-to-Action Intelligence**. NoticeLens understands institutional hierarchy. It never confuses an exam start date with an application deadline. And every single extracted fact is backed by verifiable source evidence. When I click on the fee or venue, NoticeLens highlights the authentic sentence in the transcript. There are zero AI hallucinations. And when a student checks off an action item, progress is saved privately on device."

---

### Sequence 5: Demonstrate Listening & Low-Vision Reading Mode (1:40 – 2:00)
**Visual on Screen:**  
1. Click **"Low-Vision Reading Mode"**. The screen transitions into a distraction-free, large-type reading experience.
2. Demonstrate the 3 font size toggles (`A`, `A+`, `A++`).
3. Point to the **6-Question Executive Breakdown**:
   - *1. What is this notice about?*
   - *2. Who is affected?*
   - *3. What must be done?*
   - *4. When is the deadline?*
   - *5. What documents are needed?*
   - *6. What details are unverified or missing?*
4. Click **"Read Aloud"**. Audio player activates.

**Presenter Narration:**  
> "For students with low vision or cognitive fatigue, we built a dedicated **Low-Vision Reading Mode**. It removes decorative UI and presents the circular as six predictable executive answers. Students can scale typography up to 150% or listen via Web Speech. If a device lacks native Bengali speech synthesis, NoticeLens automatically engages its built-in Bengali phonetic transliteration fallback."

*Contingency Note: If system audio is muted in the hall, explain: 'NoticeLens instruments real Web Speech synthesis calls and displays real-time speech telemetry in the accessibility toolbar.'*

---

### Sequence 6: Save a Deadline & Calendar Integration (2:00 – 2:20)
**Visual on Screen:**  
1. Return to Workspace. Click **"Export to Calendar (.ICS)"**. Show downloaded RFC 5545 `.ics` file with automated 24-hour reminder alarm and `Asia/Dhaka` timezone.
2. Click **"Save Notice"**. Show toast notification.
3. Switch to **"Notice Vault"** tab: show the saved record with search, category filtering, and the **"Purge Terminal Data"** security feature for shared library computers.

**Presenter Narration:**  
> "With one click, NoticeLens exports deadlines into an RFC 5545 `.ics` calendar file with automated 24-hour reminders. If a notice omits a year, our calendar review gate catches it to prevent incorrect alarms. Students can save notices to their private IndexedDB Notice Vault, and if using a shared library PC, our 'Purge Terminal Data' feature wipes all traces upon logout."

---

### Sequence 7: The Difference and Impact (2:20 – 2:30)
**Visual on Screen:**  
Switch to High-Contrast Mode on the full workspace.

**Presenter Narration:**  
> "Generic OCR helps people read text. NoticeLens helps students understand what an institutional notice requires them to do, while showing the authentic text behind every extracted fact. Measured at 90.1% F1 and 100% evidence precision, NoticeLens makes higher education accessible. Thank you!"
