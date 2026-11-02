// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { processNoticeDocument } from '../../services/extraction/noticeEngine';
import { DEMO_NOTICES } from '../../data/demoNotices';
import { ActionChecklistCard } from '../../components/results/ActionChecklistCard';
import { DeadlineTimelineCard } from '../../components/results/DeadlineTimelineCard';
import { AccessibleReadingView } from '../../components/results/AccessibleReadingView';
import { speechService } from '../../services/speech/webSpeechService';

describe('Notice-to-Action Experience & Accessible Low-Vision Reading Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Target Audience Extraction ("Who is Affected")', () => {
    it('extracts target audience for Bengali examination notice', () => {
      const notice = processNoticeDocument(DEMO_NOTICES[0].ocrText);
      expect(notice.summary.targetAudience).toBeDefined();
      expect(notice.summary.targetAudience).toContain('শিক্ষার্থী');
    });

    it('extracts target audience for English event/hackathon notice', () => {
      const notice = processNoticeDocument(DEMO_NOTICES[1].ocrText);
      expect(notice.summary.targetAudience).toBeDefined();
      expect(notice.summary.targetAudience).toMatch(/students/i);
    });

    it('extracts target audience for Mixed admission notice', () => {
      const notice = processNoticeDocument(DEMO_NOTICES[2].ocrText);
      expect(notice.summary.targetAudience).toBeDefined();
      expect(notice.summary.targetAudience).toMatch(/Admission|Candidate|ভর্তি/i);
    });
  });

  describe('ActionChecklistCard Component', () => {
    it('derives explicit actionable items from notice fields', () => {
      const notice = processNoticeDocument(DEMO_NOTICES[0].ocrText);
      render(<ActionChecklistCard notice={notice} />);

      expect(screen.getByText(/Student Action Checklist/i)).toBeInTheDocument();
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('allows toggling items and updates completed count', () => {
      const notice = processNoticeDocument(DEMO_NOTICES[0].ocrText);
      render(<ActionChecklistCard notice={notice} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toHaveAttribute('aria-checked', 'false');

      fireEvent.click(checkboxes[0]);
      expect(checkboxes[0]).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByText(/1 of/i)).toBeInTheDocument();
    });

    it('persists checked state across remounts via localStorage', () => {
      const notice = processNoticeDocument(DEMO_NOTICES[1].ocrText);
      const { unmount } = render(<ActionChecklistCard notice={notice} />);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      unmount();

      render(<ActionChecklistCard notice={notice} />);
      const remountedCheckboxes = screen.getAllByRole('checkbox');
      expect(remountedCheckboxes[0]).toHaveAttribute('aria-checked', 'true');
    });

    it('allows resetting all tasks with clear button', () => {
      const notice = processNoticeDocument(DEMO_NOTICES[0].ocrText);
      render(<ActionChecklistCard notice={notice} />);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      expect(screen.getByText(/1 of/i)).toBeInTheDocument();

      const clearBtn = screen.getByRole('button', { name: /Reset checklist progress/i });
      fireEvent.click(clearBtn);

      const updatedCheckboxes = screen.getAllByRole('checkbox');
      expect(updatedCheckboxes[0]).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('DeadlineTimelineCard Component', () => {
    it('disambiguates between critical deadline and other dates', () => {
      const notice = processNoticeDocument(DEMO_NOTICES[0].ocrText);
      render(<DeadlineTimelineCard notice={notice} />);

      expect(screen.getByText(/Date & Timeline Disambiguation/i)).toBeInTheDocument();
      expect(screen.getByText(/Critical Deadlines/i)).toBeInTheDocument();
    });

    it('renders empty timeline state gracefully if no dates exist', () => {
      const baseNotice = processNoticeDocument('Simple notice with no dates.');
      const emptyNotice = {
        ...baseNotice,
        detectedDates: [],
        fields: {
          ...baseNotice.fields,
          deadline: {
            ...baseNotice.fields.deadline,
            value: '',
            status: 'not_found' as const,
            evidence: null,
          },
          eventDate: {
            ...baseNotice.fields.eventDate,
            value: '',
            status: 'not_found' as const,
            evidence: null,
          },
        },
      };

      render(<DeadlineTimelineCard notice={emptyNotice} />);
      expect(screen.getByText(/No explicit calendar dates were detected/i)).toBeInTheDocument();
    });
  });

  describe('AccessibleReadingView Component', () => {
    it('renders executive 6-question breakdown in focused mode', () => {
      const notice = processNoticeDocument(DEMO_NOTICES[1].ocrText);
      const onExit = vi.fn();
      render(<AccessibleReadingView notice={notice} onExitReadingMode={onExit} />);

      expect(screen.getByText(/Focused Reading Mode/i)).toBeInTheDocument();
      expect(screen.getByText(/1\. What is this notice about\?/i)).toBeInTheDocument();
      expect(screen.getByText(/2\. Who is affected \(Target Students\)\?/i)).toBeInTheDocument();
      expect(screen.getByText(/3\. What must be done\?/i)).toBeInTheDocument();
      expect(screen.getByText(/4\. When is the deadline\?/i)).toBeInTheDocument();
      expect(screen.getByText(/5\. What documents are needed\?/i)).toBeInTheDocument();
      expect(screen.getByText(/6\. What details are unverified or missing\?/i)).toBeInTheDocument();
    });

    it('cycles font scale through Normal, Large, and Extra-Large', () => {
      const notice = processNoticeDocument(DEMO_NOTICES[1].ocrText);
      render(<AccessibleReadingView notice={notice} onExitReadingMode={vi.fn()} />);

      const normalBtn = screen.getByRole('button', { name: /^Normal text size$/i });
      const largeBtn = screen.getByRole('button', { name: /^Large text size$/i });
      const extraLargeBtn = screen.getByRole('button', { name: /^Extra large text size$/i });

      expect(normalBtn).toBeInTheDocument();
      expect(largeBtn).toBeInTheDocument();
      expect(extraLargeBtn).toBeInTheDocument();

      fireEvent.click(extraLargeBtn);
      expect(extraLargeBtn).toHaveClass('bg-sky-600');
    });

    it('invokes speech service when Read Aloud is clicked', () => {
      const speakSpy = vi.spyOn(speechService, 'speak').mockImplementation(vi.fn());
      const notice = processNoticeDocument(DEMO_NOTICES[1].ocrText);
      render(<AccessibleReadingView notice={notice} onExitReadingMode={vi.fn()} />);

      const readAloudBtn = screen.getByRole('button', { name: /Read notice aloud/i });
      fireEvent.click(readAloudBtn);

      expect(speakSpy).toHaveBeenCalled();
    });

    it('calls onExitReadingMode when Return to Workspace button is clicked', () => {
      const onExit = vi.fn();
      const notice = processNoticeDocument(DEMO_NOTICES[0].ocrText);
      render(<AccessibleReadingView notice={notice} onExitReadingMode={onExit} />);

      const returnBtn = screen.getByRole('button', { name: /Return to Workspace/i });
      fireEvent.click(returnBtn);

      expect(onExit).toHaveBeenCalledTimes(1);
    });
  });
});
