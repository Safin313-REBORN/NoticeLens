# NoticeLens — Real-World User Research Protocol & Field Evaluation Kit
**Document Version:** 2.0.0  
**Target Audience:** Visually Impaired, Low-Vision, and Neurodivergent University Students  
**Status:** Approved Ethical Protocol & Operational Field Kit (Pending Empirical Execution)  

> [!IMPORTANT]
> **Research Integrity Notice:** In strict accordance with hackathon evaluation standards, NoticeLens has NOT fabricated participant names, testimonials, interview transcripts, or satisfaction scores. This protocol provides the ethical foundation, instruments, consent scripts, and observation forms ready for field execution with 3–5 university students.

---

## 1. Executive Summary & Research Objectives

NoticeLens addresses an acute accessibility gap in higher education: **institutional circulars, examination schedules, and fee notices published as raster images, camera photos, or scanned PDFs**. While standard OCR produces unstructured text streams, students with visual impairments, low vision, or cognitive fatigue struggle to parse critical deadlines, payment amounts, prerequisites, and actionable requirements.

### Primary Research Objectives:
1. **Assistive Technology Compatibility:** Evaluate interaction with screen readers (NVDA, JAWS, VoiceOver, TalkBack, Orca), screen magnifiers, and 200% browser zoom reflow.
2. **Notice-to-Action Utility:** Measure whether the 6-question breakdown, structured action checklist, and timeline disambiguation reduce cognitive effort relative to raw OCR streams.
3. **Factual Evidence Grounding:** Determine whether interactive source-evidence highlights foster trust and enable efficient fact verification.
4. **Local Privacy Assurance:** Test whether the Shared Terminal Purge and local-first architecture provide sufficient security on shared campus laboratory workstations.

---

## 2. Participant Profile & Inclusion Criteria

Target Cohort: **3 to 5 university students** with lived experience of visual or cognitive reading challenges.

### Inclusion Criteria:
- Enrolled undergraduate or graduate students at an accredited university.
- User profile:
  - Total blindness: relying exclusively on screen readers or refreshable braille displays.
  - Low vision: utilizing screen magnifiers, high-contrast themes, or enlarged typography.
  - Neurodivergent / cognitive reading challenge (e.g. dyslexia, ADHD, information processing overload).
  - Mixed Bengali-English bilingual learners encountering administrative circulars.
- Familiarity with standard web browsing (desktop Chrome/Firefox or mobile Safari/Chrome).

### Exclusion Criteria:
- **Simulated Impairments Prohibited:** Sighted individuals wearing blindfolds or blur goggles are strictly barred from participating as substitutes for visually impaired users. Simulations do not reproduce experienced assistive workflows or mental models.
- Inability or unwillingness to grant voluntary informed consent.

---

## 3. Ethical Conduct & Short Accessible Consent Script

### 3.1 Facilitator Consent Script (Verbal & Large-Print Accessible Format)

```text
"Hello, and thank you for taking the time to help evaluate NoticeLens. 

Before we begin, please know:
1. You are not being tested—we are testing how well the software supports you. 
   If anything is confusing or difficult, that is a flaw in the software, not you.
2. Your participation is completely voluntary. You may skip any question or task, 
   take a break at any time, or stop the session entirely without giving a reason.
3. We do not collect any personal medical details or clinical vision measurements.
4. All notices and text processed during this session remain strictly inside your 
   browser on this device. Nothing is sent to an external server or saved in the cloud.
5. At the end of the session, we will run the built-in 'Shared Terminal Purge' 
   to erase all stored notices, settings, and cache files from this computer.
6. Your notes will be completely anonymous and referenced only by a code like 'Participant P1'.

Do you have any questions, and are you comfortable proceeding with the session?"
```

Participant Response: [ ] Agreed Verbally   [ ] Declined / Deferred

---

## 4. Accessible Participant Instruction Sheet

Facilitators must provide this sheet either verbally, via screen-reader-accessible HTML/plain text, or in 24pt high-contrast bold typography:

```text
NoticeLens Usability Session — Step-by-Step Tasks:

Task 1: Open the NoticeLens website. Using your keyboard or screen reader, locate 
        the notice upload area.
Task 2: Select the sample notice button to load an official university examination circular.
Task 3: Find the critical application deadline. Check whether you can easily distinguish 
        it from the examination start date.
Task 4: Find the required documents and fee amount.
Task 5: Listen to the plain-language executive summary using the 'Read Aloud' button 
        or your screen reader.
Task 6: Select the fee or deadline field and observe the evidence quote from the original notice.
Task 7: Mark one requirement as completed in the Action Checklist, and try exporting the 
        deadline to your calendar (.ics file).
Task 8: Go to the Saved Notices vault, reopen the circular, and then trigger the 
        'Shared Terminal Purge' button to erase all session data.
```

---

## 5. Facilitator Observation Form

For each task, record:
- **Task Start Time & End Time** (seconds elapsed).
- **Assistance Level:**
  - `0` = Independent pass (completed without assistance).
  - `1` = Minor verbal clarification (e.g., clarifying task phrasing).
  - `2` = Directive prompt (e.g., pointing out a missed heading).
  - `3` = Facilitator takeover / Task abort.
- **Assistive Technology Friction:**
  - Screen reader focus loss or unexpected jumping.
  - Inappropriate ARIA role or silent dynamic updates.
  - Color contrast difficulties under magnification.
  - Touch target collisions or scrolling barriers.
- **Quotes & Participant Reactions:** Verbatim remarks during task execution.

---

## 6. Structured Feedback Questionnaire

### Part A: 5-Point Likert Usability Items (Adapted from SUS)
*Scale: 1 = Strongly Disagree, 2 = Disagree, 3 = Neutral, 4 = Agree, 5 = Strongly Agree*

1. "I was able to find the critical deadline without confusing it with the exam date." [1 - 2 - 3 - 4 - 5]
2. "The 6-question summary gave me the information I needed faster than reading the whole notice." [1 - 2 - 3 - 4 - 5]
3. "Seeing the original evidence quote increased my confidence that the information was accurate." [1 - 2 - 3 - 4 - 5]
4. "The high-contrast mode and text resizing made reading comfortable for my vision." [1 - 2 - 3 - 4 - 5]
5. "The audio playback was clear and understandable in Bengali and English." [1 - 2 - 3 - 4 - 5]
6. "I would feel safe using this application on a shared computer in the campus library." [1 - 2 - 3 - 4 - 5]

### Part B: Qualitative Open-Ended Inquiries
1. "What was the most confusing or frustrating part of this experience?"
2. "If you had to prepare for an upcoming exam or registration deadline, which feature would you rely on most?"
3. "What feature is currently missing that would make this indispensable for your studies?"

---

## 7. Problem Prioritization Framework (Nielsen-Norman Group Severity Scale)

All observed usability problems will be categorized and prioritized using standard accessibility severity criteria:

| Severity Code | Classification | Criteria & Impact | Response SLA |
| :---: | :--- | :--- | :---: |
| **P0** | **Blocker / Critical Barrier** | Prevents participant from completing task. Causes focus trap, screen reader crash, or total inability to access deadline. | Immediate fix before release |
| **P1** | **Major Flaw** | Causes significant delay, confusion, or incorrect date interpretation. Workaround exists but imposes high cognitive tax. | 48-hour sprint |
| **P2** | **Moderate Friction** | Noticeable inconvenience (e.g., awkward pronunciation of a Bengali word, minor focus jump after checking item). | Next minor release |
| **P3** | **Cosmetic / Minor** | Minor visual alignment or subtle stylistic preference that does not hinder task completion. | Low priority backlog |

---

## 8. Empirical Execution Status Commitment

NoticeLens upholds strict scientific transparency:
- Real field sessions with 3–5 students are currently **Pending Empirical Execution** in coordination with university accessibility services.
- Empirical findings will be entered exclusively into `USER_RESEARCH_RESULTS_TEMPLATE.md` upon session completion.
- No simulated user feedback will ever be substituted for lived-experience user research.
