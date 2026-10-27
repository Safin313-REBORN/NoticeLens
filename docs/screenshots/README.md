# NoticeLens Screenshot Guide & Verification Checklist

In accordance with our core engineering principles (Principle #11: *"Do not fabricate screenshots or testing results"*), screenshots in this directory must represent actual runtime captures of NoticeLens.

Due to the sandbox container's restricted outbound network for downloading Playwright browser driver binaries, the three required screenshots can be captured directly in your local desktop browser by following these simple steps:

---

## Required Screenshots
1. **`screenshot-1-home-scanner.png`**:
   - **View**: Home Landing & Notice Scanner Screen
   - **What to show**: NoticeLens brand title, tagline *"Read the notice. Know what to do."*, top accessibility toolbar (High Contrast mode, Text Size scaler, Voice ready status), drag-and-drop upload zone, and the three bundled sample notice buttons.
   - **How to capture**: Open `http://localhost:5173/` in your browser. Press `F12` > Device toolbar (or full window) and capture screenshot. Save to `docs/screenshots/screenshot-1-home-scanner.png`.

2. **`screenshot-2-workspace-evidence.png`**:
   - **View**: Notice Workspace & Traceable Evidence Highlighting
   - **What to show**: The Accessible Plain-Language Summary (overview, critical deadline, action items), structured field cards (with "Confirmed" / "Needs Review" badges), and the Raw OCR Transcript on the right with a clicked evidence snippet highlighted in bright yellow (`evidence-highlight`).
   - **How to capture**: From the homepage, click on sample notice **"Semester Final Examination Schedule & Rules"**. When the workspace loads, click on the **Venue** card or **Fees** card to highlight its evidence snippet in the raw transcript. Save screenshot to `docs/screenshots/screenshot-2-workspace-evidence.png`.

3. **`screenshot-3-saved-notices.png`**:
   - **View**: Saved Notices & Accessibility Experience
   - **What to show**: The "Saved Notices" view with the saved examination circular card, category badge, deadline reminder, and calendar export button. Optionally toggle **"High Contrast (7:1+)"** in the top toolbar to showcase the WCAG AAA compliant black/yellow visual mode.
   - **How to capture**: In the workspace, click **"Save Notice"**, then click **"Saved Notices"** in the top navbar. Save screenshot to `docs/screenshots/screenshot-3-saved-notices.png`.
