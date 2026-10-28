import { useState, useRef, useCallback } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minDistance?: number;
  maxDiagonalRatio?: number;
}

export interface SwipeGestureHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export interface SwipeGestureState {
  isSwiping: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distanceX: number;
  distanceY: number;
}

/**
 * Custom touch gesture hook for mobile gesture-based UI navigation.
 * Distinguishes intentional horizontal or vertical swipes from general page scrolling.
 */
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  minDistance = 45,
  maxDiagonalRatio = 1.25,
}: SwipeGestureOptions): [SwipeGestureHandlers, SwipeGestureState] {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [gestureState, setGestureState] = useState<SwipeGestureState>({
    isSwiping: false,
    direction: null,
    distanceX: 0,
    distanceY: 0,
  });

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    setGestureState({
      isSwiping: true,
      direction: null,
      distanceX: 0,
      distanceY: 0,
    });
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let currentDir: 'left' | 'right' | 'up' | 'down' | null = null;
    if (absDx > absDy) {
      currentDir = dx > 0 ? 'right' : 'left';
    } else {
      currentDir = dy > 0 ? 'down' : 'up';
    }

    setGestureState({
      isSwiping: true,
      direction: currentDir,
      distanceX: dx,
      distanceY: dy,
    });
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const duration = Date.now() - touchStartRef.current.time;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Must exceed minimum distance and be fast enough (< 800ms)
      if (duration < 800) {
        // Horizontal swipe: dx dominates dy
        if (absDx >= minDistance && absDx > absDy * maxDiagonalRatio) {
          if (dx < 0 && onSwipeLeft) {
            onSwipeLeft();
          } else if (dx > 0 && onSwipeRight) {
            onSwipeRight();
          }
        }
        // Vertical swipe: dy dominates dx
        else if (absDy >= minDistance && absDy > absDx * maxDiagonalRatio) {
          if (dy < 0 && onSwipeUp) {
            onSwipeUp();
          } else if (dy > 0 && onSwipeDown) {
            onSwipeDown();
          }
        }
      }

      touchStartRef.current = null;
      setGestureState({
        isSwiping: false,
        direction: null,
        distanceX: 0,
        distanceY: 0,
      });
    },
    [minDistance, maxDiagonalRatio, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]
  );

  return [
    { onTouchStart, onTouchMove, onTouchEnd },
    gestureState,
  ];
}
