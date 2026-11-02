# NoticeLens Verified Runtime Screenshots

These screenshots represent actual runtime captures of the NoticeLens application rendered by Google Chrome 128+ in headless mode on `http://127.0.0.1:5173`. Every screenshot in this directory is a genuinely unique view with a unique image hash (zero duplicate files).

---

## Canonical Runtime Screenshots

1. **`01_home_scan.png`**:
   - **View**: Desktop Home Landing & Notice Ingestion Screen (Neumorphic Soft UI)
   - **Captured Components**: NoticeLens branding and tagline, top accessibility toolbar (High Contrast Mode toggle, text scaling, speech hardware status), drag-and-drop document upload box, soft convex card surfaces, and the three bundled university notice presets featuring distinct "⚡ Run Live OCR on Image" and "Instant Sample Data" buttons.
   - **Resolution**: 1280 x 1400

2. **`02_workspace_evidence.png`**:
   - **View**: Structured Notice Workspace & Evidence Highlighting
   - **Captured Components**: Accessible Plain-Language Summary (overview, critical deadline, action items, location & time schedule), deadline action card with `.ics` export, original document preview, OCR Document Transcript with truthful "Preset Sample (No OCR)" badge, and 14 extracted facts with Confirmed status badges.
   - **Resolution**: 1280 x 1400

3. **`03_saved_vault.png`**:
   - **View**: Notice Vault (Saved Notices Screen)
   - **Captured Components**: Notice Vault subheader, search input, category filters (All, Examination, Admission, Event, Scholarship, General), saved notice cards with verified badges and fictional demo educational disclaimers, and action buttons.
   - **Resolution**: 1280 x 1000

4. **`04_mobile_viewport.png`**:
   - **View**: Mobile Responsiveness & Gesture Navigation (Scan View)
   - **Captured Components**: Mobile layout at 375 x 812 viewport ensuring accessible touch targets, zero horizontal overflow (`scrollWidth <= clientWidth`), responsive stacking of navigation, toolbar, and gesture quick-nav bar.
   - **Resolution**: 375 x 812

5. **`07_mobile_gesture_workspace.png`**:
   - **View**: Mobile Viewport Workspace Screen
   - **Captured Components**: Mobile gesture navigation bar, responsive plain-language summary card layout, action buttons, and gesture action feedback at 375 x 812 viewport.
   - **Resolution**: 375 x 812

6. **`08_desktop_neomorphism_workspace.png`**:
   - **View**: Desktop Neumorphic Workspace View
   - **Captured Components**: Neumorphic workspace layout showing plain-language summary, deadline calendar card, and OCR evidence citations.
   - **Resolution**: 1280 x 1400

7. **`09_high_contrast_mode.png`**:
   - **View**: Dedicated High-Contrast Accessibility Mode
   - **Captured Components**: Full interface rendered with computed pure black background (`#000000`), solid high-contrast white and yellow borders (`#ffffff`, `#facc15`), yellow headings, and high-contrast typography designed specifically for low-vision readability (verified 15.93:1 contrast ratio).
   - **Resolution**: 1280 x 1400

8. **`10_verified_offline_ocr.png`**:
   - **View**: Real Offline Bengali & English OCR Execution from IndexedDB Cache
   - **Captured Components**: Demonstrates real OCR running in an offline Chrome instance (`navigator.onLine === false`, network conditions set to 0 throughput/offline). NoticeLens initializes Tesseract.js from the browser's IndexedDB `keyval-store`, recognizing text with high confidence, rendering confirmed facts, and generating calendar deadlines with Zero external traineddata requests during offline OCR recognition.
   - **Resolution**: 1280 x 1200

9. **`11_offline_cache_miss_alert.png`**:
   - **View**: Offline Cache Miss Actionable Guidance
   - **Captured Components**: Demonstrates clear user guidance when offline and the required language model has not been previously downloaded. Shows actionable error banner informing the student that initial download requires internet access while preserving document selection and recommending Instant Sample Data presets.
   - **Resolution**: 1280 x 1000

10. **`12_solved_limitations_studio.png`**:
    - **View**: A11y Studio Solved Limitations Hub (Offline Model Pre-caching, Phonetic TTS Fallback, Persistent Storage)
    - **Captured Components**: Captures the Offline OCR Language Model Manager (allowing pre-caching of Bengali and English packs ahead of time), Speech Synthesis with Romanized Phonetic Transliteration preview for systems without native Bengali TTS, and Persistent Storage protection with JSON vault backup/restore.
    - **Resolution**: 1280 x 1600

---

## Architectural Concept Sketches

- **`handdrawn_desktop.png`**: Initial concept sketch for desktop Neumorphic layout and evidence linking.
- **`handdrawn_highcontrast.png`**: Low-vision high-contrast layout mapping and focus state structure.
- **`handdrawn_mobile.png`**: Mobile viewport swipe-gesture and touch ergonomics sketch.
