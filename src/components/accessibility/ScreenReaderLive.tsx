import React from 'react';

interface ScreenReaderLiveProps {
  message: string;
}

export const ScreenReaderLive: React.FC<ScreenReaderLiveProps> = ({ message }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};
