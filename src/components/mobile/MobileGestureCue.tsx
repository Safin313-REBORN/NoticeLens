import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface MobileGestureCueProps {
  isSwiping: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distanceX: number;
}

export const MobileGestureCue: React.FC<MobileGestureCueProps> = ({
  isSwiping,
  direction,
  distanceX,
}) => {
  if (!isSwiping || !direction || (direction !== 'left' && direction !== 'right')) {
    return null;
  }

  const absX = Math.abs(distanceX);
  if (absX < 25) {
    return null;
  }

  const isAdvance = direction === 'left'; // Swiping left advances to next screen

  return (
    <aside
      aria-live="polite"
      aria-atomic="true"
      className="md:hidden fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-100"
    >
      <div className="bg-[#1e293b]/90 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.3)] flex items-center gap-2 border border-white/20 animate-pulse high-contrast:bg-black high-contrast:text-yellow-400 high-contrast:border-2 high-contrast:border-white">
        {isAdvance ? (
          <>
            <span className="text-xs font-bold">Next Screen</span>
            <ArrowRight className="w-4 h-4 text-sky-400 high-contrast:text-yellow-400" />
          </>
        ) : (
          <>
            <ArrowLeft className="w-4 h-4 text-sky-400 high-contrast:text-yellow-400" />
            <span className="text-xs font-bold">Previous Screen</span>
          </>
        )}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden ml-1">
          <div
            className="h-full bg-sky-400 high-contrast:bg-yellow-400 transition-all duration-75"
            style={{ width: `${Math.min(100, (absX / 60) * 100)}%` }}
          />
        </div>
      </div>
    </aside>
  );
};
