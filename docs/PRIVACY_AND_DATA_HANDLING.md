# NoticeLens — Privacy Architecture & Data Handling Specification
**Document Version:** 1.0.0  
**Specification:** Client-Side Data Lifecycle, Public-Terminal Protection & Privacy Threat Posture  
**Guiding Principle:** Local-First Independence — Your Documents Never Leave Your Device  

---

## 1. Core Privacy Philosophy & Architectural Boundary

NoticeLens was engineered for students dealing with sensitive institutional announcements, including examination eligibility notices, fee challans, disciplinary summons, and confidential grade circulars.

### The Zero-Cloud Inference Guarantee:
- **Zero Document Transmission:** 100% of OCR processing, text normalization, intelligence extraction, summary generation, action checklists, and calendar exports occur **strictly within the client browser runtime**.
- **Zero Third-Party LLM Endpoints:** No data is forwarded to OpenAI, Google Cloud Vertex, Anthropic, or external inference servers.
- **Zero Tracking or Telemetry:** NoticeLens does not include third-party tracking scripts, analytics beacons, or fingerprinting libraries.

---

## 2. Comprehensive Data Lifecycle & Storage Matrix

| Data Element | Storage Location | Retention Lifetime | Network Transmission | Purge Mechanism |
| :--- | :--- | :--- | :---: | :--- |
| **Uploaded Scanned Images** | Client Memory (HTML5 Canvas / Blob URL) | Session runtime (discarded on navigation/refresh) | None (0 bytes) | `URL.revokeObjectURL()`, memory garbage collection |
| **Tesseract Language Binaries (`.traineddata`)** | IndexedDB (`keyval-store`) | Persistent client cache | One-time initial download from trusted CDN / local static route | Retained for offline capability; clearable via browser settings |
| **Tesseract Engine Assets (`worker.min.js`, WASM)** | CacheStorage (`noticelens-ocr-cache-v2`) | Persistent client cache | Cached by Service Worker | Clearable via browser "Clear Site Data" |
| **Saved Notices in Notice Vault** | IndexedDB (`noticelens_db` $\rightarrow$ `notices`) | User-controlled persistence | None (0 bytes) | Single-card delete button OR "Purge Terminal Data" |
| **Fallback Saved Notices** (if IndexedDB disabled) | `localStorage['noticelens_saved_notices']` | User-controlled persistence (image stripped) | None (0 bytes) | Single-card delete button OR "Purge Terminal Data" |
| **Interactive Checklist State** | `localStorage['noticelens_checklist_{id}']` | Persisted until cleared | None (0 bytes) | Card "Reset" button OR "Purge Terminal Data" |
| **TTS Audio Playback** | Web Speech API in-memory buffer | Real-time speech stream (transient) | None (Client OS speech engine) | `speechSynthesis.cancel()` on stop or view exit |
| **Calendar Exports (`.ics`)** | Temporary browser memory blob | Immediate user download to local filesystem | None (RFC 5545 string generated locally) | Immediate blob revocation |

---

## 3. Public-Terminal Protection: Shared Terminal Purge

Many university students in Bangladesh and worldwide access administrative portals from shared computers in campus computer labs, university libraries, or commercial cyber-cafés. On shared machines, unpurged local storage poses a critical privacy exposure risk.

### What "Shared Terminal Purge" Does:
When a student activates **"Purge Terminal Data"** from the Notice Vault:
1. **IndexedDB Database Cleared:** Executes `objectStore.clear()` on the primary `notices` store.
2. **LocalStorage Keys Removed:** Erases `noticelens_saved_notices` and all task progress keys prefixed with `noticelens_checklist_`.
3. **Blob URL Revocation:** Invokes `URL.revokeObjectURL()` on any active document previews.
4. **Active Worker Termination:** Shuts down any in-memory Tesseract worker threads via `worker.terminate()`.
5. **UI & Memory State Reset:** Sets active notice, transcript, and summary states to null.
6. **Accessible Screen Reader Announcement:** Emits an ARIA live region confirmation stating: *"All saved notices purged from local device database."*

### Technical Honesty: Why We Do Not Claim "Cryptographic Erasure"
In adherence to competitive integrity and technical honesty:
- NoticeLens **does not claim cryptographic multi-pass block overwriting**. Browser web sandbox APIs do not have direct physical access to SSD flash memory controllers or disk sectors.
- Instead, NoticeLens guarantees **complete logical eviction from browser storage subsystems**. Once purged, subsequent visitors to the terminal cannot inspect, recover, or open any previously saved notices through the web application.

---

## 4. Frequently Asked Privacy Questions

### Q: What happens if a student forgets to purge on a public computer?
If private browsing (Incognito) was used, the browser automatically discards all IndexedDB and localStorage entries upon closing the browser window. If standard browsing was used, saved notices remain in the browser's local IndexedDB until manually purged or until browser history is cleared.

### Q: Does speech synthesis transmit notice text to external servers?
Modern mobile operating systems (iOS, Android) and desktop OSs (macOS, Windows 11) run native on-device speech synthesis engines for supported languages. However, some browser versions of Chrome may route unknown language requests through remote Google TTS services if on-device voices are absent. NoticeLens mitigates this by providing an offline-capable **phonetic fallback engine** that transliterates Bengali text into phonetic sequences readable by universal on-device voices.
