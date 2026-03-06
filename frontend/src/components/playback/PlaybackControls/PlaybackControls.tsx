/**
 * PlaybackControls Component
 * Controls for playing through sheet music:
 * - Play/Pause button
 * - Step forward/backward
 * - Tempo adjustment
 * - Progress indicator
 */

import React from 'react';
import './PlaybackControls.css';

interface PlaybackControlsProps {
  /** Whether playback is active */
  isPlaying: boolean;

  /** Current note index */
  currentIndex: number;

  /** Total number of notes */
  totalNotes: number;

  /** Current tempo in BPM */
  tempo: number;

  /** Play callback */
  onPlay: () => void;

  /** Pause callback */
  onPause: () => void;

  /** Step forward callback */
  onStepForward: () => void;

  /** Step backward callback */
  onStepBackward: () => void;

  /** Tempo change callback */
  onTempoChange: (tempo: number) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  currentIndex,
  totalNotes,
  tempo,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onTempoChange,
}) => {
  const progress = totalNotes > 0 ? (currentIndex / (totalNotes - 1)) * 100 : 0;

  return (
    <div className="playback-controls">
      {/* Progress Bar */}
      <div className="playback-controls__progress">
        <div
          className="playback-controls__progress-fill"
          style={{ width: `${progress}%` }}
        />
        <div className="playback-controls__progress-info">
          <span>
            {currentIndex + 1} / {totalNotes}
          </span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="playback-controls__main">
        {/* Step Backward */}
        <button
          className="playback-controls__button"
          onClick={onStepBackward}
          disabled={currentIndex === 0}
          aria-label="Step backward"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 20L9 12L19 4V20Z" fill="currentColor"/>
            <path d="M5 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          className="playback-controls__button playback-controls__button--primary"
          onClick={isPlaying ? onPause : onPlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M6 4H10V20H6V4Z" fill="currentColor"/>
              <path d="M14 4H18V20H14V4Z" fill="currentColor"/>
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
            </svg>
          )}
        </button>

        {/* Step Forward */}
        <button
          className="playback-controls__button"
          onClick={onStepForward}
          disabled={currentIndex >= totalNotes - 1}
          aria-label="Step forward"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 4L15 12L5 20V4Z" fill="currentColor"/>
            <path d="M19 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Tempo Control */}
      <div className="playback-controls__tempo">
        <label htmlFor="tempo-slider" className="playback-controls__tempo-label">
          Tempo: {tempo} BPM
        </label>
        <div className="playback-controls__tempo-controls">
          <button
            className="playback-controls__tempo-button"
            onClick={() => onTempoChange(Math.max(40, tempo - 10))}
          >
            −
          </button>
          <input
            id="tempo-slider"
            type="range"
            min="40"
            max="240"
            value={tempo}
            onChange={(e) => onTempoChange(parseInt(e.target.value))}
            className="playback-controls__tempo-slider"
          />
          <button
            className="playback-controls__tempo-button"
            onClick={() => onTempoChange(Math.min(240, tempo + 10))}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};
