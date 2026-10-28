// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { MobileGestureNav } from '../../components/mobile/MobileGestureNav';
import { MobileGestureCue } from '../../components/mobile/MobileGestureCue';
import { EvidenceFieldCard } from '../../components/results/EvidenceFieldCard';
import { ExtractedField } from '../../types/notice';

describe('useSwipeGesture Hook', () => {
  it('does not trigger callbacks for small touch movements below minDistance', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    const { result } = renderHook(() =>
      useSwipeGesture({
        onSwipeLeft,
        onSwipeRight,
        minDistance: 45,
      })
    );

    const [handlers] = result.current;

    act(() => {
      handlers.onTouchStart({
        touches: [{ clientX: 100, clientY: 100 }],
      } as unknown as React.TouchEvent);

      handlers.onTouchMove({
        touches: [{ clientX: 120, clientY: 102 }],
      } as unknown as React.TouchEvent);

      handlers.onTouchEnd({
        changedTouches: [{ clientX: 120, clientY: 102 }],
      } as unknown as React.TouchEvent);
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('triggers onSwipeLeft when user swipes left horizontally', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    const { result } = renderHook(() =>
      useSwipeGesture({
        onSwipeLeft,
        onSwipeRight,
        minDistance: 45,
      })
    );

    const [handlers] = result.current;

    act(() => {
      handlers.onTouchStart({
        touches: [{ clientX: 200, clientY: 100 }],
      } as unknown as React.TouchEvent);

      handlers.onTouchMove({
        touches: [{ clientX: 120, clientY: 105 }],
      } as unknown as React.TouchEvent);

      handlers.onTouchEnd({
        changedTouches: [{ clientX: 120, clientY: 105 }],
      } as unknown as React.TouchEvent);
    });

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('triggers onSwipeRight when user swipes right horizontally', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    const { result } = renderHook(() =>
      useSwipeGesture({
        onSwipeLeft,
        onSwipeRight,
        minDistance: 45,
      })
    );

    const [handlers] = result.current;

    act(() => {
      handlers.onTouchStart({
        touches: [{ clientX: 100, clientY: 100 }],
      } as unknown as React.TouchEvent);

      handlers.onTouchMove({
        touches: [{ clientX: 180, clientY: 102 }],
      } as unknown as React.TouchEvent);

      handlers.onTouchEnd({
        changedTouches: [{ clientX: 180, clientY: 102 }],
      } as unknown as React.TouchEvent);
    });

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('does not trigger horizontal swipes when movement is primarily vertical scroll', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();

    const { result } = renderHook(() =>
      useSwipeGesture({
        onSwipeLeft,
        onSwipeRight,
        minDistance: 45,
      })
    );

    const [handlers] = result.current;

    act(() => {
      handlers.onTouchStart({
        touches: [{ clientX: 100, clientY: 100 }],
      } as unknown as React.TouchEvent);

      // Heavy vertical movement (Y changed by 120, X only changed by 50)
      handlers.onTouchMove({
        touches: [{ clientX: 150, clientY: 220 }],
      } as unknown as React.TouchEvent);

      handlers.onTouchEnd({
        changedTouches: [{ clientX: 150, clientY: 220 }],
      } as unknown as React.TouchEvent);
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });
});

describe('MobileGestureCue Component', () => {
  it('returns null when not swiping or distance is below threshold', () => {
    const { container } = render(
      <MobileGestureCue isSwiping={false} direction={null} distanceX={0} />
    );
    expect(container.firstChild).toBeNull();

    const { container: containerSmall } = render(
      <MobileGestureCue isSwiping={true} direction="left" distanceX={-15} />
    );
    expect(containerSmall.firstChild).toBeNull();
  });

  it('renders Next Screen cue when swiping left with sufficient distance', () => {
    render(<MobileGestureCue isSwiping={true} direction="left" distanceX={-50} />);
    expect(screen.getByText('Next Screen')).toBeInTheDocument();
  });

  it('renders Previous Screen cue when swiping right with sufficient distance', () => {
    render(<MobileGestureCue isSwiping={true} direction="right" distanceX={50} />);
    expect(screen.getByText('Previous Screen')).toBeInTheDocument();
  });
});

describe('MobileGestureNav Component', () => {
  it('renders pattern track nodes and active screen label', () => {
    const onTabChange = vi.fn();

    render(
      <MobileGestureNav
        activeTab="scan"
        onTabChange={onTabChange}
        hasActiveNotice={false}
        activeNotice={null}
        savedCount={2}
        onOpenSampleModal={vi.fn()}
        onShowToast={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Mobile Gesture Navigation')).toBeInTheDocument();
    expect(screen.getByText('Scan')).toBeInTheDocument();
    expect(screen.getByText('⇄ Swipe left/right')).toBeInTheDocument();
  });

  it('navigates to next tab when right arrow is clicked', () => {
    const onTabChange = vi.fn();

    render(
      <MobileGestureNav
        activeTab="scan"
        onTabChange={onTabChange}
        hasActiveNotice={false}
        activeNotice={null}
        savedCount={0}
        onOpenSampleModal={vi.fn()}
        onShowToast={vi.fn()}
      />
    );

    const nextBtn = screen.getByLabelText(/Swipe right to Vault/i);
    fireEvent.click(nextBtn);

    expect(onTabChange).toHaveBeenCalledWith('saved');
  });

  it('opens quick action drawer when gesture diamond is tapped', () => {
    render(
      <MobileGestureNav
        activeTab="scan"
        onTabChange={vi.fn()}
        hasActiveNotice={false}
        activeNotice={null}
        savedCount={0}
        onOpenSampleModal={vi.fn()}
        onShowToast={vi.fn()}
      />
    );

    const diamondBtn = screen.getByLabelText('Open mobile gesture quick actions');
    fireEvent.click(diamondBtn);

    expect(screen.getByText('Gesture Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Sample Notices')).toBeInTheDocument();
  });
});

describe('EvidenceFieldCard Touch Interactions', () => {
  const dummyField: ExtractedField = {
    key: 'title',
    label: 'Notice Title',
    labelBn: 'শিরোনাম',
    value: 'ঢাকা বিশ্ববিদ্যালয় ভর্তি বিজ্ঞপ্তি',
    evidence: {
      text: 'ঢাকা বিশ্ববিদ্যালয় ভর্তি বিজ্ঞপ্তি',
      startIndex: 0,
      endIndex: 30,
      confidence: 'high',
    },
    status: 'confirmed',
  };

  it('renders mobile touch gesture legend hint', () => {
    render(<EvidenceFieldCard field={dummyField} onUpdateField={vi.fn()} />);

    expect(screen.getByText(/Swipe 👉 speak/i)).toBeInTheDocument();
    expect(screen.getByText(/Tap 2x edit/i)).toBeInTheDocument();
  });
});
