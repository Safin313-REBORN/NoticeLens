import React, { useState, useEffect } from 'react';
import { Volume2, Play, Pause, Square, AlertCircle, Settings } from 'lucide-react';
import { speechService, SpeechStatusState } from '../../services/speech/webSpeechService';
import { VoiceOption } from '../../types/notice';

export const AudioPlayerBar: React.FC = () => {
  const [speechState, setSpeechState] = useState<SpeechStatusState>(speechService.getState());
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = speechService.subscribe((state) => {
      setSpeechState(state);
      if (state.voiceName) setSelectedVoiceName(state.voiceName);
      const vList = speechService.getAvailableVoices();
      if (vList.length > 0) setVoices(vList);
    });

    const vList = speechService.getAvailableVoices();
    setVoices(vList);

    return () => unsub();
  }, []);

  const handlePlayPause = () => {
    if (speechState.status === 'playing') {
      speechService.pause();
    } else if (speechState.status === 'paused') {
      speechService.resume();
    }
  };

  const handleStop = () => {
    speechService.stop();
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vName = e.target.value;
    setSelectedVoiceName(vName);
    const found = voices.find((v) => v.voice.name === vName);
    if (found) {
      speechService.setVoice(found.voice);
      if (found.isBengali) {
        setWarningMessage(null);
      } else {
        setWarningMessage('Selected voice does not natively speak Bengali. Bengali text may sound accented.');
      }
    }
  };

  const handleRateChange = (rate: number) => {
    speechService.setRate(rate);
  };

  if (!speechService.isSupported()) {
    return (
      <div className="bg-slate-100 border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500 high-contrast:bg-black high-contrast:border-white">
        Web Speech is not supported on this browser.
      </div>
    );
  }

  return (
    <div
      className="bg-[#eef2f8] border-t border-slate-300/80 shadow-[0_-4px_15px_rgba(200,211,226,0.5)] px-4 py-2.5 sticky bottom-16 md:bottom-0 z-30 high-contrast:!bg-black high-contrast:!border-white high-contrast:!border-t-3"
      role="region"
      aria-label="Text to Speech Audio Controls"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Playback Status & Currently Reading snippet */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#eef2f8] shadow-[3px_3px_6px_#c5d0e0,-3px_-3px_6px_#ffffff] flex items-center justify-center text-sky-600 shrink-0 border border-white/60 high-contrast:!bg-yellow-400 high-contrast:!text-black">
            <Volume2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-900 high-contrast:text-white">
                Audio Reader
              </span>
              <span
                className={`neu-badge text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                  speechState.status === 'playing'
                    ? 'bg-emerald-500 text-white animate-pulse high-contrast:!bg-yellow-400 high-contrast:!text-black'
                    : speechState.status === 'paused'
                    ? 'bg-amber-500 text-white high-contrast:!bg-yellow-400 high-contrast:!text-black'
                    : 'bg-slate-200 text-slate-700 high-contrast:!bg-slate-800 high-contrast:!text-white'
                }`}
              >
                {speechState.status}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-600 high-contrast:text-yellow-300 truncate max-w-xs sm:max-w-md">
              {speechState.currentText ? `"${speechState.currentText}"` : 'Select a field or summary to listen'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5">
          {speechState.status !== 'idle' && (
            <>
              <button
                onClick={handlePlayPause}
                aria-label={speechState.status === 'playing' ? 'Pause speech' : 'Resume speech'}
                className="neu-btn p-2.5 rounded-xl bg-sky-600 text-white hover:bg-sky-700 shadow-[3px_3px_6px_#c5d0e0,-3px_-3px_6px_#ffffff] high-contrast:!bg-yellow-400 high-contrast:!text-black"
              >
                {speechState.status === 'playing' ? <Pause className="w-4 h-4 stroke-[2.5]" /> : <Play className="w-4 h-4 stroke-[2.5]" />}
              </button>

              <button
                onClick={handleStop}
                aria-label="Stop speech playback"
                className="neu-btn p-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 shadow-[3px_3px_6px_#c5d0e0,-3px_-3px_6px_#ffffff] high-contrast:!bg-slate-800 high-contrast:!text-white"
              >
                <Square className="w-4 h-4 stroke-[2.5]" />
              </button>
            </>
          )}

          {/* Speed Buttons */}
          <div className="hidden sm:flex items-center gap-1 rounded-xl p-1 bg-[#eef2f8] shadow-[inset_2px_2px_4px_#c5d0e0,inset_-2px_-2px_4px_#ffffff] border border-slate-200/50">
            {[0.85, 1.0, 1.25].map((rate) => (
              <button
                key={rate}
                onClick={() => handleRateChange(rate)}
                className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-colors ${
                  speechState.rate === rate
                    ? 'bg-sky-600 text-white shadow-sm high-contrast:bg-yellow-400 high-contrast:text-black'
                    : 'text-slate-700 hover:bg-slate-200/60 high-contrast:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Voice Settings Toggle */}
          <button
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            aria-expanded={showVoiceSettings}
            aria-label="Speech Voice Settings"
            className="neu-btn p-2.5 rounded-xl bg-[#eef2f8] text-slate-700 shadow-[3px_3px_6px_#c5d0e0,-3px_-3px_6px_#ffffff] hover:text-slate-900 border border-white/60 high-contrast:!border-white high-contrast:!text-white"
          >
            <Settings className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Voice Settings Dropdown */}
      {showVoiceSettings && (
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-200 high-contrast:border-white/30 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label htmlFor="voice-select-dropdown" className="block font-bold text-ink-900 high-contrast:text-white mb-1">
              Select Synthesized Voice:
            </label>
            <select
              id="voice-select-dropdown"
              value={selectedVoiceName}
              onChange={handleVoiceChange}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus-visible:ring-2 focus-visible:ring-teal-500 high-contrast:bg-black high-contrast:text-white high-contrast:border-white"
            >
              {voices.map((v) => (
                <option key={v.voice.name} value={v.voice.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            {!speechState.hasBengaliVoice ? (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 high-contrast:bg-slate-900 high-contrast:border-yellow-400 high-contrast:text-yellow-300">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-tight">
                  <strong>Device Note:</strong> Your operating system lacks a native Bengali voice package. Speech will use the closest available synthesis engine.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-teal-800 high-contrast:text-teal-300 font-medium">
                ✓ Native Bengali voice detected and configured on this device.
              </p>
            )}
          </div>
        </div>
      )}

      {warningMessage && (
        <div className="max-w-7xl mx-auto mt-2 text-[11px] text-amber-800 high-contrast:text-yellow-300 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{warningMessage}</span>
        </div>
      )}
    </div>
  );
};
