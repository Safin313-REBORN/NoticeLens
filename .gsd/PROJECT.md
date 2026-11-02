# NoticeLens — Project Specification

> **Mission**: Empower university students with visual impairments, low vision, dyslexia, and ADHD across Bangladesh to read complex printed notices, extract critical deadlines, and take immediate action.

---

## 🏛️ System Architecture

- **Runtime Environment**: 100% Client-Side Web Application (zero external API keys required, zero server uploads).
- **Frontend Core**: React 18, TypeScript (Strict Mode), Vite 5.
- **Styling Architecture**: Pure Neumorphic Soft UI (Desktop) and Pattern Gesture-based UI (Mobile) via Tailwind CSS v3 and Vanilla CSS tokens.
- **Document Intelligence**:
  - Tesseract.js OCR engine (WASM) supporting bilingual `ben+eng`, `ben`, and `eng`.
  - In-memory HTML5 Canvas contrast enhancement and grayscale stretching.
  - Contextual Bengali/English date parser (DD/MM/YYYY, word months, ordinal dates).
  - Contextual time interval parser (Bengali & English 12-hour AM/PM).
  - Traceable character-level evidence matcher with highlighted citations.
  - Plain-language summary generator in Bengali and English.
- **Accessibility & Inclusive UX**:
  - WCAG 2.2 AAA compliant high-contrast mode (up to 21:1 black/white).
  - Dyslexia-friendly OpenDyslexic font support.
  - Bionic reading mode (highlighted word prefixes for rapid ADHD reading).
  - Visual focus ruler for sustained tracking.
  - Web Speech API integration with native Bengali voice discovery.
  - Full keyboard accessibility with skip links, aria-live regions, and focus rings.
- **Local Persistence & Export**:
  - IndexedDB (`NoticeLensDB`) for private offline notice archives.
  - Quota-safe fallback `localStorage` layer.
  - RFC 5545 iCalendar (`.ics`) exporter with VALARM automated reminders.

---

## 🔒 Security & Privacy Posture
- **Zero-Cloud Architecture**: No document images or OCR transcripts leave the user's browser.
- **Content Security Policy**: Strict CSP configured in `index.html` preventing script injection.
- **Local Storage Defenses**: Sanitization of heavy base64 images before saving to fallback storage to prevent 5MB quota exhaustion.
- **CRLF Injection Defense**: Sanitization and RFC 5545 escaping in calendar exports.
